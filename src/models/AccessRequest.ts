import mongoose, { Schema, Document, Types } from 'mongoose';

export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface IAccessRequest extends Document {
  userId: Types.ObjectId;
  status: RequestStatus;
  message?: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AccessRequestSchema = new Schema<IAccessRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    message: { type: String, maxlength: 500 },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    reason: { type: String },
  },
  { timestamps: true }
);

AccessRequestSchema.index({ userId: 1, status: 1 });

export const AccessRequest = mongoose.model<IAccessRequest>(
  'AccessRequest',
  AccessRequestSchema
);
