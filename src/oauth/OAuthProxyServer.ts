import { Express } from 'express';
import { createMcpOAuthRouter } from './mcpSdkOAuth';
import { envProvider } from '../envProvider';
import { createLogger } from '../logger';

const logger = createLogger('oauth-proxy-server');

export class OAuthProxyServer {
  private app: Express;

  constructor(app: Express) {
    this.app = app;
  }

  setup() {
    // Setup OAuth routes using MCP SDK
    const oauthRouter = createMcpOAuthRouter();
    this.app.use(oauthRouter);

    const baseUrl = envProvider.publicUrl || `http://${envProvider.httpHost}:${envProvider.httpPort}`;
    logger.info({ baseUrl }, 'OAuth proxy server enabled using MCP SDK - OAuth metadata available at /.well-known/oauth-protected-resource');
  }
}