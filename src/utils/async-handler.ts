import { Request, Response, NextFunction, RequestHandler } from "express";

// Define a custom type that allows returning a Promise of a Response.
type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<Response<any> | void>;

// Accepts functions of type AsyncRequestHandler and wraps them to catch errors
const asyncHandler = (requestHandler: AsyncRequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(requestHandler(req, res, next)).catch(next);
  };
};

export { asyncHandler };
