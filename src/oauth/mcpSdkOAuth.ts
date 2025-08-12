import { Router } from 'express';
import { ProxyOAuthServerProvider } from '@modelcontextprotocol/sdk/server/auth/providers/proxyProvider.js';
import { mcpAuthRouter } from '@modelcontextprotocol/sdk/server/auth/router.js';
import { envProvider } from '../envProvider';
import { createLogger } from '../logger';
import { cleanupOAuthRequestMiddleware } from './cleanupOAuthRequestMiddleware';

const logger = createLogger('mcp-sdk-oauth');

/**
 * Creates an OAuth router that proxies to an external OAuth provider (Clerk, Auth0, etc.)
 * Supports Dynamic Client Registration (DCR) when the provider enables it.
 */
export function createMcpOAuthRouter(): Router {
  const baseUrl = envProvider.publicUrl || `http://${envProvider.httpHost}:${envProvider.httpPort}`;
  const registrationUrl = process.env.OAUTH_REGISTRATION_URL;
  const revocationUrl = process.env.OAUTH_REVOCATION_URL;
  
  // Configure the proxy provider using environment variables
  const proxyProvider = new ProxyOAuthServerProvider({
    endpoints: {
      authorizationUrl: envProvider.oauthAuthorizationUrl,
      tokenUrl: envProvider.oauthTokenUrl,
      registrationUrl: registrationUrl, // If provided, enables real DCR
      revocationUrl: revocationUrl
    },
    
    // Validate access tokens with the external OAuth provider
    verifyAccessToken: async (token: string) => {
      try {
        const response = await fetch(envProvider.oauthUserInfoUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Token validation failed: ${response.status}`);
        }
        
        const userInfo: any = await response.json();
        
        return {
          token,
          clientId: userInfo.aud || userInfo.client_id || 'mcp-client',
          scopes: userInfo.scope?.split(' ') || envProvider.oauthScopes.split(' '),
        };
      } catch (error) {
        logger.error({ error }, 'Token validation failed');
        throw error;
      }
    },
    
    // Get client information - used during authorization
    getClient: async (client_id: string) => {
      logger.debug({ client_id }, 'Getting client for authorization');
      
      // Since we're proxying to Clerk which handles its own client validation,
      // we return undefined to indicate we don't have local client info.
      // This tells the SDK to skip local validation and let Clerk handle it.
      return {
        client_id,
        redirect_uris: ['http://localhost:6274/oauth/callback/debug'],
        scope: 'openid email profile'
      };
    },
  });

  // Create router with MCP SDK
  const router = Router();
  
  // Apply cleanup middleware to fix MCP Inspector's malformed requests
  router.use(cleanupOAuthRequestMiddleware);
  
  router.use(mcpAuthRouter({
    provider: proxyProvider,
    issuerUrl: new URL(baseUrl),
    baseUrl: new URL(baseUrl),
    scopesSupported: envProvider.oauthScopes.split(' '),
    resourceName: envProvider.mcpServerName,
    // Don't enable built-in DCR handler since we're proxying to Clerk
    // clientRegistrationOptions: {},
  }));
  
  return router;
}