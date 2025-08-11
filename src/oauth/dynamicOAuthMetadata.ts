import { Request, Response, NextFunction } from 'express';
import { envProvider } from '../envProvider';
import { createLogger } from '../logger';

const logger = createLogger('oauth-metadata');

/**
 * Dynamic OAuth metadata middleware that returns URLs based on the request origin
 * This allows both local and ngrok access to work correctly
 */
export function dynamicOAuthMetadataMiddleware(req: Request, res: Response, next: NextFunction) {
  // Only handle the OAuth metadata endpoints
  if (!req.path.includes('/.well-known/oauth-')) {
    return next();
  }

  // Determine the base URL from the request
  const protocol = req.protocol;
  const host = req.get('host') || `${envProvider.httpHost}:${envProvider.httpPort}`;
  const requestBasedUrl = `${protocol}://${host}`;
  
  // Use request URL for localhost access, PUBLIC_URL for everything else
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
  const baseUrl = (isLocalhost || !envProvider.publicUrl) ? requestBasedUrl : envProvider.publicUrl;

  logger.info({
    path: req.path,
    requestHost: req.get('host'),
    protocol: req.protocol,
    baseUrl: baseUrl
  }, 'OAuth metadata request');

  if (req.path === '/.well-known/oauth-protected-resource') {
    res.json({
      // resource: `${baseUrl}/mcp`,
      resource: `${baseUrl}`,
      authorization_servers: [baseUrl],
      scopes_supported: envProvider.oauthScopes.split(' '),
      resource_name: envProvider.mcpServerName
    });
  } else if (req.path === '/.well-known/oauth-authorization-server') {
    // DCR removed - no registration_endpoint
    res.json({
      issuer: baseUrl,
      authorization_endpoint: `${baseUrl}/oauth/authorize`,
      token_endpoint: `${baseUrl}/oauth/token`,
      response_types_supported: ['code'],
      scopes_supported: envProvider.oauthScopes.split(' '),
      grant_types_supported: ['authorization_code', 'refresh_token'],
      token_endpoint_auth_methods_supported: ['none'],  // No client auth needed
      code_challenge_methods_supported: ['S256', 'plain']
    });
  } else {
    next();
  }
}