import { Request, Response, NextFunction } from 'express';
import { envProvider } from '../envProvider';
import { createLogger } from '../logger';

const logger = createLogger('auth-middleware');

// Simple token cache to avoid hitting userinfo endpoint on every request
const tokenCache = new Map<string, { userInfo: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Skip auth for OAuth proxy endpoints and DCR
  if (req.path.startsWith('/oauth/') || 
      req.path.includes('/.well-known/') || 
      req.path === '/register' ||
      req.path === '/authorize' ||
      req.path === '/token' ||
      req.path === '/revoke') {
    return next();
  }

  // Skip auth if not enabled
  if (!envProvider.authEnabled) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'unauthorized',
      error_description: 'Missing or invalid authorization header'
    });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    // Check cache first
    const cached = tokenCache.get(token);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      (req as any).user = cached.userInfo;
      (req as any).accessToken = token;
      return next();
    }

    // Validate token by calling the userinfo endpoint
    const response = await fetch(envProvider.oauthUserInfoUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Token validation failed: ${response.status}`);
    }

    const userInfo = await response.json();
    
    // Cache the result
    tokenCache.set(token, { userInfo, timestamp: Date.now() });
    
    // Clean up old cache entries periodically
    if (tokenCache.size > 1000) {
      const now = Date.now();
      for (const [key, value] of tokenCache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
          tokenCache.delete(key);
        }
      }
    }
    
    // Attach user info to request for downstream use
    (req as any).user = userInfo;
    (req as any).accessToken = token;
    
    next();
  } catch (error: any) {
    logger.error({ error: error.message }, 'Token validation error');
    
    // Return proper OAuth error response
    const errorResponse: any = {
      error: 'invalid_token',
      error_description: error.message || 'The access token provided is expired, revoked, malformed, or invalid'
    };
    
    // Add WWW-Authenticate header as per OAuth spec
    res.setHeader('WWW-Authenticate', `Bearer realm="${envProvider.publicUrl || 'MCP Server'}", error="invalid_token", error_description="${errorResponse.error_description}"`);
    
    return res.status(401).json(errorResponse);
  }
}