# Dynamic Client Registration (DCR) - Stub Only

## Update: DCR Simplified to Stub Implementation

This MCP server uses a minimal DCR stub for compatibility with MCP Inspector. The DCR endpoint returns fake credentials while actual authentication uses your configured Google OAuth credentials.

## Why DCR Was Removed

1. **Unnecessary Complexity**: Since the server uses hardcoded Google OAuth credentials (from environment variables), the DCR layer was just adding complexity without providing additional security.

2. **Claude Support**: As of July 2024, Claude supports specifying custom client ID and client secret when configuring a server that doesn't support DCR.

3. **Simpler Architecture**: Without DCR, the OAuth flow is more straightforward and easier to debug.

## Current OAuth Flow (Without DCR)

```
1. Claude/ChatGPT discovers OAuth support
   GET /.well-known/oauth-authorization-server
   → No registration_endpoint returned

2. OAuth flow starts directly
   GET /oauth/authorize?redirect_uri=...
   → Redirects to Google OAuth using server's credentials

3. User authenticates with Google
   → Google redirects back to server

4. Server exchanges code for tokens
   POST /oauth/token
   → Returns Google's access/refresh tokens

5. Claude/ChatGPT uses tokens for API calls
   → Server validates tokens with Google
```

## Configuration

The server uses your Google OAuth credentials directly:

```bash
# Required environment variables
OAUTH_CLIENT_ID=your-google-client-id
OAUTH_CLIENT_SECRET=your-google-client-secret
```

## DCR Stub Implementation

The `/oauth/register` endpoint returns fake credentials:
```json
{
  "client_id": "mcp-inspector-client",
  "client_secret": "not-used",
  ...
}
```

These credentials are never validated. All OAuth operations use your configured Google OAuth credentials.

## Compatibility

- ✅ **Claude**: Fully supported (ignores DCR)
- ✅ **ChatGPT**: Works with hardcoded credentials
- ✅ **MCP Inspector**: Works with DCR stub

## Benefits of Removal

- Simpler codebase
- Fewer potential failure points
- Direct OAuth flow with Google
- Easier to debug and maintain