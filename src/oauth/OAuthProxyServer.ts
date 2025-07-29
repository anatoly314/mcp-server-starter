import { Express } from 'express';
import { OAuthProxyRouter } from './OAuthProxyRouter';
import { envProvider } from '../envProvider';
import { dynamicOAuthMetadataMiddleware } from './dynamicOAuthMetadata';
import { createLogger } from '../logger';

const logger = createLogger('oauth-proxy-server');

export class OAuthProxyServer {
  private app: Express;

  constructor(app: Express) {
    this.app = app;
  }

  setup() {
    // Setup dynamic OAuth metadata endpoints
    this.app.use(dynamicOAuthMetadataMiddleware);

    // Setup OAuth proxy routes
    const oauthRouter = new OAuthProxyRouter();
    this.app.use(oauthRouter.getRouter());

    const baseUrl = envProvider.publicUrl || `http://${envProvider.httpHost}:${envProvider.httpPort}`;
    logger.info({ baseUrl }, 'OAuth proxy server enabled - OAuth metadata dynamically available at [request-origin]/.well-known/oauth-protected-resource');
  }
}