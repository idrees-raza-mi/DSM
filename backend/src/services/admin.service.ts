import User, { IUser } from '../models/User.model';
import DocumentModel from '../models/Document.model';

export async function listPendingDrivers(): Promise<IUser[]> {
  return User.find({ role: 'driver', status: 'under_review', onboardingStep: 3 }).sort({ createdAt: -1 });
}

export async function getDriverById(driverId: string): Promise<IUser & { documents: any[] }> {
  const driver = await User.findById(driverId);
  if (!driver) {
    throw Object.assign(new Error('Driver not found'), { statusCode: 404 });
  }
  const documents = await DocumentModel.find({ driver: driverId });
  return Object.assign(driver.toObject(), { documents });
}

export async function approveDriver(driverId: string): Promise<IUser> {
  const driver = await User.findById(driverId);
  if (!driver) {
    throw Object.assign(new Error('Driver not found'), { statusCode: 404 });
  }
  driver.status = 'active';
  driver.onboardingStep = 4;
  await driver.save();

  // Approve all pending documents
  await DocumentModel.updateMany(
    { driver: driverId, status: 'pending' },
    { status: 'approved', reviewedAt: new Date() }
  );

  return driver;
}

export async function rejectDriver(driverId: string, reason?: string): Promise<IUser> {
  const driver = await User.findById(driverId);
  if (!driver) {
    throw Object.assign(new Error('Driver not found'), { statusCode: 404 });
  }
  driver.status = 'blocked';
  driver.applicationNote = reason || 'Application rejected';
  await driver.save();
  return driver;
}

export async function requestMoreDocuments(driverId: string, note: string): Promise<IUser> {
  const driver = await User.findById(driverId);
  if (!driver) {
    throw Object.assign(new Error('Driver not found'), { statusCode: 404 });
  }
  driver.onboardingStep = 2; // Send back to document upload step
  driver.applicationNote = note;
  await driver.save();
  return driver;
}

export async function listAllDrivers(filters?: {
  status?: string;
  city?: string;
  search?: string;
}): Promise<IUser[]> {
  const query: any = { role: 'driver' };

  if (filters?.status) query.status = filters.status;
  if (filters?.city) query.city = filters.city;
  if (filters?.search) {
    query.$or = [
      { name: { $regex: filters.search, $options: 'i' } },
      { email: { $regex: filters.search, $options: 'i' } },
      { phone: { $regex: filters.search, $options: 'i' } },
    ];
  }

  return User.find(query).sort({ createdAt: -1 });
}

export async function updateDriverStatus(driverId: string, status: string): Promise<IUser> {
  const driver = await User.findById(driverId);
  if (!driver) {
    throw Object.assign(new Error('Driver not found'), { statusCode: 404 });
  }
  driver.status = status as any;
  await driver.save();
  return driver;
}

export async function createAdmin(data: {
  name: string;
  email: string;
  password: string;
  phone: string;
}): Promise<IUser> {
  const existing = await User.findOne({ email: data.email.toLowerCase() });
  if (existing) {
    throw Object.assign(new Error('Email already in use'), { statusCode: 409 });
  }
  const admin = await User.create({
    name: data.name,
    email: data.email.toLowerCase(),
    phone: data.phone,
    password: data.password,
    role: 'admin',
    status: 'active',
    onboardingStep: 4,
  });
  return admin;
}

export async function listAdmins(): Promise<IUser[]> {
  return User.find({ role: 'admin' }).select('-password').sort({ createdAt: -1 });
}

export async function deleteAdmin(adminId: string): Promise<void> {
  const admin = await User.findById(adminId);
  if (!admin || admin.role !== 'admin') {
    throw Object.assign(new Error('Admin not found'), { statusCode: 404 });
  }
  await User.findByIdAndDelete(adminId);
}
