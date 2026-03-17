import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as billingService from '../services/billing.service';
import { sendSuccess, sendCreated } from '../utils/response';

// Driver endpoints
export async function getMyBillingPeriods(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const periods = await billingService.getDriverBillingPeriods(req.user!.userId);
    sendSuccess(res, periods);
  } catch (err) {
    next(err);
  }
}

export async function getBillingPeriod(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const period = await billingService.getBillingPeriodById(req.params.id, req.user!.userId);
    sendSuccess(res, period);
  } catch (err) {
    next(err);
  }
}

export async function submitInvoice(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { fileUrl, amount } = req.body;
    const invoice = await billingService.submitInvoice(req.user!.userId, req.params.id, fileUrl, amount);
    sendCreated(res, invoice, 'Invoice submitted');
  } catch (err) {
    next(err);
  }
}

export async function generateBillingPeriod(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { month, year } = req.body;
    const period = await billingService.generateBillingPeriod(req.user!.userId, month, year);
    sendSuccess(res, period);
  } catch (err) {
    next(err);
  }
}

// Admin endpoints
export async function listAllInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status } = req.query;
    const invoices = await billingService.listAllInvoices({ status: status as string });
    sendSuccess(res, invoices);
  } catch (err) {
    next(err);
  }
}

export async function approveInvoice(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const invoice = await billingService.approveInvoice(req.params.id, req.user!.userId);
    sendSuccess(res, invoice, 'Invoice approved');
  } catch (err) {
    next(err);
  }
}

export async function rejectInvoice(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { reason } = req.body;
    const invoice = await billingService.rejectInvoice(req.params.id, req.user!.userId, reason);
    sendSuccess(res, invoice, 'Invoice rejected');
  } catch (err) {
    next(err);
  }
}
