import { GetPromptResult, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { BasePrompt, PromptDefinition } from '../BasePrompt.js';

export class CodeReviewPrompt extends BasePrompt {
  definition: PromptDefinition = {
    name: 'code_review',
    description: 'Generate a code review request for the provided code',
    arguments: [
      {
        name: 'code',
        description: 'The code to be reviewed',
        required: true
      },
      {
        name: 'language',
        description: 'Programming language of the code (e.g., javascript, python, java)',
        required: false
      },
      {
        name: 'focus_areas',
        description: 'Specific areas to focus on (e.g., performance, security, readability)',
        required: false
      }
    ]
  };

  async getPrompt(args?: Record<string, string>): Promise<GetPromptResult> {
    if (!args?.code) {
      throw new McpError(ErrorCode.InvalidParams, 'Code is required for review');
    }

    const language = args.language || 'the provided';
    const focusAreas = args.focus_areas || 'code quality, best practices, and potential improvements';

    return {
      description: 'Code review request',
      messages: [
        this.createMessage('user', 
          `Please review the following ${language} code and provide feedback focusing on ${focusAreas}:\n\n\`\`\`${args.language || ''}\n${args.code}\n\`\`\`\n\nPlease provide:\n1. Overall assessment\n2. Specific issues or concerns\n3. Suggestions for improvement\n4. Best practices that could be applied`
        )
      ]
    };
  }
}