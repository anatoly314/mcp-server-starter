import { Prompt } from '@modelcontextprotocol/sdk/types.js';
import { PromptImplementation } from './types.js';
import { createLogger } from '../../../logger.js';

const logger = createLogger('prompt-registry');

export class PromptRegistry {
  private prompts = new Map<string, PromptImplementation>();

  register(prompt: PromptImplementation): void {
    this.prompts.set(prompt.definition.name, prompt);
    logger.info({ name: prompt.definition.name }, 'Registered prompt');
  }

  getAll(): PromptImplementation[] {
    return Array.from(this.prompts.values());
  }

  get(name: string): PromptImplementation | undefined {
    return this.prompts.get(name);
  }

  getPromptDefinitions(): Prompt[] {
    return this.getAll().map(prompt => ({
      name: prompt.definition.name,
      description: prompt.definition.description,
      arguments: prompt.definition.arguments?.map(arg => ({
        name: arg.name,
        description: arg.description,
        required: arg.required ?? false
      }))
    }));
  }

  has(name: string): boolean {
    return this.prompts.has(name);
  }

  size(): number {
    return this.prompts.size;
  }
}