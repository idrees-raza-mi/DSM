import app from './app';
import { env } from './config/env';
import { connectDB } from './config/db';
import { logger } from './config/logger';
import { startCronJobs } from './cron';

async function start(): Promise<void> {
  await connectDB();

  startCronJobs();

  app.listen(env.PORT, () => {
    logger.info(`FleetFlow API running on port ${env.PORT}`);
  });
}

start().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
