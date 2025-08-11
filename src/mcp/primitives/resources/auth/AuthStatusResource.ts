import { ReadResourceResult } from '@modelcontextprotocol/sdk/types.js';
import { BaseResource, ResourceDefinition } from '../types.js';
import { envProvider } from '../../../../envProvider.js';

export class AuthStatusResource extends BaseResource {
  definition: ResourceDefinition = {
    uri: 'auth://status',
    name: 'Authentication Status',
    description: 'Current authentication configuration status',
    mimeType: 'application/json'
  };
  
  async read(uri: string): Promise<ReadResourceResult> {
    const status = {
      enabled: envProvider.authEnabled,
      configured: envProvider.authEnabled && !!envProvider.oauthClientId,
      provider: envProvider.authEnabled ? envProvider.oauthProvider : 'none',
      clientId: envProvider.authEnabled ? (envProvider.oauthClientId ? 'configured' : 'missing') : 'disabled',
      redirectUri: envProvider.authEnabled ? envProvider.oauthRedirectUri : 'disabled',
      scopes: envProvider.authEnabled ? envProvider.oauthScopes : 'disabled'
    };
    
    return this.createTextContent(uri, JSON.stringify(status, null, 2));
  }
}