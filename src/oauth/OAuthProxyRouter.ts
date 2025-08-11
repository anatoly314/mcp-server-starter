import { Router, Request, Response } from 'express';
import express from 'express';
import crypto from 'crypto';
import { OAuthProvider } from '../auth/providers/OAuthProvider';
import { OAuthFactory } from '../auth/OAuthFactory';
import { envProvider } from '../envProvider';
import { createLogger } from '../logger';

const logger = createLogger('oauth-proxy');

interface PendingAuthorization {
  code_challenge?: string;
  code_challenge_method?: string;
  redirect_uri: string;
  state?: string;
  google_code?: string;
}

export class OAuthProxyRouter {
  private readonly router: Router;
  private oauthProvider: OAuthProvider;
  private pendingAuthorizations: Map<string, PendingAuthorization> = new Map();

  constructor() {
    this.router = Router();
    this.oauthProvider = OAuthFactory.createProvider();
    this.setupRoutes();
    logger.info('OAuthProxyRouter initialized (DCR removed - using direct OAuth)');
  }

  private setupRoutes() {
    // OAuth authorization endpoint
    this.router.get('/oauth/authorize', this.handleAuthorization.bind(this));
    
    // OAuth token endpoint - needs urlencoded body parser for form data
    this.router.post('/oauth/token', express.urlencoded({ extended: true }), this.handleToken.bind(this));
    
    // OAuth callback endpoint
    this.router.get('/oauth/callback', this.handleCallback.bind(this));
  }

  private async handleAuthorization(req: Request, res: Response) {
    const {
      response_type,
      redirect_uri,
      scope,
      state,
      code_challenge,
      code_challenge_method
    } = req.query;

    logger.info({
      redirect_uri,
      has_pkce: !!code_challenge
    }, 'Authorization request (no client validation - DCR removed)');

    // Validate required parameters
    if (!redirect_uri) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'redirect_uri is required'
      });
    }

    // Generate authorization code
    const authCode = `auth_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Store authorization request (including PKCE parameters)
    this.pendingAuthorizations.set(authCode, {
      code_challenge: code_challenge as string,
      code_challenge_method: code_challenge_method as string || 'plain',
      redirect_uri: redirect_uri as string,
      state: state as string
    });
    
    logger.info({
      authCode,
      has_pkce: !!code_challenge
    }, 'Stored pending authorization');

    // Store the original redirect_uri in state so we can redirect back later
    const stateData = {
      original_redirect_uri: redirect_uri,
      original_state: state,
      auth_code: authCode
    };
    const encodedState = Buffer.from(JSON.stringify(stateData)).toString('base64');

    // Build OAuth provider URL
    const authUrl = this.oauthProvider.generateAuthUrl(
      scope ? (scope as string).split(' ') : envProvider.oauthScopes.split(' ')
    );

    // Add state parameter
    const finalAuthUrl = new URL(authUrl);
    finalAuthUrl.searchParams.set('state', encodedState);

    logger.info({ url: finalAuthUrl.toString() }, 'Redirecting to OAuth provider');
    res.redirect(finalAuthUrl.toString());
  }

  private async handleToken(req: Request, res: Response) {
    const {
      grant_type,
      code,
      redirect_uri,
      refresh_token,
      code_verifier
    } = req.body;

    try {
      let tokens;
      
      if (grant_type === 'authorization_code' && code) {
        // Get pending authorization
        const pendingAuth = this.pendingAuthorizations.get(code);
        if (!pendingAuth) {
          return res.status(400).json({
            error: 'invalid_grant',
            error_description: 'Invalid authorization code'
          });
        }

        // Verify redirect_uri matches
        if (redirect_uri && redirect_uri !== pendingAuth.redirect_uri) {
          return res.status(400).json({
            error: 'invalid_grant',
            error_description: 'redirect_uri mismatch'
          });
        }

        // Verify PKCE if it was used
        if (pendingAuth.code_challenge) {
          if (!code_verifier) {
            return res.status(400).json({
              error: 'invalid_request',
              error_description: 'code_verifier required'
            });
          }

          // Verify code challenge
          let computedChallenge: string;
          if (pendingAuth.code_challenge_method === 'S256') {
            computedChallenge = crypto
              .createHash('sha256')
              .update(code_verifier)
              .digest('base64url');
          } else {
            computedChallenge = code_verifier;
          }

          if (computedChallenge !== pendingAuth.code_challenge) {
            return res.status(400).json({
              error: 'invalid_grant',
              error_description: 'Invalid code_verifier'
            });
          }
        }

        // Exchange OAuth provider's authorization code for tokens
        const providerCode = pendingAuth.google_code;
        if (!providerCode) {
          return res.status(400).json({
            error: 'invalid_grant',
            error_description: 'Authorization not completed'
          });
        }

        tokens = await this.oauthProvider.getToken(providerCode);
        
        // Clean up
        this.pendingAuthorizations.delete(code);
      } else if (grant_type === 'refresh_token' && refresh_token) {
        // Refresh access token
        tokens = await this.oauthProvider.refreshAccessToken(refresh_token);
      } else {
        return res.status(400).json({
          error: 'unsupported_grant_type',
          error_description: 'Only authorization_code and refresh_token grant types are supported'
        });
      }

      // Log token info for debugging
      logger.info({
        has_access_token: !!tokens.access_token,
        has_refresh_token: !!tokens.refresh_token,
        expires_in: tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : 3600,
        grant_type
      }, 'Returning tokens to client');

      // Return Google tokens directly (spec compliant)
      res.json({
        access_token: tokens.access_token,
        token_type: 'Bearer',
        expires_in: tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : 3600,
        refresh_token: tokens.refresh_token,
        scope: tokens.scope || envProvider.oauthScopes
      });
    } catch (error: any) {
      logger.error({ error }, 'Token exchange error');
      res.status(400).json({
        error: 'invalid_grant',
        error_description: error.message || 'Failed to exchange tokens'
      });
    }
  }

  private async handleCallback(req: Request, res: Response) {
    const { code, state, error } = req.query;
    
    if (error) {
      // Decode state to get original redirect_uri
      try {
        const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
        const errorUrl = new URL(stateData.original_redirect_uri);
        errorUrl.searchParams.set('error', error as string);
        if (stateData.original_state) {
          errorUrl.searchParams.set('state', stateData.original_state);
        }
        return res.redirect(errorUrl.toString());
      } catch {
        return res.status(400).send(`OAuth error: ${error}`);
      }
    }

    if (!code || !state) {
      return res.status(400).send('Authorization code or state missing');
    }

    try {
      // Decode the state to get the original redirect_uri and our auth code
      const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
      
      // Store the OAuth provider's code for later exchange
      const pendingAuth = this.pendingAuthorizations.get(stateData.auth_code);
      if (pendingAuth) {
        // Update with provider's code
        this.pendingAuthorizations.set(stateData.auth_code, {
          ...pendingAuth,
          google_code: code as string
        });
      }
      
      // Redirect back to the original client with our authorization code
      const callbackUrl = new URL(stateData.original_redirect_uri);
      callbackUrl.searchParams.set('code', stateData.auth_code);
      if (stateData.original_state) {
        callbackUrl.searchParams.set('state', stateData.original_state);
      }
      
      logger.info({ auth_code: stateData.auth_code }, 'Redirecting back to client with auth code');
      res.redirect(callbackUrl.toString());
    } catch (error) {
      logger.error({ error }, 'Failed to decode state');
      res.status(400).send('Invalid state parameter');
    }
  }

  getRouter(): Router {
    return this.router;
  }
}