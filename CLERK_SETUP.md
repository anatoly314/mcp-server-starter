# Clerk OAuth Setup

## Quick Setup

1. **Create Clerk App**
   - Sign up at https://clerk.com
   - Create new application
   - Enable "Dynamic client registration" in OAuth settings

2. **Get Your Domain**
   - Find your Clerk domain: `https://YOUR-APP.clerk.accounts.dev`

3. **Configure Environment**
   ```bash
   cp .env.http.clerk .env.http
   ```
   
   Edit `.env.http`:
   ```env
   AUTH_ENABLED=true
   OAUTH_ISSUER_URL=https://YOUR-APP.clerk.accounts.dev
   PUBLIC_URL=http://localhost:3000  # Or your deployed URL
   ```

4. **Start Server**
   ```bash
   pnpm run dev:http
   ```

## Testing

1. Connect with MCP Inspector or Claude
2. OAuth flow will start automatically
3. Login with your Clerk account

## Production

For production, update `PUBLIC_URL` to your actual domain (e.g., `https://mcp.yourdomain.com`).