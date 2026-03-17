import Booking from '../models/Booking.model';
import Assignment from '../models/Assignment.model';
import BillingPeriod from '../models/BillingPeriod.model';
import Invoice from '../models/Invoice.model';

export async function generateBillingPeriod(driverId: string, month: number, year: number): Promise<any> {
  // Check if already exists
  const existing = await BillingPeriod.findOne({ driver: driverId, month, year });
  if (existing) return existing;

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  // Find all completed bookings for this driver in this period
  const bookings = await Booking.find({
    driver: driverId,
    status: 'completed',
    completedAt: { $gte: startDate, $lte: endDate },
  }).populate({
    path: 'assignment',
    populate: { path: 'location' },
  });

  const missions = bookings.map((booking: any) => ({
    booking: booking._id,
    date: booking.assignment.date,
    location: booking.assignment.location?.name || 'Unknown',
    timeSlot: booking.assignment.timeSlot,
    compensation: booking.assignment.compensation,
  }));

  const totalAmount = missions.reduce((sum, m) => sum + m.compensation, 0);

  const period = await BillingPeriod.create({
    driver: driverId,
    month,
    year,
    totalMissions: missions.length,
    totalAmount,
    missions,
  });

  return period;
}

export async function getDriverBillingPeriods(driverId: string): Promise<any[]> {
  return BillingPeriod.find({ driver: driverId }).sort({ year: -1, month: -1 });
}

export async function getBillingPeriodById(periodId: string, driverId: string): Promise<any> {
  const period = await BillingPeriod.findOne({ _id: periodId, driver: driverId });
  if (!period) {
    throw Object.assign(new Error('Billing period not found'), { statusCode: 404 });
  }

  const invoice = await Invoice.findOne({ billingPeriod: periodId, driver: driverId });
  return { ...period.toObject(), invoice };
}

export async function submitInvoice(
  driverId: string,
  periodId: string,
  fileUrl: string,
  amount: number
): Promise<any> {
  const period = await BillingPeriod.findOne({ _id: periodId, driver: driverId });
  if (!period) {
    throw Object.assign(new Error('Billing period not found'), { statusCode: 404 });
  }

  // Check for existing invoice
  const existing = await Invoice.findOne({ billingPeriod: periodId, driver: driverId });
  if (existing && existing.status !== 'rejected') {
    throw Object.assign(new Error('Invoice already submitted for this period'), { statusCode: 400 });
  }

  const invoice = await Invoice.create({
    driver: driverId,
    billingPeriod: periodId,
    fileUrl,
    amount,
    status: 'submitted',
    submittedAt: new Date(),
  });

  return invoice;
}

// Admin functions
export async function listAllInvoices(filters?: {
  status?: string;
}): Promise<any[]> {
  const query: any = {};
  if (filters?.status) query.status = filters.status;

  return Invoice.find(query)
    .populate('driver', 'name email phone')
    .populate('billingPeriod', 'month year totalMissions totalAmount')
    .sort({ submittedAt: -1 });
}

export async function approveInvoice(invoiceId: string, adminId: string): Promise<any> {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    throw Object.assign(new Error('Invoice not found'), { statusCode: 404 });
  }

  if (invoice.status !== 'submitted') {
    throw Object.assign(new Error('Invoice cannot be approved in current status'), { statusCode: 400 });
  }

  invoice.status = 'approved';
  invoice.reviewedAt = new Date();
  invoice.reviewedBy = adminId as any;
  await invoice.save();

  return invoice;
}

export async function rejectInvoice(invoiceId: string, adminId: string, reason: string): Promise<any> {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    throw Object.assign(new Error('Invoice not found'), { statusCode: 404 });
  }

  invoice.status = 'rejected';
  invoice.reviewedAt = new Date();
  invoice.reviewedBy = adminId as any;
  invoice.rejectionReason = reason;
  await invoice.save();

  return invoice;
}
