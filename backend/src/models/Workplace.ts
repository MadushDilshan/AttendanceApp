import mongoose, { Document, Schema } from 'mongoose';

export interface IWorkplace extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  geofenceRadiusMetres: number;
  qrCodeToken: string;
  createdAt: Date;
  updatedAt: Date;
}

const workplaceSchema = new Schema<IWorkplace>(
  {
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 100 },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: (coords: number[]) =>
            coords.length === 2 &&
            coords[0] >= -180 && coords[0] <= 180 &&
            coords[1] >= -90 && coords[1] <= 90,
          message: 'Coordinates must be [longitude, latitude] within valid range',
        },
      },
    },
    geofenceRadiusMetres: {
      type: Number,
      required: true,
      default: 100,
      min: 10,
      max: 5000,
    },
    qrCodeToken: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

workplaceSchema.index({ location: '2dsphere' });

export const Workplace = mongoose.model<IWorkplace>('Workplace', workplaceSchema);
