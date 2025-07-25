export interface OAuthTokens {
  access_token?: string | null;
  refresh_token?: string | null;
  id_token?: string | null;
  token_type?: string;
  scope?: string;
  expiry_date?: number | null;
}

export interface OAuthUserInfo {
  id?: string;
  email?: string;
  name?: string;
  picture?: string;
  [key: string]: any;
}

export interface OAuthProvider {
  generateAuthUrl(scopes?: string[]): string;
  getToken(code: string): Promise<OAuthTokens>;
  refreshAccessToken(refreshToken: string): Promise<OAuthTokens>;
  getUserInfo(accessToken: string): Promise<OAuthUserInfo>;
  verifyIdToken?(idToken: string): Promise<any>;
}