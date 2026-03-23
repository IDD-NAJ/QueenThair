import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { redisClient } from '../config/rateLimiter';
import { createAuthError, createForbiddenError } from '../utils/AppError';
import { logger } from '../config/logger';
import { query } from '../db/connection';

/**
 * Extended Request interface with user information.
 */
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'customer' | 'admin';
  };
  requestId?: string;
}

/**
 * JWT payload structure.
 */
interface JWTPayload {
  userId: string;
  email: string;
  role: 'customer' | 'admin';
  iat: number;
  exp: number;
  jti: string; // JWT ID for token blacklisting
}

/**
 * Authentication middleware.
 * Verifies JWT signature, checks expiry, and attaches req.user.
 * 
 * @throws 401 if token is missing, expired, or tampered
 */
export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createAuthError('Access token required');
    }

    const token = authHeader.substring(7);

    // Check if token is blacklisted in Redis
    const blacklisted = await redisClient.get(`blacklist:${token}`);
    if (blacklisted) {
      throw createAuthError('Token has been revoked');
    }

    // Verify JWT
    const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;

    // Attach user to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      next(createAuthError('Access token expired'));
      return;
    }
    if (error.name === 'JsonWebTokenError') {
      next(createAuthError('Invalid access token'));
      return;
    }
    next(error);
  }
};

/**
 * Admin authorization middleware.
 * Requires req.user to have role === 'admin'.
 * Must be used AFTER requireAuth middleware.
 * 
 * @throws 403 if user is not an admin
 */
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    next(createAuthError('Authentication required'));
    return;
  }

  if (req.user.role !== 'admin') {
    logger.warn('Admin access denied', {
      userId: req.user.id,
      attemptedRole: req.user.role,
      path: req.path,
    });
    next(createForbiddenError('Admin access required'));
    return;
  }

  next();
};

/**
 * Ownership verification middleware factory.
 * Confirms record.user_id === req.user.id before allowing access.
 * 
 * @param tableName - Database table to query
 * @param paramKey - Request param key containing the record ID
 * @param ownerColumn - Column name for the owner ID (default: 'user_id')
 * 
 * @example
 * router.get('/orders/:id', requireAuth, requireOwnership('orders', 'id'), getOrder);
 */
export const requireOwnership = (
  tableName: string,
  paramKey: string,
  ownerColumn: string = 'user_id'
) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw createAuthError('Authentication required');
      }

      const recordId = req.params[paramKey];
      if (!recordId) {
        throw createAuthError(`Parameter ${paramKey} is required`);
      }

      // Query the database to check ownership
      const result = await query(
        `SELECT ${ownerColumn} FROM ${tableName} WHERE id = $1`,
        [recordId]
      );

      if (result.rowCount === 0) {
        throw createAuthError('Resource not found');
      }

      const record = result.rows[0];

      // Check ownership or admin status
      if (record[ownerColumn] !== req.user.id && req.user.role !== 'admin') {
        logger.warn('Ownership check failed', {
          userId: req.user.id,
          attemptedResource: recordId,
          table: tableName,
          path: req.path,
        });
        throw createForbiddenError('You do not have permission to access this resource');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Generate JWT access token.
 * 15-minute expiry for security.
 */
export const generateAccessToken = (user: {
  id: string;
  email: string;
  role: 'customer' | 'admin';
}): string => {
  const jti = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      jti,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRY }
  );
};

/**
 * Generate JWT refresh token.
 * 7-day expiry, stored as httpOnly cookie.
 */
export const generateRefreshToken = (user: {
  id: string;
  email: string;
  role: 'customer' | 'admin';
}): string => {
  const jti = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      jti,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRY }
  );
};

/**
 * Store refresh token hash in database.
 */
export const storeRefreshToken = async (
  userId: string,
  token: string,
  ipAddress: string,
  userAgent: string
): Promise<void> => {
  // Hash the token before storing
  const bcrypt = await import('bcrypt');
  const tokenHash = await bcrypt.hash(token, env.BCRYPT_ROUNDS);

  // Calculate expiry date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, tokenHash, expiresAt, ipAddress, userAgent]
  );
};

/**
 * Verify refresh token from database.
 */
export const verifyRefreshToken = async (
  token: string
): Promise<{ userId: string; email: string; role: 'customer' | 'admin' } | null> => {
  try {
    // Decode token to get user ID
    const decoded = jwt.decode(token) as JWTPayload;
    if (!decoded) return null;

    // Find token in database
    const result = await query(
      `SELECT token_hash, revoked FROM refresh_tokens 
       WHERE user_id = $1 AND expires_at > NOW()
       ORDER BY created_at DESC`,
      [decoded.userId]
    );

    if (result.rowCount === 0) return null;

    // Verify token hash
    const bcrypt = await import('bcrypt');
    for (const row of result.rows) {
      if (row.revoked) continue;
      
      const isValid = await bcrypt.compare(token, row.token_hash);
      if (isValid) {
        return {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
        };
      }
    }

    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Revoke refresh token.
 */
export const revokeRefreshToken = async (token: string): Promise<void> => {
  const decoded = jwt.decode(token) as JWTPayload;
  if (!decoded) return;

  await query(
    'UPDATE refresh_tokens SET revoked = true WHERE user_id = $1',
    [decoded.userId]
  );
};

/**
 * Revoke all refresh tokens for a user.
 * Used on password change or account compromise.
 */
export const revokeAllUserTokens = async (userId: string): Promise<void> => {
  await query(
    'UPDATE refresh_tokens SET revoked = true WHERE user_id = $1',
    [userId]
  );
  
  logger.info('All refresh tokens revoked for user', { userId });
};

/**
 * Blacklist access token in Redis.
 * TTL matches remaining token expiry.
 */
export const blacklistToken = async (token: string): Promise<void> => {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    if (!decoded || !decoded.exp) return;

    // Calculate remaining TTL
    const now = Math.floor(Date.now() / 1000);
    const ttl = decoded.exp - now;

    if (ttl > 0) {
      await redisClient.setEx(`blacklist:${token}`, ttl, 'true');
    }
  } catch (error) {
    logger.error('Failed to blacklist token', { error: (error as Error).message });
  }
};

/**
 * Clear refresh token cookie.
 */
export const clearRefreshCookie = (res: Response): void => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: env.isProduction(),
    sameSite: 'strict',
  });
};

/**
 * Set refresh token cookie.
 */
export const setRefreshCookie = (res: Response, token: string): void => {
  // Cookie expires in 7 days
  const maxAge = 7 * 24 * 60 * 60 * 1000;
  
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: env.isProduction(),
    sameSite: 'strict',
    maxAge,
  });
};
