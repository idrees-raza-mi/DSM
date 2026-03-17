import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireDriver } from '../middleware/roles.middleware';
import * as billingController from '../controllers/billing.controller';

const router = Router();

// Driver billing routes
router.use(authenticate, requireDriver);

router.get('/periods', billingController.getMyBillingPeriods);
router.get('/periods/:id', billingController.getBillingPeriod);
router.post('/periods/:id/invoice', billingController.submitInvoice);
router.post('/periods/generate', billingController.generateBillingPeriod);

export default router;
