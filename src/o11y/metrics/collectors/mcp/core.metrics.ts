import { getMeter } from '../../provider.js';

const METER_NAME = 'mcp-server.mcp';

export function initializeMcpMetrics() {
  const meter = getMeter(METER_NAME);

  const mcpOperationDuration = meter.createHistogram('mcp_operation_duration_seconds', {
    description: 'Duration of MCP operations in seconds',
    unit: 's',
  });

  const mcpOperationTotal = meter.createCounter('mcp_operations_total', {
    description: 'Total number of MCP operations',
  });

  const mcpOperationErrors = meter.createCounter('mcp_operation_errors_total', {
    description: 'Total number of MCP operation errors',
  });

  const mcpMessageSizeBytes = meter.createHistogram('mcp_message_size_bytes', {
    description: 'Size of MCP messages in bytes',
    unit: 'By',
  });

  return {
    mcpOperationDuration,
    mcpOperationTotal,
    mcpOperationErrors,
    mcpMessageSizeBytes,
  };
}