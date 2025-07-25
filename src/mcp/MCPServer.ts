import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { ToolHandlers, ResourceHandlers } from './handlers';
import { envProvider } from '../envProvider';
import { createToolRegistry } from './tools/index.js';

export class MCPServer {
  private readonly server: Server;
  private readonly toolHandlers: ToolHandlers;
  private readonly resourceHandlers: ResourceHandlers;

  constructor() {
    this.server = new Server(
      {
        name: envProvider.mcpServerName,
        version: envProvider.mcpServerVersion,
      },
      {
        capabilities: {
          tools: {},
          resources: {}
        },
      }
    );

    const toolRegistry = createToolRegistry();
    this.toolHandlers = new ToolHandlers(toolRegistry);
    this.resourceHandlers = new ResourceHandlers();
    this.setupHandlers();
  }

  private setupHandlers() {
    // Tool handlers
    this.server.setRequestHandler(
      ListToolsRequestSchema, 
      this.toolHandlers.handleListTools.bind(this.toolHandlers)
    );
    
    this.server.setRequestHandler(
      CallToolRequestSchema, 
      this.toolHandlers.handleCallTool.bind(this.toolHandlers)
    );

    // Resource handlers
    this.server.setRequestHandler(
      ListResourcesRequestSchema, 
      this.resourceHandlers.handleListResources.bind(this.resourceHandlers)
    );
    
    this.server.setRequestHandler(
      ReadResourceRequestSchema, 
      this.resourceHandlers.handleReadResource.bind(this.resourceHandlers)
    );
  }

  getServer(): Server {
    return this.server;
  }
}