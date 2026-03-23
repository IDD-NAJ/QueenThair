/**
 * Custom application error class.
 * Extends Error with additional properties for structured error handling.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly requestId?: string;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    isOperational = true,
    requestId?: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.requestId = requestId;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Create a 400 Bad Request error.
 * @param message - Human-readable error message
 * @param code - Machine-readable error code
 */
export const createBadRequestError = (message: string, code = 'BAD_REQUEST', requestId?: string): AppError =>
  new AppError(message, 400, code, true, requestId);

/**
 * Create a 401 Unauthorized error.
 * @param message - Human-readable error message
 * @param code - Machine-readable error code
 */
export const createAuthError = (message = 'Authentication required', code = 'UNAUTHORIZED', requestId?: string): AppError =>
  new AppError(message, 401, code, true, requestId);

/**
 * Create a 403 Forbidden error.
 * @param message - Human-readable error message
 * @param code - Machine-readable error code
 */
export const createForbiddenError = (message = 'Access denied', code = 'FORBIDDEN', requestId?: string): AppError =>
  new AppError(message, 403, code, true, requestId);

/**
 * Create a 404 Not Found error.
 * @param message - Human-readable error message
 * @param code - Machine-readable error code
 */
export const createNotFoundError = (message = 'Resource not found', code = 'NOT_FOUND', requestId?: string): AppError =>
  new AppError(message, 404, code, true, requestId);

/**
 * Create a 409 Conflict error.
 * @param message - Human-readable error message
 * @param code - Machine-readable error code
 */
export const createConflictError = (message: string, code = 'CONFLICT', requestId?: string): AppError =>
  new AppError(message, 409, code, true, requestId);

/**
 * Create a 422 Unprocessable Entity error.
 * @param message - Human-readable error message
 * @param code - Machine-readable error code
 */
export const createValidationError = (message: string, code = 'VALIDATION_ERROR', requestId?: string): AppError =>
  new AppError(message, 422, code, true, requestId);

/**
 * Create a 429 Too Many Requests error.
 * @param message - Human-readable error message
 * @param code - Machine-readable error code
 */
export const createRateLimitError = (message = 'Too many requests', code = 'RATE_LIMIT_EXCEEDED', requestId?: string): AppError =>
  new AppError(message, 429, code, true, requestId);

/**
 * Create a 500 Internal Server Error.
 * This is for unexpected errors that should not expose details to the client.
 * @param message - Human-readable error message
 * @param code - Machine-readable error code
 */
export const createInternalError = (message = 'Internal server error', code = 'INTERNAL_ERROR', requestId?: string): AppError =>
  new AppError(message, 500, code, false, requestId);
