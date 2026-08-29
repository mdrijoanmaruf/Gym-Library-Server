import { Router } from 'express';
import { MediaController } from './media.controller';
import { authenticate } from '../../middleware/authenticate';
import { requireAdmin } from '../../middleware/requireAdmin';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

// Public Routes (No authentication required to view library)
router.get('/categories', asyncHandler(MediaController.categories));
router.get('/', asyncHandler(MediaController.list));
router.get('/stream/:id', asyncHandler(MediaController.streamVideo));
router.get('/:id', asyncHandler(MediaController.getById));
router.get('/:id/url', asyncHandler(MediaController.getUrl));

// Admin Routes (Require authentication & admin role)
router.use(authenticate);
router.post('/upload-url', requireAdmin, asyncHandler(MediaController.getUploadUrl));
router.post('/', requireAdmin, asyncHandler(MediaController.create));
router.patch('/:id', requireAdmin, asyncHandler(MediaController.update));
router.delete('/:id', requireAdmin, asyncHandler(MediaController.delete));

export default router;
