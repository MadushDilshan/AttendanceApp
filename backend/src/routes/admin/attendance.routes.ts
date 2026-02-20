import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate';
import { Employee } from '../../models/Employee';
import { AttendanceRecord } from '../../models/AttendanceRecord';
import {
  queryRecords,
  adminCloseRecord,
} from '../../services/attendance.service';
import { todayUTC } from '../../utils/dateUtils';

const router = Router();

// GET /api/admin/attendance/today — real-time overview
router.get(
  '/today',
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const today = todayUTC();
      const employees = await Employee.find({ role: 'employee', status: 'active' });
      const records = await AttendanceRecord.find({ date: today });

      const recordMap = new Map(records.map(r => [r.employeeId.toString(), r]));

      const overview = employees.map(emp => {
        const record = recordMap.get(emp._id.toString()) ?? null;
        let displayStatus: 'checked_in' | 'checked_out' | 'absent' | 'incomplete' = 'absent';
        if (record) {
          if (record.status === 'open') displayStatus = 'checked_in';
          else if (record.status === 'closed') displayStatus = 'checked_out';
          else if (record.status === 'incomplete') displayStatus = 'incomplete';
        }
        return { employee: emp, record, displayStatus };
      });

      res.json({ date: today, overview });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/admin/attendance — query history
const querySchema = z.object({
  employeeId: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(['open', 'closed', 'incomplete']).optional(),
});

router.get(
  '/',
  validate(querySchema, 'query'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const q = req.query as z.infer<typeof querySchema>;
      const records = await queryRecords(q);
      res.json({ records, totalCount: records.length });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/admin/attendance/:id/close — manual close
const closeSchema = z.object({
  checkOutAt: z.string().datetime(),
  adjustmentNote: z.string().min(10, 'Note must be at least 10 characters'),
});

router.patch(
  '/:id/close',
  validate(closeSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { checkOutAt, adjustmentNote } = req.body as z.infer<typeof closeSchema>;
      const record = await adminCloseRecord(
        req.params.id,
        new Date(checkOutAt),
        adjustmentNote,
        req.employee!._id.toString()
      );
      res.json({ record });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
