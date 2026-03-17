import mongoose, { Schema, Document } from 'mongoose';
import { INVOICE_STATUSES } from '../utils/constants';

export interface IInvoice extends Document {
  driver: mongoose.Types.ObjectId;
  billingPeriod: mongoose.Types.ObjectId;
  fileUrl: string;
  amount: number;
  status: typeof INVOICE_STATUSES[number];
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  rejectionReason?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceSchema = new Schema<IInvoice>(
  {
    driver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    billingPeriod: { type: Schema.Types.ObjectId, ref: 'BillingPeriod', required: true },
    fileUrl: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: INVOICE_STATUSES, default: 'submitted' },
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

invoiceSchema.index({ driver: 1, status: 1 });
invoiceSchema.index({ billingPeriod: 1 });

export default mongoose.model<IInvoice>('Invoice', invoiceSchema);
