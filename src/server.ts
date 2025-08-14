import { MCPServer } from './mcp/MCPServer';
import { HTTPServer } from './http/HTTPServer';
import { StdioServer } from './stdio/StdioServer';
import { envProvider } from './envProvider';
import { createLogger } from './logger';

const logger = createLogger('server');

let httpServerInstance: HTTPServer;

async function main() {
  try {
    // Create MCP server instance
    const mcpServer = new MCPServer();

    // Start appropriate transport based on configuration
    if (envProvider.transportType === 'stdio') {
      const stdioServer = new StdioServer();
      await stdioServer.connectMCPServer(mcpServer.getServer());
    } else {
      httpServerInstance = new HTTPServer();
      
      // Setup MCP endpoints
      httpServerInstance.setupMCPEndpoints();
      
      // Connect MCP server to HTTP transport
      await httpServerInstance.connectMCPServer(mcpServer.getServer());
      
      // Start HTTP server
      httpServerInstance.start();
    }
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  if (httpServerInstance) {
    await httpServerInstance.shutdown();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down gracefully...');
  if (httpServerInstance) {
    await httpServerInstance.shutdown();
  }
  process.exit(0);
});

// Start the server
main().catch((error) => {
  logger.fatal({ error }, 'Unhandled error in main');
  process.exit(1);
});