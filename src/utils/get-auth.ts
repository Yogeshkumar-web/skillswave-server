import { Request } from 'express';
import { IUser } from '../models/user.model';

// Define the structure of the extended Request object with an optional user
export interface AuthenticatedRequest extends Request {
  user?: IUser; // User information can be undefined if not authenticated
}

// Function to extract user information from the request
export const getAuth = (
  req: AuthenticatedRequest
): { userId: string; email: string; role: string } => {
  // Check if req.user exists and contains necessary fields
  if (req.user && req.user.userId && req.user.email && req.user.role) {
    return {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role,
    };
  }

  // If user is not authenticated or missing fields, throw a detailed error
  throw new Error('User not authenticated or missing user information');
};
