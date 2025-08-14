# Claude MCP OAuth Scope Overreach Bug Report

## Issue Summary
Claude Desktop/Web adds unauthorized OAuth scopes when connecting to MCP servers, requesting scopes that were never advertised by the server's OAuth metadata.

## Severity
**Medium** - Causes unnecessary permission requests and potential privacy concerns for users.

## Description
When connecting to an MCP server that uses Clerk as the OAuth provider, Claude automatically adds Clerk-specific scopes (`public_metadata`, `private_metadata`) to the authorization request, even though these scopes are NOT advertised by the MCP server.

## Reproduction Steps
1. Set up an MCP server with Clerk OAuth
2. Configure server to advertise only standard scopes: `openid`, `profile`, `email`
3. Verify OAuth metadata endpoint returns:
   ```json
   {
     "scopes_supported": ["openid", "profile", "email"]
   }
   ```
4. Connect Claude to the MCP server
5. Observe the authorization URL Claude generates

## Expected Behavior
Claude should only request the scopes advertised by the MCP server:
```
https://example.clerk.accounts.dev/oauth/authorize?scope=openid+profile+email
```

## Actual Behavior
Claude adds additional Clerk-specific scopes not advertised by the server:
```
https://example.clerk.accounts.dev/oauth/authorize?scope=openid+profile+email+public_metadata+private_metadata
```

## Evidence
Server's OAuth metadata explicitly declares supported scopes:
```typescript
// Server configuration
scopesSupported: ['openid', 'profile', 'email']
```

But Claude's authorization request includes:
- ✅ `openid` (advertised)
- ✅ `profile` (advertised)  
- ✅ `email` (advertised)
- ❌ `public_metadata` (NOT advertised)
- ❌ `private_metadata` (NOT advertised)

## Impact
1. **User Trust**: Users see permission requests for "metadata" access they didn't expect
2. **Provider Compatibility**: These scopes are Clerk-specific and will fail with other providers
3. **Principle Violation**: Violates OAuth best practice of "least privilege" - only request what's needed
4. **MCP Spec Compliance**: MCP servers should control their security surface via advertised scopes

## Root Cause (Hypothesis)
Claude appears to:
- Detect Clerk domains (`*.clerk.accounts.dev`) and automatically add Clerk-specific scopes
- OR have hardcoded scope additions for certain OAuth providers
- OR be reading these scopes from an undocumented Clerk metadata endpoint

## Suggested Fix
Claude should:
1. **Only request scopes explicitly advertised** in the server's OAuth metadata
2. **Never add provider-specific scopes** unless advertised
3. **Respect the MCP server's security boundaries** as defined by its metadata

## Workaround
Currently none available since:
- The authorization happens directly between Claude and the OAuth provider
- MCP servers cannot intercept or modify the authorization request
- Clerk doesn't provide fine-grained scope restrictions for DCR clients

## Environment
- Claude Desktop/Web (all versions with MCP support)
- MCP Server with Clerk OAuth provider
- Dynamic Client Registration enabled

## Business Impact
This bug makes it difficult to use Clerk as an OAuth provider for MCP servers while maintaining clean permission requests. It may push developers to less secure authentication methods or different providers.