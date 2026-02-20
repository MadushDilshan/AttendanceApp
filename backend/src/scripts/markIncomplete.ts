/**
 * Cron job: runs at 00:05 UTC daily.
 * Finds all AttendanceRecords with status 'open' from previous days
 * and marks them as 'incomplete'.
 */
import cron from 'node-cron';
import { AttendanceRecord } from '../models/AttendanceRecord';
import { todayUTC } from '../utils/dateUtils';

export function registerMarkIncompleteJob(): void {
  // Runs at 00:05 UTC every day
  cron.schedule('5 0 * * *', async () => {
    const today = todayUTC();
    try {
      const result = await AttendanceRecord.updateMany(
        { status: 'open', date: { $lt: today } },
        { $set: { status: 'incomplete' } }
      );
      if (result.modifiedCount > 0) {
        console.warn(
          JSON.stringify({
            level: 'info',
            event: 'mark_incomplete_cron',
            updatedCount: result.modifiedCount,
            timestamp: new Date().toISOString(),
          })
        );
      }
    } catch (err) {
      console.error('markIncomplete cron error:', err);
    }
  });
}
