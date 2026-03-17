import mongoose, { Schema, Document } from 'mongoose';

export interface ILocation extends Document {
  name: string;
  city: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  checkinRadiusMeters: number;
  overbookingPercent: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const locationSchema = new Schema<ILocation>(
  {
    name: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    checkinRadiusMeters: { type: Number, default: 500 },
    overbookingPercent: { type: Number, default: 5 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

locationSchema.index({ city: 1 });

export default mongoose.model<ILocation>('Location', locationSchema);
