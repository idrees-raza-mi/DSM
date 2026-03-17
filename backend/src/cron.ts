import cron from 'node-cron';
import { logger } from './config/logger';
import { withdrawUnconfirmedBookings, markNoShows } from './services/assignment.service';

export function startCronJobs(): void {
  // Run every 15 minutes: check for unconfirmed bookings approaching T-6h
  cron.schedule('*/15 * * * *', async () => {
    try {
      const count = await withdrawUnconfirmedBookings();
      if (count > 0) {
        logger.info(`Auto-withdrawn ${count} unconfirmed booking(s)`);
      }
    } catch (err) {
      logger.error('Cron: withdrawUnconfirmedBookings failed:', err);
    }
  });

  // Run every 30 minutes: check for no-shows on past assignments
  cron.schedule('*/30 * * * *', async () => {
    try {
      const count = await markNoShows();
      if (count > 0) {
        logger.info(`Marked ${count} booking(s) as no-show`);
      }
    } catch (err) {
      logger.error('Cron: markNoShows failed:', err);
    }
  });

  logger.info('Cron jobs started');
}
