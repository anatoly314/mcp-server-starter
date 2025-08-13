import { Router } from 'express';
import { mcpAuthMetadataRouter } from '@modelcontextprotocol/sdk/server/auth/router.js';
import { OAuthMetadata } from '@modelcontextprotocol/sdk/shared/auth.js';
import { envProvider } from '../envProvider';
import { createLogger } from '../logger';

const logger = createLogger('oauth-metadata');

/**
 * Creates a router that serves OAuth protected resource metadata
 * This implements the complete OAuth discovery flow for MCP servers
 */
export function createOAuthMetadataRouter(): Router {
  // issuerUrl is guaranteed to exist when this function is called (validated at startup)
  const issuer = envProvider.oauthIssuerUrl!;
  
  // Construct the OAuth metadata based on Clerk's standard structure
  // We know Clerk's endpoints follow this pattern
  const oauthMetadata: OAuthMetadata = {
    issuer: issuer,
    authorization_endpoint: `${issuer}/oauth/authorize`,
    token_endpoint: `${issuer}/oauth/token`,
    registration_endpoint: `${issuer}/oauth/register`,
    revocation_endpoint: `${issuer}/oauth/revoke`,
    jwks_uri: `${issuer}/.well-known/jwks.json`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'none'],
    scopes_supported: ['openid', 'profile', 'email'],  // Only include scopes that DCR clients can use
    code_challenge_methods_supported: ['S256'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256']
  };
  
  // Determine the resource server URL
  const resourceServerUrl = new URL(envProvider.publicUrl);

  // Create the metadata router using MCP SDK
  const router = mcpAuthMetadataRouter({
    oauthMetadata,
    resourceServerUrl,
    resourceName: envProvider.mcpServerName,
    serviceDocumentationUrl: envProvider.serviceDocumentationUrl,
    scopesSupported: ['openid', 'profile', 'email'] // Use Clerk's supported scopes
  });
  
  logger.info('OAuth metadata endpoints configured:');
  logger.info(`  - /.well-known/oauth-protected-resource (returns resource: ${resourceServerUrl.href}, authorization_servers: [${issuer}])`);
  logger.info('  - /.well-known/oauth-authorization-server (for backwards compatibility)');
  
  return router;
}