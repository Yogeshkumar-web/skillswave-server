import { Response } from 'express';

interface SuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

interface ErrorResponse {
  success: false;
  message: string;
  error: string;
  timestamp: string;
}

type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

const apiResponse = <T>(
  res: Response,
  options: {
    success: boolean;
    message: string;
    data?: T;
    statusCode?: number;
    metadata?: Record<string, unknown>;
    error?: string;
  }
): Response => {
  const {
    success,
    message,
    data,
    statusCode = 200,
    metadata = {},
    error,
  } = options;

  const response: ApiResponse<T> = success
    ? {
        success: true,
        message,
        data: data as T,
        metadata,
        timestamp: new Date().toISOString(),
      }
    : {
        success: false,
        message,
        error: error || 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
      };

  return res.status(statusCode).json(response);
};

export default apiResponse;
