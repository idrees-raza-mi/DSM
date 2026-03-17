import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireDriver } from '../middleware/roles.middleware';
import * as assignmentController from '../controllers/assignment.controller';

const router = Router();

// All assignment routes require authentication and driver role
router.use(authenticate, requireDriver);

router.get('/available', assignmentController.getAvailable);
router.post('/:id/reserve', assignmentController.reserve);
router.get('/my', assignmentController.getMyAssignments);
router.post('/:id/confirm', assignmentController.confirm);
router.post('/:id/check-in', assignmentController.checkIn);
router.post('/:id/cancel', assignmentController.cancel);

export default router;
