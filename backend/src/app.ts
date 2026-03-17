import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import authRoutes from './routes/auth.routes';
import driverRoutes from './routes/driver.routes';
import adminRoutes from './routes/admin.routes';
import assignmentRoutes from './routes/assignment.routes';
import billingRoutes from './routes/billing.routes';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'FleetFlow API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/billing', billingRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
