import mongoose, { Schema, Document } from 'mongoose';
import { IChapterProgress } from '../types';

// Chapter Progress Schema
export const chapterProgressSchema = new Schema<IChapterProgress>({
  chapterId: {
    type: String,
    required: true,
    trim: true,
  },
  completed: {
    type: Boolean,
    required: true,
  },
});

// Interface for Section Progress
export interface ISectionProgress {
  sectionId: string;
  chapters: IChapterProgress[];
}

// Section Progress Schema
const sectionProgressSchema = new Schema<ISectionProgress>({
  sectionId: {
    type: String,
    required: true,
    trim: true,
  },
  chapters: {
    type: [chapterProgressSchema],
    required: true,
    validate: {
      validator: (chapters: IChapterProgress[]) => chapters.length > 0,
      message: 'Each section must have at least one chapter.',
    },
  },
});

// Interface for User Course Progress
export interface IUserCourseProgress extends Document {
  userId: string;
  courseId: string;
  enrollmentDate: Date;
  overallProgress: number; // Percentage (0-100)
  sections: ISectionProgress[];
  lastAccessedTimestamp: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// User Course Progress Schema
const userCourseProgressSchema = new Schema<IUserCourseProgress>(
  {
    userId: {
      type: String,
      required: true,
      index: true, // Indexed for faster lookups
      trim: true,
    },
    courseId: {
      type: String,
      required: true,
      index: true, // Indexed for efficient querying
      trim: true,
    },
    enrollmentDate: {
      type: Date, // Use Date for better type handling and operations
      required: true,
    },
    overallProgress: {
      type: Number,
      required: true,
      min: 0, // Ensure progress is never negative
      max: 100, // Ensure progress does not exceed 100%
      default: 0,
    },
    sections: {
      type: [sectionProgressSchema],
      required: true,
      validate: {
        validator: (sections: ISectionProgress[]) => sections.length > 0,
        message: 'At least one section progress is required.',
      },
    },
    lastAccessedTimestamp: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt
  }
);

// Add compound index for efficient queries by user and course
userCourseProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

// User Course Progress Model
export const UserCourseProgress = mongoose.model<IUserCourseProgress>(
  'UserCourseProgress',
  userCourseProgressSchema
);
