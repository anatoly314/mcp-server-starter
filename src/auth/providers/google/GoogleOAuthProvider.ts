import { OAuth2Client } from 'google-auth-library';
import { envProvider } from '../../../envProvider';
import { OAuthProvider, OAuthTokens, OAuthUserInfo } from '../OAuthProvider';
import { createLogger } from '../../../logger';

const logger = createLogger('google-oauth-provider');

export class GoogleOAuthProvider implements OAuthProvider {
  private oauth2Client: OAuth2Client;

  constructor() {
    // Use PUBLIC_URL if available, otherwise fall back to configured redirect URI
    const baseUrl = envProvider.publicUrl || `http://${envProvider.httpHost}:${envProvider.httpPort}`;
    const redirectUri = `${baseUrl}/oauth/callback`;
    
    this.oauth2Client = new OAuth2Client(
      envProvider.oauthClientId,
      envProvider.oauthClientSecret,
      redirectUri
    );
    logger.info({ redirectUri }, 'GoogleOAuth initialized');
  }

  generateAuthUrl(scopes: string[] = ['openid', 'email', 'profile']): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  async getToken(code: string): Promise<OAuthTokens> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);
      
      // Log whether refresh token was received
      logger.info({
        has_refresh_token: !!tokens.refresh_token,
        has_access_token: !!tokens.access_token,
        expiry_date: tokens.expiry_date
      }, 'Received tokens from Google');
      
      return tokens as OAuthTokens;
    } catch (error) {
      throw new Error(`Failed to exchange code for tokens: ${error}`);
    }
  }

  async verifyIdToken(idToken: string) {
    try {
      const ticket = await this.oauth2Client.verifyIdToken({
        idToken,
        audience: envProvider.oauthClientId
      });
      return ticket.getPayload();
    } catch (error) {
      throw new Error(`Failed to verify ID token: ${error}`);
    }
  }

  async getUserInfo(accessToken: string): Promise<OAuthUserInfo> {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });
      const response = await this.oauth2Client.request({
        url: envProvider.oauthUserInfoUrl
      });
      return response.data as OAuthUserInfo;
    } catch (error) {
      throw new Error(`Failed to get user info: ${error}`);
    }
  }

  setCredentials(tokens: any) {
    this.oauth2Client.setCredentials(tokens);
  }

  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    try {
      logger.info('Attempting to refresh access token');
      this.oauth2Client.setCredentials({ refresh_token: refreshToken });
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      logger.info({
        has_new_access_token: !!credentials.access_token,
        has_refresh_token: !!credentials.refresh_token,
        expiry_date: credentials.expiry_date
      }, 'Successfully refreshed access token');
      
      return credentials as OAuthTokens;
    } catch (error) {
      logger.error({ error }, 'Failed to refresh access token');
      throw new Error(`Failed to refresh access token: ${error}`);
    }
  }
}