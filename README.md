# MCP Server Sandbox

A basic Model Context Protocol (MCP) server implementation with Google OAuth support.

## Features

- Google OAuth integration (optional)
- Basic MCP commands for testing
- Stateless architecture
- Environment-based configuration
- Configurable transport (HTTP or stdio)
- Easy to extend

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Configure authentication (optional):
   - Set `AUTH_ENABLED=true` in `.env` to enable authentication
   - If authentication is enabled:
     - Go to [Google Cloud Console](https://console.cloud.google.com/)
     - Create a new project or select an existing one
     - Enable Google+ API
     - Create OAuth 2.0 credentials
     - **IMPORTANT**: Add `http://localhost:3000/oauth/callback` to the authorized redirect URIs in Google Cloud Console
     - Add your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env`
   - If `AUTH_ENABLED=false`, authentication tools won't be available

## Running the Server

### HTTP Transport (default)
```bash
npx tsx -r dotenv/config src/server.ts
```

The server will start on `http://localhost:3000/mcp` by default.

### Stdio Transport
```bash
TRANSPORT_TYPE=stdio npx tsx -r dotenv/config src/server.ts
```

## Available Tools

### Authentication Tools (only available when AUTH_ENABLED=true)
- `get_auth_url` - Generate Google OAuth authentication URL
- `exchange_code` - Exchange authorization code for tokens
- `get_user_info` - Get user information from Google

### Basic Tools (always available)
- `echo` - Simple echo command for testing
- `get_timestamp` - Get current timestamp in various formats

## Available Resources

- `auth://status` - Current authentication configuration status

## Using with Claude Desktop

For stdio transport, add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "mcp-server-sandbox": {
      "command": "npx",
      "args": ["tsx", "-r", "dotenv/config", "/path/to/mcp-server-sandbox/src/server.ts"],
      "env": {
        "TRANSPORT_TYPE": "stdio"
      }
    }
  }
}
```

Note: HTTP transport is not currently supported in Claude Desktop.

## Architecture

```
src/
├── server.ts                 # Main entry point
├── envProvider.ts           # Environment configuration
├── auth/                    # OAuth providers
│   ├── OAuthProvider.ts     # OAuth provider interface
│   ├── OAuthFactory.ts      # Provider factory
│   ├── googleOAuth.ts       # Google OAuth implementation
│   └── customOAuth.ts       # Generic OAuth implementation
├── oauth/                   # OAuth proxy server
│   └── OAuthProxyRouter.ts  # OAuth proxy endpoints
├── mcp/                     # MCP server components
│   ├── MCPServer.ts         # MCP server setup
│   └── handlers/            # Request handlers
│       ├── toolHandlers.ts  # Tool implementations
│       └── resourceHandlers.ts # Resource implementations
├── http/                    # HTTP transport
│   └── HTTPServer.ts        # Express server setup
└── stdio/                   # Stdio transport
    └── StdioServer.ts       # Stdio server setup
```

### Key Design Principles

1. **Modular Architecture**: Each component has a single responsibility
2. **Provider Pattern**: OAuth providers are pluggable via the factory pattern
3. **Environment-based Configuration**: All config comes from environment variables
4. **Transport Agnostic**: MCP server works with both HTTP and stdio transports
5. **OAuth Flexibility**: Supports both Google OAuth and custom OAuth providers

## Development

### Adding New Tools

1. Edit `src/mcp/handlers/toolHandlers.ts`
2. Add tool definition in `handleListTools()`
3. Add tool implementation in `handleCallTool()`

### Adding New Resources

1. Edit `src/mcp/handlers/resourceHandlers.ts`
2. Add resource definition in `handleListResources()`
3. Add resource implementation in `handleReadResource()`

### Adding OAuth Providers

1. Create new provider in `src/auth/` implementing `OAuthProvider` interface
2. Update `OAuthFactory.ts` to include your provider
3. Set `OAUTH_PROVIDER=yourprovider` in `.env`

## Troubleshooting OAuth

### Error 400: redirect_uri_mismatch

If you see this error when trying to authenticate:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services > Credentials
3. Click on your OAuth 2.0 Client ID
4. Add `http://localhost:3000/oauth/callback` to "Authorized redirect URIs"
5. Save the changes

The redirect URI in Google Cloud Console must exactly match `GOOGLE_REDIRECT_URI` in your `.env` file.

## Testing with MCP Inspector

The project includes MCP Inspector for testing. First, start the server:

```bash
# Start server with authentication enabled
AUTH_ENABLED=true npm start

# Or without authentication
npm start
```

Then in another terminal, run the inspector:

```bash
# Test with OAuth proxy (works with MCP Inspector!)
npm run inspector:http

# Test without authentication 
npm run inspector:http:debug

# Test stdio transport
npm run inspector:stdio
```

## OAuth Proxy Implementation

This server implements a complete OAuth proxy that makes it compatible with MCP Inspector:

- **Registration Endpoint**: `/oauth/register` - Dynamic client registration (DCR)
- **Authorization Endpoint**: `/oauth/authorize` - Redirects to Google OAuth
- **Token Endpoint**: `/oauth/token` - Exchanges codes/tokens with Google
- **Callback Endpoint**: `/oauth/callback` - Handles Google's OAuth callback

The proxy supports:
- Dynamic client registration (required by MCP Inspector)
- PKCE (Proof Key for Code Exchange) with S256 and plain methods
- Client credential validation
- State management for OAuth flows
- Transparent forwarding to Google OAuth

This allows you to test the full OAuth flow in MCP Inspector while using Google as the actual identity provider.

## Testing HTTP Transport with curl

You can also test the HTTP transport using curl:

```bash
# Initialize
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{}}}'

# Call echo tool
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"echo","arguments":{"message":"Hello!"}}}'
```