# Environment Configuration Guide

## PUBLIC_URL Configuration

| Scenario | PUBLIC_URL | Redirect URI |
|----------|------------|--------------|
| Local development | `http://localhost:3000` | `http://localhost:3000/oauth/callback` |
| Ngrok tunnel | `https://xxx.ngrok-free.app` | `https://xxx.ngrok-free.app/oauth/callback` |
| Production | `https://yourdomain.com` | `https://yourdomain.com/oauth/callback` |

**Always set PUBLIC_URL** to match how you're accessing the server!

## Configuration Files

### 1. Local Development (`.env.local.example`)
```bash
# Copy for local development
cp .env.local.example .env

# PUBLIC_URL=http://localhost:3000
# Redirect URI: http://localhost:3000/oauth/callback
```

### 2. Ngrok Development (`.env.ngrok.example`)
```bash
# Copy for ngrok usage
cp .env.ngrok.example .env

# Update PUBLIC_URL with your ngrok URL
PUBLIC_URL=https://your-id.ngrok-free.app
# Redirect URI: https://your-id.ngrok-free.app/oauth/callback
```

### 3. Production (`.env.production.example`)
```bash
# Copy for production
cp .env.production.example .env

# Set your production domain
PUBLIC_URL=https://mcp.yourdomain.com
# Redirect URI: https://mcp.yourdomain.com/oauth/callback
```

## Google Console Setup

Add ALL these redirect URIs to your Google OAuth client:
- `http://localhost:3000/oauth/callback` (for local dev)
- `https://your-ngrok-id.ngrok-free.app/oauth/callback` (for ngrok)
- `https://your-production-domain.com/oauth/callback` (for production)

## Quick Start

### Local Development
```bash
cp .env.local.example .env
npm run dev
npm run inspector:local
```

### Ngrok Testing
```bash
# Start ngrok
ngrok http 3000

# Copy ngrok URL, then:
cp .env.ngrok.example .env
# Edit .env and set PUBLIC_URL to your ngrok URL

npm run dev
npm run inspector:ngrok
```

## Important Notes

1. **Always set PUBLIC_URL** - Set it to match how you're accessing the server
2. **Update PUBLIC_URL when switching environments** - Local vs ngrok vs production
3. **The redirect URI is automatically derived** - You rarely need to set OAUTH_REDIRECT_URI manually
4. **Match Google Console** - Ensure all redirect URIs are added to your Google OAuth client

## Simplified Rule

**PUBLIC_URL = The URL you use in your browser to access the server**
- Local: `http://localhost:3000`
- Ngrok: `https://your-id.ngrok-free.app`
- Production: `https://yourdomain.com`