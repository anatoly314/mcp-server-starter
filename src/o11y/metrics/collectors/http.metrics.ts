import { getMeter } from '../provider.js';

const METER_NAME = 'mcp-server.http';

export function initializeHttpMetrics() {
  const meter = getMeter(METER_NAME);

  const httpRequestDuration = meter.createHistogram('http_request_duration_seconds', {
    description: 'Duration of HTTP requests in seconds',
    unit: 's',
  });

  const httpRequestTotal = meter.createCounter('http_requests_total', {
    description: 'Total number of HTTP requests',
  });

  const httpActiveRequests = meter.createUpDownCounter('http_active_requests', {
    description: 'Number of active HTTP requests',
  });

  const httpRequestSizeBytes = meter.createHistogram('http_request_size_bytes', {
    description: 'Size of HTTP requests in bytes',
    unit: 'By',
  });

  const httpResponseSizeBytes = meter.createHistogram('http_response_size_bytes', {
    description: 'Size of HTTP responses in bytes',
    unit: 'By',
  });

  return {
    httpRequestDuration,
    httpRequestTotal,
    httpActiveRequests,
    httpRequestSizeBytes,
    httpResponseSizeBytes,
  };
}