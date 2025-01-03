import { Request } from 'express';
import { User } from '../types';

// Define the structure of the extended Request object with an optional user
export interface AuthenticatedRequest extends Request {
  user?: User; // User information can be undefined if not authenticated
}

// Function to extract user information from the request
export const getAuth = (
  req: AuthenticatedRequest
): { _id: string; email: string; role: string } => {
  // Check if req.user exists and contains necessary fields
  if (req.user && req.user._id && req.user.email && req.user.role) {
    return {
      _id: req.user._id,
      email: req.user.email,
      role: req.user.role,
    };
  }

  // If user is not authenticated or missing fields, throw a detailed error
  throw new Error('User not authenticated or missing user information');
};
