import mongoose, { Schema } from 'mongoose';
import { IComment } from '../types';

export const commentSchema = new Schema<IComment>(
  {
    commentId: {
      type: String,
      required: true,
      unique: true, // Ensure unique comment IDs
    },
    userId: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true, // Remove extra spaces for consistency
      minlength: 1, // Ensure no empty comments
      maxlength: 500, // Limit comment length for better UX
    },
  },
  {
    timestamps: true, // Automatically manage `createdAt` and `updatedAt`
  }
);

// Create a model for Comment
export const Comment = mongoose.model<IComment>('Comment', commentSchema);
