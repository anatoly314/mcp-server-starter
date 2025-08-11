import { Router } from 'express';
import { ProxyOAuthServerProvider } from '@modelcontextprotocol/sdk/server/auth/providers/proxyProvider';
import { mcpAuthRouter } from '@modelcontextprotocol/sdk/server/auth/router';
import { envProvider } from '../envProvider';
import { createLogger } from '../logger';

const logger = createLogger('mcp-sdk-oauth');

/**
 * Create OAuth router using MCP SDK's built-in proxy provider
 * Works with ANY OAuth provider configured via environment variables
 */
export function createMcpOAuthRouter(): Router {
  const baseUrl = envProvider.publicUrl || `http://${envProvider.httpHost}:${envProvider.httpPort}`;
  
  // Configure the proxy provider using environment variables
  const proxyProvider = new ProxyOAuthServerProvider({
    endpoints: {
      authorizationUrl: envProvider.oauthAuthorizationUrl,
      tokenUrl: envProvider.oauthTokenUrl,
      revocationUrl: process.env.OAUTH_REVOCATION_URL, // Optional
    },
    
    // Simple token validation - just call the userinfo endpoint
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
        logger.info({ userId: userInfo.id || userInfo.sub }, 'Token validated');
        
        return {
          token,
          clientId: 'mcp-client',
          scopes: envProvider.oauthScopes.split(' '),
        };
      } catch (error) {
        logger.error({ error }, 'Token validation failed');
        throw error;
      }
    },
    
    // DCR stub for MCP Inspector compatibility
    getClient: async (client_id: string) => {
      return {
        client_id,
        client_secret: 'not-used',
        redirect_uris: [],
        grant_types: ['authorization_code', 'refresh_token'],
        response_types: ['code'],
        scope: envProvider.oauthScopes,
      };
    },
  });

  // Create router with MCP SDK
  const router = Router();
  
  router.use(mcpAuthRouter({
    provider: proxyProvider,
    issuerUrl: new URL(baseUrl),
    baseUrl: new URL(baseUrl),
    scopesSupported: envProvider.oauthScopes.split(' '),
    resourceName: envProvider.mcpServerName,
    clientRegistrationOptions: {}, // Enable DCR endpoint
  }));
  
  return router;
}