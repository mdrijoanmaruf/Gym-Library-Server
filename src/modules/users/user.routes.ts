import { Router } from 'express';
import { UserController } from './user.controller';
import { authenticate } from '../../middleware/authenticate';

const router = Router();

// Protect all user routes
router.use(authenticate);

router.get('/profile', UserController.getProfile);
router.patch('/day-aliases', UserController.updateDayAlias);

export default router;
