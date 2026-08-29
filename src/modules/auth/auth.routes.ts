import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { requireAdmin } from '../../middleware/requireAdmin';
import { authLimiter } from '../../middleware/rateLimiters';
import { asyncHandler } from '../../utils/asyncHandler';
import { registerSchema, loginSchema, googleAuthSchema } from './auth.validation';

const router = Router();

router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  asyncHandler(AuthController.register)
);

router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  asyncHandler(AuthController.login)
);

router.post(
  '/google',
  authLimiter,
  validate(googleAuthSchema),
  asyncHandler(AuthController.googleLogin)
);

router.post(
  '/logout',
  authenticate,
  asyncHandler(AuthController.logout)
);

router.get(
  '/me',
  authenticate,
  asyncHandler(AuthController.me)
);

router.get(
  '/users',
  authenticate,
  requireAdmin,
  asyncHandler(AuthController.getUsers)
);

router.put(
  '/users/:id/role',
  authenticate,
  requireAdmin,
  asyncHandler(AuthController.updateUserRole)
);

export default router;
