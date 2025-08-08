import { GetPromptResult, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { BasePrompt, PromptDefinition } from '../types.js';

export class GenerateTestPrompt extends BasePrompt {
  definition: PromptDefinition = {
    name: 'generate_test',
    description: 'Generate unit tests for the provided code',
    arguments: [
      {
        name: 'code',
        description: 'The code to generate tests for',
        required: true
      },
      {
        name: 'language',
        description: 'Programming language of the code',
        required: false
      },
      {
        name: 'framework',
        description: 'Testing framework to use (e.g., jest, pytest, junit)',
        required: false
      },
      {
        name: 'style',
        description: 'Testing style (unit, integration, e2e)',
        required: false
      }
    ]
  };

  async getPrompt(args?: Record<string, string>): Promise<GetPromptResult> {
    if (!args?.code) {
      throw new McpError(ErrorCode.InvalidParams, 'Code is required to generate tests');
    }

    const language = args.language || '';
    const framework = args.framework || 'an appropriate testing framework';
    const style = args.style || 'unit';

    return {
      description: 'Test generation request',
      messages: [
        this.createMessage('user',
          `Please generate ${style} tests for the following ${language} code using ${framework}:\n\n\`\`\`${language}\n${args.code}\n\`\`\`\n\nInclude:\n1. Test setup and teardown if needed\n2. Tests for normal cases\n3. Tests for edge cases\n4. Tests for error conditions\n5. Clear test descriptions\n6. Assertions that verify the expected behavior`
        )
      ]
    };
  }
}