import mongoose, { Schema, Document } from 'mongoose';

export type MediaType = 'gif' | 'video';

export interface IMediaAsset extends Document {
  category: string;
  type: MediaType;
  title: string;
  filename: string;
  filePath: string;
  createdAt: Date;
  updatedAt: Date;
}

const MediaAssetSchema = new Schema<IMediaAsset>(
  {
    category: { type: String, required: true, index: true },
    type: { type: String, enum: ['gif', 'video'], required: true, index: true },
    title: { type: String, required: true },
    filename: { type: String, required: true },
    filePath: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

MediaAssetSchema.index({ category: 1, type: 1 });

export const MediaAsset = mongoose.model<IMediaAsset>('MediaAsset', MediaAssetSchema);
