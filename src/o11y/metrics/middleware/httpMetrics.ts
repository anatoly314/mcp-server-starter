import { Request, Response, NextFunction } from 'express';
import { getAllMetrics, isMetricsEnabled } from '../index.js';

export const httpMetricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Skip if metrics are disabled
  if (!isMetricsEnabled()) {
    return next();
  }

  // Get metrics (they're already initialized in HTTPServer)
  const metrics = getAllMetrics();
  const { httpRequestTotal, httpRequestDuration, httpActiveRequests, httpRequestSizeBytes, httpResponseSizeBytes } = metrics;

  const startTime = Date.now();
  
  // Increment active requests
  const labels = {
    method: req.method,
    route: req.route?.path || req.path,
  };
  
  httpActiveRequests.add(1, labels);
  
  // Track request size
  const requestSize = parseInt(req.get('content-length') || '0', 10);
  if (requestSize > 0) {
    httpRequestSizeBytes.record(requestSize, labels);
  }
  
  // Hook into response finish event
  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000; // Convert to seconds
    const statusLabels = {
      ...labels,
      status: res.statusCode.toString(),
      status_class: `${Math.floor(res.statusCode / 100)}xx`,
    };
    
    // Record metrics
    httpRequestTotal.add(1, statusLabels);
    httpRequestDuration.record(duration, statusLabels);
    httpActiveRequests.add(-1, labels);
    
    // Track response size
    const responseSize = parseInt(res.get('content-length') || '0', 10);
    if (responseSize > 0) {
      httpResponseSizeBytes.record(responseSize, statusLabels);
    }
  });
  
  next();
};