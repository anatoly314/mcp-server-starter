import { MCPServer } from './mcp/MCPServer';
import { HTTPServer } from './http/HTTPServer';
import { StdioServer } from './stdio/StdioServer';
import { OAuthProxyServer } from './oauth/OAuthProxyServer';
import { envProvider } from './envProvider';

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
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('\nShutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('\nShutting down gracefully...');
  process.exit(0);
});

// Start the server
main().catch(console.error);