import { Router } from 'express';
import { MediaController } from './media.controller';
import { authenticate } from '../../middleware/authenticate';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

// All media routes require authentication
router.use(authenticate);

router.get('/categories', asyncHandler(MediaController.categories));
router.get('/stream/:id', asyncHandler(MediaController.stream));
router.get('/', asyncHandler(MediaController.list));

export default router;
