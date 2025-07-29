import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../logger';

const logger = createLogger('http-middleware');

export const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const { method, url, body } = req;
  
  logger.info({
    method,
    url,
    body: method === 'POST' ? body : undefined,
    headers: {
      'content-type': req.headers['content-type'],
      'authorization': req.headers.authorization ? 'Bearer ***' : undefined
    }
  }, 'HTTP request');
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method,
      url,
      statusCode: res.statusCode,
      duration
    }, 'HTTP response');
  });
  
  next();
};