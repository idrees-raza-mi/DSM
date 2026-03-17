import { Response } from 'express';

interface ApiResponse {
  success: boolean;
  data?: any;
  message?: string;
}

export function sendSuccess(res: Response, data: any, message?: string, statusCode = 200): void {
  const body: ApiResponse = { success: true, data };
  if (message) body.message = message;
  res.status(statusCode).json(body);
}

export function sendError(res: Response, message: string, statusCode = 400): void {
  res.status(statusCode).json({ success: false, message });
}

export function sendCreated(res: Response, data: any, message?: string): void {
  sendSuccess(res, data, message, 201);
}

export function sendNotFound(res: Response, message = 'Resource not found'): void {
  sendError(res, message, 404);
}

export function sendUnauthorized(res: Response, message = 'Unauthorized'): void {
  sendError(res, message, 401);
}

export function sendForbidden(res: Response, message = 'Forbidden'): void {
  sendError(res, message, 403);
}
