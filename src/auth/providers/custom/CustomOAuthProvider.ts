import { OAuthProvider, OAuthTokens, OAuthUserInfo } from '../OAuthProvider';
import { envProvider } from '../../../envProvider';

export class CustomOAuthProvider implements OAuthProvider {
  generateAuthUrl(scopes?: string[]): string {
    const url = new URL(envProvider.oauthAuthorizationUrl);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', envProvider.oauthClientId);
    url.searchParams.set('redirect_uri', envProvider.oauthRedirectUri);
    url.searchParams.set('scope', scopes?.join(' ') || envProvider.oauthScopes);
    return url.toString();
  }

  async getToken(code: string): Promise<OAuthTokens> {
    const response = await fetch(envProvider.oauthTokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: envProvider.oauthRedirectUri,
        client_id: envProvider.oauthClientId,
        client_secret: envProvider.oauthClientSecret,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to exchange code for tokens: ${error}`);
    }

    return await response.json() as OAuthTokens;
  }

  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    const response = await fetch(envProvider.oauthTokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: envProvider.oauthClientId,
        client_secret: envProvider.oauthClientSecret,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to refresh access token: ${error}`);
    }

    return await response.json() as OAuthTokens;
  }

  async getUserInfo(accessToken: string): Promise<OAuthUserInfo> {
    if (!envProvider.oauthUserInfoUrl) {
      throw new Error('User info URL not configured');
    }

    const response = await fetch(envProvider.oauthUserInfoUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get user info: ${error}`);
    }

    return await response.json() as OAuthUserInfo;
  }
}