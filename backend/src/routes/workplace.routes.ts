import { Router, Request, Response, NextFunction } from 'express';
import { Workplace } from '../models/Workplace';
import { createError } from '../middleware/errorHandler';

const router = Router();

// GET /api/workplace/geofence — returns geofence data for any authenticated employee
router.get(
  '/geofence',
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const workplace = await Workplace.findOne().select(
        'name location geofenceRadiusMetres'
      );
      if (!workplace) {
        return next(createError(404, 'NOT_FOUND', 'Workplace not configured'));
      }
      res.json({ workplace });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
