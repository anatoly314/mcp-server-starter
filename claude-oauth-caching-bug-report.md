# Claude MCP OAuth Server-Side Caching Bug Report

## Issue Summary
Claude web chat permanently caches OAuth client credentials server-side with no way for users to clear them, causing authentication failures when OAuth clients are deleted or modified on the provider side.

## Severity
**High** - Users can be permanently locked out of their MCP servers with no recovery option.

## Reproduction Steps
1. Configure an MCP server with OAuth (e.g., using Clerk as OAuth provider)
2. Connect Claude to the server - OAuth works initially
3. Delete the OAuth client from the provider (or it expires/gets revoked)
4. Try to reconnect - Claude continues using the cached, now-invalid client_id
5. Authentication fails with "The requested OAuth 2.0 Client does not exist"
6. **No way to fix**: Clearing browser data doesn't help as credentials are stored server-side

## Technical Details

### Root Cause
- Claude caches OAuth client credentials on Anthropic's servers, tied to user account + server URL
- When an OAuth client is deleted/modified on the provider side, Claude continues using cached credentials
- No user-accessible mechanism to clear this server-side cache
- Cache appears to be permanent or very long-lived

### Observed Behavior
Example from testing with Clerk OAuth provider:
- Initial connection creates client_id: `O0nS4UroWecFIlgw`
- Client deleted from Clerk
- Claude continues trying to use `O0nS4UroWecFIlgw` indefinitely
- Error: "Client authentication failed... The requested OAuth 2.0 Client does not exist"

### Additional Bug
Claude exhibits different OAuth behavior based on URL format:
- Root domain (`https://example.com`) - Uses self-generated client_id format
- Path-based (`https://example.com/mcp`) - Properly performs Dynamic Client Registration
- Both get cached permanently server-side

## Impact
1. **Users get permanently locked out** of MCP servers after OAuth changes
2. **Forces domain/URL changes** as the only workaround
3. **Breaks OAuth provider migration** scenarios
4. **No recovery path** for affected users

## Current Workarounds
1. Change to a different domain (e.g., `dev.example.com` → `dev1.example.com`)
2. Add a different path to the URL
3. Cannot use the same URL ever again once cached with bad credentials

## Proposed Solutions
1. **Add "Clear OAuth Cache" button** in MCP server settings
2. **Implement cache TTL** - expire cached credentials after reasonable time
3. **Handle OAuth errors properly** - on "client does not exist" error, trigger re-registration
4. **Add force refresh option** - allow users to force new Dynamic Client Registration

## Related Issues
- GitHub Issue #4760 describes similar issue for Claude Desktop (uses `~/.mcp-auth` local cache)
- This report is specifically for Claude web chat (server-side cache)

## Environment
- Platform: Claude web chat (claude.ai)
- MCP SDK: @modelcontextprotocol/sdk
- OAuth Provider: Clerk (but affects any OAuth provider)
- Browser: Issue persists across all browsers/devices (server-side cache)

## Business Impact
This bug severely impacts MCP adoption as developers cannot reliably maintain OAuth-protected MCP servers. Any OAuth maintenance, key rotation, or provider changes result in permanent lockout for all connected Claude users.