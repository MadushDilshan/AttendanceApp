import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type RequestPart = 'body' | 'params' | 'query';

export function validate(schema: ZodSchema, part: RequestPart = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      const errors = (result.error as ZodError).flatten().fieldErrors;
      res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: errors,
      });
      return;
    }
    // Replace the raw input with the parsed (and coerced) value
    (req as unknown as Record<string, unknown>)[part] = result.data;
    next();
  };
}
