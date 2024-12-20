import { Response } from "express";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

type ApiResponseFunction = <T>(
  res: Response,
  success: boolean,
  message: string,
  data?: T,
  statusCode?: number,
  metadata?: Record<string, unknown>
) => Response;

// Standardized API response function
const apiResponse: ApiResponseFunction = <T>(
  res: Response,
  success: boolean,
  message: string,
  data: T = {} as T, // Default empty object cast to generic type T
  statusCode: number = 200,
  metadata: Record<string, unknown> = {}
): Response => {
  const response: ApiResponse<T> = {
    success,
    message,
    data,
    metadata,
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(response);
};

export default apiResponse;
