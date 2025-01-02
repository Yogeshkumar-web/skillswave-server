import { model, Schema } from 'mongoose';
import { ChapterProgress, SectionProgress, UserCourseProgress } from '../types';

// Chapter Progress Schema
export const chapterProgressSchema = new Schema<ChapterProgress>({
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

// Section Progress Schema
export const sectionProgressSchema = new Schema<SectionProgress>({
  sectionId: {
    type: String,
    required: true,
    trim: true,
  },
  chapters: {
    type: [chapterProgressSchema],
    required: true,
    validate: {
      validator: (chapters: ChapterProgress[]) => chapters.length > 0,
      message: 'Each section must have at least one chapter.',
    },
  },
});

// User Course Progress Schema
const userCourseProgressSchema = new Schema<UserCourseProgress>(
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
        validator: (sections: SectionProgress[]) => sections.length > 0,
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

export const ChapterProgressModel = model<ChapterProgress>(
  'ChapterProgress',
  chapterProgressSchema
);
export const SectionProgressModel = model<SectionProgress>(
  'SectionProgress',
  sectionProgressSchema
);
export const UserCourseProgressModel = model<UserCourseProgress>(
  'UserCourseProgress',
  userCourseProgressSchema
);
