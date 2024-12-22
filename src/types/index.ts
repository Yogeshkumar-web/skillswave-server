import mongoose, { Document, Schema } from 'mongoose';

export interface DecodedToken {
  _id: mongoose.Types.ObjectId;
  iat?: number;
  exp?: number;
}

// model types

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

// Define the Comment document interface
export interface IComment extends Document {
  commentId: string;
  userId: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

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

// Interface for Chapter Progress
export interface IChapterProgress {
  chapterId: string;
  completed: boolean;
}

// Interface for Enrollment
export interface IEnrollment extends Document {
  userId: string; // User enrolled in the course
  courseId: string; // Course the user enrolled in
  enrollmentDate: Date; // Date when the enrollment occurred
  status: 'active' | 'completed' | 'cancelled'; // Enrollment status
  progress: number; // Overall progress percentage (0-100)
}

export interface IRefreshToken extends Document {
  user: Schema.Types.ObjectId;
  token: string;
  expiresAt: Date;
}

// Interface for Section
export interface ISection extends Document {
  sectionId: string;
  sectionTitle: string;
  sectionDescription?: string;
  chapters: IChapter[];
}

// Interface for Transaction
export interface ITransaction extends Document {
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
export interface IUser extends Document {
  userId: string;
  fullName: string;
  email: string;
  password?: string;
  isVerified: boolean;
  provider?: string;
  providerId?: string;
  image?: string;
  role: 'admin' | 'user' | 'writer';
  posts: mongoose.Types.ObjectId[];
  comments: mongoose.Types.ObjectId[];
  enrolledCourses: mongoose.Types.ObjectId[];
  transactions: mongoose.Types.ObjectId[];
  isPasswordCorrect(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
}

export interface IVerificationToken extends Document {
  user: Schema.Types.ObjectId;
  token: string;
  expiresAt: Date;
}
