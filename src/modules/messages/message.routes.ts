import { Router } from 'express';
import { MessageController } from './message.controller';
import { authenticate } from '../../middleware/authenticate';
import { requireAdmin } from '../../middleware/requireAdmin';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

// Public route
router.post('/', asyncHandler(MessageController.submitMessage));

// Admin routes
router.use(authenticate, requireAdmin);
router.get('/', asyncHandler(MessageController.getMessages));
router.patch('/:id/read', asyncHandler(MessageController.markAsRead));
router.delete('/:id', asyncHandler(MessageController.deleteMessage));

export default router;
