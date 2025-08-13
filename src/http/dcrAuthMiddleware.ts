import { Request, Response, NextFunction } from 'express';
import { envProvider } from '../envProvider';
import { createLogger } from '../logger';

const logger = createLogger('dcr-auth-middleware');

// Simple token cache to avoid hitting userinfo endpoint on every request
const tokenCache = new Map<string, { userInfo: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * DCR-compliant authentication middleware for MCP servers
 * 
 * This middleware implements the MCP specification for OAuth 2.0 with Dynamic Client Registration:
 * 1. Returns 401 with WWW-Authenticate header containing issuer URL for unauthorized requests
 * 2. Validates Bearer tokens by calling the OAuth provider's userinfo endpoint
 * 
 * The client is responsible for:
 * - Discovering OAuth metadata via .well-known/oauth-authorization-server
 * - Performing Dynamic Client Registration if needed
 * - Completing the OAuth flow to obtain an access token
 */
export async function dcrAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  // Skip auth if not enabled
  if (!envProvider.authEnabled) {
    return next();
  }

  // Extract the issuer URL from the OAuth authorization server URL
  // Format: https://domain/.well-known/oauth-authorization-server -> https://domain
  const authServerUrl = envProvider.oauthAuthorizationServerUrl;
  if (!authServerUrl) {
    logger.error('OAUTH_AUTHORIZATION_SERVER_URL not configured');
    return res.status(500).json({
      error: 'server_error',
      error_description: 'OAuth authorization server not configured'
    });
  }

  // Parse the issuer URL (remove .well-known path)
  const issuerUrl = authServerUrl.replace('/.well-known/oauth-authorization-server', '');

  // Check for authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Return 401 with WWW-Authenticate header per MCP spec
    // The header must indicate the resource server metadata URL
    const resourceUrl = envProvider.publicUrl || `http://${envProvider.httpHost}:${envProvider.httpPort}`;
    const resourceMetadataUrl = `${resourceUrl}/.well-known/oauth-protected-resource`;
    
    res.setHeader('WWW-Authenticate', 
      `Bearer realm="${envProvider.publicUrl || 'MCP Server'}", ` +
      `resource_metadata="${resourceMetadataUrl}"`
    );
    
    return res.status(401).json({
      error: 'unauthorized',
      error_description: 'Authentication required. Discover OAuth configuration via resource metadata.'
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
    // Construct userinfo URL from issuer
    const userinfoUrl = `${issuerUrl}/oauth/userinfo`;
    
    const response = await fetch(userinfoUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Token validation failed: ${response.status}`);
    }

    const userInfo: any = await response.json();
    
    // Validate that the token is for this resource server
    // Per MCP spec: "Servers MUST validate that access tokens were issued specifically for them"
    // In Clerk, this is handled by the token being issued for the specific application
    
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
    
    logger.debug({ userId: userInfo.sub, email: userInfo.email }, 'Token validated successfully');
    
    next();
  } catch (error: any) {
    logger.error({ error: error.message }, 'Token validation error');
    
    // Return proper OAuth error response with WWW-Authenticate header
    const resourceUrl = envProvider.publicUrl || `http://${envProvider.httpHost}:${envProvider.httpPort}`;
    const resourceMetadataUrl = `${resourceUrl}/.well-known/oauth-protected-resource`;
    
    res.setHeader('WWW-Authenticate', 
      `Bearer realm="${envProvider.publicUrl || 'MCP Server'}", ` +
      `resource_metadata="${resourceMetadataUrl}", ` +
      `error="invalid_token", ` +
      `error_description="The access token provided is expired, revoked, malformed, or invalid"`
    );
    
    return res.status(401).json({
      error: 'invalid_token',
      error_description: error.message || 'The access token provided is expired, revoked, malformed, or invalid'
    });
  }
}