# Clerk OAuth Setup for MCP Server

This guide shows how to configure your MCP server to use Clerk as the OAuth provider with Dynamic Client Registration (DCR) support.

## Prerequisites

1. A Clerk account (sign up at https://clerk.com)
2. A Clerk application created in your dashboard

## Setup Steps

### 1. Enable Dynamic Client Registration in Clerk

1. Go to your [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **OAuth Applications**
3. Enable the **"Dynamic client registration"** toggle
4. Note: When DCR is enabled, the OAuth consent screen is automatically enforced for security

### 2. Find Your Clerk Domain

1. In Clerk Dashboard, go to **API Keys**
2. Find your **Frontend API URL** (e.g., `https://happy-dog-123.clerk.accounts.dev`)
3. Extract the domain part: `happy-dog-123`

### 3. Configure Environment Variables

1. Copy the Clerk environment template:
   ```bash
   cp .env.http.clerk .env
   ```

2. Edit `.env` and replace `YOUR_CLERK_DOMAIN` with your actual domain:
   ```env
   OAUTH_AUTHORIZATION_URL=https://happy-dog-123.clerk.accounts.dev/oauth/authorize
   OAUTH_TOKEN_URL=https://happy-dog-123.clerk.accounts.dev/oauth/token
   OAUTH_USERINFO_URL=https://happy-dog-123.clerk.accounts.dev/oauth/userinfo
   OAUTH_REGISTRATION_URL=https://happy-dog-123.clerk.accounts.dev/oauth/register
   OAUTH_REVOCATION_URL=https://happy-dog-123.clerk.accounts.dev/oauth/revoke
   ```

### 4. Start the Server

```bash
npm run dev:http
```

### 5. Test with MCP Inspector

1. Open [MCP Inspector](https://inspector.modelcontextprotocol.io)
2. Connect to your server: `http://localhost:3000/mcp`
3. The OAuth flow should start automatically
4. MCP Inspector will:
   - Register itself as a client via DCR
   - Redirect you to Clerk for authentication
   - Complete the OAuth flow

## How It Works

1. **Dynamic Client Registration**: MCP Inspector registers itself as an OAuth client without pre-configuration
2. **Authentication**: Users authenticate through Clerk's UI
3. **Token Validation**: The server validates tokens by calling Clerk's userinfo endpoint
4. **No Secrets Required**: With DCR enabled, you don't need to configure OAuth client credentials

## Switching to Other Providers

This setup is provider-agnostic. To use a different provider (Auth0, Okta, etc.):

1. Update the OAuth URLs in `.env` to point to your provider
2. Ensure the provider supports DCR or disable it by removing `OAUTH_REGISTRATION_URL`
3. Restart the server

## Troubleshooting

- **"Incompatible auth server: does not support dynamic client registration"**: Make sure DCR is enabled in Clerk Dashboard
- **404 on registration endpoint**: Verify your Clerk domain is correct
- **Token validation fails**: Check that the userinfo endpoint URL is correct

## Security Notes

- DCR creates a public endpoint - ensure you understand the security implications
- The OAuth consent screen is enforced when DCR is enabled
- Consider implementing rate limiting for the DCR endpoint in production