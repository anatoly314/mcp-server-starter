import { ResourceRegistry } from './ResourceRegistry.js';
import { AuthStatusResource } from './auth/AuthStatusResource.js';
import { SystemInfoResource } from './system/SystemInfoResource.js';
import { ServerConfigResource } from './config/ServerConfigResource.js';
import { createLogger } from '../../logger.js';

const logger = createLogger('resources');

export function createResourceRegistry(): ResourceRegistry {
  const registry = new ResourceRegistry();
  
  // Register all resources
  registry.register(new AuthStatusResource());
  registry.register(new SystemInfoResource());
  registry.register(new ServerConfigResource());
  
  logger.info({ resourceCount: registry.size() }, 'Resource registry initialized');
  
  return registry;
}

export { ResourceRegistry } from './ResourceRegistry.js';
export type { ResourceDefinition, ResourceImplementation } from './types.js';