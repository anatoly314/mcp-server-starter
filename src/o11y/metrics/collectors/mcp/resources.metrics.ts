import { getMeter } from '../../provider.js';

const METER_NAME = 'mcp-server.resources';

export function initializeResourcesMetrics() {
  const meter = getMeter(METER_NAME);

  const resourceReadDuration = meter.createHistogram('resource_read_duration_seconds', {
    description: 'Duration of resource reads in seconds',
    unit: 's',
  });

  const resourceReadTotal = meter.createCounter('resource_reads_total', {
    description: 'Total number of resource reads',
  });

  const resourceReadErrors = meter.createCounter('resource_read_errors_total', {
    description: 'Total number of resource read errors',
  });

  const resourceSizeBytes = meter.createHistogram('resource_size_bytes', {
    description: 'Size of resources in bytes',
    unit: 'By',
  });

  return {
    resourceReadDuration,
    resourceReadTotal,
    resourceReadErrors,
    resourceSizeBytes,
  };
}