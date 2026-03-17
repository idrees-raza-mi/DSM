import User, { IUser } from '../models/User.model';
import DocumentModel from '../models/Document.model';

export async function getDriverProfile(driverId: string): Promise<IUser> {
  const driver = await User.findById(driverId);
  if (!driver) {
    throw Object.assign(new Error('Driver not found'), { statusCode: 404 });
  }
  return driver;
}

export async function updateDriverProfile(
  driverId: string,
  data: {
    fullName?: string;
    phone?: string;
    email?: string;
    address?: string;
    bankDetails?: { bankName: string; accountName: string; iban: string };
  }
): Promise<IUser> {
  const driver = await User.findById(driverId);
  if (!driver) {
    throw Object.assign(new Error('Driver not found'), { statusCode: 404 });
  }

  if (data.fullName) driver.name = data.fullName;
  if (data.phone) driver.phone = data.phone;
  if (data.email) driver.email = data.email;
  if (data.address) driver.address = data.address;
  if (data.bankDetails) driver.bankDetails = data.bankDetails;

  // Advance onboarding if at step 0
  if (driver.onboardingStep === 0) {
    driver.onboardingStep = 1;
  }

  await driver.save();
  return driver;
}

export async function uploadDocument(
  driverId: string,
  type: string,
  fileUrl: string
): Promise<any> {
  // Upsert: replace existing document of same type
  const doc = await DocumentModel.findOneAndUpdate(
    { driver: driverId, type },
    { fileUrl, status: 'pending', uploadedAt: new Date() },
    { upsert: true, new: true }
  );
  return doc;
}

export async function listDocuments(driverId: string): Promise<any[]> {
  return DocumentModel.find({ driver: driverId }).sort({ type: 1 });
}

export async function submitApplication(driverId: string): Promise<IUser> {
  const driver = await User.findById(driverId);
  if (!driver) {
    throw Object.assign(new Error('Driver not found'), { statusCode: 404 });
  }

  // Verify required documents exist
  const docs = await DocumentModel.find({ driver: driverId });
  const requiredTypes = ['driver_license', 'id_document', 'profile_photo', 'bank_details'] as const;
  const uploadedTypes = docs.map((d) => d.type);
  const missing = requiredTypes.filter((t) => !uploadedTypes.includes(t as any));

  if (missing.length > 0) {
    throw Object.assign(new Error(`Missing documents: ${missing.join(', ')}`), { statusCode: 400 });
  }

  driver.onboardingStep = 3; // submitted
  driver.status = 'under_review';
  await driver.save();
  return driver;
}

export async function getApplicationStatus(driverId: string): Promise<{ status: string; onboardingStep: number }> {
  const driver = await User.findById(driverId).select('status onboardingStep');
  if (!driver) {
    throw Object.assign(new Error('Driver not found'), { statusCode: 404 });
  }
  return { status: driver.status, onboardingStep: driver.onboardingStep };
}
