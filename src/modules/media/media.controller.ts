import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { MediaAsset } from '../../models/MediaAsset';
import { AppError } from '../../utils/AppError';

const MIME_TYPES: Record<string, string> = {
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

export class MediaController {
  /** GET /api/media
   *  Query: category?, type?, page?, limit?
   */
  static async list(req: Request, res: Response) {
    const { category, type, page = '1', limit = '10' } = req.query as Record<string, string>;

    const filter: Record<string, unknown> = {};
    if (category && category !== 'All') filter.category = category;
    if (type) filter.type = type;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [data, total] = await Promise.all([
      MediaAsset.find(filter).sort({ category: 1, title: 1 }).skip(skip).limit(limitNum).lean(),
      MediaAsset.countDocuments(filter),
    ]);

    res.json({
      data,
      total,
      page: pageNum,
      limit: limitNum,
      hasMore: skip + data.length < total,
    });
  }

  /** GET /api/media/categories */
  static async categories(_req: Request, res: Response) {
    const cats = await MediaAsset.distinct('category');
    res.json({ categories: ['All', ...cats.sort()] });
  }

  /** GET /api/media/stream/:id
   *  Streams the actual file bytes from disk.
   *  Supports HTTP Range requests for video seeking.
   */
  static async stream(req: Request, res: Response, next: NextFunction) {
    const asset = await MediaAsset.findById(req.params.id).lean();
    if (!asset) return next(new AppError('Media not found', 404, 'NOT_FOUND'));

    const absPath = path.resolve(process.cwd(), asset.filePath);

    if (!fs.existsSync(absPath)) {
      return next(new AppError('File not found on disk', 404, 'FILE_MISSING'));
    }

    const ext = path.extname(asset.filename).toLowerCase();
    const mimeType = MIME_TYPES[ext] ?? 'application/octet-stream';
    const stat = fs.statSync(absPath);
    const fileSize = stat.size;

    // Support Range requests (needed for video seeking in browsers)
    const rangeHeader = req.headers.range;
    if (rangeHeader && mimeType.startsWith('video/')) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + 1024 * 1024 - 1, fileSize - 1);
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': mimeType,
        'Cache-Control': 'private, max-age=3600',
      });

      fs.createReadStream(absPath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': mimeType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'private, max-age=3600',
      });
      fs.createReadStream(absPath).pipe(res);
    }
  }
}
