import { model, Schema } from 'mongoose';
import { RefreshToken } from '../types';

export const refreshTokenSchema = new Schema<RefreshToken>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// Set TTL for auto-removal of expired tokens
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshTokenModel = model<RefreshToken>(
  'RefreshToken',
  refreshTokenSchema
);
