import {
  ListResourcesRequest,
  ReadResourceRequest,
  Resource,
  ReadResourceResult,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';
import { ResourceRegistry } from '../capabilities/resources/index.js';

export class ResourceHandlers {
  constructor(private readonly resourceRegistry: ResourceRegistry) {}

  async handleListResources(request: ListResourcesRequest): Promise<{ resources: Resource[] }> {
    const resources = this.resourceRegistry.getResourceDefinitions();
    return { resources };
  }

  async handleReadResource(request: ReadResourceRequest): Promise<ReadResourceResult> {
    const { uri } = request.params;

    try {
      const resource = this.resourceRegistry.get(uri);
      
      if (!resource) {
        throw new McpError(ErrorCode.InvalidRequest, `Unknown resource: ${uri}`);
      }

      return await resource.read(uri);
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(ErrorCode.InternalError, `Resource read failed: ${error}`);
    }
  }
}