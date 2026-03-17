import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as assignmentService from '../services/assignment.service';
import { sendSuccess, sendCreated } from '../utils/response';

export async function getAvailable(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const assignments = await assignmentService.getAvailableAssignments(req.user!.userId);
    sendSuccess(res, assignments);
  } catch (err) {
    next(err);
  }
}

export async function reserve(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const booking = await assignmentService.reserveAssignment(req.user!.userId, req.params.id);
    sendCreated(res, booking, 'Slot reserved with binding agreement');
  } catch (err) {
    next(err);
  }
}

export async function getMyAssignments(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const bookings = await assignmentService.getMyAssignments(req.user!.userId);
    sendSuccess(res, bookings);
  } catch (err) {
    next(err);
  }
}

export async function confirm(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const booking = await assignmentService.confirmAssignment(req.user!.userId, req.params.id);
    sendSuccess(res, booking, 'Assignment confirmed');
  } catch (err) {
    next(err);
  }
}

export async function checkIn(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { code, lat, lng } = req.body;
    const booking = await assignmentService.checkInAssignment(
      req.user!.userId,
      req.params.id,
      code,
      parseFloat(lat),
      parseFloat(lng)
    );
    sendSuccess(res, booking, 'Check-in successful, mission completed');
  } catch (err) {
    next(err);
  }
}

export async function cancel(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const booking = await assignmentService.cancelAssignment(req.user!.userId, req.params.id);
    sendSuccess(res, booking, `Booking cancelled (${booking.cancellationType})`);
  } catch (err) {
    next(err);
  }
}

// Admin: get single assignment
export async function getAssignment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const assignment = await assignmentService.getAssignmentById(req.params.id);
    sendSuccess(res, assignment);
  } catch (err) {
    next(err);
  }
}

// Admin: update assignment
export async function updateAssignment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const assignment = await assignmentService.updateAssignment(req.params.id, req.body);
    sendSuccess(res, assignment, 'Assignment updated');
  } catch (err) {
    next(err);
  }
}

// Admin: delete assignment
export async function deleteAssignment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await assignmentService.deleteAssignment(req.params.id);
    sendSuccess(res, null, 'Assignment deleted');
  } catch (err) {
    next(err);
  }
}

// Admin: deactivate/activate assignment
export async function setAssignmentActive(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const isActive = req.body.isActive === true || req.body.isActive === 'true';
    const assignment = await assignmentService.toggleAssignmentActive(req.params.id, isActive);
    sendSuccess(res, assignment, `Assignment ${isActive ? 'activated' : 'deactivated'}`);
  } catch (err) {
    next(err);
  }
}

// Admin endpoints
export async function createAssignment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const assignment = await assignmentService.createAssignment({
      ...req.body,
      createdBy: req.user!.userId,
    });
    sendCreated(res, assignment, 'Assignment created');
  } catch (err) {
    next(err);
  }
}

export async function listAssignments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { date, locationId, city } = req.query;
    const assignments = await assignmentService.listAssignments({
      date: date as string,
      locationId: locationId as string,
      city: city as string,
    });
    sendSuccess(res, assignments);
  } catch (err) {
    next(err);
  }
}
