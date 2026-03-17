import mongoose, { Schema, Document as MongoDoc } from 'mongoose';
import { DOCUMENT_TYPES } from '../utils/constants';

export interface IDocument extends MongoDoc {
  driver: mongoose.Types.ObjectId;
  type: typeof DOCUMENT_TYPES[number];
  fileUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewNote?: string;
  uploadedAt: Date;
  reviewedAt?: Date;
}

const documentSchema = new Schema<IDocument>(
  {
    driver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: DOCUMENT_TYPES, required: true },
    fileUrl: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    reviewNote: { type: String },
    uploadedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

documentSchema.index({ driver: 1, type: 1 });

export default mongoose.model<IDocument>('Document', documentSchema);
