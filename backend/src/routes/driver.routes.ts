import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireDriver } from '../middleware/roles.middleware';
import * as driverController from '../controllers/driver.controller';

const router = Router();

// All driver routes require authentication and driver role
router.use(authenticate, requireDriver);

router.get('/me', driverController.getMe);
router.put('/me/profile', driverController.updateProfile);
router.post('/me/documents', driverController.uploadDocument);
router.get('/me/documents', driverController.listDocuments);
router.post('/me/submit-application', driverController.submitApplication);
router.get('/me/application-status', driverController.getApplicationStatus);
router.get('/me/score', driverController.getScore);

export default router;
