import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES, DRIVER_STATUSES, SCORE_START } from '../utils/constants';

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'driver' | 'admin';
  status: 'under_review' | 'active' | 'restricted' | 'blocked';
  address?: string;
  bankDetails?: {
    bankName: string;
    accountName: string;
    iban: string;
  };
  currentScore: number;
  onboardingStep: number; // 0=registered, 1=profile done, 2=docs uploaded, 3=submitted, 4=approved
  applicationNote?: string;
  city?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: 'driver' },
    status: { type: String, enum: DRIVER_STATUSES, default: 'under_review' },
    address: { type: String, trim: true },
    bankDetails: {
      bankName: { type: String },
      accountName: { type: String },
      iban: { type: String },
    },
    currentScore: { type: Number, default: SCORE_START, min: 0, max: 100 },
    onboardingStep: { type: Number, default: 0 },
    applicationNote: { type: String },
    city: { type: String, trim: true },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

userSchema.index({ role: 1, status: 1 });
userSchema.index({ email: 1 });

export default mongoose.model<IUser>('User', userSchema);
