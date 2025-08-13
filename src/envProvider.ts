interface EnvironmentConfig {
  // OAuth Configuration
  AUTH_ENABLED: boolean;
  OAUTH_AUTHORIZATION_SERVER_URL?: string;
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
  ALLOWED_EMAILS?: string;
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
    const publicUrl = process.env.PUBLIC_URL;
    
    return {
      // OAuth Configuration
      AUTH_ENABLED: authEnabled,
      OAUTH_AUTHORIZATION_SERVER_URL: process.env.OAUTH_AUTHORIZATION_SERVER_URL,
      PUBLIC_URL: publicUrl,
      
      // MCP Configuration
      MCP_SERVER_NAME: process.env.MCP_SERVER_NAME || 'mcp-server-starter',
      MCP_SERVER_VERSION: process.env.MCP_SERVER_VERSION || '1.0.0',
      PORT: process.env.PORT || '3000',
      TRANSPORT_TYPE: (transportType === 'stdio' ? 'stdio' : 'http') as 'stdio' | 'http',
      HTTP_HOST: process.env.HTTP_HOST || 'localhost',
      HTTP_PORT: process.env.HTTP_PORT || '3000',
      
      // Security Configuration
      FILTER_BY_IP: process.env.FILTER_BY_IP,
      ALLOWED_EMAILS: process.env.ALLOWED_EMAILS
    };
  }

  private validateConfig(): void {
    if (this.config.AUTH_ENABLED) {
      if (!this.config.OAUTH_AUTHORIZATION_SERVER_URL) {
        throw new Error('Missing required environment variable: OAUTH_AUTHORIZATION_SERVER_URL');
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

  get oauthAuthorizationServerUrl(): string | undefined {
    return this.config.OAUTH_AUTHORIZATION_SERVER_URL;
  }

  get publicUrl(): string | undefined {
    return this.config.PUBLIC_URL;
  }

  get filterByIp(): string | undefined {
    return this.config.FILTER_BY_IP;
  }

  get allowedEmails(): string | undefined {
    return this.config.ALLOWED_EMAILS;
  }

  getAll(): EnvironmentConfig {
    return { ...this.config };
  }
}

export const envProvider = new EnvProvider();