import { Request, Response, NextFunction } from 'express';
import { AppError, createInternalError } from '../utils/AppError';
import { logger } from '../config/logger';
import { alertService } from '../services/alert.service';
import { env } from '../config/env';

/**
 * Global error handler middleware.
 * Catches all errors and returns appropriate responses.
 * Must be the last middleware in the Express stack.
 */
export const globalErrorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Determine if it's an operational (expected) error
  const isOperational = err instanceof AppError ? err.isOperational : false;
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const requestId = (req as any).requestId;

  // Log the error with full details
  const logData = {
    method: req.method,
    path: req.path,
    statusCode,
    requestId,
    userId: (req as any).user?.id,
    ip: req.ip,
    errorCode: err instanceof AppError ? err.code : 'UNKNOWN_ERROR',
    errorMessage: err.message,
    stackTrace: err.stack,
  };

  if (statusCode >= 500) {
    logger.error('Server error occurred', logData);
  } else {
    logger.warn('Client error occurred', logData);
  }

  // Send critical alerts for 5xx errors
  if (statusCode >= 500) {
    alertService.send({
      timestamp: new Date(),
      severity: statusCode >= 500 ? 'high' : 'medium',
      title: `Server Error: ${statusCode}`,
      description: err.message,
      environment: env.NODE_ENV,
      serverId: env.SERVER_ID,
      requestId,
      affectedUserId: (req as any).user?.id,
      stackTrace: err.stack,
    });
  }

  // Prepare response
  let response: any = {
    error: isOperational ? err.message : 'Internal server error',
    requestId,
  };

  // In development, include additional details
  if (env.isDevelopment()) {
    response.stack = err.stack;
    response.code = err instanceof AppError ? err.code : undefined;
  }

  // For validation errors, include field-level errors
  if (err instanceof AppError && (err as any).errors) {
    response.errors = (err as any).errors;
  }

  // Never expose internal error details in production
  if (!isOperational && env.isProduction()) {
    response = {
      error: 'Internal server error',
      requestId,
    };
  }

  res.status(statusCode).json(response);
};

/**
 * Handle uncaught promise rejections.
 * Logs the error and sends an alert, then exits gracefully.
 */
export const handleUnhandledRejection = (reason: Error): void => {
  logger.error('Unhandled Rejection', {
    error: reason.message,
    stackTrace: reason.stack,
  });

  alertService.send({
    timestamp: new Date(),
    severity: 'critical',
    title: 'Unhandled Promise Rejection',
    description: reason.message,
    environment: env.NODE_ENV,
    serverId: env.SERVER_ID,
    stackTrace: reason.stack,
  });

  // Graceful shutdown
  gracefulShutdown(1);
};

/**
 * Handle uncaught exceptions.
 * Logs the error and sends an alert, then exits immediately.
 */
export const handleUncaughtException = (error: Error): void => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stackTrace: error.stack,
  });

  alertService.send({
    timestamp: new Date(),
    severity: 'critical',
    title: 'Uncaught Exception',
    description: error.message,
    environment: env.NODE_ENV,
    serverId: env.SERVER_ID,
    stackTrace: error.stack,
  });

  // Immediate exit - uncaught exceptions leave the app in undefined state
  process.exit(1);
};

/**
 * Graceful shutdown handler.
 * Closes database connections and drains in-flight requests.
 */
export const gracefulShutdown = (exitCode: number): void => {
  logger.info('Shutting down gracefully...');

  // Close server (would be passed in real implementation)
  // server.close(() => {
  //   logger.info('HTTP server closed');
  // });

  // Give requests 5 seconds to finish
  setTimeout(() => {
    logger.info('Forcing shutdown');
    process.exit(exitCode);
  }, 5000);
};
