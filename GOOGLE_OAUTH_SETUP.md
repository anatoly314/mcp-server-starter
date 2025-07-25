# Google OAuth Setup for MCP Server with ngrok

## Step 1: Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **+ CREATE CREDENTIALS** > **OAuth client ID**
5. Select **Web application** as the Application type

## Step 2: Configure OAuth Client

In the OAuth client configuration:

1. **Name**: Give it a descriptive name like "MCP Server ngrok"

2. **Authorized redirect URIs**: Add EXACTLY these URIs:
   ```
   https://YOUR-NGROK-ID.ngrok-free.app/oauth/callback
   http://localhost:3000/oauth/callback
   ```
   
   Replace `YOUR-NGROK-ID` with your actual ngrok subdomain.
   
   **IMPORTANT**: The redirect URI must match EXACTLY, including:
   - Protocol (https for ngrok, http for localhost)
   - Domain (your exact ngrok subdomain)
   - Port (if any)
   - Path (/oauth/callback)

3. Click **CREATE**

4. Copy the **Client ID** and **Client Secret**

## Step 3: Environment Variables

Set these environment variables for your MCP server:

```bash
# Required OAuth settings
export OAUTH_CLIENT_ID="your-client-id.apps.googleusercontent.com"
export OAUTH_CLIENT_SECRET="your-client-secret"
export OAUTH_REDIRECT_URI="https://YOUR-NGROK-ID.ngrok-free.app/oauth/callback"

# Required for ngrok
export PUBLIC_URL="https://YOUR-NGROK-ID.ngrok-free.app"

# OAuth configuration
export AUTH_ENABLED=false
export OAUTH_PROXY_ENABLED=true
export OAUTH_PROVIDER=google
export OAUTH_SCOPES="openid email profile"

# Server configuration
export TRANSPORT_TYPE=http
export HTTP_HOST=0.0.0.0
export HTTP_PORT=3000
```

## Step 4: Common Issues

### redirect_uri_mismatch Error

This error means the redirect URI your server is using doesn't match what's in Google Console.

1. Check the exact error message - it often shows what URI was expected vs what was sent
2. Ensure NO trailing slashes
3. Protocol must match (https vs http)
4. Path must be exactly `/oauth/callback`

### Debugging

The server logs will show:
```
GoogleOAuth initialized with redirect URI: https://YOUR-NGROK-ID.ngrok-free.app/oauth/callback
```

Make sure this EXACTLY matches one of your authorized redirect URIs in Google Console.

## Step 5: Testing with Claude

1. Start your server with the correct environment variables
2. Check ngrok is running and forwarding to port 3000
3. In Claude, add your custom MCP server using the ngrok URL
4. When you connect, it should redirect you to Google OAuth
5. After authorization, you'll be redirected back to Claude

## Important Notes

- ngrok URLs change when you restart ngrok (unless you have a paid account with a reserved domain)
- Each time your ngrok URL changes, you need to:
  1. Update `PUBLIC_URL` and `OAUTH_REDIRECT_URI` environment variables
  2. Add the new redirect URI to Google Console
  3. Restart your MCP server