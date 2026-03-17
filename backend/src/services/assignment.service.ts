import Assignment from '../models/Assignment.model';
import Booking from '../models/Booking.model';
import User from '../models/User.model';
import Location from '../models/Location.model';
import { isWithinRadius } from '../utils/geo';
import {
  MAX_MISSIONS_PER_DAY,
  TIER_PRIORITY_MIN,
  TIER_NORMAL_MIN,
  TIER_LIMITED_MIN,
  AUTO_WITHDRAW_HOURS,
} from '../utils/constants';
import { applyNoShowPenalty, applyLateCancelPenalty, applyCompletedBonus } from './scoring.service';

export async function getAvailableAssignments(driverId: string): Promise<any[]> {
  const driver = await User.findById(driverId).select('currentScore status');
  if (!driver || driver.status !== 'active') {
    return [];
  }

  const now = new Date();
  const assignments = await Assignment.find({
    isActive: true,
    startTime: { $gt: now },
  }).populate('location');

  // Filter by score tier visibility
  const results = [];
  for (const assignment of assignments) {
    const bookingCount = await Booking.countDocuments({
      assignment: assignment._id,
      status: { $in: ['reserved', 'confirmed', 'checked_in'] },
    });

    if (bookingCount >= assignment.maxDrivers) continue;

    // Check if driver already booked this
    const alreadyBooked = await Booking.findOne({
      driver: driverId,
      assignment: assignment._id,
      status: { $in: ['reserved', 'confirmed', 'checked_in'] },
    });
    if (alreadyBooked) continue;

    const slotsRemaining = assignment.maxDrivers - bookingCount;
    const isLastSlots = slotsRemaining <= Math.ceil(assignment.requiredDrivers * 0.1);

    // Score-based visibility
    if (driver.currentScore >= TIER_PRIORITY_MIN) {
      // Priority: sees everything first
      results.push({ assignment, slotsRemaining });
    } else if (driver.currentScore >= TIER_NORMAL_MIN) {
      // Normal: sees everything
      results.push({ assignment, slotsRemaining });
    } else if (driver.currentScore >= TIER_LIMITED_MIN) {
      // Limited: only remaining slots (last 10% of capacity)
      if (isLastSlots) {
        results.push({ assignment, slotsRemaining });
      }
    }
    // Below 60: restricted, no slots visible
  }

  return results;
}

