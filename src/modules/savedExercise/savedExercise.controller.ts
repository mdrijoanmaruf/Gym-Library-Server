import { Request, Response } from 'express';
import { SavedExercise } from '../../models/SavedExercise';
import { R2Service } from '../../services/r2.service';

export class SavedExerciseController {
  // Add or update a saved exercise
  static async toggleSave(req: Request, res: Response) {
    const userId = req.user?.userId;
    const { mediaId, days } = req.body;

    if (!userId || !mediaId || !Array.isArray(days)) {
      return res.status(400).json({ message: 'Invalid request body' });
    }

    if (days.length === 0) {
      // Unsave completely
      await SavedExercise.findOneAndDelete({ userId, mediaId });
      return res.status(200).json({ message: 'Removed from saved exercises' });
    }

    // Upsert the saved exercise
    const updated = await SavedExercise.findOneAndUpdate(
      { userId, mediaId },
      { userId, mediaId, days },
      { upsert: true, new: true }
    );

    return res.status(200).json({ message: 'Saved successfully', data: updated });
  }

  // Get user's saved exercises (populated)
  static async getMyExercises(req: Request, res: Response) {
    const userId = req.user?.userId;
    const { day, category } = req.query;

    const query: any = { userId };
    if (day && day !== 'All') {
      query.days = day;
    }

    const savedExercises = await SavedExercise.find(query)
      .populate('mediaId')
      .sort({ createdAt: -1 });

    // Filter by category if needed (since category is inside the populated mediaId)
    let results = savedExercises.map(se => ({
      ...se.toObject(),
      mediaId: se.mediaId, // Populated IMediaAsset
    }));

    if (category && category !== 'All') {
      results = results.filter(se => (se.mediaId as any).category === category);
    }

    // Enhance with pre-signed URLs
    const enhancedResults = await Promise.all(results.map(async (se: any) => {
      const media = se.mediaId;
      if (media && media.r2Key) {
        media.streamUrl = await R2Service.generatePresignedGetUrl(media.r2Key);
        if (media.thumbnailR2Key) {
          media.thumbnailUrl = await R2Service.generatePresignedGetUrl(media.thumbnailR2Key);
        }
      }
      return se;
    }));

    return res.status(200).json({ data: enhancedResults });
  }

  // Get just the array of mediaIds the user has saved
  static async getMySavedIds(req: Request, res: Response) {
    const userId = req.user?.userId;

    const saved = await SavedExercise.find({ userId }).select('mediaId days').lean();
    
    // Map { "mediaId": ["Monday", "Tuesday"] }
    const savedMap: Record<string, string[]> = {};
    saved.forEach(s => {
      savedMap[s.mediaId.toString()] = s.days;
    });

    return res.status(200).json({ data: savedMap });
  }
}
