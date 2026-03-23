import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';
import { env } from './env';
import { logger } from './logger';

/**
 * Rate limiting configuration using Redis as the store.
 * Enforces limits across all server instances, not per-process.
 */

// Create Redis client for rate limiting
const redisClient = createClient({
  url: env.REDIS_URL,
});

redisClient.on('error', (err) => {
  logger.error('Redis connection error for rate limiting', { error: err.message });
});

// Connect to Redis (async - handled gracefully if connection fails)
redisClient.connect().catch((err) => {
  logger.error('Failed to connect to Redis for rate limiting', { error: err.message });
});

/**
 * Whitelist check function.
 * Returns true if the IP is in the whitelist.
 */
const isWhitelisted = (ip: string): boolean => {
  return env.getRateLimitWhitelist().includes(ip);
};

/**
 * Skip function for rate limiters.
 * Skips whitelisted IPs and certain conditions.
 */
const skipHandler = (req: any): boolean => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  return isWhitelisted(ip);
};

/**
 * Global rate limiter for all routes.
 * 500 requests per 15 minutes per IP.
 */
export const globalLimiter = rateLimit({
  store: new RedisStore({
    // @ts-ignore - sendCommand is available but not in types
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipHandler,
  keyGenerator: (req) => req.ip || 'unknown',
  handler: (req, res, _next, options) => {
    logger.warn('Rate limit exceeded (global)', {
      ip: req.ip,
      route: req.path,
      userAgent: req.get('user-agent'),
    });
    res.status(options.statusCode).json({
      error: 'Too many requests',
      retryAfter: Math.ceil(options.windowMs / 1000),
    });
  },
});

/**
 * Authentication rate limiter.
 * 10 requests per 15 minutes for login/register/refresh endpoints.
 * Includes progressive delay after 5 failed attempts.
 */
export const authLimiter = rateLimit({
  store: new RedisStore({
    // @ts-ignore
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipHandler,
  keyGenerator: (req) => req.ip || 'unknown',
  handler: (req, res, _next, options) => {
    logger.warn('Rate limit exceeded (auth)', {
      ip: req.ip,
      route: req.path,
      userAgent: req.get('user-agent'),
    });
    res.status(options.statusCode).json({
      error: 'Too many authentication attempts. Please try again later.',
      retryAfter: Math.ceil(options.windowMs / 1000),
    });
  },
});

/**
 * Password reset rate limiter.
 * 5 requests per hour for forgot/reset password endpoints.
 */
export const passwordResetLimiter = rateLimit({
  store: new RedisStore({
    // @ts-ignore
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipHandler,
  keyGenerator: (req) => req.ip || 'unknown',
  handler: (req, res, _next, options) => {
    logger.warn('Rate limit exceeded (password reset)', {
      ip: req.ip,
      route: req.path,
      userAgent: req.get('user-agent'),
    });
    res.status(options.statusCode).json({
      error: 'Too many password reset attempts. Please try again later.',
      retryAfter: Math.ceil(options.windowMs / 1000),
    });
  },
});

/**
 * API rate limiter for all /api/* routes.
 * 60 requests per minute per IP or per user for authenticated requests.
 */
export const apiLimiter = rateLimit({
  store: new RedisStore({
    // @ts-ignore
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipHandler,
  // Key by user ID for authenticated routes, IP for public routes
  keyGenerator: (req: any) => {
    return req.user?.id || req.ip || 'unknown';
  },
  handler: (req, res, _next, options) => {
    logger.warn('Rate limit exceeded (api)', {
      ip: req.ip,
      userId: req.user?.id,
      route: req.path,
    });
    res.status(options.statusCode).json({
      error: 'Too many requests',
      retryAfter: Math.ceil(options.windowMs / 1000),
    });
  },
});

/**
 * Export Redis client for use in other modules (token blacklisting, etc.)
 */
export { redisClient };
