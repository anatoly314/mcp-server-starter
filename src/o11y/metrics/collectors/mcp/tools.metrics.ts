import { getMeter } from '../../provider.js';

const METER_NAME = 'mcp-server.tools';

export function initializeToolsMetrics() {
  const meter = getMeter(METER_NAME);

  const toolExecutionDuration = meter.createHistogram('tool_execution_duration_seconds', {
    description: 'Duration of tool executions in seconds',
    unit: 's',
  });

  const toolExecutionTotal = meter.createCounter('tool_executions_total', {
    description: 'Total number of tool executions',
  });

  const toolExecutionErrors = meter.createCounter('tool_execution_errors_total', {
    description: 'Total number of tool execution errors',
  });

  return {
    toolExecutionDuration,
    toolExecutionTotal,
    toolExecutionErrors,
  };
}