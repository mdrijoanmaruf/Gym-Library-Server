import { Request, Response, NextFunction } from 'express';
import { User } from '../../models/User';
import { AppError } from '../../utils/AppError';

export class UserController {
  /**
   * GET /api/users/profile
   * Get the current user's profile
   */
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) return next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));

      const user = await User.findById(userId).select('-passwordHash -refreshTokens').lean();
      if (!user) return next(new AppError('User not found', 404, 'NOT_FOUND'));

      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/users/day-aliases
   * Update or add a day alias for the user
   * Body: { day: string, alias: string }
   */
  static async updateDayAlias(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) return next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));

      const { day, alias } = req.body;
      if (!day) return next(new AppError('Day is required', 400, 'VALIDATION_ERROR'));

      const updateQuery = alias 
        ? { $set: { [`dayAliases.${day}`]: alias } }
        : { $unset: { [`dayAliases.${day}`]: 1 } };

      const user = await User.findByIdAndUpdate(userId, updateQuery, { new: true }).select('dayAliases').lean();
      
      res.json({ success: true, data: user?.dayAliases });
    } catch (error) {
      next(error);
    }
  }
}
