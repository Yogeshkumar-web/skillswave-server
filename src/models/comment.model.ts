import { model, Schema } from 'mongoose';
import { Comment } from '../types';

export const commentSchema = new Schema<Comment>(
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

export const CommentModel = model<Comment>('Comment', commentSchema);
