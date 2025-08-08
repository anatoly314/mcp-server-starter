# MCP Server Starter Kit

Production-ready Model Context Protocol server with batteries included.  
Fork, extend, deploy. No bullshit.

## What This Is

- ✅ **Working MCP server** with auth, logging, and security out of the box
- ✅ **Extensible registry pattern** for tools, resources, and prompts  
- ✅ **Multiple transports** configured (HTTP with SSE, stdio for Claude Desktop)
- ✅ **Production middleware** - OAuth 2.0, IP filtering, email filtering, structured logging
- ✅ **TypeScript** with proper error handling and modular architecture
- ✅ **Pino logging** - structured JSON logs that don't interfere with stdio

## What This Isn't

- ❌ **Not a framework** - no coding conventions forced on you
- ❌ **Not bare boilerplate** - actually works out of the box  
- ❌ **Not a library** - you fork and own your copy

## Get Started in 2 Minutes

### Prerequisites

```bash
# Install pnpm if you haven't already
npm install -g pnpm

# For Claude Desktop support
npm install -g tsx
```

### Quick Start

```bash
# Clone and install
git clone https://github.com/anatoly314/mcp-server-starter.git
cd mcp-server-starter
pnpm install

# Copy environment config
cp .env.http.example .env.http

# Start the server
pnpm run dev:http
```

Server runs at `http://localhost:3000/mcp` with:
- Echo tool (for testing)
- Timestamp tool
- System info resource
- Auth status resource
- Three code-related prompts

## Production Features Built-In

### 🔐 Security
- **Google OAuth 2.0** - Full OAuth flow with token validation and caching
- **IP Filtering** - Restrict access by IP ranges (supports Cloudflare headers)
- **Email Filtering** - Whitelist specific emails for access control
- **Bearer Token Auth** - Standard HTTP Authorization header support

### 📊 Observability
- **Structured Logging** - Pino with JSON output to stderr
- **Request Logging** - HTTP middleware with request/response details
- **Error Tracking** - Proper error boundaries and logging

### 🏗️ Architecture
- **Registry Pattern** - Easy to add new tools/resources/prompts
- **Dependency Injection Ready** - Clean constructor patterns (no DI framework bloat)
- **Transport Agnostic** - Same MCP server works with HTTP and stdio
- **Environment-based Config** - All configuration via env vars

## Adding Your Own Features

### Add a New Tool

Create a new tool in `src/mcp/tools/`:

```typescript
// src/mcp/tools/my-tool/MyTool.ts
import { BaseTool, ToolDefinition } from '../types';

export class MyTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'my_tool',
    description: 'Does something useful',
    inputSchema: {
      type: 'object',
      properties: {
        input: { type: 'string' }
      },
      required: ['input']
    }
  };

  async execute(args: any): Promise<CallToolResult> {
    // Your implementation here
    return {
      content: [{
        type: 'text',
        text: `Result: ${args.input}`
      }]
    };
  }
}
```

Register it in `src/mcp/tools/index.ts`:

```typescript
import { MyTool } from './my-tool/MyTool';

export function createToolRegistry(): ToolRegistry {
  const registry = new ToolRegistry();
  
  // Existing tools
  registry.register(new EchoTool());
  registry.register(new TimestampTool());
  
  // Your new tool
  registry.register(new MyTool());
  
  return registry;
}
```

### Add a New Resource

Similar pattern for resources in `src/mcp/resources/`.

### Add a New Prompt

Similar pattern for prompts in `src/mcp/prompts/`.

## Configuration

### Environment Variables

