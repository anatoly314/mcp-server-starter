import express, { Express } from 'express';
import cors from 'cors';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { envProvider } from '../envProvider';
import { authMiddleware } from './authMiddleware';
import { loggingMiddleware } from './loggingMiddleware';
import { ipFilterMiddleware } from './ipFilterMiddleware';
import { createLogger } from '../logger';

const logger = createLogger('http');

export class HTTPServer {
  private readonly app: Express;
  private readonly transport: StreamableHTTPServerTransport;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // Stateless mode
      enableJsonResponse: false // Use SSE streaming
    });
  }

  private setupMiddleware() {
    // IP filter must be first - it's our first line of defense
    this.app.use(ipFilterMiddleware);
    
    // Trust proxy headers (needed for reverse proxies like Cloudflare, nginx)
    this.app.set('trust proxy', true);
    
    // Enable CORS for all origins (needed for MCP Inspector)
    this.app.use(cors());
    this.app.use(express.json());
    
    // Add logging middleware
    if (process.env.REQUEST_LOGGING !== 'false') {
      this.app.use(loggingMiddleware);
    }
    
    // Apply auth middleware globally if AUTH_ENABLED=true
    this.app.use(authMiddleware);
  }

  getApp(): Express {
    return this.app;
  }

  setupMCPEndpoints() {
    // Handle MCP requests at /mcp
    this.app.post('/mcp', async (req, res) => {
      await this.transport.handleRequest(req, res, req.body);
    });

    this.app.get('/mcp', async (req, res) => {
      await this.transport.handleRequest(req, res);
    });

    this.app.delete('/mcp', async (req, res) => {
      await this.transport.handleRequest(req, res);
    });
    
    // Also handle MCP requests at root (for Claude compatibility)
    this.app.post('/', async (req, res) => {
      await this.transport.handleRequest(req, res, req.body);
    });

    this.app.get('/', async (req, res) => {
      await this.transport.handleRequest(req, res);
    });

    this.app.delete('/', async (req, res) => {
      await this.transport.handleRequest(req, res);
    });
  }

  async connectMCPServer(mcpServer: Server) {
    await mcpServer.connect(this.transport);
  }

  start() {
    this.app.listen(envProvider.httpPort, envProvider.httpHost, () => {
      const baseUrl = envProvider.publicUrl || `http://${envProvider.httpHost}:${envProvider.httpPort}`;
      logger.info(`${envProvider.mcpServerName} v${envProvider.mcpServerVersion} started`);
      logger.info('MCP endpoints available at:');
      logger.info(`  - ${baseUrl}/mcp (recommended)`);
      logger.info(`  - ${baseUrl}/ (Claude compatibility)`);
      if (envProvider.authEnabled) {
        logger.info('Authentication is ENABLED - Bearer token required for MCP endpoints');
      }
      if (envProvider.filterByIp) {
        logger.info({ allowedIps: envProvider.filterByIp }, 'IP filtering is ENABLED');
      }
    });
  }
}