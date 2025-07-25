# MCP Spec-Compliant OAuth Implementation

This MCP server implements OAuth 2.1 authentication following the Model Context Protocol specification.

## Architecture

According to the MCP specification, this server acts as a **resource server** that:
- Validates tokens issued by Google OAuth (the authorization server)
- Does NOT issue its own tokens
- Uses token introspection with caching for performance

## OAuth Flow

1. **Discovery**: Claude fetches OAuth metadata from `/.well-known/oauth-protected-resource`
2. **Authorization**: User is redirected to Google for authentication
3. **Token Exchange**: Claude exchanges authorization code for Google access tokens
4. **API Access**: Claude sends Google access token with each request
5. **Validation**: Server validates token with Google's tokeninfo endpoint (with caching)

## Key Components

### Token Validation (`/src/auth/TokenValidator.ts`)
- Validates Google OAuth tokens using the tokeninfo endpoint
- Implements intelligent caching to reduce API calls
- Cache respects token expiry times
- Returns user information from validated tokens

### Auth Middleware (`/src/http/authMiddleware.ts`)
- Validates Bearer tokens on each request
- Returns proper OAuth error responses with WWW-Authenticate headers
- Attaches user info to request context

### OAuth Proxy (`/src/oauth/OAuthProxyRouter.ts`)
- Handles OAuth flow between Claude and Google
- Returns Google tokens directly (not wrapped)
- Supports refresh token flow

## Configuration

```bash
# Required environment variables
export AUTH_ENABLED=true
export OAUTH_PROXY_ENABLED=true
export OAUTH_PROVIDER=google
export OAUTH_CLIENT_ID=your-google-client-id
export OAUTH_CLIENT_SECRET=your-google-client-secret
export PUBLIC_URL=https://your-domain.com
```

## Security Features

1. **Token Validation**: Every request validates the token with Google
2. **Caching**: Reduces load on Google's API while maintaining security
3. **Proper Error Handling**: Returns OAuth-compliant error responses
4. **No Token Storage**: Server remains stateless (except for cache)

## Performance Optimizations

- Token validation results are cached for 5 minutes
- Cache respects token expiry times
- Negative results (invalid tokens) cached for 30 seconds
- Automatic cache cleanup every minute

## Spec Compliance

This implementation follows the MCP specification by:
- ✅ Acting as a resource server only
- ✅ Not issuing its own tokens
- ✅ Validating tokens with the authorization server
- ✅ Supporting standard OAuth 2.1 flows
- ✅ Returning proper OAuth error responses

## Token Lifecycle

1. **Fresh Token**: Validated with Google, result cached
2. **Cached Token**: Returns cached validation (within 5 minutes)
3. **Expired Token**: Returns 401, client should refresh
4. **Refresh Flow**: Client uses refresh token to get new access token

## Error Handling

The server returns standard OAuth errors:
- `401 Unauthorized` with `invalid_token` error
- Includes `WWW-Authenticate` header
- Descriptive error messages

## Testing

To test the implementation:

1. Connect Claude to your MCP server
2. Complete OAuth flow with Google
3. Verify tokens are being validated (check logs)
4. Test token expiry and refresh flow

## Differences from Non-Compliant Approaches

This implementation does NOT:
- Issue its own JWT tokens
- Wrap Google tokens in custom tokens
- Store sessions server-side
- Act as an authorization server

Instead, it properly delegates authentication to Google and validates tokens according to OAuth 2.1 specifications.