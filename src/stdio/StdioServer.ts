import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { envProvider } from '../envProvider';

export class StdioServer {
  private readonly transport: StdioServerTransport;

  constructor() {
    this.transport = new StdioServerTransport();
  }

  async connectMCPServer(mcpServer: Server) {
    await mcpServer.connect(this.transport);
    console.error(`${envProvider.mcpServerName} v${envProvider.mcpServerVersion} started (stdio transport)`);
  }
}