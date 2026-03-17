import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/roles.middleware';
import * as adminController from '../controllers/admin.controller';
import * as assignmentController from '../controllers/assignment.controller';
import * as billingController from '../controllers/billing.controller';
import * as analyticsController from '../controllers/analytics.controller';
import * as locationController from '../controllers/location.controller';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate, requireAdmin);

// Driver management
router.get('/drivers', adminController.listAllDrivers);
router.get('/drivers/pending', adminController.listPendingDrivers);
router.get('/drivers/:id', adminController.getDriver);
router.post('/drivers/:id/approve', adminController.approveDriver);
router.post('/drivers/:id/reject', adminController.rejectDriver);
router.post('/drivers/:id/request-more-documents', adminController.requestMoreDocuments);
router.put('/drivers/:id/status', adminController.updateDriverStatus);

// Assignment management
router.post('/assignments', assignmentController.createAssignment);
router.get('/assignments', assignmentController.listAssignments);

// Invoices
router.get('/invoices', billingController.listAllInvoices);
router.post('/invoices/:id/approve', billingController.approveInvoice);
router.post('/invoices/:id/reject', billingController.rejectInvoice);

// Analytics
router.get('/analytics/overview', analyticsController.getOverview);
router.get('/analytics/no-shows', analyticsController.getNoShows);
router.get('/analytics/cancellations', analyticsController.getCancellations);
router.get('/analytics/locations', analyticsController.getLocations);
router.get('/analytics/billing', analyticsController.getBilling);

// Locations
router.post('/locations', locationController.createLocation);
router.get('/locations', locationController.listLocations);
router.put('/locations/:id', locationController.updateLocation);

export default router;
