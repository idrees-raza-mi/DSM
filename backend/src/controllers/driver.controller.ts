import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as driverService from '../services/driver.service';
import * as scoringService from '../services/scoring.service';
import { sendSuccess } from '../utils/response';

export async function getMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const driver = await driverService.getDriverProfile(req.user!.userId);
    sendSuccess(res, {
      id: driver._id,
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      role: driver.role,
      status: driver.status,
      address: driver.address,
      bankDetails: driver.bankDetails,
      currentScore: driver.currentScore,
      onboardingStep: driver.onboardingStep,
      city: driver.city,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const driver = await driverService.updateDriverProfile(req.user!.userId, req.body);
    sendSuccess(res, {
      id: driver._id,
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      address: driver.address,
      bankDetails: driver.bankDetails,
      onboardingStep: driver.onboardingStep,
    }, 'Profile updated');
  } catch (err) {
    next(err);
  }
}

export async function uploadDocument(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { type, fileUrl } = req.body;
    const doc = await driverService.uploadDocument(req.user!.userId, type, fileUrl);
    sendSuccess(res, doc, 'Document uploaded');
  } catch (err) {
    next(err);
  }
}

export async function listDocuments(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const docs = await driverService.listDocuments(req.user!.userId);
    sendSuccess(res, docs);
  } catch (err) {
    next(err);
  }
}

export async function submitApplication(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const driver = await driverService.submitApplication(req.user!.userId);
    sendSuccess(res, {
      status: driver.status,
      onboardingStep: driver.onboardingStep,
    }, 'Application submitted for review');
  } catch (err) {
    next(err);
  }
}

export async function getApplicationStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const status = await driverService.getApplicationStatus(req.user!.userId);
    sendSuccess(res, status);
  } catch (err) {
    next(err);
  }
}

export async function getScore(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const scoreData = await scoringService.getDriverScore(req.user!.userId);
    sendSuccess(res, scoreData);
  } catch (err) {
    next(err);
  }
}
