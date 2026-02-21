import mongoose from 'mongoose';
import { AttendanceRecord, IAttendanceRecord } from '../models/AttendanceRecord';
import { Employee } from '../models/Employee';
import { PaySheet, IPaysheetEntry } from '../models/PaySheet';
import {
  setTimeOnDate,
  roundToHalfHour,
  msToHours,
  maxDate,
  minDate,
} from '../utils/dateUtils';

// Pay rate constants — change here and in app_config.dart together
export const PAY_RATES = {
  REGULAR_DAY_RATE: 1000,        // Rs per day (reference rate)
  REGULAR_EFFECTIVE_HOURS: 9,   // 08:00–17:00 = 9 hours
  OVERTIME_RATE: 160,             // Rs per hour
  REGULAR_START_HOUR: 8,         // 08:00 Sri Lanka time
  REGULAR_END_HOUR: 17,          // 17:00 Sri Lanka time (5 PM)
  OT_ROUNDING_MINS: 30,
} as const;

export interface PayCalculationResult {
  regularHours: number;
  overtimeHoursMorning: number;
  overtimeHoursEvening: number;
  regularPay: number;
  overtimePay: number;
  totalPay: number;
}

/**
 * Calculate pay for a single attendance record.
 * Converts to Sri Lanka time (UTC+5:30) for regular hours calculation.
 */
export function calculatePay(checkInAt: Date, checkOutAt: Date): PayCalculationResult {
  // Convert to Sri Lanka time (UTC+5:30 = +330 minutes)
  const SRI_LANKA_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const checkInLocal = new Date(checkInAt.getTime() + SRI_LANKA_OFFSET_MS);
  const checkOutLocal = new Date(checkOutAt.getTime() + SRI_LANKA_OFFSET_MS);

  const regularStart = setTimeOnDate(checkInLocal, PAY_RATES.REGULAR_START_HOUR, 0);
  const regularEnd = setTimeOnDate(checkInLocal, PAY_RATES.REGULAR_END_HOUR, 0);

  // Regular hours: overlap of [checkIn, checkOut] with [08:00, 17:00] in local time
  const regularOverlapStart = maxDate(checkInLocal, regularStart);
  const regularOverlapEnd = minDate(checkOutLocal, regularEnd);
  const regularMs = Math.max(0, regularOverlapEnd.getTime() - regularOverlapStart.getTime());
  const regularHours = msToHours(regularMs);

  // Morning overtime: time before 08:00 local time
  const morningEnd = minDate(checkOutLocal, regularStart);
  const morningMs = Math.max(0, morningEnd.getTime() - checkInLocal.getTime());
  const morningHoursRaw = msToHours(morningMs);

  // Evening overtime: time after 17:00 local time
  const eveningStart = maxDate(checkInLocal, regularEnd);
  const eveningMs = Math.max(0, checkOutLocal.getTime() - eveningStart.getTime());
  const eveningHoursRaw = msToHours(eveningMs);

  // Round overtime to nearest 30 min
  const totalOTMinutes = roundToHalfHour((morningHoursRaw + eveningHoursRaw) * 60);
  const totalOTHours = totalOTMinutes / 60;

  // Distribute rounding across morning + evening proportionally
  const totalRawOT = morningHoursRaw + eveningHoursRaw;
  const morningRatio = totalRawOT > 0 ? morningHoursRaw / totalRawOT : 0;
  const overtimeHoursMorning = Math.round(totalOTHours * morningRatio * 2) / 2;
  const overtimeHoursEvening = Math.round((totalOTHours - overtimeHoursMorning) * 2) / 2;

  // Round regular hours to nearest 30 min (same as overtime)
  const regularHoursRounded = roundToHalfHour(regularHours * 60) / 60;

  // Regular pay: proportional — Rs 111.11/hr (1,000 ÷ 9 hours)
  const regularHourlyRate = PAY_RATES.REGULAR_DAY_RATE / PAY_RATES.REGULAR_EFFECTIVE_HOURS;
  const regularPay = Math.round(regularHoursRounded * regularHourlyRate * 100) / 100;
  const overtimePay = Math.round(totalOTHours * PAY_RATES.OVERTIME_RATE * 100) / 100;

  return {
    regularHours: regularHoursRounded,
    overtimeHoursMorning,
    overtimeHoursEvening,
    regularPay,
    overtimePay,
    totalPay: regularPay + overtimePay,
  };
}

export interface GeneratePaysheetParams {
  periodStart: string;  // YYYY-MM-DD
  periodEnd: string;    // YYYY-MM-DD
  employeeIds: string[]; // empty = all employees
  generatedBy: string;
}

/**
 * Generate a paysheet document for the given employees and date range.
 */
export async function generatePaysheet(params: GeneratePaysheetParams) {
  const { periodStart, periodEnd, generatedBy } = params;

  // Resolve employee IDs
  let resolvedIds: mongoose.Types.ObjectId[];
  if (params.employeeIds.length === 0) {
    const employees = await Employee.find({ role: 'employee', status: 'active' }).select('_id');
    resolvedIds = employees.map(e => e._id);
  } else {
    resolvedIds = params.employeeIds.map(id => new mongoose.Types.ObjectId(id));
  }

  // Fetch all records in the date range
  const records = await AttendanceRecord.find({
    employeeId: { $in: resolvedIds },
    date: { $gte: periodStart, $lte: periodEnd },
  }).populate<{ employeeId: { name: string; _id: mongoose.Types.ObjectId } }>('employeeId', 'name');

  const entries: IPaysheetEntry[] = [];
  let totalRegularPay = 0;
  let totalOvertimePay = 0;
  let skippedDays = 0;

  for (const record of records) {
    const populated = record as unknown as IAttendanceRecord & {
      employeeId: { _id: mongoose.Types.ObjectId; name: string };
    };

    if (record.status !== 'closed' || !record.checkOutAt) {
      entries.push({
        employeeId: populated.employeeId._id,
        employeeName: populated.employeeId.name,
        date: record.date,
        checkInAt: record.checkInAt,
        checkOutAt: record.checkOutAt ?? record.checkInAt,
        regularHours: 0,
        overtimeHoursMorning: 0,
        overtimeHoursEvening: 0,
        regularPay: 0,
        overtimePay: 0,
        totalPay: 0,
        isManuallyAdjusted: record.isManuallyAdjusted,
        recordStatus: 'skipped_incomplete',
      });
      skippedDays++;
      continue;
    }

    const pay = calculatePay(record.checkInAt, record.checkOutAt);
    totalRegularPay += pay.regularPay;
    totalOvertimePay += pay.overtimePay;

    entries.push({
      employeeId: populated.employeeId._id,
      employeeName: populated.employeeId.name,
      date: record.date,
      checkInAt: record.checkInAt,
      checkOutAt: record.checkOutAt,
      regularHours: pay.regularHours,
      overtimeHoursMorning: pay.overtimeHoursMorning,
      overtimeHoursEvening: pay.overtimeHoursEvening,
      regularPay: pay.regularPay,
      overtimePay: pay.overtimePay,
      totalPay: pay.totalPay,
      isManuallyAdjusted: record.isManuallyAdjusted,
      recordStatus: 'included',
    });
  }

  const paysheet = await PaySheet.create({
    generatedBy: new mongoose.Types.ObjectId(generatedBy),
    generatedAt: new Date(),
    periodStart,
    periodEnd,
    employeeIds: resolvedIds,
    entries,
    totals: {
      totalRegularPay,
      totalOvertimePay,
      totalPayable: totalRegularPay + totalOvertimePay,
      skippedDays,
    },
    status: 'draft',
  });

  return paysheet;
}

