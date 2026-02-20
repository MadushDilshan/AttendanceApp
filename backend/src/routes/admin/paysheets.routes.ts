import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate';
import { PaySheet } from '../../models/PaySheet';
import { generatePaysheet } from '../../services/payroll.service';
import { generatePDF, generateCSV } from '../../services/export.service';
import { createError } from '../../middleware/errorHandler';

const router = Router();

// POST /api/admin/paysheets/generate
const generateSchema = z.object({
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  employeeIds: z.array(z.string()).default([]),
});

router.post(
  '/generate',
  validate(generateSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as z.infer<typeof generateSchema>;
      const paysheet = await generatePaysheet({
        ...body,
        generatedBy: req.employee!._id.toString(),
      });
      res.status(201).json({ paysheet });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/admin/paysheets/:id
router.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const paysheet = await PaySheet.findById(req.params.id);
      if (!paysheet) return next(createError(404, 'NOT_FOUND', 'Paysheet not found'));
      res.json({ paysheet });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/admin/paysheets/:id — mark as processed
router.patch(
  '/:id',
  validate(z.object({ status: z.literal('processed') })),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const paysheet = await PaySheet.findByIdAndUpdate(
        req.params.id,
        { status: 'processed' },
        { new: true }
      );
      if (!paysheet) return next(createError(404, 'NOT_FOUND', 'Paysheet not found'));
      res.json({ paysheet });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/admin/paysheets/:id/export?format=pdf|csv
router.get(
  '/:id/export',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const format = req.query.format as string;
      if (!['pdf', 'csv'].includes(format)) {
        return next(createError(400, 'INVALID_FORMAT', 'format must be pdf or csv'));
      }

      const paysheet = await PaySheet.findById(req.params.id);
      if (!paysheet) return next(createError(404, 'NOT_FOUND', 'Paysheet not found'));

      const filename = `paysheet-${paysheet.periodStart}-${paysheet.periodEnd}`;

      if (format === 'pdf') {
        const buffer = await generatePDF(paysheet);
        res.set('Content-Type', 'application/pdf');
        res.set('Content-Disposition', `attachment; filename="${filename}.pdf"`);
        res.send(buffer);
      } else {
        const csv = generateCSV(paysheet);
        res.set('Content-Type', 'text/csv');
        res.set('Content-Disposition', `attachment; filename="${filename}.csv"`);
        res.send(csv);
      }
    } catch (err) {
      next(err);
    }
  }
);

export default router;
