import { ObservableGauge } from '@opentelemetry/api';
import { getMeter } from '../provider.js';

const METER_NAME = 'mcp-server.system';

export function initializeSystemMetrics() {
  const meter = getMeter(METER_NAME);

  // Node.js specific metrics not available from container metrics
  const eventLoopLag = meter.createObservableGauge('nodejs_event_loop_lag_seconds', {
    description: 'Node.js event loop lag in seconds',
    unit: 's',
  });

  const heapUsedPercent = meter.createObservableGauge('nodejs_heap_used_percent', {
    description: 'Percentage of heap memory used',
    unit: '%',
  });

  const externalMemory = meter.createObservableGauge('nodejs_external_memory_bytes', {
    description: 'Node.js external memory (C++ objects bound to JS)',
    unit: 'By',
  });

  // Note: Removed activeHandles and activeRequests metrics
  // These used private Node.js APIs which are unsafe

  // Set up callbacks to collect system metrics
  setupSystemMetricsCallbacks({
    eventLoopLag,
    heapUsedPercent,
    externalMemory,
  });

  return {
    eventLoopLag,
    heapUsedPercent,
    externalMemory,
  };
}

function setupSystemMetricsCallbacks(metrics: {
  eventLoopLag: ObservableGauge;
  heapUsedPercent: ObservableGauge;
  externalMemory: ObservableGauge;
}) {
  // Heap used percentage - useful for understanding memory pressure
  metrics.heapUsedPercent.addCallback((observableResult) => {
    const memUsage = process.memoryUsage();
    const percentage = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    observableResult.observe(percentage);
  });

  // External memory - C++ objects bound to JavaScript
  metrics.externalMemory.addCallback((observableResult) => {
    const memUsage = process.memoryUsage();
    observableResult.observe(memUsage.external);
  });

  // Event loop lag measurement
  let eventLoopLag = 0;
  
  // Measure event loop lag by scheduling a timer and checking how long it takes to execute
  setInterval(() => {
    const start = process.hrtime.bigint();
    setImmediate(() => {
      // This callback should run immediately if event loop is not blocked
      // Any delay indicates event loop lag
      const end = process.hrtime.bigint();
      const lagNs = Number(end - start);
      eventLoopLag = lagNs / 1e9; // Convert to seconds
    });
  }, 1000); // Check every second
  
  // Register the callback ONCE - it will be called whenever metrics are scraped
  metrics.eventLoopLag.addCallback((observableResult) => {
    observableResult.observe(eventLoopLag);
  });

  // Note: Removed activeHandles and activeRequests metrics
  // These used private Node.js APIs (_getActiveHandles, _getActiveRequests)
  // which are unsafe and can break in any Node.js version update.
  // There's no public API alternative for these metrics.
}