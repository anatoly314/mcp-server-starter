import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export interface ToolInputSchema {
  type: 'object';
  properties?: Record<string, unknown>;
  required?: string[];
  [key: string]: unknown;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: ToolInputSchema;
}

export interface ToolImplementation {
  definition: ToolDefinition;
  execute(args: any): Promise<CallToolResult>;
}

export abstract class BaseTool implements ToolImplementation {
  abstract definition: ToolDefinition;
  abstract execute(args: any): Promise<CallToolResult>;
}