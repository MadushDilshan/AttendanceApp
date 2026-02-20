import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { Employee } from '../models/Employee';
import {
  comparePassword,
  signAccessToken,
  signRefreshToken,
  storeRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
} from '../services/auth.service';
import { createError } from '../middleware/errorHandler';
import { env } from '../config/env';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /api/auth/login
router.post(
  '/login',
  validate(loginSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body as z.infer<typeof loginSchema>;

      const employee = await Employee.findOne({ email, status: 'active' });
      if (!employee) {
        return next(createError(401, 'INVALID_CREDENTIALS', 'Invalid email or password'));
      }

      const valid = await comparePassword(password, employee.passwordHash);
      if (!valid) {
        return next(createError(401, 'INVALID_CREDENTIALS', 'Invalid email or password'));
      }

      const accessToken = signAccessToken(employee);
      const rawRefreshToken = signRefreshToken();
      await storeRefreshToken(
        employee._id.toString(),
        rawRefreshToken,
        req.headers['user-agent'] ?? null,
        req.ip ?? null
      );

      // Web: set HttpOnly cookie; Mobile: also return in body
      res.cookie('refreshToken', rawRefreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        accessToken,
        refreshToken: rawRefreshToken, // for mobile clients
        employee,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/refresh
router.post(
  '/refresh',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Mobile sends in body; web browser sends via cookie
      const rawToken =
        (req.body as { refreshToken?: string }).refreshToken ??
        (req.cookies as { refreshToken?: string }).refreshToken;

      if (!rawToken) {
        return next(createError(401, 'NO_REFRESH_TOKEN', 'Refresh token not provided'));
      }

      const result = await rotateRefreshToken(rawToken);
      if (!result) {
        return next(createError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token invalid or expired'));
      }

      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({ accessToken: result.tokens.accessToken });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/logout
router.post(
  '/logout',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawToken =
        (req.body as { refreshToken?: string }).refreshToken ??
        (req.cookies as { refreshToken?: string }).refreshToken;

      if (rawToken) {
        await revokeRefreshToken(rawToken);
      }

      res.clearCookie('refreshToken');
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

export default router;
