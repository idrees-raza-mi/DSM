import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { sendForbidden } from '../utils/response';
import { Role } from '../utils/constants';

export function requireRole(...roles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role as Role)) {
      sendForbidden(res, 'Insufficient permissions');
      return;
    }
    next();
  };
}

export const requireAdmin = requireRole('admin');
export const requireDriver = requireRole('driver');
