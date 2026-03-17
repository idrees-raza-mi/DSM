import mongoose, { Schema, Document } from 'mongoose';
import { BOOKING_STATUSES } from '../utils/constants';

export interface IBooking extends Document {
  driver: mongoose.Types.ObjectId;
  assignment: mongoose.Types.ObjectId;
  status: typeof BOOKING_STATUSES[number];
  reservedAt: Date;
  confirmedAt?: Date;
  checkedInAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancellationType?: 'on_time' | 'late' | null;
  isSubstitute: boolean; // true if driver was bumped to substitute due to overbooking
  confirmations: {
    t24?: Date;
    t12?: Date;
    t6?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    driver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignment: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
    status: { type: String, enum: BOOKING_STATUSES, default: 'reserved' },
    reservedAt: { type: Date, default: Date.now },
    confirmedAt: { type: Date },
    checkedInAt: { type: Date },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
    cancellationType: { type: String, enum: ['on_time', 'late', null], default: null },
    isSubstitute: { type: Boolean, default: false },
    confirmations: {
      t24: { type: Date },
      t12: { type: Date },
      t6: { type: Date },
    },
  },
  { timestamps: true }
);

bookingSchema.index({ driver: 1, status: 1 });
bookingSchema.index({ assignment: 1, status: 1 });
bookingSchema.index({ driver: 1, assignment: 1 }, { unique: true });

export default mongoose.model<IBooking>('Booking', bookingSchema);
