import { GetPromptResult, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { BasePrompt, PromptDefinition } from '../BasePrompt.js';

export class ExplainCodePrompt extends BasePrompt {
  definition: PromptDefinition = {
    name: 'explain_code',
    description: 'Generate an explanation for the provided code snippet',
    arguments: [
      {
        name: 'code',
        description: 'The code snippet to explain',
        required: true
      },
      {
        name: 'language',
        description: 'Programming language of the code',
        required: false
      },
      {
        name: 'level',
        description: 'Explanation level (beginner, intermediate, advanced)',
        required: false
      }
    ]
  };

  async getPrompt(args?: Record<string, string>): Promise<GetPromptResult> {
    if (!args?.code) {
      throw new McpError(ErrorCode.InvalidParams, 'Code is required for explanation');
    }

    const language = args.language || '';
    const level = args.level || 'intermediate';

    return {
      description: 'Code explanation request',
      messages: [
        this.createMessage('user',
          `Please explain the following ${language} code at a ${level} level:\n\n\`\`\`${language}\n${args.code}\n\`\`\`\n\nProvide:\n1. A high-level overview of what the code does\n2. Step-by-step breakdown of how it works\n3. Key concepts or patterns used\n4. Any important considerations or potential issues`
        )
      ]
    };
  }
}