```bash
# Server Configuration
MCP_SERVER_NAME=my-mcp-server
MCP_SERVER_VERSION=1.0.0
TRANSPORT_TYPE=http          # or stdio
HTTP_HOST=0.0.0.0
HTTP_PORT=3000

# OAuth Configuration (optional)
AUTH_ENABLED=true
OAUTH_CLIENT_ID=your-google-client-id
OAUTH_CLIENT_SECRET=your-google-client-secret
PUBLIC_URL=https://your-domain.com

# Security (optional)
FILTER_BY_IP=192.168.1.0/24,10.0.0.1
ALLOWED_EMAILS=user@example.com,admin@company.org

# Logging
LOG_LEVEL=info               # debug, info, warn, error
REQUEST_LOGGING=true
```

## Deployment

### Local Development
```bash
pnpm run dev:http    # HTTP transport with hot reload
pnpm run dev:stdio   # Stdio transport for Claude Desktop
```

### Production Build
```bash
pnpm run build       # Compile TypeScript
node dist/server.js  # Run compiled server
```

### Docker
```dockerfile
FROM node:20-slim
RUN npm install -g pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build
CMD ["node", "dist/server.js"]
```

### Cloud Deployment

Works with any Node.js hosting:
- **Railway** - One-click deploy
- **Render** - Automatic SSL
- **Fly.io** - Global distribution
- **AWS/GCP/Azure** - Enterprise scale

## Testing

### MCP Inspector
```bash
# Start server for Inspector
pnpm run inspector:stdio

# Or test HTTP endpoint manually
pnpm run dev:http
```

### Manual Testing
```bash
# Test with curl
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## Architecture Overview

```
src/
├── server.ts                 # Entry point
├── envProvider.ts           # Environment configuration
├── logger.ts                # Pino logger setup
├── mcp/                     # MCP implementation
│   ├── MCPServer.ts         # Core MCP server
│   ├── tools/               # Tool implementations
│   │   ├── ToolRegistry.ts  # Tool registry
│   │   ├── types.ts         # Base types
│   │   └── echo/            # Example tool
│   ├── resources/           # Resource implementations
│   │   └── ResourceRegistry.ts
│   ├── prompts/             # Prompt implementations
│   │   └── PromptRegistry.ts
│   └── handlers/            # Request handlers
├── http/                    # HTTP transport
│   ├── HTTPServer.ts        # Express server
│   ├── authMiddleware.ts    # OAuth validation
│   ├── emailFilterMiddleware.ts
│   └── ipFilterMiddleware.ts
├── stdio/                   # Stdio transport
│   └── StdioServer.ts
├── oauth/                   # OAuth proxy
│   └── OAuthProxyServer.ts
└── auth/                    # Auth providers
    └── providers/
        └── google/
```

## Why Use This?

### vs. Building from Scratch
- **Save 2-3 weeks** of setup and boilerplate
- **Production patterns** already implemented
- **Security** handled correctly from day one

### vs. Other MCP Starters
- **Actually production-ready** - not a toy example
- **Batteries included** - auth, logging, security work out of the box
- **No framework lock-in** - just clean TypeScript you can modify

### vs. MCP Libraries
- **You own the code** - no black box dependencies
- **Customizable** - change anything you need
- **Learnable** - see how everything works

## Common Use Cases

This starter kit is perfect for:

- **AI Tool Integration** - Add your company's internal tools to Claude
- **API Gateways** - Expose existing APIs through MCP
- **Data Access Layers** - Provide LLMs access to your databases
- **Workflow Automation** - Build conversational interfaces to complex systems
- **Custom Assistants** - Create specialized AI agents with specific capabilities

## Documentation

- [Claude Desktop Setup](./CLAUDE_DESKTOP_SETUP.md) - Use with Claude Desktop app
- [Google OAuth Setup](./GOOGLE_OAUTH_SETUP.md) - Configure authentication
- [Environment Setup](./ENV_SETUP.md) - Configuration guide
- [OAuth Architecture](./MCP_SPEC_COMPLIANT_AUTH.md) - How auth works

## Contributing

This is a starter kit - fork it and make it your own! If you build something cool, let the community know.

## License

MIT - Use this however you want.

---

Built with ❤️ and minimal bullshit. Stop configuring, start shipping.