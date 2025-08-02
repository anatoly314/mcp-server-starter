interface EnvironmentConfig {
  // OAuth Configuration
  AUTH_ENABLED: boolean;
  OAUTH_PROXY_ENABLED: boolean;
  OAUTH_PROVIDER: 'google' | 'custom';
  OAUTH_CLIENT_ID: string;
  OAUTH_CLIENT_SECRET: string;
  OAUTH_REDIRECT_URI: string;
  OAUTH_AUTHORIZATION_URL?: string;
  OAUTH_TOKEN_URL?: string;
  OAUTH_USERINFO_URL?: string;
  OAUTH_SCOPES?: string;
  PUBLIC_URL?: string;
  
  
  // MCP Server Configuration
  MCP_SERVER_NAME: string;
  MCP_SERVER_VERSION: string;
  PORT?: string;
  TRANSPORT_TYPE: 'stdio' | 'http';
  HTTP_HOST?: string;
  HTTP_PORT?: string;
  
  // Security Configuration
  FILTER_BY_IP?: string;
}

class EnvProvider {
  private config: EnvironmentConfig;

  constructor() {
    this.config = this.parseEnvironment();
    this.validateConfig();
  }

  private parseEnvironment(): EnvironmentConfig {
    const transportType = (process.env.TRANSPORT_TYPE || 'http').toLowerCase();
    const authEnabled = process.env.AUTH_ENABLED === 'true';
    const oauthProxyEnabled = process.env.OAUTH_PROXY_ENABLED === 'true';
    const oauthProvider = (process.env.OAUTH_PROVIDER || 'google') as 'google' | 'custom';
    
    const clientId = process.env.OAUTH_CLIENT_ID || '';
    const clientSecret = process.env.OAUTH_CLIENT_SECRET || '';
    
    // Derive redirect URI from PUBLIC_URL if not explicitly set
    const publicUrl = process.env.PUBLIC_URL;
    const defaultRedirectUri = publicUrl 
      ? `${publicUrl}/oauth/callback` 
      : `http://localhost:${process.env.HTTP_PORT || '3000'}/oauth/callback`;
    const redirectUri = process.env.OAUTH_REDIRECT_URI || defaultRedirectUri;
    
    return {
      // OAuth Configuration
      AUTH_ENABLED: authEnabled,
      OAUTH_PROXY_ENABLED: oauthProxyEnabled,
      OAUTH_PROVIDER: oauthProvider,
      OAUTH_CLIENT_ID: clientId,
      OAUTH_CLIENT_SECRET: clientSecret,
      OAUTH_REDIRECT_URI: redirectUri,
      OAUTH_AUTHORIZATION_URL: process.env.OAUTH_AUTHORIZATION_URL,
      OAUTH_TOKEN_URL: process.env.OAUTH_TOKEN_URL,
      OAUTH_USERINFO_URL: process.env.OAUTH_USERINFO_URL,
      OAUTH_SCOPES: process.env.OAUTH_SCOPES || 'openid email profile',
      PUBLIC_URL: process.env.PUBLIC_URL,
      
      // MCP Configuration
      MCP_SERVER_NAME: process.env.MCP_SERVER_NAME || 'mcp-server-sandbox',
      MCP_SERVER_VERSION: process.env.MCP_SERVER_VERSION || '1.0.0',
      PORT: process.env.PORT || '3000',
      TRANSPORT_TYPE: (transportType === 'stdio' ? 'stdio' : 'http') as 'stdio' | 'http',
      HTTP_HOST: process.env.HTTP_HOST || 'localhost',
      HTTP_PORT: process.env.HTTP_PORT || '3000',
      
      // Security Configuration
      FILTER_BY_IP: process.env.FILTER_BY_IP
    };
  }

  private validateConfig(): void {
    if (this.config.AUTH_ENABLED || this.config.OAUTH_PROXY_ENABLED) {
      if (!this.config.OAUTH_CLIENT_ID || !this.config.OAUTH_CLIENT_SECRET) {
        throw new Error('Missing required OAuth environment variables: OAUTH_CLIENT_ID and OAUTH_CLIENT_SECRET');
      }
      
      // All providers must specify their OAuth URLs
      const required = ['OAUTH_AUTHORIZATION_URL', 'OAUTH_TOKEN_URL', 'OAUTH_USERINFO_URL'];
      const missing = required.filter(key => !this.config[key as keyof EnvironmentConfig]);
      if (missing.length > 0) {
        throw new Error(`Missing required OAuth environment variables: ${missing.join(', ')}`);
      }
    }
  }


  get mcpServerName(): string {
    return this.config.MCP_SERVER_NAME;
  }

  get mcpServerVersion(): string {
    return this.config.MCP_SERVER_VERSION;
  }

  get port(): number {
    return parseInt(this.config.PORT || '3000', 10);
  }

  get authEnabled(): boolean {
    return this.config.AUTH_ENABLED;
  }

  get transportType(): 'stdio' | 'http' {
    return this.config.TRANSPORT_TYPE;
  }

  get httpHost(): string {
    return this.config.HTTP_HOST || 'localhost';
  }

  get httpPort(): number {
    return parseInt(this.config.HTTP_PORT || '3000', 10);
  }

  get oauthProvider(): 'google' | 'custom' {
    return this.config.OAUTH_PROVIDER;
  }

  get oauthClientId(): string {
    return this.config.OAUTH_CLIENT_ID;
  }

  get oauthClientSecret(): string {
    return this.config.OAUTH_CLIENT_SECRET;
  }

  get oauthRedirectUri(): string {
    return this.config.OAUTH_REDIRECT_URI;
  }

  get oauthAuthorizationUrl(): string {
    if (!this.config.OAUTH_AUTHORIZATION_URL) {
      throw new Error('OAUTH_AUTHORIZATION_URL is required');
    }
    return this.config.OAUTH_AUTHORIZATION_URL;
  }

  get oauthTokenUrl(): string {
    if (!this.config.OAUTH_TOKEN_URL) {
      throw new Error('OAUTH_TOKEN_URL is required');
    }
    return this.config.OAUTH_TOKEN_URL;
  }

  get oauthUserInfoUrl(): string {
    if (!this.config.OAUTH_USERINFO_URL) {
      throw new Error('OAUTH_USERINFO_URL is required');
    }
    return this.config.OAUTH_USERINFO_URL;
  }

  get oauthScopes(): string {
    return this.config.OAUTH_SCOPES || 'openid email profile';
  }

  get oauthProxyEnabled(): boolean {
    return this.config.OAUTH_PROXY_ENABLED;
  }

  get publicUrl(): string | undefined {
    return this.config.PUBLIC_URL;
  }

  get filterByIp(): string | undefined {
    return this.config.FILTER_BY_IP;
  }

  getAll(): EnvironmentConfig {
    return { ...this.config };
  }
}

export const envProvider = new EnvProvider();