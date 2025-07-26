import { ResourceRegistry } from './ResourceRegistry.js';
import { AuthStatusResource } from './auth/AuthStatusResource.js';
import { SystemInfoResource } from './system/SystemInfoResource.js';
import { ServerConfigResource } from './config/ServerConfigResource.js';

export function createResourceRegistry(): ResourceRegistry {
  const registry = new ResourceRegistry();
  
  // Register all resources
  registry.register(new AuthStatusResource());
  registry.register(new SystemInfoResource());
  registry.register(new ServerConfigResource());
  
  console.error(`Resource registry initialized with ${registry.size()} resources`);
  
  return registry;
}

export { ResourceRegistry } from './ResourceRegistry.js';
export type { ResourceDefinition, ResourceImplementation } from './types.js';