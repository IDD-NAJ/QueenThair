import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Request ID middleware.
 * Assigns a unique X-Request-ID (UUID v4) to every inbound request.
 * Enables tracing a single request across all log entries.
 */

/**
 * Extended Request interface with request ID.
 */
export interface RequestWithId extends Request {
  requestId: string;
}

/**
 * Request ID middleware.
 * Generates or extracts request ID and attaches it to the request.
 */
export const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Check if request already has an ID (from load balancer or previous middleware)
  const existingId = req.headers['x-request-id'] as string;
  
  // Generate new UUID or use existing
  const requestId = existingId || uuidv4();
  
  // Attach to request object
  (req as RequestWithId).requestId = requestId;
  
  // Add to response headers for client-side tracing
  res.setHeader('X-Request-ID', requestId);
  
  next();
};

/**
 * Get request ID from request object.
 * Returns undefined if middleware hasn't been applied.
 */
export const getRequestId = (req: Request): string | undefined => {
  return (req as RequestWithId).requestId;
};
