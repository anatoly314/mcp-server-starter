Let me explain Dynamic Client Registration (DCR) and why MCP Inspector requires it:

Traditional OAuth vs Dynamic Client Registration

Traditional OAuth (Pre-registration)

In traditional OAuth flows, you must manually register your application before using it:

1. Go to provider's dashboard (e.g., Google Cloud Console)
2. Create an application manually
3. Get client_id and client_secret
4. Configure these credentials in your app

Example: When you set up Google OAuth, you manually created:
OAUTH_CLIENT_ID=your-client-id-from-google-console
OAUTH_CLIENT_SECRET=your-client-secret-from-google-console

Dynamic Client Registration (DCR)

With DCR, clients can register themselves automatically:

1. Client discovers the registration endpoint
2. Client sends registration request with its metadata
3. Server generates client_id and client_secret
4. Client uses these credentials immediately

Why MCP Inspector Needs DCR

MCP Inspector is a generic testing tool that needs to work with any MCP server:

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
"Now I can authenticate!"   "Proceed with OAuth flow"

Without DCR, MCP Inspector would need:
- Pre-configured credentials for every server
- Manual setup for each test
- Different configurations per server

With DCR, MCP Inspector can:
- Test any OAuth-enabled server automatically
- Register itself on-the-fly
- Work without manual configuration

The Flow in Practice

# 1. Inspector discovers your server has OAuth
GET /.well-known/oauth-authorization-server
Response: { "registration_endpoint": "/oauth/register", ... }

# 2. Inspector registers itself
POST /oauth/register
Body: { "redirect_uris": ["http://localhost:5173/callback"], ... }
Response: { "client_id": "mcp_12345", "client_secret": "abc123" }

# 3. Inspector uses these credentials for OAuth
GET /oauth/authorize?client_id=mcp_12345&redirect_uri=...

This is why your initial OAuth proxy failed - MCP Inspector expected to register itself dynamically, but your server only supported pre-registered Google credentials. By adding DCR, you
made your server compatible with MCP Inspector's automated testing workflow.