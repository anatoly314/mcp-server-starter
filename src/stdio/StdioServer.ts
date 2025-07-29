import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { envProvider } from '../envProvider';
import { createLogger } from '../logger';

const logger = createLogger('stdio');

export class StdioServer {
  private readonly transport: StdioServerTransport;

  constructor() {
    this.transport = new StdioServerTransport();
  }

  async connectMCPServer(mcpServer: Server) {
    await mcpServer.connect(this.transport);
    logger.info(`${envProvider.mcpServerName} v${envProvider.mcpServerVersion} started (stdio transport)`);
  }
}