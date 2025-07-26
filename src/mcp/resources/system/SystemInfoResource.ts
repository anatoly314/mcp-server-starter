import { ReadResourceResult } from '@modelcontextprotocol/sdk/types.js';
import { BaseResource, ResourceDefinition } from '../types.js';
import os from 'os';

export class SystemInfoResource extends BaseResource {
  definition: ResourceDefinition = {
    uri: 'system://info',
    name: 'System Information',
    description: 'Current system information and environment',
    mimeType: 'application/json'
  };
  
  async read(uri: string): Promise<ReadResourceResult> {
    const systemInfo = {
      platform: os.platform(),
      release: os.release(),
      type: os.type(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalMemory: Math.round(os.totalmem() / (1024 * 1024 * 1024)) + ' GB',
      freeMemory: Math.round(os.freemem() / (1024 * 1024 * 1024)) + ' GB',
      uptime: Math.round(os.uptime() / 3600) + ' hours',
      hostname: os.hostname(),
      nodeVersion: process.version,
      env: {
        NODE_ENV: process.env.NODE_ENV || 'development'
      }
    };
    
    return this.createTextContent(uri, JSON.stringify(systemInfo, null, 2));
  }
}