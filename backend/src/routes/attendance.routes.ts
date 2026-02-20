import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import {
  checkIn,
  checkOut,
  getTodayRecord,
  syncEvents,
} from '../services/attendance.service';

const router = Router();

// All employee attendance routes require authentication
router.use(authenticate);

const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const checkInSchema = z.object({
  qrToken: z.string().min(1),
  deviceTimestamp: z.string().datetime(),
  location: locationSchema,
});

const checkOutSchema = checkInSchema;

const syncSchema = z.object({
  events: z.array(
    z.object({
      localId: z.string().uuid(),
      type: z.enum(['checkin', 'checkout']),
      qrToken: z.string().min(1),
      deviceTimestamp: z.string().datetime(),
      location: locationSchema,
    })
  ).min(1),
});

// GET /api/attendance/today
router.get(
  '/today',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const record = await getTodayRecord(req.employee!._id.toString());
      res.json({ record });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/attendance/checkin
router.post(
  '/checkin',
  validate(checkInSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as z.infer<typeof checkInSchema>;
      const record = await checkIn({
        employeeId: req.employee!._id.toString(),
        ...body,
      });
      res.status(201).json({ record, serverCheckInAt: record.checkInAt });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/attendance/checkout
router.post(
  '/checkout',
  validate(checkOutSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as z.infer<typeof checkOutSchema>;
      const result = await checkOut({
        employeeId: req.employee!._id.toString(),
        ...body,
      });
      res.json({ record: result.record, serverCheckOutAt: result.record.checkOutAt, summary: result.summary });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/attendance/sync
router.post(
  '/sync',
  validate(syncSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { events } = req.body as z.infer<typeof syncSchema>;
      const results = await syncEvents(req.employee!._id.toString(), events);
      res.json({ results });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
