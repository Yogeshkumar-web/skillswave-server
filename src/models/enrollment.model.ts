import { model, Schema } from 'mongoose';
import { Enrollment } from '../types';

// Enrollment Schema
export const enrollmentSchema = new Schema<Enrollment>(
  {
    userId: {
      type: String,
      required: true,
      trim: true,
      index: true, // Indexed for faster lookups
    },
    courseId: {
      type: String,
      required: true,
      trim: true,
      index: true, // Indexed for efficient querying
    },
    enrollmentDate: {
      type: Date,
      required: true,
      default: Date.now, // Automatically set to current date if not provided
    },
    status: {
      type: String,
      required: true,
      enum: ['active', 'completed', 'cancelled'], // Restrict to specific values
      default: 'active', // Default status for new enrollments
    },
    progress: {
      type: Number,
      required: true,
      min: 0, // Ensure progress is never negative
      max: 100, // Ensure progress does not exceed 100%
      default: 0, // Default to 0% progress on enrollment
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);

// Add compound index for efficient querying by user and course
enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const EnrollmentModel = model<Enrollment>(
  'Enrollment',
  enrollmentSchema
);
