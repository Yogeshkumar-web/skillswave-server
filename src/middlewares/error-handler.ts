import { Request, Response, NextFunction } from 'express';
import apiResponse from '../utils/api-response';
import { ErrorHandler } from '../types';

const errorHandler = (
  err: ErrorHandler,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err instanceof Error ? err.message : 'Unknown error occurred';

  if (process.env.NODE_ENV === 'development') {
    console.error(`[ERROR]: ${err.stack || err}`);
  }

  apiResponse(res, {
    success: false,
    message,
    error: err.message || 'An unexpected error occurred',
    statusCode,
  });

  next();
};

export { errorHandler };
