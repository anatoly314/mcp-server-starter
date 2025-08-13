# Environment Setup

## Basic Configuration

```bash
cp .env.http.example .env.http
```

## Required Variables

```env
# Where your server is accessible
PUBLIC_URL=http://localhost:3000
```

## Optional Variables

### Server
```env
MCP_SERVER_NAME=my-mcp-server
MCP_SERVER_VERSION=1.0.0
HTTP_HOST=0.0.0.0
HTTP_PORT=3000
```

### OAuth (Clerk)
```env
AUTH_ENABLED=true
OAUTH_ISSUER_URL=https://your-app.clerk.accounts.dev
SERVICE_DOCUMENTATION_URL=https://github.com/your-org/your-repo
```

### Security
```env
# IP filtering (comma-separated)
FILTER_BY_IP=127.0.0.1,192.168.1.0/24

# Email whitelist (comma-separated)
ALLOWED_EMAILS=user@example.com,admin@company.org
```

## Examples

### Local Development (No Auth)
```env
PUBLIC_URL=http://localhost:3000
```

### Production with Clerk OAuth
```env
PUBLIC_URL=https://mcp.yourdomain.com
AUTH_ENABLED=true
OAUTH_ISSUER_URL=https://your-app.clerk.accounts.dev
ALLOWED_EMAILS=team@company.com
```

### Claude Desktop (stdio)
No `.env` file needed - configuration in Claude Desktop settings.