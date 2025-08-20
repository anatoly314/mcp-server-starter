import { PromptRegistry } from './PromptRegistry.js';
import { CodeReviewPrompt } from './code-review/CodeReviewPrompt.js';
import { ExplainCodePrompt } from './explain-code/ExplainCodePrompt.js';
import { GenerateTestPrompt } from './generate-test/GenerateTestPrompt.js';
import { createLogger } from '../../../logger.js';

const logger = createLogger('prompts');

export function createPromptRegistry(): PromptRegistry {
  const registry = new PromptRegistry();
  
  // Register all prompts
  registry.register(new CodeReviewPrompt());
  registry.register(new ExplainCodePrompt());
  registry.register(new GenerateTestPrompt());
  
  logger.info({ promptCount: registry.size() }, 'Prompt registry initialized');
  
  return registry;
}

export { PromptRegistry } from './PromptRegistry.js';
export type { PromptDefinition, PromptImplementation } from './BasePrompt.js';