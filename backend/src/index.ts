import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { connectDatabase } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { authenticate } from './middleware/authenticate';
import { authorize } from './middleware/authorize';

// Routes
import authRoutes from './routes/auth.routes';
import attendanceRoutes from './routes/attendance.routes';
import workplaceRoutes from './routes/workplace.routes';
import adminAttendanceRoutes from './routes/admin/attendance.routes';
import adminEmployeesRoutes from './routes/admin/employees.routes';
import adminWorkplaceRoutes from './routes/admin/workplace.routes';
import adminPaysheetRoutes from './routes/admin/paysheets.routes';

// Cron jobs
import { registerMarkIncompleteJob } from './scripts/markIncomplete';

const app = express();

// ─── Security middleware ────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);

// ─── Parsing middleware ─────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// ─── Structured JSON logging ────────────────────────────────────────────────
morgan.token('employee-id', (req: express.Request) => req.employee?._id.toString() ?? '-');
app.use(
  morgan(
    (tokens, req, res) =>
      JSON.stringify({
        level: 'info',
        method: tokens.method(req, res),
        url: tokens.url(req, res),
        status: tokens.status(req, res),
        responseTime: `${tokens['response-time'](req, res)}ms`,
        employeeId: tokens['employee-id'](req, res),
        timestamp: new Date().toISOString(),
      })
  )
);

// ─── Health check ───────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', env: env.NODE_ENV }));

// ─── Public routes ──────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);

// ─── Employee routes (authenticated) ────────────────────────────────────────
app.use('/api/attendance', attendanceRoutes);
app.use('/api/workplace', authenticate, workplaceRoutes);

// ─── Admin routes (authenticated + admin role) ──────────────────────────────
app.use('/api/admin/attendance', authenticate, authorize('admin'), adminAttendanceRoutes);
app.use('/api/admin/employees', authenticate, authorize('admin'), adminEmployeesRoutes);
app.use('/api/admin/workplace', authenticate, authorize('admin'), adminWorkplaceRoutes);
app.use('/api/admin/paysheets', authenticate, authorize('admin'), adminPaysheetRoutes);

// ─── Global error handler (MUST be last) ────────────────────────────────────
app.use(errorHandler);

// ─── Start ──────────────────────────────────────────────────────────────────
async function start(): Promise<void> {
  await connectDatabase();
  registerMarkIncompleteJob();
  app.listen(env.PORT, () => {
    console.warn(`🚀 Server running on port ${env.PORT} (${env.NODE_ENV})`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
