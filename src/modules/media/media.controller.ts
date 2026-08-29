import { Request, Response, NextFunction } from 'express';
import { MediaAsset } from '../../models/MediaAsset';
import { AppError } from '../../utils/AppError';
import { R2Service } from '../../services/r2.service';

export class MediaController {
  /** GET /api/media
   *  Query: category?, type?, page?, limit?
   */
  static async list(req: Request, res: Response) {
    const { category, type, page = '1', limit = '10' } = req.query as Record<string, string>;

    const filter: Record<string, unknown> = { isPublished: true };
    if (category && category !== 'All') filter.category = category;
    if (type) filter.type = type;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [data, total] = await Promise.all([
      MediaAsset.find(filter).sort({ category: 1, title: 1 }).skip(skip).limit(limitNum).lean(),
      MediaAsset.countDocuments(filter),
    ]);

    // Generate pre-signed URLs for each item
    const enhancedData = await Promise.all(data.map(async (item) => {
      const streamUrl = await R2Service.generatePresignedGetUrl(item.r2Key);
      const thumbnailUrl = item.thumbnailR2Key 
        ? await R2Service.generatePresignedGetUrl(item.thumbnailR2Key)
        : undefined;
      return { ...item, streamUrl, thumbnailUrl };
    }));

    res.json({
      data: enhancedData,
      total,
      page: pageNum,
      limit: limitNum,
      hasMore: skip + data.length < total,
    });
  }

  /** GET /api/media/categories */
  static async categories(_req: Request, res: Response) {
    const cats = await MediaAsset.distinct('category', { isPublished: true });
    res.json({ categories: ['All', ...cats.sort()] });
  }

  /** GET /api/media/:id 
   *  Gets a single media asset and its presigned URL.
   *  Also increments viewCount.
  */
  static async getById(req: Request, res: Response, next: NextFunction) {
    const asset = await MediaAsset.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    ).lean();

    if (!asset) return next(new AppError('Media not found', 404, 'NOT_FOUND'));

    const streamUrl = await R2Service.generatePresignedGetUrl(asset.r2Key);
    const thumbnailUrl = asset.thumbnailR2Key 
      ? await R2Service.generatePresignedGetUrl(asset.thumbnailR2Key)
      : undefined;

    res.json({ ...asset, streamUrl, thumbnailUrl });
  }

  /** GET /api/media/:id/url 
   *  Refreshes just the presigned URL for an asset.
  */
  static async getUrl(req: Request, res: Response, next: NextFunction) {
    const asset = await MediaAsset.findById(req.params.id).lean();
    if (!asset) return next(new AppError('Media not found', 404, 'NOT_FOUND'));

    const streamUrl = await R2Service.generatePresignedGetUrl(asset.r2Key);
    res.json({ streamUrl });
  }

  // --- Admin Routes ---

  /** POST /api/media/upload-url
   *  Body: { r2Key: string, contentType: string }
   */
  static async getUploadUrl(req: Request, res: Response) {
    const { r2Key, contentType } = req.body;
    if (!r2Key || !contentType) {
      throw new AppError('r2Key and contentType are required', 400, 'BAD_REQUEST');
    }
    const uploadUrl = await R2Service.generatePresignedPutUrl(r2Key, contentType);
    res.json({ uploadUrl, r2Key });
  }

  /** POST /api/media
   *  Create a new MediaAsset record (after successful upload).
   */
  static async create(req: Request, res: Response) {
    const asset = await MediaAsset.create(req.body);
    res.status(201).json(asset);
  }

  /** PATCH /api/media/:id
   *  Update MediaAsset metadata.
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    const asset = await MediaAsset.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
    if (!asset) return next(new AppError('Media not found', 404, 'NOT_FOUND'));
    res.json(asset);
  }

  /** DELETE /api/media/:id
   *  Delete from DB and R2.
   */
  static async delete(req: Request, res: Response, next: NextFunction) {
    const asset = await MediaAsset.findById(req.params.id);
    if (!asset) return next(new AppError('Media not found', 404, 'NOT_FOUND'));

    await R2Service.deleteObject(asset.r2Key);
    if (asset.thumbnailR2Key) {
      await R2Service.deleteObject(asset.thumbnailR2Key);
    }
    
    await asset.deleteOne();
    res.json({ message: 'Deleted successfully' });
  }
}
