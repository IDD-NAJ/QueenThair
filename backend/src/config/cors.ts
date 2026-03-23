import cors from 'cors';
import { env } from './env';
import { logger } from './logger';

/**
 * CORS (Cross-Origin Resource Sharing) configuration.
 * Only allows authorized origins to make cross-origin requests to the API.
 */

/**
 * Parse allowed origins from environment variable.
 * Returns an array of allowed origin strings.
 */
const allowedOrigins = env.getAllowedOrigins();

/**
 * Origin validation function for CORS.
 * Checks the incoming origin against the allowlist.
 * 
 * @param origin - The incoming request origin
 * @param callback - Callback to signal if origin is allowed
 */
const corsOriginValidator = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void): void => {
  // Allow requests with no origin (e.g., mobile apps, curl, Postman)
  if (!origin) {
    if (env.isProduction()) {
      // In production, log and reject requests without origin
      logger.warn('CORS: Request without origin rejected in production', { origin });
      callback(new Error('CORS policy: No origin provided'));
      return;
    }
    // In non-production, allow null origins
    callback(null, true);
    return;
  }

  // Check if origin is in the allowlist
  if (allowedOrigins.includes(origin)) {
    callback(null, true);
    return;
  }

  // Log and reject unauthorized origins
  logger.warn('CORS: Unauthorized origin rejected', { origin, allowedOrigins });
  callback(new Error('CORS policy: Origin not allowed'));
};

/**
 * CORS middleware configuration.
 */
export const corsConfig = cors({
  origin: corsOriginValidator,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-CSRF-Token'],
  credentials: true, // Required for httpOnly cookie transport
  maxAge: 86400, // Cache preflight for 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204,
});

/**
 * Handle OPTIONS preflight requests explicitly.
 * Returns 204 immediately for preflight requests.
 */
export const handlePreflight = (req: any, res: any, next: any): void => {
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
};
