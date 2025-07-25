import { CallToolResult, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { BaseTool, ToolDefinition } from '../types.js';

export class EchoTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'echo',
    description: 'Simple echo command for testing',
    inputSchema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'Message to echo back'
        }
      },
      required: ['message']
    }
  };

  async execute(args: any): Promise<CallToolResult> {
    if (!args?.message || typeof args.message !== 'string') {
      throw new McpError(ErrorCode.InvalidParams, 'Message is required');
    }
    
    return {
      content: [
        {
          type: 'text',
          text: `Echo: ${args.message}`
        }
      ]
    };
  }
}