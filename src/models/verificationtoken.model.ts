import mongoose, { Document, Schema } from "mongoose";

interface IVerificationToken extends Document {
  user: Schema.Types.ObjectId;
  token: string;
  expiresAt: Date;
}

const verificationTokenSchema = new Schema<IVerificationToken>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// Set TTL for auto-removal of expired verification tokens
verificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const VerificationToken = mongoose.model<IVerificationToken>(
  "VerificationToken",
  verificationTokenSchema
);
