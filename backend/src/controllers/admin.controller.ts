import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as adminService from '../services/admin.service';
import { sendSuccess } from '../utils/response';

export async function listPendingDrivers(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const drivers = await adminService.listPendingDrivers();
    sendSuccess(res, drivers);
  } catch (err) {
    next(err);
  }
}

export async function getDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const driver = await adminService.getDriverById(req.params.id);
    sendSuccess(res, driver);
  } catch (err) {
    next(err);
  }
}

export async function approveDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const driver = await adminService.approveDriver(req.params.id);
    sendSuccess(res, driver, 'Driver approved');
  } catch (err) {
    next(err);
  }
}

export async function rejectDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const driver = await adminService.rejectDriver(req.params.id, req.body.reason);
    sendSuccess(res, driver, 'Driver rejected');
  } catch (err) {
    next(err);
  }
}

export async function requestMoreDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const driver = await adminService.requestMoreDocuments(req.params.id, req.body.note);
    sendSuccess(res, driver, 'Document request sent');
  } catch (err) {
    next(err);
  }
}

export async function listAllDrivers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status, city, search } = req.query;
    const drivers = await adminService.listAllDrivers({
      status: status as string,
      city: city as string,
      search: search as string,
    });
    sendSuccess(res, drivers);
  } catch (err) {
    next(err);
  }
}

export async function updateDriverStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const driver = await adminService.updateDriverStatus(req.params.id, req.body.status);
    sendSuccess(res, driver, 'Driver status updated');
  } catch (err) {
    next(err);
  }
}

export async function createAdmin(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, password, phone } = req.body;
    const admin = await adminService.createAdmin({ name, email, password, phone });
    sendSuccess(res, {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
      role: admin.role,
    }, 'Admin account created');
  } catch (err) {
    next(err);
  }
}

export async function listAdmins(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const admins = await adminService.listAdmins();
    sendSuccess(res, admins);
  } catch (err) {
    next(err);
  }
}

export async function deleteAdmin(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    // Prevent self-deletion
    if (req.user!.userId === req.params.id) {
      throw Object.assign(new Error('You cannot delete your own account'), { statusCode: 400 });
    }
    await adminService.deleteAdmin(req.params.id);
    sendSuccess(res, null, 'Admin account removed');
  } catch (err) {
    next(err);
  }
}
