import mongoose, { Document, Schema } from 'mongoose';

export interface IPaysheetEntry {
  employeeId: mongoose.Types.ObjectId;
  employeeName: string;
  date: string;
  checkInAt: Date;
  checkOutAt: Date;
  regularHours: number;
  overtimeHoursMorning: number;
  overtimeHoursEvening: number;
  regularPay: number;
  overtimePay: number;
  totalPay: number;
  isManuallyAdjusted: boolean;
  recordStatus: 'included' | 'skipped_incomplete';
}

export interface IPaySheet extends Document {
  _id: mongoose.Types.ObjectId;
  generatedBy: mongoose.Types.ObjectId;
  generatedAt: Date;
  periodStart: string;
  periodEnd: string;
  employeeIds: mongoose.Types.ObjectId[];
  entries: IPaysheetEntry[];
  totals: {
    totalRegularPay: number;
    totalOvertimePay: number;
    totalPayable: number;
    skippedDays: number;
  };
  status: 'draft' | 'processed';
  createdAt: Date;
  updatedAt: Date;
}

const paysheetEntrySchema = new Schema<IPaysheetEntry>(
  {
    employeeId: { type: Schema.Types.ObjectId, required: true },
    employeeName: { type: String, required: true },
    date: { type: String, required: true },
    checkInAt: { type: Date, required: true },
    checkOutAt: { type: Date, required: true },
    regularHours: { type: Number, required: true },
    overtimeHoursMorning: { type: Number, required: true },
    overtimeHoursEvening: { type: Number, required: true },
    regularPay: { type: Number, required: true },
    overtimePay: { type: Number, required: true },
    totalPay: { type: Number, required: true },
    isManuallyAdjusted: { type: Boolean, default: false },
    recordStatus: { type: String, enum: ['included', 'skipped_incomplete'], required: true },
  },
  { _id: false }
);

const paySheetSchema = new Schema<IPaySheet>(
  {
    generatedBy: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    generatedAt: { type: Date, required: true, default: () => new Date() },
    periodStart: { type: String, required: true },
    periodEnd: { type: String, required: true },
    employeeIds: [{ type: Schema.Types.ObjectId, ref: 'Employee' }],
    entries: [paysheetEntrySchema],
    totals: {
      totalRegularPay: { type: Number, required: true },
      totalOvertimePay: { type: Number, required: true },
      totalPayable: { type: Number, required: true },
      skippedDays: { type: Number, required: true },
    },
    status: { type: String, enum: ['draft', 'processed'], default: 'draft' },
  },
  { timestamps: true }
);

export const PaySheet = mongoose.model<IPaySheet>('PaySheet', paySheetSchema);
