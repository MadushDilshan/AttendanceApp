import mongoose, { Document, Schema } from 'mongoose';

export type AttendanceStatus = 'open' | 'closed' | 'incomplete';

export interface IAttendanceRecord extends Document {
  _id: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  workplaceId: mongoose.Types.ObjectId;
  date: string; // 'YYYY-MM-DD' — the check-in date in UTC
  checkInAt: Date;
  checkOutAt: Date | null;
  status: AttendanceStatus;
  regularHours: number | null;
  overtimeHoursMorning: number | null;
  overtimeHoursEvening: number | null;
  isManuallyAdjusted: boolean;
  adjustmentNote: string | null;
  adjustedBy: mongoose.Types.ObjectId | null;
  adjustedAt: Date | null;
  deviceCheckInAt: Date;
  deviceCheckOutAt: Date | null;
  checkInLocation: { lat: number; lng: number };
  createdAt: Date;
  updatedAt: Date;
}

const attendanceRecordSchema = new Schema<IAttendanceRecord>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    workplaceId: { type: Schema.Types.ObjectId, ref: 'Workplace', required: true },
    date: { type: String, required: true },
    checkInAt: { type: Date, required: true },
    checkOutAt: { type: Date, default: null },
    status: { type: String, enum: ['open', 'closed', 'incomplete'], default: 'open' },
    regularHours: { type: Number, default: null },
    overtimeHoursMorning: { type: Number, default: null },
    overtimeHoursEvening: { type: Number, default: null },
    isManuallyAdjusted: { type: Boolean, default: false },
    adjustmentNote: { type: String, default: null },
    adjustedBy: { type: Schema.Types.ObjectId, ref: 'Employee', default: null },
    adjustedAt: { type: Date, default: null },
    deviceCheckInAt: { type: Date, required: true },
    deviceCheckOutAt: { type: Date, default: null },
    checkInLocation: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
  },
  { timestamps: true }
);

// One record per employee per day
attendanceRecordSchema.index({ employeeId: 1, date: 1 }, { unique: true });
attendanceRecordSchema.index({ date: 1, workplaceId: 1 });
attendanceRecordSchema.index({ status: 1, date: 1 });

export const AttendanceRecord = mongoose.model<IAttendanceRecord>(
  'AttendanceRecord',
  attendanceRecordSchema
);
