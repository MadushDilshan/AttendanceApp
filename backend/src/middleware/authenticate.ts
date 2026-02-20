import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/auth.service';
import { Employee } from '../models/Employee';
import type { IEmployee } from '../models/Employee';

declare global {
  namespace Express {
    interface Request {
      employee?: IEmployee;
    }
  }
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ code: 'UNAUTHORIZED', message: 'No token provided' });
      return;
    }

    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);

    const employee = await Employee.findById(payload.sub).select('-passwordHash');
    if (!employee || employee.status === 'inactive') {
      res.status(401).json({ code: 'UNAUTHORIZED', message: 'Employee not found or inactive' });
      return;
    }

    req.employee = employee;
    next();
  } catch {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Invalid or expired token' });
  }
}
