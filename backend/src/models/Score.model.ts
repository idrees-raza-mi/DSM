import mongoose, { Schema, Document } from 'mongoose';

export interface IScore extends Document {
  driver: mongoose.Types.ObjectId;
  booking?: mongoose.Types.ObjectId;
  reason: 'no_show' | 'late_cancel' | 'completed' | 'admin_adjustment';
  delta: number; // +2, -10, -20, etc.
  scoreBefore: number;
  scoreAfter: number;
  note?: string;
  createdAt: Date;
}

const scoreSchema = new Schema<IScore>(
  {
    driver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    booking: { type: Schema.Types.ObjectId, ref: 'Booking' },
    reason: {
      type: String,
      enum: ['no_show', 'late_cancel', 'completed', 'admin_adjustment'],
      required: true,
    },
    delta: { type: Number, required: true },
    scoreBefore: { type: Number, required: true },
    scoreAfter: { type: Number, required: true },
    note: { type: String },
  },
  { timestamps: true }
);

scoreSchema.index({ driver: 1, createdAt: -1 });

export default mongoose.model<IScore>('Score', scoreSchema);
