import mongoose, { Document, Schema } from 'mongoose';

export type EmployeeRole = 'employee' | 'admin';
export type EmployeeStatus = 'active' | 'inactive';

export interface IEmployee extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: EmployeeRole;
  status: EmployeeStatus;
  workplaceId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const employeeSchema = new Schema<IEmployee>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'],
    },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['employee', 'admin'], required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    workplaceId: { type: Schema.Types.ObjectId, ref: 'Workplace' },
  },
  { timestamps: true }
);

employeeSchema.index({ workplaceId: 1, status: 1 });

// Never return passwordHash in JSON responses
employeeSchema.set('toJSON', {
  transform(_doc, ret) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (ret as any).passwordHash;
    return ret;
  },
});

export const Employee = mongoose.model<IEmployee>('Employee', employeeSchema);
