import { MCPServer } from './mcp/MCPServer';
import { HTTPServer } from './http/HTTPServer';
import { StdioServer } from './stdio/StdioServer';
import { OAuthProxyServer } from './oauth/OAuthProxyServer';
import { envProvider } from './envProvider';
import { createLogger } from './logger';

const logger = createLogger('server');

async function main() {
  try {
    // Create MCP server instance
    const mcpServer = new MCPServer();

    // Start appropriate transport based on configuration
    if (envProvider.transportType === 'stdio') {
      const stdioServer = new StdioServer();
      await stdioServer.connectMCPServer(mcpServer.getServer());
    } else {
      const httpServer = new HTTPServer();
      
      // Setup OAuth proxy if enabled
      if (envProvider.oauthProxyEnabled) {
        const oauthProxy = new OAuthProxyServer(httpServer.getApp());
        oauthProxy.setup();
      }
      
      // Setup MCP endpoints
      httpServer.setupMCPEndpoints();
      
      // Connect MCP server to HTTP transport
      await httpServer.connectMCPServer(mcpServer.getServer());
      
      // Start HTTP server
      httpServer.start();
    }
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Shutting down gracefully...');
  process.exit(0);
});

// Start the server
main().catch((error) => {
  logger.fatal({ error }, 'Unhandled error in main');
  process.exit(1);
});