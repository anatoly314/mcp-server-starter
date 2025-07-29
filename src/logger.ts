import pino from 'pino';
import { envProvider } from './envProvider';

// Determine log level from environment or default to 'info'
const logLevel = process.env.LOG_LEVEL || 'info';

// Always use JSON output (no pretty printing)
const transport = undefined;

// Create the logger instance
export const logger = pino({
  level: logLevel,
  base: {
    service: envProvider.mcpServerName,
    version: envProvider.mcpServerVersion
  },
  transport,
  // Redact sensitive information
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.secret', '*.token'],
    censor: '[REDACTED]'
  }
});

// Create child loggers for different modules
export const createLogger = (module: string) => {
  return logger.child({ module });
};