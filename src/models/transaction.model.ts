import mongoose, { Schema, Document } from 'mongoose';
import { ITransaction } from '../types';

// Transaction Schema
export const transactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: String,
      required: true,
      index: true, // Indexing for faster queries based on userId
    },
    transactionId: {
      type: String,
      required: true,
      unique: true, // Ensure each transaction ID is unique
    },
    dateTime: {
      type: Date,
      required: true,
      default: Date.now, // Automatically set to the current timestamp if not provided
    },
    courseId: {
      type: String,
      required: true,
      index: true, // Indexing for faster queries based on courseId
    },
    paymentProvider: {
      type: String,
      enum: ['stripe'], // Stripe is the only supported payment provider for now
      required: true,
    },
    amount: {
      type: Number,
      min: 0, // Ensure the amount is non-negative
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Transaction Model
export const Transaction = mongoose.model<ITransaction>(
  'Transaction',
  transactionSchema
);
