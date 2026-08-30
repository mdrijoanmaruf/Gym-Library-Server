import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'user' | 'admin' | 'super_admin';
export type UserStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  image?: string;
  dayAliases?: Map<string, string>;
  refreshTokens: string[];
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['user', 'admin', 'super_admin'],
      default: 'user',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: 'pending',
    },
    image: { type: String },
    dayAliases: {
      type: Map,
      of: String,
      default: {},
    },
    refreshTokens: [{ type: String }],
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
  },
  { timestamps: true }
);



export const User = mongoose.model<IUser>('User', UserSchema);