export async function reserveAssignment(driverId: string, assignmentId: string): Promise<any> {
  const driver = await User.findById(driverId);
  if (!driver || driver.status !== 'active') {
    throw Object.assign(new Error('Driver is not active'), { statusCode: 403 });
  }

  const assignment = await Assignment.findById(assignmentId);
  if (!assignment || !assignment.isActive) {
    throw Object.assign(new Error('Assignment not found or inactive'), { statusCode: 404 });
  }

  // Check if assignment is in the future
  if (assignment.startTime <= new Date()) {
    throw Object.assign(new Error('Assignment has already started'), { statusCode: 400 });
  }

  // Check max 2 missions per day
  const dayStart = new Date(assignment.date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(assignment.date);
  dayEnd.setHours(23, 59, 59, 999);

  const dailyBookings = await Booking.countDocuments({
    driver: driverId,
    status: { $in: ['reserved', 'confirmed', 'checked_in'] },
  });

  // Need to check bookings for this specific day via assignment lookup
  const dayAssignments = await Assignment.find({
    date: { $gte: dayStart, $lte: dayEnd },
  }).select('_id');
  const dayAssignmentIds = dayAssignments.map((a) => a._id);

  const dailyCount = await Booking.countDocuments({
    driver: driverId,
    assignment: { $in: dayAssignmentIds },
    status: { $in: ['reserved', 'confirmed', 'checked_in'] },
  });

  if (dailyCount >= MAX_MISSIONS_PER_DAY) {
    throw Object.assign(new Error(`Maximum ${MAX_MISSIONS_PER_DAY} missions per day reached`), { statusCode: 400 });
  }

  // Check capacity
  const bookedCount = await Booking.countDocuments({
    assignment: assignmentId,
    status: { $in: ['reserved', 'confirmed', 'checked_in'] },
  });

  if (bookedCount >= assignment.maxDrivers) {
    throw Object.assign(new Error('No slots available'), { statusCode: 400 });
  }

  // Check duplicate booking
  const existing = await Booking.findOne({
    driver: driverId,
    assignment: assignmentId,
    status: { $in: ['reserved', 'confirmed', 'checked_in'] },
  });
  if (existing) {
    throw Object.assign(new Error('Already booked this assignment'), { statusCode: 400 });
  }

  // Determine if this is an overbooking slot (substitute)
  const isSubstitute = bookedCount >= assignment.requiredDrivers;

  const booking = await Booking.create({
    driver: driverId,
    assignment: assignmentId,
    status: 'reserved',
    reservedAt: new Date(),
    isSubstitute,
  });

  return booking;
}

export async function getMyAssignments(driverId: string): Promise<any[]> {
  const bookings = await Booking.find({
    driver: driverId,
    status: { $in: ['reserved', 'confirmed', 'checked_in', 'completed'] },
  })
    .populate({
      path: 'assignment',
      populate: { path: 'location' },
    })
    .sort({ createdAt: -1 });

  return bookings;
}

export async function confirmAssignment(driverId: string, bookingId: string): Promise<any> {
  const booking = await Booking.findOne({
    _id: bookingId,
    driver: driverId,
  }).populate('assignment');

  if (!booking) {
    throw Object.assign(new Error('Booking not found'), { statusCode: 404 });
  }

  if (booking.status !== 'reserved' && booking.status !== 'confirmed') {
    throw Object.assign(new Error('Booking cannot be confirmed in current status'), { statusCode: 400 });
  }

  const assignment = booking.assignment as any;
  const hoursUntilStart = (new Date(assignment.startTime).getTime() - Date.now()) / (1000 * 60 * 60);

  // Record which confirmation window this is
  const now = new Date();
  if (hoursUntilStart <= 6) {
    booking.confirmations.t6 = now;
  } else if (hoursUntilStart <= 12) {
    booking.confirmations.t12 = now;
  } else if (hoursUntilStart <= 24) {
    booking.confirmations.t24 = now;
  }

  booking.status = 'confirmed';
  booking.confirmedAt = now;
  await booking.save();

  return booking;
}

export async function checkInAssignment(
  driverId: string,
  bookingId: string,
  code: string,
  lat: number,
  lng: number
): Promise<any> {
  const booking = await Booking.findOne({
    _id: bookingId,
    driver: driverId,
  }).populate({
    path: 'assignment',
    populate: { path: 'location' },
  });

  if (!booking) {
    throw Object.assign(new Error('Booking not found'), { statusCode: 404 });
  }

  if (booking.status !== 'confirmed') {
    throw Object.assign(new Error('Must confirm before checking in'), { statusCode: 400 });
  }

  const assignment = booking.assignment as any;
  const location = assignment.location;

  // Verify check-in code
  if (assignment.checkinCode !== code) {
    throw Object.assign(new Error('Invalid check-in code'), { statusCode: 400 });
  }

  // Verify GPS proximity
  if (!isWithinRadius(lat, lng, location.coordinates.lat, location.coordinates.lng, location.checkinRadiusMeters)) {
    throw Object.assign(new Error('You are not within the check-in radius of the location'), { statusCode: 400 });
  }

  booking.status = 'checked_in';
  booking.checkedInAt = new Date();
  await booking.save();

  // Auto-complete and award score bonus
  booking.status = 'completed';
  booking.completedAt = new Date();
  await booking.save();

  await applyCompletedBonus(driverId, booking._id.toString());

  return booking;
}

export async function cancelAssignment(driverId: string, bookingId: string): Promise<any> {
  const booking = await Booking.findOne({
    _id: bookingId,
    driver: driverId,
  }).populate('assignment');

  if (!booking) {
    throw Object.assign(new Error('Booking not found'), { statusCode: 404 });
  }

  if (!['reserved', 'confirmed'].includes(booking.status)) {
    throw Object.assign(new Error('Cannot cancel this booking'), { statusCode: 400 });
  }

  const assignment = booking.assignment as any;
  const hoursUntilStart = (new Date(assignment.startTime).getTime() - Date.now()) / (1000 * 60 * 60);

  booking.status = 'cancelled';
  booking.cancelledAt = new Date();

  if (hoursUntilStart >= 24) {
    // On-time cancellation — no penalty
    booking.cancellationType = 'on_time';
  } else {
    // Late cancellation — score penalty
    booking.cancellationType = 'late';
    await applyLateCancelPenalty(driverId, booking._id.toString());
  }

  await booking.save();
  return booking;
}

// Cron job: auto-withdraw unconfirmed bookings at T-6h
export async function withdrawUnconfirmedBookings(): Promise<number> {
  const sixHoursFromNow = new Date(Date.now() + AUTO_WITHDRAW_HOURS * 60 * 60 * 1000);

  // Find assignments starting within 6 hours
  const urgentAssignments = await Assignment.find({
    isActive: true,
    startTime: { $lte: sixHoursFromNow, $gt: new Date() },
  });

  let withdrawnCount = 0;

  for (const assignment of urgentAssignments) {
    // Find bookings that are still only 'reserved' (never confirmed)
    const unconfirmed = await Booking.find({
      assignment: assignment._id,
      status: 'reserved',
    });

    for (const booking of unconfirmed) {
      booking.status = 'withdrawn';
      await booking.save();
      withdrawnCount++;
    }
  }

  return withdrawnCount;
}

// Cron job: mark no-shows after assignment ends
export async function markNoShows(): Promise<number> {
  const now = new Date();

  // Find past assignments
  const pastAssignments = await Assignment.find({
    isActive: true,
    startTime: { $lt: new Date(now.getTime() - 2 * 60 * 60 * 1000) }, // 2 hours after start
  });

  let noShowCount = 0;

  for (const assignment of pastAssignments) {
    // Find confirmed but not checked-in bookings
    const noShows = await Booking.find({
      assignment: assignment._id,
      status: 'confirmed',
    });

    for (const booking of noShows) {
      booking.status = 'no_show';
      await booking.save();
      await applyNoShowPenalty(booking.driver.toString(), booking._id.toString());
      noShowCount++;
    }
  }

  return noShowCount;
}

// Admin: create assignment
export async function createAssignment(data: {
  locationId: string;
  date: string;
  timeSlot: string;
  requiredDrivers: number;
  compensation: number;
  createdBy: string;
}): Promise<any> {
  const location = await Location.findById(data.locationId);
  if (!location) {
    throw Object.assign(new Error('Location not found'), { statusCode: 404 });
  }

  // Calculate overbooking
  const overbookingSlots = Math.ceil(data.requiredDrivers * (location.overbookingPercent / 100));
  const maxDrivers = data.requiredDrivers + overbookingSlots;

  // Calculate start time based on timeSlot
  const date = new Date(data.date);
  const startHours: Record<string, number> = { morning: 8, midday: 13, evening: 18 };
  const startTime = new Date(date);
  startTime.setHours(startHours[data.timeSlot] || 8, 0, 0, 0);

  // Generate random 6-digit check-in code
  const checkinCode = Math.floor(100000 + Math.random() * 900000).toString();

  const assignment = await Assignment.create({
    location: data.locationId,
    date,
    timeSlot: data.timeSlot,
    requiredDrivers: data.requiredDrivers,
    maxDrivers,
    compensation: data.compensation,
    checkinCode,
    startTime,
    createdBy: data.createdBy,
  });

  return assignment;
}

// Admin: get single assignment with full booking breakdown
export async function getAssignmentById(assignmentId: string): Promise<any> {
  const assignment = await Assignment.findById(assignmentId).populate('location');
  if (!assignment) {
    throw Object.assign(new Error('Assignment not found'), { statusCode: 404 });
  }
  const bookings = await Booking.find({ assignment: assignmentId })
    .populate('driver', 'name email phone currentScore');
  return { ...assignment.toObject(), bookings };
}

// Admin: update assignment fields
export async function updateAssignment(
  assignmentId: string,
  data: Partial<{ requiredDrivers: number; compensation: number; checkinCode: string; date: string; timeSlot: string }>
): Promise<any> {
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    throw Object.assign(new Error('Assignment not found'), { statusCode: 404 });
  }

  if (data.requiredDrivers !== undefined) {
    const location = await Location.findById(assignment.location);
    const overbookingSlots = Math.ceil(data.requiredDrivers * ((location?.overbookingPercent ?? 5) / 100));
    assignment.requiredDrivers = data.requiredDrivers;
    assignment.maxDrivers = data.requiredDrivers + overbookingSlots;
  }
  if (data.compensation !== undefined) assignment.compensation = data.compensation;
  if (data.checkinCode !== undefined) assignment.checkinCode = data.checkinCode;
  if (data.timeSlot !== undefined) {
    assignment.timeSlot = data.timeSlot as any;
    const startHours: Record<string, number> = { morning: 8, midday: 13, evening: 18 };
    const startTime = new Date(assignment.date);
    startTime.setHours(startHours[data.timeSlot] || 8, 0, 0, 0);
    assignment.startTime = startTime;
  }

  await assignment.save();
  return assignment.populate('location');
}

