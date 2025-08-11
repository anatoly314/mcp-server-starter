# Dynamic Client Registration (DCR) - REMOVED

## Update: DCR Has Been Removed

This MCP server no longer uses Dynamic Client Registration (DCR). The OAuth flow has been simplified to work directly with your configured Google OAuth credentials.

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

## Compatibility

- ✅ **Claude**: Fully supported (can specify custom client ID if needed)
- ✅ **ChatGPT**: Works with hardcoded credentials
- ✅ **MCP Inspector**: Should work without DCR

## Benefits of Removal

- Simpler codebase
- Fewer potential failure points
- Direct OAuth flow with Google
- Easier to debug and maintain