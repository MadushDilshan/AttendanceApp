import { Request, Response, NextFunction } from 'express';
import type { EmployeeRole } from '../models/Employee';

export function authorize(...roles: EmployeeRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.employee) {
      res.status(401).json({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
      return;
    }
    if (!roles.includes(req.employee.role)) {
      res.status(403).json({
        code: 'FORBIDDEN',
        message: 'You do not have permission to perform this action',
      });
      return;
    }
    next();
  };
}