// Admin: delete assignment (only if no active bookings)
export async function deleteAssignment(assignmentId: string): Promise<void> {
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    throw Object.assign(new Error('Assignment not found'), { statusCode: 404 });
  }
  const activeBookings = await Booking.countDocuments({
    assignment: assignmentId,
    status: { $in: ['reserved', 'confirmed', 'checked_in'] },
  });
  if (activeBookings > 0) {
    throw Object.assign(
      new Error(`Cannot delete: ${activeBookings} active booking(s) exist. Deactivate instead.`),
      { statusCode: 409 }
    );
  }
  await Booking.deleteMany({ assignment: assignmentId });
  await Assignment.findByIdAndDelete(assignmentId);
}

// Admin: toggle isActive
export async function toggleAssignmentActive(assignmentId: string, isActive: boolean): Promise<any> {
  const assignment = await Assignment.findByIdAndUpdate(
    assignmentId,
    { isActive },
    { new: true }
  ).populate('location');
  if (!assignment) {
    throw Object.assign(new Error('Assignment not found'), { statusCode: 404 });
  }
  return assignment;
}

// Admin: list all assignments with booking counts
export async function listAssignments(filters?: {
  date?: string;
  locationId?: string;
  city?: string;
}): Promise<any[]> {
  const query: any = {};
  if (filters?.date) {
    const d = new Date(filters.date);
    const nextDay = new Date(d);
    nextDay.setDate(nextDay.getDate() + 1);
    query.date = { $gte: d, $lt: nextDay };
  }
  if (filters?.locationId) query.location = filters.locationId;

  let assignments = await Assignment.find(query)
    .populate('location')
    .sort({ date: 1, timeSlot: 1 });

  if (filters?.city) {
    assignments = assignments.filter((a: any) => a.location?.city === filters.city);
  }

  // Attach booking stats
  const results = [];
  for (const assignment of assignments) {
    const bookings = await Booking.find({ assignment: assignment._id });
    const reserved = bookings.filter((b) => b.status === 'reserved').length;
    const confirmed = bookings.filter((b) => b.status === 'confirmed').length;
    const checkedIn = bookings.filter((b) => ['checked_in', 'completed'].includes(b.status)).length;
    const cancelled = bookings.filter((b) => b.status === 'cancelled').length;
    const noShows = bookings.filter((b) => b.status === 'no_show').length;

    results.push({
      ...assignment.toObject(),
      stats: { reserved, confirmed, checkedIn, cancelled, noShows, total: bookings.length },
    });
  }

  return results;
}
