import { GetPromptResult, McpError, PromptMessage } from '@modelcontextprotocol/sdk/types.js';

export interface PromptArgumentDefinition {
  name: string;
  description: string;
  required?: boolean;
}

export interface PromptDefinition {
  name: string;
  description: string;
  arguments?: PromptArgumentDefinition[];
}

export interface PromptImplementation {
  definition: PromptDefinition;
  getPrompt(args?: Record<string, string>): Promise<GetPromptResult>;
}

export abstract class BasePrompt implements PromptImplementation {
  abstract definition: PromptDefinition;
  abstract getPrompt(args?: Record<string, string>): Promise<GetPromptResult>;
  
  protected createMessage(role: 'user' | 'assistant', text: string): PromptMessage {
    return {
      role,
      content: {
        type: 'text',
        text
      }
    };
  }
}