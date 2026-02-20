import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500;
  const code = err.code ?? 'INTERNAL_SERVER_ERROR';

  // Log all errors (structured for Render.com log drain)
  console.error(
    JSON.stringify({
      level: 'error',
      code,
      message: err.message,
      stack: env.NODE_ENV !== 'production' ? err.stack : undefined,
      timestamp: new Date().toISOString(),
    })
  );

  res.status(statusCode).json({
    code,
    message: env.NODE_ENV === 'production' && statusCode === 500
      ? 'An unexpected error occurred'
      : err.message,
  });
}

/** Helper: create an error with HTTP status code attached. */
export function createError(statusCode: number, code: string, message: string): AppError {
  const err = new Error(message) as AppError;
  err.statusCode = statusCode;
  err.code = code;
  return err;
}
