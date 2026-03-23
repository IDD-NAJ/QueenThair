import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { env } from './env';

/**
 * Winston logger configuration for QUEENTHAIR API.
 * Provides structured JSON logging in production and colorized output in development.
 */

// Custom format for structured JSON logging
const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Custom format for console output with colors
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ level, message, timestamp, requestId, userId, ...metadata }) => {
    let msg = `${timestamp} [${level}]`;
    if (requestId) msg += ` [${requestId}]`;
    if (userId) msg += ` [user:${userId}]`;
    msg += `: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

// Create daily rotate file transport for application logs
const appLogTransport = new DailyRotateFile({
  filename: 'logs/app-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  level: env.isProduction() ? 'info' : 'debug',
  format: jsonFormat,
});

// Create daily rotate file transport for error logs
const errorLogTransport = new DailyRotateFile({
  filename: 'logs/error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d',
  level: 'error',
  format: jsonFormat,
});

// Create the logger instance
export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  defaultMeta: {
    environment: env.NODE_ENV,
    serverId: env.SERVER_ID,
    version: env.APP_VERSION,
  },
  transports: [
    // Write all logs to app.log
    appLogTransport,
    // Write error logs to error.log
    errorLogTransport,
  ],
});

// Add console transport in non-production environments
if (!env.isProduction()) {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
  }));
}

/**
 * HTTP request logger using morgan format but feeding into Winston.
 * Logs every HTTP request with method, path, status, and response time.
 */
export const httpLogger = (tokens: any, req: any, res: any) => {
  const status = tokens.status(req, res);
  const level = status >= 400 ? 'warn' : status >= 500 ? 'error' : 'http';
  
  logger.log(level, `${tokens.method(req, res)} ${tokens.url(req, res)}`, {
    statusCode: status,
    responseTime: `${tokens['response-time'](req, res)}ms`,
    contentLength: tokens.res(req, res, 'content-length'),
    requestId: req.requestId,
    userId: req.user?.id,
    ip: tokens['remote-addr'](req, res),
    userAgent: tokens['user-agent'](req, res),
  });

  return null; // Return null to prevent morgan from outputting to console
};

/**
 * Log application startup information.
 */
export const logStartup = (): void => {
  logger.info('Application starting', {
    nodeVersion: process.version,
    environment: env.NODE_ENV,
    version: env.APP_VERSION,
    serverId: env.SERVER_ID,
    port: env.PORT,
    logLevel: env.LOG_LEVEL,
    // List loaded env vars (keys only, not values for security)
    loadedEnvVars: Object.keys(process.env).filter(key => 
      !key.includes('SECRET') && 
      !key.includes('PASSWORD') && 
      !key.includes('TOKEN') &&
      !key.includes('KEY')
    ),
  });
};

/**
 * Audit logger for security-sensitive events.
 * Writes to both the logger and optionally to the audit_logs database table.
 */
export const auditLogger = {
  loginSuccess(userId: string, ip: string, userAgent: string): void {
    logger.info('Audit: Login success', { event: 'LOGIN_SUCCESS', userId, ip, userAgent });
  },

  loginFailure(email: string, ip: string, userAgent: string, reason: string): void {
    logger.warn('Audit: Login failure', { event: 'LOGIN_FAILURE', email, ip, userAgent, reason });
  },

  passwordChange(userId: string, ip: string, userAgent: string): void {
    logger.info('Audit: Password changed', { event: 'PASSWORD_CHANGE', userId, ip, userAgent });
  },

  passwordResetRequest(userId: string, ip: string, userAgent: string): void {
    logger.info('Audit: Password reset requested', { event: 'PASSWORD_RESET_REQUEST', userId, ip, userAgent });
  },

  passwordResetComplete(userId: string, ip: string, userAgent: string): void {
    logger.info('Audit: Password reset completed', { event: 'PASSWORD_RESET_COMPLETE', userId, ip, userAgent });
  },

  tokenRefresh(userId: string, ip: string, userAgent: string): void {
    logger.info('Audit: Token refreshed', { event: 'TOKEN_REFRESH', userId, ip, userAgent });
  },

  adminAction(adminId: string, action: string, targetId: string, ip: string): void {
    logger.info('Audit: Admin action', { event: 'ADMIN_ACTION', adminId, action, targetId, ip });
  },

  orderPlaced(userId: string, orderId: string, ip: string): void {
    logger.info('Audit: Order placed', { event: 'ORDER_PLACED', userId, orderId, ip });
  },

  accountDeleted(userId: string, ip: string, userAgent: string): void {
    logger.warn('Audit: Account deleted', { event: 'ACCOUNT_DELETED', userId, ip, userAgent });
  },
};
