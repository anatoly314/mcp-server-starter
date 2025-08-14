import { getAllMetrics, isMetricsEnabled } from './index.js';

/**
 * Decorator to automatically measure execution time and record metrics
 * for MCP operations (tools, resources, prompts)
 */
export function MeasureExecution(metricType: 'tool' | 'resource' | 'prompt') {
  return function (
    _target: any,
    _propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Check if metrics are enabled (only in HTTP mode with metrics enabled)
      if (!isMetricsEnabled()) {
        // If metrics are not enabled, just run the original method
        return originalMethod.apply(this, args);
      }
      
      const startTime = process.hrtime.bigint();
      const metrics = getAllMetrics();
      
      // Extract name from the request
      const request = args[0];
      const name = request?.params?.name || request?.params?.uri || 'unknown';
      
      try {
        // Execute the original method
        const result = await originalMethod.apply(this, args);
        
        // Record success metrics based on type
        const durationSeconds = Number(process.hrtime.bigint() - startTime) / 1e9;
        
        switch (metricType) {
          case 'tool':
            metrics.toolExecutionTotal?.add(1, { tool: name, status: 'success' });
            metrics.toolExecutionDuration?.record(durationSeconds, { tool: name });
            break;
          case 'resource':
            metrics.resourceReadTotal?.add(1, { resource: name, status: 'success' });
            metrics.resourceReadDuration?.record(durationSeconds, { resource: name });
            break;
          case 'prompt':
            metrics.promptGenerationTotal?.add(1, { prompt: name, status: 'success' });
            metrics.promptGenerationDuration?.record(durationSeconds, { prompt: name });
            break;
        }
        
        return result;
      } catch (error) {
        // Record error metrics
        const durationSeconds = Number(process.hrtime.bigint() - startTime) / 1e9;
        const errorName = error instanceof Error ? error.constructor.name : 'UnknownError';
        
        switch (metricType) {
          case 'tool':
            metrics.toolExecutionErrors?.add(1, { tool: name, error: errorName });
            metrics.toolExecutionTotal?.add(1, { tool: name, status: 'error' });
            metrics.toolExecutionDuration?.record(durationSeconds, { tool: name });
            break;
          case 'resource':
            metrics.resourceReadErrors?.add(1, { resource: name, error: errorName });
            metrics.resourceReadTotal?.add(1, { resource: name, status: 'error' });
            metrics.resourceReadDuration?.record(durationSeconds, { resource: name });
            break;
          case 'prompt':
            metrics.promptGenerationErrors?.add(1, { prompt: name, error: errorName });
            metrics.promptGenerationTotal?.add(1, { prompt: name, status: 'error' });
            metrics.promptGenerationDuration?.record(durationSeconds, { prompt: name });
            break;
        }
        
        throw error; // Re-throw the error
      }
    };

    return descriptor;
  };
}