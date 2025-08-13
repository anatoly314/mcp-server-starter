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
      remotePort: req.remotePort,
      // Add request body if it exists (requires body parser middleware to run first)
      body: req.body ? sanitizeBody(req.body) : undefined
    }),
    res: (res) => ({
      statusCode: res.statusCode,
      headers: res.getHeaders ? res.getHeaders() : res._headers,
      // Response body will be attached separately (see below)
      body: res.body ? sanitizeBody(res.body) : undefined
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

// Helper function to sanitize/redact sensitive data from bodies
function sanitizeBody(body: any) {
  // Limit size to prevent huge logs
  const bodyStr = JSON.stringify(body);
  if (bodyStr.length > 1000) {
    return { truncated: true, preview: bodyStr.substring(0, 1000) + '...' };
  }

  // Clone to avoid mutating original
  const sanitized = JSON.parse(bodyStr);

  // Redact sensitive fields
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard'];

  function redactSensitive(obj: { [x: string]: any; }) {
    for (const key in obj) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        redactSensitive(obj[key]);
      }
    }
    return obj;
  }

  return redactSensitive(sanitized);
}


// Middleware to capture response body - add this BEFORE pinoHttpMiddleware
export const captureResponseBody = (req: any, res: any, next: any) => {
  const originalSend = res.send;
  const originalJson = res.json;
  const loggerCh = logger.child({ module: 'body' });

  res.send = function(data: any) {
    res.body = data;
    // Log with data as an object property
    loggerCh.info({ responseBody: data }, 'Response sent');
    return originalSend.call(this, data);
  };

  res.json = function(data: any) {
    res.body = data;
    // Correct Pino syntax: object first, then message
    loggerCh.info({ responseBody: data }, 'JSON response sent');
    return originalJson.call(this, data);
  };

  next();
};