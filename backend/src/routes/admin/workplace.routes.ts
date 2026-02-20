import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { validate } from '../../middleware/validate';
import { Workplace } from '../../models/Workplace';
import { createError } from '../../middleware/errorHandler';

const router = Router();

// GET /api/admin/workplace
router.get(
  '/',
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const workplace = await Workplace.findOne();
      if (!workplace) return next(createError(404, 'NOT_FOUND', 'Workplace not configured'));
      res.json({ workplace });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/admin/workplace
const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  location: z
    .object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) })
    .optional(),
  geofenceRadiusMetres: z.number().int().min(10).max(5000).optional(),
});

router.put(
  '/',
  validate(updateSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as z.infer<typeof updateSchema>;
      const update: Record<string, unknown> = {};
      if (body.name) update.name = body.name;
      if (body.geofenceRadiusMetres) update.geofenceRadiusMetres = body.geofenceRadiusMetres;
      if (body.location) {
        update.location = { type: 'Point', coordinates: [body.location.lng, body.location.lat] };
      }

      const workplace = await Workplace.findOneAndUpdate({}, update, { new: true, upsert: true });
      res.json({ workplace });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/admin/workplace/qr — return QR code as PNG
router.get(
  '/qr',
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const workplace = await Workplace.findOne();
      if (!workplace) return next(createError(404, 'NOT_FOUND', 'Workplace not configured'));

      const pngBuffer = await QRCode.toBuffer(workplace.qrCodeToken, {
        type: 'png',
        width: 512,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' },
      });

      res.set('Content-Type', 'image/png');
      res.set('Content-Disposition', 'inline; filename="workplace-qr.png"');
      res.send(pngBuffer);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/admin/workplace/qr/rotate — regenerate QR token
router.post(
  '/qr/rotate',
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const newToken = uuidv4();
      const workplace = await Workplace.findOneAndUpdate(
        {},
        { qrCodeToken: newToken },
        { new: true }
      );
      if (!workplace) return next(createError(404, 'NOT_FOUND', 'Workplace not configured'));
      res.json({ message: 'QR code token rotated. Print and replace the old QR code.' });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
