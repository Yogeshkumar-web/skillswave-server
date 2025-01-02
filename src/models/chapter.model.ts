import { model, Schema } from 'mongoose';
import { commentSchema } from './comment.model';
import { Chapter } from '../types';

export const chapterSchema = new Schema<Chapter>(
  {
    chapterId: {
      type: String,
      required: true,
      unique: true, // Ensure chapter IDs are unique
    },
    type: {
      type: String,
      enum: ['Text', 'Quiz', 'Video'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true, // Remove extra spaces for consistency
    },
    content: {
      type: String,
      required: true,
    },
    comments: {
      type: [commentSchema], // Embeds comments directly
      default: [], // Initialize as an empty array
    },
    video: {
      type: String,
      validate: {
        validator: function (value: string): boolean {
          return (
            !value || // Optional field
            /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w.-]*)*\/?$/.test(
              value
            )
          );
        },
        message: 'Invalid video URL format',
      },
    },
  },
  {
    timestamps: true, // Automatically manage `createdAt` and `updatedAt`
  }
);

export const ChapterModel = model<Chapter>('Chapter', chapterSchema);
