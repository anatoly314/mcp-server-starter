# TODO: OAuth Service Migration

## Current State
- Custom OAuth proxy implementation in `/src/oauth/`
- Direct integration with Google OAuth
- Token validation with caching in `GoogleTokenValidator`

## Migration Plan

### Phase 1: Evaluate Auth Services (Current)
**Decision needed between:**

**Auth0**
-  Industry standard, mature
-  Extensive features (MFA, enterprise SSO, etc.)
-  Great documentation
- L More expensive at scale
- L Can be overkill for simple use cases

**Clerk**
-  Modern, developer-friendly
-  Better pricing for small-medium scale
-  Built-in user management UI
-  Simpler implementation
- L Newer, less battle-tested
- L Fewer enterprise features

**Recommendation**: Start with Clerk for simplicity, migrate to Auth0 if you need enterprise features.

### Phase 2: Implement External Auth Service
1. Remove `/src/oauth/` directory (OAuth proxy code)
2. Configure Clerk/Auth0 to handle Google OAuth
3. Update OAuth metadata endpoints to point to Clerk/Auth0

### Phase 3: Update Token Validation
1. Keep `GoogleTokenValidator` pattern but rename to `TokenValidator`
2. Update validation to check Clerk/Auth0 tokens instead of Google
3. Keep caching logic - it's still valuable!

### Code Changes Required

**Remove:**
- `/src/oauth/` directory entirely
- OAuth proxy routes from server
- Dynamic OAuth metadata

**Keep:**
- `/src/auth/providers/` structure
- Token validation with caching
- Auth middleware pattern

**Update:**
```typescript
// Before
const userInfo = await googleTokenValidator.getUserInfo(token);

// After (minimal change!)
const userInfo = await clerkTokenValidator.getUserInfo(token);
```

### Environment Variables
```bash
# Remove
OAUTH_CLIENT_ID=xxx
OAUTH_CLIENT_SECRET=xxx
OAUTH_PROVIDER=google

# Add
CLERK_SECRET_KEY=xxx
# or
AUTH0_DOMAIN=xxx
AUTH0_AUDIENCE=xxx
```

### Benefits of Migration
1. **Security**: Offload security updates to specialists
2. **Features**: Get MFA, social logins, enterprise SSO for free
3. **Compliance**: SOC2, GDPR handled by auth service
4. **Focus**: Concentrate on MCP features, not auth
5. **Time**: Save weeks of development

### Decision Criteria
Choose **Clerk** if:
- Building SaaS/startup
- Want quickest implementation
- Need good default UI
- Cost-sensitive

Choose **Auth0** if:
- Enterprise customers
- Need advanced features
- Require extensive customization
- Have compliance requirements

### Next Steps
1. [ ] Create trial accounts for both
2. [ ] Test implementation complexity
3. [ ] Evaluate pricing for expected scale
4. [ ] Make decision
5. [ ] Implement chosen solution

### Estimated Effort
- Research & Decision: 1-2 days
- Implementation: 2-3 days
- Testing: 1 day
- Total: ~1 week

### Keep in Mind
- Current token validation logic is good - keep it!
- The architecture is already well-structured for this change
- Start simple, add features as needed