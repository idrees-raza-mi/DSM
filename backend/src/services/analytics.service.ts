import User from '../models/User.model';
import Booking from '../models/Booking.model';
import Assignment from '../models/Assignment.model';
import Invoice from '../models/Invoice.model';
import Location from '../models/Location.model';

export async function getOverview(): Promise<any> {
  const totalDrivers = await User.countDocuments({ role: 'driver' });
  const activeDrivers = await User.countDocuments({ role: 'driver', status: 'active' });
  const pendingDrivers = await User.countDocuments({ role: 'driver', status: 'under_review' });
  const restrictedDrivers = await User.countDocuments({ role: 'driver', status: 'restricted' });
  const blockedDrivers = await User.countDocuments({ role: 'driver', status: 'blocked' });

  const totalAssignments = await Assignment.countDocuments({ isActive: true });
  const totalBookings = await Booking.countDocuments();
  const completedBookings = await Booking.countDocuments({ status: 'completed' });
  const noShows = await Booking.countDocuments({ status: 'no_show' });
  const cancellations = await Booking.countDocuments({ status: 'cancelled' });

  const noShowRate = totalBookings > 0 ? ((noShows / totalBookings) * 100).toFixed(1) : '0';
  const cancellationRate = totalBookings > 0 ? ((cancellations / totalBookings) * 100).toFixed(1) : '0';
  const completionRate = totalBookings > 0 ? ((completedBookings / totalBookings) * 100).toFixed(1) : '0';

  // Top 5 drivers by score
  const topDrivers = await User.find({ role: 'driver', status: 'active' })
    .sort({ currentScore: -1 })
    .limit(5)
    .select('name email currentScore');

  // Problem drivers (score < 70)
  const problemDrivers = await User.find({ role: 'driver', currentScore: { $lt: 70 } })
    .sort({ currentScore: 1 })
    .limit(10)
    .select('name email currentScore status');

  return {
    drivers: { total: totalDrivers, active: activeDrivers, pending: pendingDrivers, restricted: restrictedDrivers, blocked: blockedDrivers },
    bookings: { total: totalBookings, completed: completedBookings, noShows, cancellations },
    rates: { noShowRate: parseFloat(noShowRate), cancellationRate: parseFloat(cancellationRate), completionRate: parseFloat(completionRate) },
    assignments: { total: totalAssignments },
    topDrivers,
    problemDrivers,
  };
}

export async function getNoShowAnalytics(): Promise<any> {
  const noShowBookings = await Booking.find({ status: 'no_show' })
    .populate('driver', 'name email currentScore')
    .populate({
      path: 'assignment',
      populate: { path: 'location', select: 'name city' },
    })
    .sort({ updatedAt: -1 })
    .limit(100);

  // Aggregate no-shows per driver
  const driverNoShows = await Booking.aggregate([
    { $match: { status: 'no_show' } },
    { $group: { _id: '$driver', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 20 },
  ]);

  const driverIds = driverNoShows.map((d) => d._id);
  const drivers = await User.find({ _id: { $in: driverIds } }).select('name email currentScore');
  const driverMap = new Map(drivers.map((d) => [d._id.toString(), d]));

  const topNoShowDrivers = driverNoShows.map((d) => ({
    driver: driverMap.get(d._id.toString()),
    noShowCount: d.count,
  }));

  return { recent: noShowBookings, topNoShowDrivers };
}

export async function getCancellationAnalytics(): Promise<any> {
  const cancellations = await Booking.find({ status: 'cancelled' })
    .populate('driver', 'name email currentScore')
    .populate({
      path: 'assignment',
      populate: { path: 'location', select: 'name city' },
    })
    .sort({ cancelledAt: -1 })
    .limit(100);

  const lateCancellations = cancellations.filter((b) => b.cancellationType === 'late');
  const onTimeCancellations = cancellations.filter((b) => b.cancellationType === 'on_time');

  return {
    total: cancellations.length,
    late: lateCancellations.length,
    onTime: onTimeCancellations.length,
    recent: cancellations,
  };
}

export async function getLocationAnalytics(): Promise<any> {
  const locations = await Location.find({ isActive: true });

  const results = [];
  for (const location of locations) {
    const assignments = await Assignment.find({ location: location._id, isActive: true });
    const assignmentIds = assignments.map((a) => a._id);

    const totalBookings = await Booking.countDocuments({ assignment: { $in: assignmentIds } });
    const completed = await Booking.countDocuments({ assignment: { $in: assignmentIds }, status: 'completed' });
    const noShows = await Booking.countDocuments({ assignment: { $in: assignmentIds }, status: 'no_show' });

    const totalCapacity = assignments.reduce((sum, a) => sum + a.requiredDrivers, 0);

    results.push({
      location: { id: location._id, name: location.name, city: location.city },
      totalAssignments: assignments.length,
      totalCapacity,
      totalBookings,
      completed,
      noShows,
      fillRate: totalCapacity > 0 ? parseFloat(((totalBookings / totalCapacity) * 100).toFixed(1)) : 0,
    });
  }

  return results;
}

export async function getBillingAnalytics(): Promise<any> {
  const totalInvoices = await Invoice.countDocuments();
  const pendingInvoices = await Invoice.countDocuments({ status: 'submitted' });
  const approvedInvoices = await Invoice.countDocuments({ status: 'approved' });
  const rejectedInvoices = await Invoice.countDocuments({ status: 'rejected' });
  const paidInvoices = await Invoice.countDocuments({ status: 'paid' });

  const totalApprovedAmount = await Invoice.aggregate([
    { $match: { status: { $in: ['approved', 'paid'] } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  const totalPendingAmount = await Invoice.aggregate([
    { $match: { status: 'submitted' } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  return {
    total: totalInvoices,
    pending: pendingInvoices,
    approved: approvedInvoices,
    rejected: rejectedInvoices,
    paid: paidInvoices,
    totalApprovedAmount: totalApprovedAmount[0]?.total || 0,
    totalPendingAmount: totalPendingAmount[0]?.total || 0,
  };
}
