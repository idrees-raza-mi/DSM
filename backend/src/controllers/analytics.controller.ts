import { Request, Response, NextFunction } from 'express';
import * as analyticsService from '../services/analytics.service';
import { sendSuccess } from '../utils/response';

export async function getOverview(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await analyticsService.getOverview();
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

export async function getNoShows(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await analyticsService.getNoShowAnalytics();
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

export async function getCancellations(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await analyticsService.getCancellationAnalytics();
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

export async function getLocations(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await analyticsService.getLocationAnalytics();
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

export async function getBilling(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await analyticsService.getBillingAnalytics();
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}
