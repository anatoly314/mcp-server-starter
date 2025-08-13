import { ReadResourceResult } from '@modelcontextprotocol/sdk/types.js';
import { BaseResource, ResourceDefinition } from '../types.js';
import { envProvider } from '../../../../envProvider.js';

export class ServerConfigResource extends BaseResource {
  definition: ResourceDefinition = {
    uri: 'config://server',
    name: 'Server Configuration',
    description: 'Current MCP server configuration',
    mimeType: 'application/json'
  };
  
  async read(uri: string): Promise<ReadResourceResult> {
    const config = {
      server: {
        name: envProvider.mcpServerName,
        version: envProvider.mcpServerVersion,
        transport: envProvider.transportType,
      },
      http: {
        host: envProvider.httpHost,
        port: envProvider.httpPort,
        publicUrl: envProvider.publicUrl,
      },
      auth: {
        enabled: envProvider.authEnabled,
        mode: 'DCR (Dynamic Client Registration)',
        oauthIssuer: envProvider.oauthIssuerUrl,
      },
      features: {
        requestLogging: process.env.REQUEST_LOGGING !== 'false',
      }
    };
    
    return this.createTextContent(uri, JSON.stringify(config, null, 2));
  }
}