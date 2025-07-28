import { Request, Response, NextFunction } from 'express';
import ipRangeCheck from 'ip-range-check';
import { envProvider } from '../envProvider';

/**
 * IP Filter Middleware
 * 
 * Filters incoming requests based on IP whitelist defined in FILTER_BY_IP env var.
 * Supports:
 * - Single IPs: "192.168.1.1"
 * - Multiple IPs: "192.168.1.1,10.0.0.1"
 * - IP ranges: "192.168.1.0/24" (CIDR notation)
 * - IP ranges with dash: "192.168.1.1-192.168.1.10"
 * 
 * Always allows local requests (when no CF-Connecting-IP or X-Forwarded-For headers are present)
 * Prioritizes Cloudflare's CF-Connecting-IP header when behind Cloudflare
 */

// Extract client IP from request
function getClientIp(req: Request): string | null {
  // Priority 1: Cloudflare header (most reliable when behind CF)
  const cfConnectingIp = req.headers['cf-connecting-ip'];
  if (cfConnectingIp && typeof cfConnectingIp === 'string') {
    return cfConnectingIp;
  }
  
  // Priority 2: X-Forwarded-For (standard proxy header)
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor && typeof xForwardedFor === 'string') {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return xForwardedFor.split(',')[0].trim();
  }
  
  // Priority 3: X-Real-IP (some proxies use this)
  const xRealIp = req.headers['x-real-ip'];
  if (xRealIp && typeof xRealIp === 'string') {
    return xRealIp;
  }
  
  // If no proxy headers, it's likely a local request
  return null;
}

export function ipFilterMiddleware(req: Request, res: Response, next: NextFunction): void {
  const filterByIp = envProvider.filterByIp;
  
  // If no IP filter configured, allow all
  if (!filterByIp) {
    return next();
  }
  
  const clientIp = getClientIp(req);
  
  // Always allow local requests (no proxy headers present)
  if (!clientIp) {
    console.error('IP Filter: Allowing local request (no proxy headers)');
    return next();
  }
  
  // Parse allowed IPs/ranges
  const allowedRanges = filterByIp.split(',').map(range => range.trim()).filter(range => range);
  
  // Check if client IP is in any allowed range
  try {
    if (ipRangeCheck(clientIp, allowedRanges)) {
      console.error(`IP Filter: Allowing request from ${clientIp}`);
      return next();
    }
  } catch (error) {
    console.error(`IP Filter: Error checking IP ${clientIp}:`, error);
    // On error, deny access for security
  }
  
  // IP not allowed
  console.error(`IP Filter: Blocking request from ${clientIp} (not in whitelist: ${filterByIp})`);
  res.status(403).json({
    error: 'Forbidden',
    message: 'Access denied from your IP address'
  });
}