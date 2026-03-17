import mongoose from 'mongoose';
import { env } from './config/env';
import User from './models/User.model';
import Location from './models/Location.model';
import { logger } from './config/logger';

// Seed script to create an admin user and sample locations
async function seed(): Promise<void> {
  await mongoose.connect(env.MONGO_URI);
  logger.info('Connected to MongoDB for seeding');

  // Create admin user if not exists
  const existingAdmin = await User.findOne({ email: 'admin@fleetflow.com' });
  if (!existingAdmin) {
    await User.create({
      name: 'Admin',
      email: 'admin@fleetflow.com',
      phone: '+491234567890',
      password: 'admin123',
      role: 'admin',
      status: 'active',
      onboardingStep: 4,
    });
    logger.info('Admin user created: admin@fleetflow.com / admin123');
  } else {
    logger.info('Admin user already exists');
  }

  // Create sample locations
  const locations = [
    { name: 'Berlin Central Hub', city: 'Berlin', address: 'Alexanderplatz 1, 10178 Berlin', lat: 52.5219, lng: 13.4132 },
    { name: 'Munich Depot', city: 'Munich', address: 'Marienplatz 1, 80331 Munich', lat: 48.1371, lng: 11.5754 },
    { name: 'Hamburg Port Center', city: 'Hamburg', address: 'Landungsbrücken 1, 20359 Hamburg', lat: 53.5461, lng: 9.9665 },
    { name: 'Frankfurt Logistics', city: 'Frankfurt', address: 'Zeil 1, 60313 Frankfurt', lat: 50.1146, lng: 8.6822 },
    { name: 'Cologne Distribution', city: 'Cologne', address: 'Domplatte 1, 50667 Cologne', lat: 50.9413, lng: 6.9583 },
  ];

  for (const loc of locations) {
    const exists = await Location.findOne({ name: loc.name });
    if (!exists) {
      await Location.create({
        name: loc.name,
        city: loc.city,
        address: loc.address,
        coordinates: { lat: loc.lat, lng: loc.lng },
        checkinRadiusMeters: 500,
        overbookingPercent: 5,
      });
      logger.info(`Location created: ${loc.name}`);
    }
  }

  logger.info('Seeding complete');
  await mongoose.disconnect();
}

seed().catch((err) => {
  logger.error('Seed failed:', err);
  process.exit(1);
});
