import { Router } from 'express';
import { SavedExerciseController } from './savedExercise.controller';
import { authenticate } from '../../middleware/authenticate';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Add/remove/update saved exercise
router.post('/toggle', asyncHandler(SavedExerciseController.toggleSave));

// Get populated saved exercises for the 'My Workout' page
router.get('/', asyncHandler(SavedExerciseController.getMyExercises));

// Get just the array of saved media IDs for the Gym page highlights
router.get('/ids', asyncHandler(SavedExerciseController.getMySavedIds));

export default router;
