import { model, Schema } from 'mongoose';
import { Course, Section } from '../types';
import { sectionSchema } from '../models/section.model';
import { enrollmentSchema } from './enrollment.model';

// Main Course Schema
export const courseSchema = new Schema<Course>(
  {
    courseId: {
      type: String,
      required: true,
      unique: true, // Ensure unique course IDs
    },
    teacherId: {
      type: String,
      required: true,
    },
    teacherName: {
      type: String,
      required: true,
      trim: true, // Remove extra spaces
    },
    title: {
      type: String,
      required: true,
      trim: true, // Enforce clean input
      maxlength: 100, // Limit title length for UX
    },
    description: {
      type: String,
      trim: true, // Remove unnecessary spaces
      maxlength: 500, // Limit description length
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
    },
    price: {
      type: Number,
      min: 0, // Ensure no negative prices
    },
    level: {
      type: String,
      required: true,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
    },
    status: {
      type: String,
      required: true,
      enum: ['Draft', 'Published'],
    },
    sections: {
      type: [sectionSchema], // Use section schema
      validate: {
        validator: (sections: Section[]) => sections.length > 0,
        message: 'At least one section is required in a course.',
      },
    },
    enrollments: {
      type: [enrollmentSchema], // Use enrollment schema
      default: [], // Default to an empty array
    },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt
  }
);

// Add index for faster searches on category and status
courseSchema.index({ category: 1, status: 1 });

export const CourseModel = model<Course>('Course', courseSchema);
