import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { sendUnauthorized } from '../utils/response';
import User from '../models/User.model';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    sendUnauthorized(res, 'No token provided');
    return;
  }

  try {
    const token = header.split(' ')[1];
    const payload = verifyToken(token);

    // Verify user still exists and is not blocked
    const user = await User.findById(payload.userId).select('role status');
    if (!user) {
      sendUnauthorized(res, 'User no longer exists');
      return;
    }

    req.user = { userId: payload.userId, role: user.role };
    next();
  } catch {
    sendUnauthorized(res, 'Invalid or expired token');
  }
}
