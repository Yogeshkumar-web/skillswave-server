import { Schema, Document, Model, model } from 'mongoose';
import { commentSchema, IComment } from './comment.model';

// Define the Chapter document interface
export interface IChapter extends Document {
  chapterId: string;
  type: 'Text' | 'Quiz' | 'Video';
  title: string;
  content: string;
  comments: IComment[];
  video?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const chapterSchema = new Schema<IChapter>(
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

// Create a model for Chapter
export const Chapter: Model<IChapter> = model<IChapter>(
  'Chapter',
  chapterSchema
);
