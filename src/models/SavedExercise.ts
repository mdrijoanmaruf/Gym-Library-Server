import mongoose, { Schema, Document } from 'mongoose';

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface ISavedExercise extends Document {
  userId: mongoose.Types.ObjectId;
  mediaId: mongoose.Types.ObjectId;
  days: DayOfWeek[];
  createdAt: Date;
  updatedAt: Date;
}

const SavedExerciseSchema = new Schema<ISavedExercise>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    mediaId: { type: Schema.Types.ObjectId, ref: 'MediaAsset', required: true },
    days: [{ type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] }],
  },
  { timestamps: true }
);

// A user can only save a specific exercise once. The days array determines when they do it.
SavedExerciseSchema.index({ userId: 1, mediaId: 1 }, { unique: true });

export const SavedExercise = mongoose.model<ISavedExercise>('SavedExercise', SavedExerciseSchema);
