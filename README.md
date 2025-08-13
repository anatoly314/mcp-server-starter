# MCP Server Starter

Production-ready Model Context Protocol server with OAuth, logging, and security.

## Features

- ✅ MCP server with HTTP/SSE and stdio transports
- ✅ OAuth 2.0 with Dynamic Client Registration (Clerk)
- ✅ IP filtering, email filtering, structured logging
- ✅ TypeScript, modular architecture
- ✅ Docker support

## Quick Start

```bash
# Install
git clone https://github.com/anatoly314/mcp-server-starter.git
cd mcp-server-starter
pnpm install

# Configure
cp .env.http.example .env.http
# Edit .env.http with your settings

# Run
pnpm run dev:http
```

Server runs at `http://localhost:3000`

## Environment Variables

### Required
- `PUBLIC_URL` - Where your server is accessible (e.g., `http://localhost:3000`)

### OAuth (optional)
- `AUTH_ENABLED=true` - Enable OAuth
- `OAUTH_ISSUER_URL` - OAuth provider URL (e.g., Clerk domain)
- `SERVICE_DOCUMENTATION_URL` - Link to your docs

### Security (optional)
- `FILTER_BY_IP` - Comma-separated IPs/CIDR ranges
- `ALLOWED_EMAILS` - Comma-separated email whitelist

## Extending

Add your functionality in `/src/mcp/primitives/`:
- `tools/` - MCP tools
- `resources/` - MCP resources  
- `prompts/` - MCP prompts

## Deployment

### Docker
```bash
docker build -t mcp-server .
docker run -p 3000:3000 --env-file .env.http mcp-server
```

### Claude Desktop
See [CLAUDE_DESKTOP_SETUP.md](CLAUDE_DESKTOP_SETUP.md)

### OAuth with Clerk
See [CLERK_SETUP.md](CLERK_SETUP.md)

## License

MIT