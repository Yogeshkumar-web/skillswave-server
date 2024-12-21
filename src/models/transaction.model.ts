import { Schema, model, Document } from 'mongoose';

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
const Transaction = model<ITransaction>('Transaction', transactionSchema);

export default Transaction;
