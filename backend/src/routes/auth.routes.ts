import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware';
import * as authController from '../controllers/auth.controller';

const router = Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').trim().notEmpty().withMessage('Phone is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  authController.register
);

router.post(
  '/login',
  [
    body('emailOrPhone').trim().notEmpty().withMessage('Email or phone is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  authController.login
);

router.post('/logout', authController.logout);

export default router;
