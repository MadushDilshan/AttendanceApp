import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate';
import { Employee } from '../../models/Employee';
import { hashPassword } from '../../services/auth.service';
import { createError } from '../../middleware/errorHandler';

const router = Router();

// GET /api/admin/employees
router.get(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filter: Record<string, unknown> = {};
      if (req.query.status) filter.status = req.query.status;
      if (req.query.workplaceId) filter.workplaceId = req.query.workplaceId;
      const employees = await Employee.find(filter).sort({ name: 1 });
      res.json({ employees });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/admin/employees
const createSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['employee', 'admin']),
  workplaceId: z.string().optional(),
});

router.post(
  '/',
  validate(createSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as z.infer<typeof createSchema>;
      const existing = await Employee.findOne({ email: body.email });
      if (existing) return next(createError(409, 'EMAIL_TAKEN', 'Email already in use'));

      const passwordHash = await hashPassword(body.password);
      const employee = await Employee.create({ ...body, passwordHash });
      res.status(201).json({ employee });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/admin/employees/:id
const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  role: z.enum(['employee', 'admin']).optional(),
  workplaceId: z.string().optional(),
});

router.put(
  '/:id',
  validate(updateSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!employee) return next(createError(404, 'NOT_FOUND', 'Employee not found'));
      res.json({ employee });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/admin/employees/:id/status
const statusSchema = z.object({ status: z.enum(['active', 'inactive']) });

router.patch(
  '/:id/status',
  validate(statusSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status } = req.body as z.infer<typeof statusSchema>;
      const employee = await Employee.findByIdAndUpdate(req.params.id, { status }, { new: true });
      if (!employee) return next(createError(404, 'NOT_FOUND', 'Employee not found'));
      res.json({ employee });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
