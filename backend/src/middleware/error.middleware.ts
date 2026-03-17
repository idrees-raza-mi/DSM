import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction): void {
  logger.error(err.stack || err.message || err);

  if (err.name === 'ValidationError') {
    res.status(400).json({ success: false, message: err.message });
    return;
  }

  if (err.name === 'CastError') {
    res.status(400).json({ success: false, message: 'Invalid ID format' });
    return;
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    res.status(409).json({ success: false, message: `Duplicate value for ${field}` });
    return;
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ success: false, message: 'Route not found' });
}
