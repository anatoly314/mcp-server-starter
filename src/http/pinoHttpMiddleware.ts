import pinoHttp from 'pino-http';
import { logger } from '../logger';

// Create pino-http middleware with our logger instance
export const pinoHttpMiddleware = pinoHttp({
  logger: logger.child({ module: 'http' }),
  
  // Customize the log messages
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return 'warn';
    } else if (res.statusCode >= 500 || err) {
      return 'error';
    }
    return 'info';
  },
  
  // Customize what gets logged
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      headers: {
        'content-type': req.headers['content-type'],
        'user-agent': req.headers['user-agent'],
        // Redact authorization header
        'authorization': req.headers.authorization ? 'Bearer [REDACTED]' : undefined
      },
      remoteAddress: req.remoteAddress,
      remotePort: req.remotePort
    }),
    res: (res) => ({
      statusCode: res.statusCode,
      headers: res.getHeaders ? res.getHeaders() : res._headers
    })
  },
  
  // Custom success message
  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url} ${res.statusCode}`;
  },
  
  // Custom error message
  customErrorMessage: (error, res) => {
    return `Request failed with ${res.statusCode}`;
  },
  
  // Don't log these routes (health checks, etc)
  autoLogging: {
    ignore: (req) => {
      // Example: ignore health check endpoints
      return req.url === '/health' || req.url === '/ping';
    }
  }
});