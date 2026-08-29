import { Router } from 'express';
import { MediaController } from './media.controller';
import { authenticate } from '../../middleware/authenticate';
import { requireAdmin } from '../../middleware/requireAdmin';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

// All media routes require authentication
router.use(authenticate);

// Public Routes (Authenticated Users)
router.get('/categories', asyncHandler(MediaController.categories));
router.get('/', asyncHandler(MediaController.list));
router.get('/:id', asyncHandler(MediaController.getById));
router.get('/:id/url', asyncHandler(MediaController.getUrl));

// Admin Routes
router.post('/upload-url', requireAdmin, asyncHandler(MediaController.getUploadUrl));
router.post('/', requireAdmin, asyncHandler(MediaController.create));
router.patch('/:id', requireAdmin, asyncHandler(MediaController.update));
router.delete('/:id', requireAdmin, asyncHandler(MediaController.delete));

export default router;
