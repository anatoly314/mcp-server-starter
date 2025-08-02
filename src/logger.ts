import pino from 'pino';
import { envProvider } from './envProvider';

// Determine log level from environment or default to 'info'
const logLevel = process.env.LOG_LEVEL || 'info';

// Always log to stderr to avoid interfering with stdout
// (especially important for stdio transport, but good practice for all modes)
const destination = pino.destination({ dest: 2, sync: false }); // 2 = stderr

// Create the logger instance
export const logger = pino({
  level: logLevel,
  base: {
    service: envProvider.mcpServerName,
    version: envProvider.mcpServerVersion
  },
  // Redact sensitive information
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.secret', '*.token'],
    censor: '[REDACTED]'
  }
}, destination);

// Create child loggers for different modules
export const createLogger = (module: string) => {
  return logger.child({ module });
};