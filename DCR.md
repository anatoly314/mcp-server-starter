# Dynamic Client Registration (DCR) Explained

## What is DCR?

Dynamic Client Registration allows OAuth clients to register themselves automatically, without manual setup.

## Traditional OAuth vs DCR

### Traditional OAuth (Manual Registration)
1. Go to provider's dashboard (e.g., Google Console)
2. Manually create an application
3. Copy client_id and client_secret
4. Configure these in your app

```bash
OAUTH_CLIENT_ID=manually-copied-from-console
OAUTH_CLIENT_SECRET=manually-copied-from-console
```

### Dynamic Client Registration
1. Client discovers registration endpoint
2. Client sends registration request
3. Server generates credentials automatically
4. Client uses credentials immediately

```javascript
// Automatic registration
POST /oauth/register
{ "redirect_uris": ["http://localhost:5173/callback"] }

// Response
{ "client_id": "generated_id", "client_secret": "generated_secret" }
```

## Why MCP Inspector Needs DCR

MCP Inspector is a testing tool that needs to work with ANY MCP server without manual configuration:

```
┌─────────────────┐         ┌─────────────────┐
│  MCP Inspector  │ ──────> │   Your Server   │
└─────────────────┘         └─────────────────┘
        │                           │
        ▼                           ▼
"I need credentials"        "Here's how to register"
        │                           │
        ▼                           ▼
POST /oauth/register        Returns client_id/secret
        │                           │
        ▼                           ▼
"Now I can test!"          "Proceed with OAuth"
```

## Implementation in This Starter

This starter implements DCR to support MCP Inspector:

1. **Registration Endpoint**: `/oauth/register` - Accepts client registration
2. **Dynamic Clients**: Generated client credentials stored in memory
3. **OAuth Proxy**: Bridges between dynamic clients and Google OAuth
4. **Metadata Endpoint**: `/.well-known/oauth-authorization-server` - Advertises capabilities

## Benefits

- **Zero Configuration Testing**: MCP Inspector works immediately
- **Automated Testing**: No manual credential setup
- **Multi-client Support**: Each test run gets unique credentials
- **Security**: Credentials are temporary and isolated

## The Flow

```bash
# 1. Inspector discovers OAuth support
GET /.well-known/oauth-authorization-server
→ { "registration_endpoint": "/oauth/register" }

# 2. Inspector registers itself
POST /oauth/register
→ { "client_id": "mcp_12345", "client_secret": "secret" }

# 3. Inspector uses credentials for OAuth
GET /oauth/authorize?client_id=mcp_12345

# 4. Normal OAuth flow continues
```

This is why MCP Inspector can test your OAuth-protected server without any manual configuration!