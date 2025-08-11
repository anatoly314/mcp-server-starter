import { 
  GetPromptRequest,
  ListPromptsRequest,
  Prompt,
  GetPromptResult,
  ErrorCode,
  McpError 
} from '@modelcontextprotocol/sdk/types.js';
import { PromptRegistry } from '../primitives/prompts/PromptRegistry.js';

export class PromptHandlers {
  constructor(private readonly promptRegistry: PromptRegistry) {}

  async handleListPrompts(request: ListPromptsRequest): Promise<{ prompts: Prompt[] }> {
    const prompts = this.promptRegistry.getPromptDefinitions();
    return { prompts };
  }

  async handleGetPrompt(request: GetPromptRequest): Promise<GetPromptResult> {
    const { name, arguments: args } = request.params;

    try {
      const prompt = this.promptRegistry.get(name);
      
      if (!prompt) {
        throw new McpError(ErrorCode.MethodNotFound, `Unknown prompt: ${name}`);
      }

      // Validate required arguments
      if (prompt.definition.arguments) {
        for (const arg of prompt.definition.arguments) {
          if (arg.required && (!args || !(arg.name in args))) {
            throw new McpError(
              ErrorCode.InvalidParams, 
              `Missing required argument: ${arg.name}`
            );
          }
        }
      }

      return await prompt.getPrompt(args);
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(ErrorCode.InternalError, `Prompt execution failed: ${error}`);
    }
  }
}