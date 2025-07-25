import {
  ListResourcesRequest,
  ReadResourceRequest,
  Resource,
  ReadResourceResult,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';
import { envProvider } from '../../envProvider';

export class ResourceHandlers {
  async handleListResources(request: ListResourcesRequest): Promise<{ resources: Resource[] }> {
    return {
      resources: [
        {
          uri: 'auth://status',
          name: 'Authentication Status',
          description: 'Current authentication configuration status',
          mimeType: 'application/json'
        }
      ]
    };
  }

  async handleReadResource(request: ReadResourceRequest): Promise<ReadResourceResult> {
    const { uri } = request.params;

    if (uri === 'auth://status') {
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify({
              enabled: envProvider.authEnabled,
              configured: envProvider.authEnabled && !!envProvider.oauthClientId,
              provider: envProvider.authEnabled ? envProvider.oauthProvider : 'none',
              clientId: envProvider.authEnabled ? (envProvider.oauthClientId ? 'configured' : 'missing') : 'disabled',
              redirectUri: envProvider.authEnabled ? envProvider.oauthRedirectUri : 'disabled',
              scopes: envProvider.authEnabled ? envProvider.oauthScopes : 'disabled'
            }, null, 2)
          }
        ]
      };
    }

    throw new McpError(ErrorCode.InvalidRequest, `Unknown resource: ${uri}`);
  }
}