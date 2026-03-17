import mongoose, { Schema, Document } from 'mongoose';
import { TIME_SLOTS } from '../utils/constants';

export interface IAssignment extends Document {
  location: mongoose.Types.ObjectId;
  date: Date;
  timeSlot: 'morning' | 'midday' | 'evening';
  requiredDrivers: number;
  maxDrivers: number; // requiredDrivers + overbooking
  compensation: number; // pay per driver for this slot
  checkinCode: string;
  startTime: Date; // actual datetime for the slot start
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const assignmentSchema = new Schema<IAssignment>(
  {
    location: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
    date: { type: Date, required: true },
    timeSlot: { type: String, enum: TIME_SLOTS, required: true },
    requiredDrivers: { type: Number, required: true, min: 1 },
    maxDrivers: { type: Number, required: true, min: 1 },
    compensation: { type: Number, required: true, min: 0 },
    checkinCode: { type: String, required: true },
    startTime: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

assignmentSchema.index({ location: 1, date: 1, timeSlot: 1 }, { unique: true });
assignmentSchema.index({ date: 1, isActive: 1 });

export default mongoose.model<IAssignment>('Assignment', assignmentSchema);
