import { Request, Response, NextFunction } from 'express';

/**
 * Async handler wrapper for Express route handlers.
 * Catches promise rejections and passes them to next(err) for centralized error handling.
 * 
 * Usage:
 *   router.get('/users', asyncHandler(async (req, res) => {
 *     const users = await User.findAll();
 *     res.json(users);
 *   }));
 * 
 * @param fn - Async route handler function
 * @returns Express middleware function with error handling
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Type for async request handler functions.
 */
export type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;
