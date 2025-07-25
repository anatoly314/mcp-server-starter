import { Request, Response, NextFunction } from 'express';
import { envProvider } from '../envProvider';

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
  const requestBaseUrl = `${protocol}://${host}`;
  
  // Use PUBLIC_URL if it matches the request, otherwise use the request URL
  const baseUrl = envProvider.publicUrl && req.get('host')?.includes('ngrok') 
    ? envProvider.publicUrl 
    : requestBaseUrl;

  console.error('OAuth metadata request:', {
    path: req.path,
    requestHost: req.get('host'),
    protocol: req.protocol,
    baseUrl: baseUrl
  });

  if (req.path === '/.well-known/oauth-protected-resource') {
    res.json({
      resource: `${baseUrl}/mcp`,
      authorization_servers: [baseUrl],
      scopes_supported: envProvider.oauthScopes.split(' '),
      resource_name: envProvider.mcpServerName
    });
  } else if (req.path === '/.well-known/oauth-authorization-server') {
    res.json({
      issuer: baseUrl,
      authorization_endpoint: `${baseUrl}/oauth/authorize`,
      token_endpoint: `${baseUrl}/oauth/token`,
      registration_endpoint: `${baseUrl}/oauth/register`,
      response_types_supported: ['code'],
      scopes_supported: envProvider.oauthScopes.split(' '),
      grant_types_supported: ['authorization_code', 'refresh_token'],
      token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
      code_challenge_methods_supported: ['S256', 'plain']
    });
  } else {
    next();
  }
}