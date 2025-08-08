import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { BaseTool, ToolDefinition } from '../types.js';

export class TimestampTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'get_timestamp',
    description: 'Get current timestamp',
    inputSchema: {
      type: 'object',
      properties: {
        format: {
          type: 'string',
          description: 'Timestamp format (iso, unix, readable)',
          default: 'iso'
        }
      }
    }
  };

  async execute(args: any): Promise<CallToolResult> {
    const format = (args?.format as string) || 'iso';
    const now = new Date();
    let timestamp: string;
    
    switch (format) {
      case 'unix':
        timestamp = Math.floor(now.getTime() / 1000).toString();
        break;
      case 'readable':
        timestamp = now.toString();
        break;
      case 'iso':
      default:
        timestamp = now.toISOString();
    }
    
    return {
      content: [
        {
          type: 'text',
          text: timestamp
        }
      ]
    };
  }
}