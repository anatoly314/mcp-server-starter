import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { ToolImplementation } from './types.js';
import { createLogger } from '../../../logger.js';

const logger = createLogger('tool-registry');

export class ToolRegistry {
  private tools = new Map<string, ToolImplementation>();

  register(tool: ToolImplementation): void {
    this.tools.set(tool.definition.name, tool);
    logger.info({ name: tool.definition.name }, 'Registered tool');
  }

  getAll(): ToolImplementation[] {
    return Array.from(this.tools.values());
  }

  get(name: string): ToolImplementation | undefined {
    return this.tools.get(name);
  }

  getToolDefinitions(): Tool[] {
    return this.getAll().map(tool => ({
      name: tool.definition.name,
      description: tool.definition.description,
      inputSchema: tool.definition.inputSchema
    }));
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  size(): number {
    return this.tools.size;
  }
}