interface EnvironmentConfig {
  // OAuth Configuration
  AUTH_ENABLED: boolean;
  OAUTH_ISSUER_URL?: string;
  PUBLIC_URL: string; // Required
  SERVICE_DOCUMENTATION_URL?: string;
  
  
  // MCP Server Configuration
  MCP_SERVER_NAME: string;
  MCP_SERVER_VERSION: string;
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
    
    return {
      // OAuth Configuration
      AUTH_ENABLED: authEnabled,
      OAUTH_ISSUER_URL: process.env.OAUTH_ISSUER_URL,
      PUBLIC_URL: process.env.PUBLIC_URL || '', // Will be validated
      SERVICE_DOCUMENTATION_URL: process.env.SERVICE_DOCUMENTATION_URL,
      
      // MCP Configuration
      MCP_SERVER_NAME: process.env.MCP_SERVER_NAME || 'mcp-server-starter',
      MCP_SERVER_VERSION: process.env.MCP_SERVER_VERSION || '1.0.0',
      TRANSPORT_TYPE: (transportType === 'stdio' ? 'stdio' : 'http') as 'stdio' | 'http',
      HTTP_HOST: process.env.HTTP_HOST || 'localhost',
      HTTP_PORT: process.env.HTTP_PORT || '3000',
      
      // Security Configuration
      FILTER_BY_IP: process.env.FILTER_BY_IP,
      ALLOWED_EMAILS: process.env.ALLOWED_EMAILS
    };
  }

  private validateConfig(): void {
    if (!this.config.PUBLIC_URL) {
      throw new Error('Missing required environment variable: PUBLIC_URL');
    }
    
    if (this.config.AUTH_ENABLED) {
      if (!this.config.OAUTH_ISSUER_URL) {
        throw new Error('Missing required environment variable: OAUTH_ISSUER_URL when AUTH_ENABLED=true');
      }
    }
  }


  get mcpServerName(): string {
    return this.config.MCP_SERVER_NAME;
  }

  get mcpServerVersion(): string {
    return this.config.MCP_SERVER_VERSION;
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

  get oauthIssuerUrl(): string | undefined {
    return this.config.OAUTH_ISSUER_URL;
  }

  get publicUrl(): string {
    return this.config.PUBLIC_URL!; // Guaranteed to exist by validateConfig
  }
  
  get serviceDocumentationUrl(): string | undefined {
    return this.config.SERVICE_DOCUMENTATION_URL;
  }

  get filterByIp(): string | undefined {
    return this.config.FILTER_BY_IP;
  }

  get allowedEmails(): string | undefined {
    return this.config.ALLOWED_EMAILS;
  }
}

export const envProvider = new EnvProvider();