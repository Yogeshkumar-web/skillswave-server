import { Schema, model, Document, Model } from 'mongoose';
import { ISection, Section } from './section.model';
import { IEnrollment, Enrollment } from './enrollment.model';

// Define the Course document interface
export interface ICourse extends Document {
  courseId: string;
  teacherId: string;
  teacherName: string;
  title: string;
  description?: string;
  category: string;
  image?: string;
  price?: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  status: 'Draft' | 'Published';
  sections: ISection[];
  enrollments: IEnrollment[];
  createdAt: Date;
  updatedAt: Date;
}

// Main Course Schema
const courseSchema = new Schema<ICourse>(
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
      type: [Section], // Embed sections schema
      validate: {
        validator: (sections: ISection[]) => sections.length > 0,
        message: 'At least one section is required in a course.',
      },
    },
    enrollments: [Enrollment], // Embed enrollments schema
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt
  }
);

// Add index for faster searches on category and status
courseSchema.index({ category: 1, status: 1 });

// Course model
export const Course: Model<ICourse> = model<ICourse>('Course', courseSchema);
