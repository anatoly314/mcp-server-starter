import { Request, Response, NextFunction } from 'express';
import { envProvider } from '../envProvider';
import { createLogger } from '../logger';

const logger = createLogger('email-filter');

/**
 * Email Filter Middleware
 * 
 * Filters authenticated users based on email whitelist defined in ALLOWED_EMAILS env var.
 * Supports:
 * - Single email: "john@example.com"
 * - Multiple emails (CSV): "john@example.com,jane@company.org,admin@gmail.com"
 * - Empty/undefined: allows all authenticated users
 * 
 * MUST run AFTER authMiddleware since it needs the authenticated user info.
 * Only applies when AUTH_ENABLED=true
 */
export function emailFilterMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Skip if auth is not enabled
  if (!envProvider.authEnabled) {
    return next();
  }

  const allowedEmails = envProvider.allowedEmails;
  
  // If no email filter configured, allow all authenticated users
  if (!allowedEmails) {
    return next();
  }
  
  // Get user email from request (set by authMiddleware)
  const user = (req as any).user;
  
  // If no user info (shouldn't happen after auth middleware), deny
  if (!user || !user.email) {
    logger.error('No user email found after auth middleware');
    res.status(403).json({
      error: 'Forbidden',
      message: 'Unable to verify user email'
    });
    return;
  }
  
  const userEmail = user.email.toLowerCase().trim();
  
  // Parse allowed emails (case-insensitive comparison)
  const emailWhitelist = allowedEmails
    .split(',')
    .map(email => email.toLowerCase().trim())
    .filter(email => email); // Remove empty strings
  
  // Check if user's email is in whitelist
  if (emailWhitelist.includes(userEmail)) {
    logger.debug({ userEmail }, 'Allowing request from whitelisted email');
    return next();
  }
  
  // Email not allowed
  logger.warn({ 
    userEmail, 
    whitelist: emailWhitelist.join(', ') 
  }, 'Blocking request - email not in whitelist');
  
  res.status(403).json({
    error: 'Forbidden',
    message: 'Your email is not authorized to access this service'
  });
}