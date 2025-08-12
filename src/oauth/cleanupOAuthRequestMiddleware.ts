import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../logger';

const logger = createLogger('oauth-cleanup-middleware');

/**
 * Middleware to clean up malformed OAuth token requests
 * 
 * Problem:
 * MCP Inspector has a bug where it sends the literal string "undefined" 
 * as the value for the 'resource' parameter in token exchange requests.
 * The MCP SDK expects 'resource' to be either a valid URL or completely absent.
 * 
 * Solution:
 * This middleware intercepts token requests and removes the 'resource' parameter
 * when it contains the invalid string "undefined", allowing the OAuth flow to proceed.
 * 
 * Background:
 * The 'resource' parameter in OAuth identifies which API/resource server the client 
 * wants to access. It should be a valid URL (e.g., "https://api.example.com") or 
 * omitted entirely. The string "undefined" is a JavaScript serialization bug that 
 * occurs when an undefined variable is converted to JSON.
 * 
 * @example
 * // Before middleware:
 * { 
 *   "grant_type": "authorization_code",
 *   "code": "abc123",
 *   "resource": "undefined"  // Invalid - causes "Invalid url" error
 * }
 * 
 * // After middleware:
 * { 
 *   "grant_type": "authorization_code",
 *   "code": "abc123"
 *   // 'resource' removed
 * }
 */
export function cleanupOAuthRequestMiddleware(req: Request, res: Response, next: NextFunction) {
  // Only process POST requests to /token endpoint
  if (req.path === '/token' && req.method === 'POST') {
    if (req.body && req.body.resource === 'undefined') {
      logger.debug({ 
        client_id: req.body.client_id,
        original_resource: req.body.resource 
      }, 'Removing invalid resource parameter "undefined" from token request');
      
      // Remove the invalid resource parameter
      delete req.body.resource;
    }
  }
  
  next();
}