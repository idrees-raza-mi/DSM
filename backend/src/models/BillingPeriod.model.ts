import mongoose, { Schema, Document } from 'mongoose';

export interface IBillingPeriod extends Document {
  driver: mongoose.Types.ObjectId;
  month: number; // 1-12
  year: number;
  totalMissions: number;
  totalAmount: number;
  missions: {
    booking: mongoose.Types.ObjectId;
    date: Date;
    location: string;
    timeSlot: string;
    compensation: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const billingPeriodSchema = new Schema<IBillingPeriod>(
  {
    driver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    totalMissions: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    missions: [
      {
        booking: { type: Schema.Types.ObjectId, ref: 'Booking' },
        date: { type: Date },
        location: { type: String },
        timeSlot: { type: String },
        compensation: { type: Number },
      },
    ],
  },
  { timestamps: true }
);

billingPeriodSchema.index({ driver: 1, year: 1, month: 1 }, { unique: true });

export default mongoose.model<IBillingPeriod>('BillingPeriod', billingPeriodSchema);
