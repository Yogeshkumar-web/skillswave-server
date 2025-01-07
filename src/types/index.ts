import mongoose, { Document, Schema } from 'mongoose';

export interface DecodedToken {
  _id: mongoose.Types.ObjectId;
  iat?: number;
  exp?: number;
}

// Define the Chapter document interface
export interface Chapter extends Document {
  chapterId: string;
  type: 'Text' | 'Quiz' | 'Video';
  title: string;
  content: string;
  comments: Comment[];
  video?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define the Comment document interface
export interface Comment extends Document {
  commentId: string;
  userId: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define the Course document interface
export interface Course extends Document {
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
  sections: Section[];
  enrollments: Enrollment[];
  createdAt: Date;
  updatedAt: Date;
}

// Interface for Chapter Progress
export interface ChapterProgress {
  chapterId: string;
  completed: boolean;
}

// Interface for Enrollment
export interface Enrollment extends Document {
  userId: string; // User enrolled in the course
  courseId: string; // Course the user enrolled in
  enrollmentDate: Date; // Date when the enrollment occurred
  status: 'active' | 'completed' | 'cancelled'; // Enrollment status
  progress: number; // Overall progress percentage (0-100)
}

export interface RefreshToken extends Document {
  user: Schema.Types.ObjectId;
  token: string;
  expiresAt: Date;
}

// Interface for Section
export interface Section extends Document {
  sectionId: string;
  sectionTitle: string;
  sectionDescription?: string;
  chapters: Chapter[];
}

// Interface for Transaction
export interface Transaction extends Document {
  userId: string;
  transactionId: string;
  dateTime: Date; // Changed to Date for better handling of timestamps
  courseId: string;
  paymentProvider: 'stripe'; // Added Stripe as the only valid payment provider
  amount?: number; // Optional as some transactions might not involve an amount
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the User document interface
export interface User extends Document {
  _id: string;
  fullName: string;
  email: string;
  password?: string;
  isVerified?: boolean;
  provider?: string;
  providerId?: string;
  image?: string;
  role: 'admin' | 'teacher' | 'student' | 'user' | 'writer';
  comments?: mongoose.Types.ObjectId[];
  enrolledCourses?: mongoose.Types.ObjectId[];
  transactions?: mongoose.Types.ObjectId[];
  isPasswordCorrect(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
}

export interface VerificationToken extends Document {
  user: Schema.Types.ObjectId;
  token: string;
  expiresAt: Date;
}

// Interface to extend JWT payload structure
export interface JwtPayload {
  _id: string;
  email: string;
  role?: string;
}

export interface ErrorHandler extends Error {
  statusCode?: number;
  message: string;
}

// Interface for Section Progress
export interface SectionProgress {
  sectionId: string;
  chapters: ChapterProgress[];
}

// Interface for User Course Progress
export interface UserCourseProgress extends Document {
  userId: string;
  courseId: string;
  enrollmentDate: Date;
  overallProgress: number; // Percentage (0-100)
  sections: SectionProgress[];
  lastAccessedTimestamp: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
