import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../utils/AppError';

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new ForbiddenError('Not authenticated'));
  }

  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return next(new ForbiddenError('Requires admin privileges'));
  }

  next();
}
