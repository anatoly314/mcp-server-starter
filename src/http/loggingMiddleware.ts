import { Request, Response, NextFunction } from 'express';

export const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const { method, url, body } = req;
  
  console.error(`[${new Date().toISOString()}] ${method} ${url}`, {
    body: method === 'POST' ? body : undefined,
    headers: {
      'content-type': req.headers['content-type'],
      'authorization': req.headers.authorization ? 'Bearer ***' : undefined
    }
  });
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.error(`[${new Date().toISOString()}] ${method} ${url} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
};