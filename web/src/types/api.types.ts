// API types derived from contracts/api.yaml
// Keep in sync with the OpenAPI contract

export type EmployeeRole = 'employee' | 'admin';
export type EmployeeStatus = 'active' | 'inactive';
export type AttendanceStatus = 'open' | 'closed' | 'incomplete';
export type PaysheetStatus = 'draft' | 'processed';
export type DisplayStatus = 'checked_in' | 'checked_out' | 'absent' | 'incomplete';

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: EmployeeRole;
  status: EmployeeStatus;
  workplaceId?: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkInAt: string;
  checkOutAt: string | null;
  status: AttendanceStatus;
  regularHours: number | null;
  overtimeHoursMorning: number | null;
  overtimeHoursEvening: number | null;
  isManuallyAdjusted: boolean;
  adjustmentNote: string | null;
}

export interface AttendanceOverviewItem {
  employee: Employee;
  record: AttendanceRecord | null;
  displayStatus: DisplayStatus;
}

export interface PaysheetEntry {
  employeeId: string;
  employeeName: string;
  date: string;
  checkInAt: string;
  checkOutAt: string;
  regularHours: number;
  overtimeHoursMorning: number;
  overtimeHoursEvening: number;
  regularPay: number;
  overtimePay: number;
  totalPay: number;
  isManuallyAdjusted: boolean;
  recordStatus: 'included' | 'skipped_incomplete';
}

export interface PaysheetTotals {
  totalRegularPay: number;
  totalOvertimePay: number;
  totalPayable: number;
  skippedDays: number;
}

export interface Paysheet {
  id: string;
  generatedBy: string;
  generatedAt: string;
  periodStart: string;
  periodEnd: string;
  entries: PaysheetEntry[];
  totals: PaysheetTotals;
  status: PaysheetStatus;
}

export interface Workplace {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  geofenceRadiusMetres: number;
  updatedAt: string;
}
