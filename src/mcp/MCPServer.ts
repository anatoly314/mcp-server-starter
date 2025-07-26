import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { ToolHandlers, ResourceHandlers, PromptHandlers } from './handlers';
import { envProvider } from '../envProvider';
import { createToolRegistry } from './tools/index.js';
import { createPromptRegistry } from './prompts/index.js';
import { createResourceRegistry } from './resources/index.js';

export class MCPServer {
  private readonly server: Server;
  private readonly toolHandlers: ToolHandlers;
  private readonly resourceHandlers: ResourceHandlers;
  private readonly promptHandlers: PromptHandlers;

  constructor() {
    this.server = new Server(
      {
        name: envProvider.mcpServerName,
        version: envProvider.mcpServerVersion,
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {}
        },
      }
    );

    const toolRegistry = createToolRegistry();
    const promptRegistry = createPromptRegistry();
    const resourceRegistry = createResourceRegistry();
    this.toolHandlers = new ToolHandlers(toolRegistry);
    this.resourceHandlers = new ResourceHandlers(resourceRegistry);
    this.promptHandlers = new PromptHandlers(promptRegistry);
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

    // Prompt handlers
    this.server.setRequestHandler(
      ListPromptsRequestSchema,
      this.promptHandlers.handleListPrompts.bind(this.promptHandlers)
    );

    this.server.setRequestHandler(
      GetPromptRequestSchema,
      this.promptHandlers.handleGetPrompt.bind(this.promptHandlers)
    );
  }

  getServer(): Server {
    return this.server;
  }
}