import { Router, Request, Response } from 'express';
import express from 'express';
import crypto from 'crypto';
import { OAuthProvider } from '../auth/providers/OAuthProvider';
import { OAuthFactory } from '../auth/OAuthFactory';
import { envProvider } from '../envProvider';

interface RegisteredClient {
  client_id: string;
  client_secret: string;
  redirect_uris: string[];
  client_name?: string;
  grant_types: string[];
  response_types: string[];
  scope?: string;
}

interface PendingAuthorization {
  code_challenge?: string;
  code_challenge_method?: string;
  client_id: string;
  redirect_uri: string;
  state?: string;
  google_code?: string;
}

export class OAuthProxyRouter {
  private readonly router: Router;
  private oauthProvider: OAuthProvider;
  private registeredClients: Map<string, RegisteredClient> = new Map();
  private pendingAuthorizations: Map<string, PendingAuthorization> = new Map();

  constructor() {
    this.router = Router();
    this.oauthProvider = OAuthFactory.createProvider();
    this.setupRoutes();
    console.error('OAuthProxyRouter initialized');
  }

  private setupRoutes() {
    // Dynamic client registration endpoint
    this.router.post('/oauth/register', this.handleClientRegistration.bind(this));
    
    // OAuth authorization endpoint
    this.router.get('/oauth/authorize', this.handleAuthorization.bind(this));
    
    // OAuth token endpoint - needs urlencoded body parser for form data
    this.router.post('/oauth/token', express.urlencoded({ extended: true }), this.handleToken.bind(this));
    
    // OAuth callback endpoint
    this.router.get('/oauth/callback', this.handleCallback.bind(this));
  }

  private async handleClientRegistration(req: Request, res: Response) {
    try {
      const {
        redirect_uris,
        client_name,
        grant_types = ['authorization_code'],
        response_types = ['code'],
        scope
      } = req.body;

      // Validate required fields
      if (!redirect_uris || !Array.isArray(redirect_uris) || redirect_uris.length === 0) {
        return res.status(400).json({
          error: 'invalid_redirect_uri',
          error_description: 'redirect_uris is required and must be a non-empty array'
        });
      }

      // Generate client credentials
      const client_id = `mcp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const client_secret = Buffer.from(Math.random().toString()).toString('base64').substring(0, 32);

      // Store the client
      const client: RegisteredClient = {
        client_id,
        client_secret,
        redirect_uris,
        client_name: client_name || 'MCP Client',
        grant_types,
        response_types,
        scope
      };
      this.registeredClients.set(client_id, client);

      // Return client information
      const response = {
        client_id,
        client_secret,
        redirect_uris,
        client_name: client.client_name,
        grant_types,
        response_types,
        scope,
        client_id_issued_at: Math.floor(Date.now() / 1000)
      };

      console.error('Registered new OAuth client:', {
        client_id,
        redirect_uris,
        total_clients: this.registeredClients.size
      });
      res.status(201).json(response);
    } catch (error) {
      console.error('Client registration error:', error);
      res.status(400).json({
        error: 'invalid_client_metadata',
        error_description: 'Failed to register client'
      });
    }
  }

  private async handleAuthorization(req: Request, res: Response) {
    const {
      response_type,
      client_id,
      redirect_uri,
      scope,
      state,
      code_challenge,
      code_challenge_method
    } = req.query;

    // Validate client_id
    console.error('Authorization request:', {
      client_id,
      registered_clients: Array.from(this.registeredClients.keys()),
      total_clients: this.registeredClients.size
    });
    
    let client = this.registeredClients.get(client_id as string);
    if (!client) {
      // Auto-register Claude clients
      if ((client_id as string).startsWith('mcp_') && redirect_uri) {
        console.error('Auto-registering Claude client:', client_id);
        client = {
          client_id: client_id as string,
          client_secret: 'auto-generated', // Not used for PKCE flow
          redirect_uris: [redirect_uri as string],
          client_name: 'Claude MCP Client',
          grant_types: ['authorization_code'],
          response_types: ['code'],
          scope: scope as string
        };
        this.registeredClients.set(client_id as string, client);
      } else {
        console.error('Client not found:', client_id);
        return res.status(400).json({
          error: 'invalid_client',
          error_description: 'Client not found'
        });
      }
    }

    // Validate redirect_uri
    if (!client.redirect_uris.includes(redirect_uri as string)) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Invalid redirect_uri'
      });
    }

    // Generate authorization code
    const authCode = `auth_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Store authorization request (including PKCE parameters)
    this.pendingAuthorizations.set(authCode, {
      code_challenge: code_challenge as string,
      code_challenge_method: code_challenge_method as string || 'plain',
      client_id: client_id as string,
      redirect_uri: redirect_uri as string,
      state: state as string
    });
    
    console.error('Stored pending authorization:', {
      authCode,
      client_id,
      has_pkce: !!code_challenge
    });

    // Store the original redirect_uri in state so we can redirect back later
    const stateData = {
      original_redirect_uri: redirect_uri,
      original_state: state,
      client_id: client_id,
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

    console.error('Redirecting to OAuth provider:', finalAuthUrl.toString());
    res.redirect(finalAuthUrl.toString());
  }

  private async handleToken(req: Request, res: Response) {
    const {
      grant_type,
      code,
      redirect_uri,
      client_id,
      client_secret,
      refresh_token,
      code_verifier
    } = req.body;

    // Validate client
    const client = this.registeredClients.get(client_id);
    if (!client) {
      return res.status(401).json({
        error: 'invalid_client',
        error_description: 'Client not found'
      });
    }
    
    // For PKCE flow, client_secret might not be required
    const isPKCE = code_verifier !== undefined;
    if (!isPKCE && client.client_secret !== client_secret) {
      return res.status(401).json({
        error: 'invalid_client',
        error_description: 'Invalid client credentials'
      });
    }

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

      // Return Google tokens directly (spec compliant)
      res.json({
        access_token: tokens.access_token,
        token_type: 'Bearer',
        expires_in: tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : 3600,
        refresh_token: tokens.refresh_token,
        scope: tokens.scope || envProvider.oauthScopes
      });
    } catch (error: any) {
      console.error('Token exchange error:', error);
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
      
      console.error('Redirecting back to client with auth code:', stateData.auth_code);
      res.redirect(callbackUrl.toString());
    } catch (error) {
      console.error('Failed to decode state:', error);
      res.status(400).send('Invalid state parameter');
    }
  }

  getRouter(): Router {
    return this.router;
  }
}