import mongoose from 'mongoose';
import { AttendanceRecord, IAttendanceRecord } from '../models/AttendanceRecord';
import { lookupWorkplaceByQrToken } from './geofence.service';
import { calculatePay } from './payroll.service';
import { createError } from '../middleware/errorHandler';
import { todayUTC } from '../utils/dateUtils';

export interface CheckInParams {
  employeeId: string;
  qrToken: string;
  deviceTimestamp: string;
  location: { lat: number; lng: number };
}

export interface CheckOutParams {
  employeeId: string;
  qrToken: string;
  deviceTimestamp: string;
  location: { lat: number; lng: number };
}

/**
 * Record an employee check-in.
 * - Validates QR token against DB
 * - Prevents duplicate check-ins for the same day
 * - Uses server timestamp (not device clock)
 */
export async function checkIn(params: CheckInParams): Promise<IAttendanceRecord> {
  const workplace = await lookupWorkplaceByQrToken(params.qrToken);
  const today = todayUTC();
  const serverTimestamp = new Date();

  const existing = await AttendanceRecord.findOne({
    employeeId: params.employeeId,
    date: today,
  });

  if (existing) {
    throw createError(
      409,
      'ALREADY_CHECKED_IN',
      'You have already checked in today. Check out first before checking in again.'
    );
  }

  const record = await AttendanceRecord.create({
    employeeId: new mongoose.Types.ObjectId(params.employeeId),
    workplaceId: workplace._id,
    date: today,
    checkInAt: serverTimestamp,
    deviceCheckInAt: new Date(params.deviceTimestamp),
    checkInLocation: params.location,
    status: 'open',
  });

  return record;
}

/**
 * Record an employee check-out.
 * Closes the open record and calculates pay.
 */
export async function checkOut(params: CheckOutParams): Promise<{
  record: IAttendanceRecord;
  summary: {
    totalHours: number;
    regularHours: number;
    overtimeHoursMorning: number;
    overtimeHoursEvening: number;
    regularPay: number;
    overtimePay: number;
    totalPay: number;
  };
}> {
  await lookupWorkplaceByQrToken(params.qrToken);
  const today = todayUTC();
  const serverTimestamp = new Date();

  const record = await AttendanceRecord.findOne({
    employeeId: params.employeeId,
    date: today,
    status: 'open',
  });

  if (!record) {
    throw createError(
      400,
      'NO_OPEN_CHECKIN',
      'No open check-in found for today. Please check in first.'
    );
  }

  const pay = calculatePay(record.checkInAt, serverTimestamp);

  record.checkOutAt = serverTimestamp;
  record.deviceCheckOutAt = new Date(params.deviceTimestamp);
  record.status = 'closed';
  record.regularHours = pay.regularHours;
  record.overtimeHoursMorning = pay.overtimeHoursMorning;
  record.overtimeHoursEvening = pay.overtimeHoursEvening;
  await record.save();

  const totalHours =
    (serverTimestamp.getTime() - record.checkInAt.getTime()) / (1000 * 60 * 60);

  return {
    record,
    summary: {
      totalHours: Math.round(totalHours * 100) / 100,
      regularHours: pay.regularHours,
      overtimeHoursMorning: pay.overtimeHoursMorning,
      overtimeHoursEvening: pay.overtimeHoursEvening,
      regularPay: pay.regularPay,
      overtimePay: pay.overtimePay,
      totalPay: pay.totalPay,
    },
  };
}

/**
 * Bulk sync offline events (called by mobile when reconnecting).
 */
export async function syncEvents(
  employeeId: string,
  events: Array<{
    localId: string;
    type: 'checkin' | 'checkout';
    qrToken: string;
    deviceTimestamp: string;
    location: { lat: number; lng: number };
  }>
): Promise<Array<{ localId: string; status: 'synced' | 'conflict' | 'error'; message: string }>> {
  const results = [];

  for (const event of events) {
    try {
      if (event.type === 'checkin') {
        await checkIn({ employeeId, ...event });
      } else {
        await checkOut({ employeeId, ...event });
      }
      results.push({ localId: event.localId, status: 'synced' as const, message: 'OK' });
    } catch (err: unknown) {
      const appErr = err as { code?: string; message?: string };
      const isConflict = appErr.code === 'ALREADY_CHECKED_IN' || appErr.code === 'NO_OPEN_CHECKIN';
      results.push({
        localId: event.localId,
        status: isConflict ? ('conflict' as const) : ('error' as const),
        message: appErr.message ?? 'Unknown error',
      });
    }
  }

  return results;
}

/**
 * Get today's attendance record for an employee (or null).
 */
export async function getTodayRecord(employeeId: string): Promise<IAttendanceRecord | null> {
  return AttendanceRecord.findOne({ employeeId, date: todayUTC() });
}

/**
 * Admin: query attendance records with filters.
 */
export async function queryRecords(params: {
  employeeId?: string;
  startDate: string;
  endDate: string;
  status?: string;
}) {
  const filter: Record<string, unknown> = {
    date: { $gte: params.startDate, $lte: params.endDate },
  };
  if (params.employeeId) filter.employeeId = new mongoose.Types.ObjectId(params.employeeId);
  if (params.status) filter.status = params.status;

  return AttendanceRecord.find(filter).populate('employeeId', 'name email').sort({ date: -1 });
}

/**
 * Admin: manually close an incomplete attendance record.
 */
export async function adminCloseRecord(
  recordId: string,
  checkOutAt: Date,
  adjustmentNote: string,
  adminId: string
): Promise<IAttendanceRecord> {
  const record = await AttendanceRecord.findById(recordId);
  if (!record) throw createError(404, 'NOT_FOUND', 'Attendance record not found');
  if (record.status === 'closed') {
    throw createError(400, 'ALREADY_CLOSED', 'This record is already closed');
  }

  const pay = calculatePay(record.checkInAt, checkOutAt);

  record.checkOutAt = checkOutAt;
  record.status = 'closed';
  record.regularHours = pay.regularHours;
  record.overtimeHoursMorning = pay.overtimeHoursMorning;
  record.overtimeHoursEvening = pay.overtimeHoursEvening;
  record.isManuallyAdjusted = true;
  record.adjustmentNote = adjustmentNote;
  record.adjustedBy = new mongoose.Types.ObjectId(adminId);
  record.adjustedAt = new Date();
  await record.save();

  return record;
}
