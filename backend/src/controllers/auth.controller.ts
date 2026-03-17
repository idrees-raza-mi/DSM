import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { sendSuccess, sendCreated } from '../utils/response';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, phone, password } = req.body;
    const { user, token } = await authService.registerDriver({ name, email, phone, password });

    sendCreated(res, {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        onboardingStep: user.onboardingStep,
      },
    }, 'Registration successful');
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { emailOrPhone, password } = req.body;
    const { user, token } = await authService.loginUser(emailOrPhone, password);

    sendSuccess(res, {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        onboardingStep: user.onboardingStep,
        currentScore: user.currentScore,
      },
    }, 'Login successful');
  } catch (err) {
    next(err);
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  // JWT is stateless — client simply discards the token
  sendSuccess(res, null, 'Logged out successfully');
}
