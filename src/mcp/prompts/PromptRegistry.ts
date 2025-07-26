import { Prompt } from '@modelcontextprotocol/sdk/types.js';
import { PromptImplementation } from './types.js';

export class PromptRegistry {
  private prompts = new Map<string, PromptImplementation>();

  register(prompt: PromptImplementation): void {
    this.prompts.set(prompt.definition.name, prompt);
    console.error(`Registered prompt: ${prompt.definition.name}`);
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