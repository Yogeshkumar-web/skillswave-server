import { model, Schema } from 'mongoose';
import { Transaction } from '../types';

// Transaction Schema
export const transactionSchema = new Schema<Transaction>(
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

export const TransactionModel = model<Transaction>(
  'Transaction',
  transactionSchema
);
