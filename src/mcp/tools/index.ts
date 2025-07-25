import { ToolRegistry } from './ToolRegistry.js';
import { EchoTool } from './echo/EchoTool.js';
import { TimestampTool } from './timestamp/TimestampTool.js';

export function createToolRegistry(): ToolRegistry {
  const registry = new ToolRegistry();
  
  // Register all tools
  registry.register(new EchoTool());
  registry.register(new TimestampTool());
  
  console.error(`Tool registry initialized with ${registry.size()} tools`);
  
  return registry;
}

export { ToolRegistry } from './ToolRegistry.js';
export type { ToolDefinition, ToolImplementation } from './types.js';