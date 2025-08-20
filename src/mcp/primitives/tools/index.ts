import { ToolRegistry } from './ToolRegistry.js';
import { EchoTool } from './echo/EchoTool.js';
import { TimestampTool } from './timestamp/TimestampTool.js';
import { createLogger } from '../../../logger.js';

const logger = createLogger('tools');

export function createToolRegistry(): ToolRegistry {
  const registry = new ToolRegistry();
  
  // Register all tools
  registry.register(new EchoTool());
  registry.register(new TimestampTool());
  
  logger.info({ toolCount: registry.size() }, 'Tool registry initialized');
  
  return registry;
}

export { ToolRegistry } from './ToolRegistry.js';
export type { ToolDefinition, ToolImplementation } from './BaseTool';