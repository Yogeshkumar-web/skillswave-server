import { Schema, model, Document, Model } from 'mongoose';

// Interface for Enrollment
export interface IEnrollment extends Document {
  userId: string; // User enrolled in the course
  courseId: string; // Course the user enrolled in
  enrollmentDate: Date; // Date when the enrollment occurred
  status: 'active' | 'completed' | 'cancelled'; // Enrollment status
  progress: number; // Overall progress percentage (0-100)
}

// Enrollment Schema
const enrollmentSchema = new Schema<IEnrollment>(
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

// Enrollment Model
const Enrollment: Model<IEnrollment> = model<IEnrollment>(
  'Enrollment',
  enrollmentSchema
);

export default Enrollment;
