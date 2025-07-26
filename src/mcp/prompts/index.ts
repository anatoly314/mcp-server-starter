import { PromptRegistry } from './PromptRegistry.js';
import { CodeReviewPrompt } from './code-review/CodeReviewPrompt.js';
import { ExplainCodePrompt } from './explain-code/ExplainCodePrompt.js';
import { GenerateTestPrompt } from './generate-test/GenerateTestPrompt.js';

export function createPromptRegistry(): PromptRegistry {
  const registry = new PromptRegistry();
  
  // Register all prompts
  registry.register(new CodeReviewPrompt());
  registry.register(new ExplainCodePrompt());
  registry.register(new GenerateTestPrompt());
  
  console.error(`Prompt registry initialized with ${registry.size()} prompts`);
  
  return registry;
}

export { PromptRegistry } from './PromptRegistry.js';
export type { PromptDefinition, PromptImplementation } from './types.js';