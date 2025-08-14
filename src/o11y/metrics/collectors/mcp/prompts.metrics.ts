import { getMeter } from '../../provider.js';

const METER_NAME = 'mcp-server.prompts';

export function initializePromptsMetrics() {
  const meter = getMeter(METER_NAME);

  const promptGenerationDuration = meter.createHistogram('prompt_generation_duration_seconds', {
    description: 'Duration of prompt generation in seconds',
    unit: 's',
  });

  const promptGenerationTotal = meter.createCounter('prompt_generations_total', {
    description: 'Total number of prompt generations',
  });

  const promptGenerationErrors = meter.createCounter('prompt_generation_errors_total', {
    description: 'Total number of prompt generation errors',
  });

  return {
    promptGenerationDuration,
    promptGenerationTotal,
    promptGenerationErrors,
  };
}