# Environment Configuration Guide

## PUBLIC_URL Configuration

| Scenario | PUBLIC_URL | Redirect URI |
|----------|------------|--------------|
| Local development | `http://localhost:3000` | `http://localhost:3000/oauth/callback` |
| Ngrok tunnel | `https://xxx.ngrok-free.app` | `https://xxx.ngrok-free.app/oauth/callback` |
| Production | `https://yourdomain.com` | `https://yourdomain.com/oauth/callback` |

**Always set PUBLIC_URL** to match how you're accessing the server!

## Configuration Files

### 1. HTTP Transport (`.env.http.example`)
```bash
# Copy for HTTP transport
cp .env.http.example .env.http

# Set PUBLIC_URL based on your environment:
# Local: PUBLIC_URL=http://localhost:3000
# Ngrok: PUBLIC_URL=https://your-id.ngrok-free.app
# Production: PUBLIC_URL=https://yourdomain.com
```

### 2. STDIO Transport (`.env.stdio.example`)
```bash
# Copy for STDIO transport
cp .env.stdio.example .env.stdio

# Minimal configuration needed for stdio mode
```

## Google Console Setup

Add ALL these redirect URIs to your Google OAuth client:
- `http://localhost:3000/oauth/callback` (for local dev)
- `https://your-ngrok-id.ngrok-free.app/oauth/callback` (for ngrok)
- `https://your-production-domain.com/oauth/callback` (for production)

## Quick Start

### Local Development
```bash
cp .env.http.example .env.http
pnpm run dev:http
# For inspector, use stdio mode:
pnpm run inspector:stdio
```

### Ngrok Testing
```bash
# Start ngrok
ngrok http 3000

# Copy ngrok URL, then:
cp .env.http.example .env.http
# Edit .env.http and set PUBLIC_URL to your ngrok URL

pnpm run dev:http
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