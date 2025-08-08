# Environment Configuration Guide

Complete guide to configuring your MCP Server Starter Kit.

## Quick Start

```bash
# For HTTP transport (most common)
cp .env.http.example .env.http

# For stdio transport (Claude Desktop)
cp .env.stdio.example .env.stdio
```

## Core Configuration

### Transport Selection

| Variable | Options | Description |
|----------|---------|-------------|
| `TRANSPORT_TYPE` | `http`, `stdio` | How the server communicates |
| `HTTP_HOST` | IP address | For HTTP: bind address (default: `0.0.0.0`) |
| `HTTP_PORT` | Port number | For HTTP: server port (default: `3000`) |

### Server Identity

| Variable | Default | Description |
|----------|---------|-------------|
| `MCP_SERVER_NAME` | `mcp-server-starter` | Your server's name |
| `MCP_SERVER_VERSION` | `1.0.0` | Your server's version |

## Authentication Configuration

### Google OAuth Setup

| Variable | Required | Description |
|----------|----------|-------------|
| `AUTH_ENABLED` | No | Enable authentication (`true`/`false`) |
| `OAUTH_PROXY_ENABLED` | No | Enable OAuth proxy for MCP Inspector (`true`/`false`) |
| `OAUTH_CLIENT_ID` | If auth enabled | Your Google OAuth client ID |
| `OAUTH_CLIENT_SECRET` | If auth enabled | Your Google OAuth client secret |
| `PUBLIC_URL` | If auth enabled | Your server's public URL |

### OAuth URLs (Auto-configured for Google)

| Variable | Default |
|----------|---------|
| `OAUTH_AUTHORIZATION_URL` | `https://accounts.google.com/o/oauth2/v2/auth` |
| `OAUTH_TOKEN_URL` | `https://oauth2.googleapis.com/token` |
| `OAUTH_USERINFO_URL` | `https://www.googleapis.com/oauth2/v2/userinfo` |
| `OAUTH_SCOPES` | `openid email profile` |

## Security Configuration

### IP Filtering

Control which IPs can access your server:

```bash
# Single IP
FILTER_BY_IP=192.168.1.100

# Multiple IPs (comma-separated)
FILTER_BY_IP=192.168.1.100,10.0.0.5

# CIDR ranges
FILTER_BY_IP=192.168.1.0/24

# Mixed
FILTER_BY_IP=192.168.1.0/24,10.0.0.5,172.16.0.0/16
```

**Features:**
- Supports Cloudflare headers (`CF-Connecting-IP`)
- Always allows local connections
- Works with reverse proxies

### Email Filtering

Restrict access to specific email addresses (requires AUTH_ENABLED=true):

```bash
# Single email
ALLOWED_EMAILS=admin@company.com

# Multiple emails (comma-separated)
ALLOWED_EMAILS=john@example.com,jane@company.org,admin@gmail.com

# Empty = allow all authenticated users
ALLOWED_EMAILS=
```

**Features:**
- Case-insensitive comparison
- Works after OAuth authentication
- CSV list support

## Logging Configuration

| Variable | Options | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `debug`, `info`, `warn`, `error` | Minimum log level (default: `info`) |
| `REQUEST_LOGGING` | `true`, `false` | Log HTTP requests (default: `true`) |

## Environment-Specific Configurations

### Local Development

`.env.http`:
```bash
TRANSPORT_TYPE=http
HTTP_HOST=localhost
HTTP_PORT=3000
AUTH_ENABLED=false
LOG_LEVEL=debug
```

### Production with Auth

`.env.http`:
```bash
TRANSPORT_TYPE=http
HTTP_HOST=0.0.0.0
HTTP_PORT=3000
AUTH_ENABLED=true
OAUTH_CLIENT_ID=your-client-id
OAUTH_CLIENT_SECRET=your-client-secret
PUBLIC_URL=https://api.yourcompany.com
FILTER_BY_IP=office.ip.range/24
ALLOWED_EMAILS=team@yourcompany.com
LOG_LEVEL=info
```

### Claude Desktop

`.env.stdio`:
```bash
TRANSPORT_TYPE=stdio
MCP_SERVER_NAME=my-mcp-tools
MCP_SERVER_VERSION=1.0.0
AUTH_ENABLED=false
LOG_LEVEL=warn
```

## PUBLIC_URL Configuration

The `PUBLIC_URL` must match how users access your server:

| Scenario | PUBLIC_URL | OAuth Redirect URI |
|----------|------------|-------------------|
| Local dev | `http://localhost:3000` | `http://localhost:3000/oauth/callback` |
| Ngrok tunnel | `https://abc123.ngrok-free.app` | `https://abc123.ngrok-free.app/oauth/callback` |
| Production | `https://mcp.yourcompany.com` | `https://mcp.yourcompany.com/oauth/callback` |

**Important:** Add the OAuth Redirect URI to your Google OAuth client's authorized redirect URIs.

## Common Configurations

### Public API (No Auth)
```bash
TRANSPORT_TYPE=http
AUTH_ENABLED=false
```

### Internal Tool (IP Restricted)
```bash
TRANSPORT_TYPE=http
AUTH_ENABLED=false
FILTER_BY_IP=10.0.0.0/8
```

### Team Tool (Email Restricted)
```bash
TRANSPORT_TYPE=http
AUTH_ENABLED=true
OAUTH_CLIENT_ID=xxx
OAUTH_CLIENT_SECRET=xxx
ALLOWED_EMAILS=team@company.com
```

### High Security (Everything)
```bash
TRANSPORT_TYPE=http
AUTH_ENABLED=true
OAUTH_CLIENT_ID=xxx
OAUTH_CLIENT_SECRET=xxx
FILTER_BY_IP=office.ip/32
ALLOWED_EMAILS=admin@company.com
LOG_LEVEL=debug
REQUEST_LOGGING=true
```

## Troubleshooting

### Auth Issues
- Ensure `PUBLIC_URL` matches your actual URL
- Verify redirect URI is in Google Console
- Check `OAUTH_CLIENT_ID` and `OAUTH_CLIENT_SECRET` are correct

### Access Denied
- Check IP filtering rules
- Verify email is in `ALLOWED_EMAILS` list
- Look at logs for specific denial reason

### Can't Connect
- Verify `HTTP_HOST` and `HTTP_PORT`
- Check firewall rules
- Ensure server is running (`pnpm run dev:http`)

## Security Best Practices

1. **Always use AUTH_ENABLED=true in production**
2. **Set FILTER_BY_IP for additional security**
3. **Use ALLOWED_EMAILS for team-only access**
4. **Keep LOG_LEVEL=info or higher in production**
5. **Never commit .env files to git**
6. **Rotate OAuth secrets regularly**
7. **Use HTTPS in production (via reverse proxy)**