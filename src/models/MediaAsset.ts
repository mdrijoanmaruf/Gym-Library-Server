import mongoose, { Schema, Document } from 'mongoose';

export type MediaType = 'gif' | 'video';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface IMediaAsset extends Document {
  title: string;
  slug: string;
  category: string;
  type: MediaType;
  r2Key: string;
  thumbnailR2Key?: string;
  durationSeconds?: number;
  difficulty: Difficulty;
  equipment: string[];
  muscleGroups: string[];
  description?: string;
  tags: string[];
  isPublished: boolean;
  featured: boolean;
  order: number;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const MediaAssetSchema = new Schema<IMediaAsset>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    category: { type: String, required: true, index: true },
    type: { type: String, enum: ['gif', 'video'], required: true, index: true },
    r2Key: { type: String, required: true, unique: true },
    thumbnailR2Key: { type: String },
    durationSeconds: { type: Number },
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    equipment: [{ type: String }],
    muscleGroups: [{ type: String }],
    description: { type: String },
    tags: [{ type: String }],
    isPublished: { type: Boolean, default: true, index: true },
    featured: { type: Boolean, default: false, index: true },
    order: { type: Number, default: 999999, index: true },
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

MediaAssetSchema.index({ category: 1, type: 1, isPublished: 1 });

// Generate slug before validation if not present
MediaAssetSchema.pre('validate', function (next) {
  if (this.title && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
  next();
});

export const MediaAsset = mongoose.model<IMediaAsset>('MediaAsset', MediaAssetSchema);
