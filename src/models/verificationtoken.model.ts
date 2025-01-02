import { model, Schema } from 'mongoose';
import { VerificationToken } from '../types';

export const verificationTokenSchema = new Schema<VerificationToken>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// Set TTL for auto-removal of expired verification tokens
verificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const VerificationTokenModel = model<VerificationToken>(
  'VerificationToken',
  verificationTokenSchema
);
