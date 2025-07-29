import { Request, Response, NextFunction } from 'express';
import { envProvider } from '../envProvider';
import { googleTokenValidator } from '../auth/providers/google/GoogleTokenValidator';
import { createLogger } from '../logger';

const logger = createLogger('auth-middleware');

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Skip auth for OAuth proxy endpoints
  if (req.path.startsWith('/oauth/') || req.path.includes('/.well-known/')) {
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
    // Validate token with Google (spec compliant)
    const userInfo = await googleTokenValidator.getUserInfo(token);
    
    // Attach user info to request for downstream use
    (req as any).user = userInfo;
    (req as any).googleAccessToken = token;
    
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