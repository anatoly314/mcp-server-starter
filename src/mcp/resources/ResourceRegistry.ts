import { Resource } from '@modelcontextprotocol/sdk/types.js';
import { ResourceImplementation } from './types.js';
import { createLogger } from '../../logger.js';

const logger = createLogger('resource-registry');

export class ResourceRegistry {
  private resources = new Map<string, ResourceImplementation>();

  register(resource: ResourceImplementation): void {
    this.resources.set(resource.definition.uri, resource);
    logger.info({ uri: resource.definition.uri }, 'Registered resource');
  }

  getAll(): ResourceImplementation[] {
    return Array.from(this.resources.values());
  }

  get(uri: string): ResourceImplementation | undefined {
    return this.resources.get(uri);
  }

  getResourceDefinitions(): Resource[] {
    return this.getAll().map(resource => ({
      uri: resource.definition.uri,
      name: resource.definition.name,
      description: resource.definition.description,
      mimeType: resource.definition.mimeType
    }));
  }

  has(uri: string): boolean {
    return this.resources.has(uri);
  }

  size(): number {
    return this.resources.size;
  }
}