import express, { Express } from 'express';
import cors from 'cors';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { envProvider } from '../envProvider';
import { dcrAuthMiddleware } from './dcrAuthMiddleware';
import { createOAuthMetadataRouter } from './oauthMetadataMiddleware';
import { loggingMiddleware } from './loggingMiddleware';
import { ipFilterMiddleware } from './ipFilterMiddleware';
import { emailFilterMiddleware } from './emailFilterMiddleware';
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
    // Set to specific number or list to satisfy express-rate-limit
    this.app.set('trust proxy', 1); // Trust first proxy (Cloudflare)
    
    // Enable CORS for all origins (needed for MCP Inspector)
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true })); // For OAuth token requests
    
    // Add logging middleware
    if (process.env.REQUEST_LOGGING !== 'false') {
      this.app.use(loggingMiddleware);
    }
    
    // Setup OAuth metadata endpoints if auth is enabled
    // This must come BEFORE the auth middleware so the metadata endpoints are public
    if (envProvider.authEnabled) {
      const metadataRouter = createOAuthMetadataRouter();
      this.app.use(metadataRouter);
    }
    
    // Apply DCR-compliant auth middleware globally if AUTH_ENABLED=true
    this.app.use(dcrAuthMiddleware);
    
    // Apply email filter AFTER auth (needs user info from auth)
    this.app.use(emailFilterMiddleware);
  }

  setupMCPEndpoints() {
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
      logger.info(`${envProvider.mcpServerName} v${envProvider.mcpServerVersion} started`);

      if (envProvider.authEnabled) {
        logger.info('Authentication is ENABLED - Bearer token required for MCP endpoints');
      }
      if (envProvider.filterByIp) {
        logger.info({ allowedIps: envProvider.filterByIp }, 'IP filtering is ENABLED');
      }
      if (envProvider.allowedEmails) {
        logger.info({ allowedEmails: envProvider.allowedEmails }, 'Email filtering is ENABLED');
      }
    });
  }
}