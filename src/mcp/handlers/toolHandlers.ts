import { 
  CallToolRequest,
  ListToolsRequest,
  Tool,
  CallToolResult,
  ErrorCode,
  McpError 
} from '@modelcontextprotocol/sdk/types.js';
import { ToolRegistry } from '../primitives/tools';
import { MeasureExecution } from '../../o11y/metrics/decorators.js';

export class ToolHandlers {
  constructor(private readonly toolRegistry: ToolRegistry) {}

  async handleListTools(_request: ListToolsRequest): Promise<{ tools: Tool[] }> {
    const tools = this.toolRegistry.getToolDefinitions();
    return { tools };
  }

  @MeasureExecution('tool')
  async handleCallTool(request: CallToolRequest): Promise<CallToolResult> {
    const { name, arguments: args } = request.params;

    try {
      const tool = this.toolRegistry.get(name);
      
      if (!tool) {
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
      }

      return await tool.execute(args);
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error}`);
    }
  }
}