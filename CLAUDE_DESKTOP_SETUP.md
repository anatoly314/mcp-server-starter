# Claude Desktop Setup Guide

This guide explains how to configure Claude Desktop to use the MCP Server Starter in stdio mode.

## Prerequisites

1. Install tsx globally:
   ```bash
   npm install -g tsx
   ```

2. Install project dependencies:
   ```bash
   pnpm install
   ```

## Installation Steps

### 1. Copy the Configuration

Copy the provided configuration to Claude Desktop's config location:

```bash
cp claude_desktop_config.json ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Note:** If you already have a `claude_desktop_config.json` file, you'll need to merge the configurations manually.

### 2. Verify the Configuration

The configuration should look like this:

```json
{
  "mcpServers": {
    "mcp-server-starter": {
      "command": "tsx",
      "args": [
        "/Users/anatoly/Developer/git/mcp-server-starter/src/server.ts"
      ],
      "env": {
        "MCP_SERVER_NAME": "mcp-server-starter",
        "MCP_SERVER_VERSION": "1.0.0",
        "TRANSPORT_TYPE": "stdio"
      }
    }
  }
}
```

**Key points:**
- Uses absolute path to avoid path resolution issues
- No dotenv dependency - all environment variables are specified directly
- Logs are sent to stderr to avoid interfering with stdio protocol

### 3. Restart Claude Desktop

After updating the configuration, completely quit and restart Claude Desktop for the changes to take effect.

## Available Tools

Once connected, you'll have access to these tools in Claude Desktop:

### Basic Tools (always available)
- `echo` - Simple echo command for testing
- `get_timestamp` - Get current timestamp in various formats

### Authentication Tools (only if AUTH_ENABLED=true in .env.stdio)
- `get_auth_url` - Generate OAuth authentication URL
- `exchange_code` - Exchange authorization code for tokens
- `get_user_info` - Get user information

### Resources
- `auth://status` - Current authentication configuration status
- `system://info` - System information
- `config://server` - Server configuration

### Prompts
- `code_review` - Review code and provide feedback
- `explain_code` - Explain how code works
- `generate_test` - Generate test cases for code

## Troubleshooting

### Server doesn't appear in Claude Desktop

1. Check that the paths in the configuration are absolute and correct
2. Verify tsx is installed globally: `which tsx` (should show a path)
3. If tsx is not found, install it: `npm install -g tsx`
4. Check Claude Desktop logs for errors

### Permission errors

Make sure the server files have execute permissions:
```bash
chmod +x src/server.ts
```

### Environment variables not loading

The configuration now includes all environment variables directly, so no .env file is needed. If you need to customize variables, edit them in the Claude Desktop configuration file.

## Manual Testing

You can test the server manually before using with Claude Desktop:

```bash
MCP_SERVER_NAME=mcp-server-starter MCP_SERVER_VERSION=1.0.0 TRANSPORT_TYPE=stdio tsx src/server.ts
```

Type some JSON-RPC commands to verify it's working:
```json
{"jsonrpc":"2.0","id":1,"method":"tools/list"}
```

Press Ctrl+C to exit.

## Updating the Server

When you update the server code:

1. No need to update Claude Desktop configuration
2. Simply restart Claude Desktop to use the latest code
3. Or use the "Reload" option in Claude Desktop if available