import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { query } from '../db/connection';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { alertService } from './alert.service';

/**
 * Password Reset Service.
 * Implements cryptographically secure password reset flow.
 */

/**
 * Generate a secure password reset token.
 * Uses crypto.randomBytes for cryptographically secure random generation.
 */
export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash a token for database storage (using SHA-256).
 * Only the hash is stored, the raw token is sent to the user.
 */
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Create a password reset token and store it in the database.
 */
export const createPasswordResetToken = async (
  userId: string,
  email: string,
  ipAddress: string,
  userAgent: string
): Promise<string | null> => {
  try {
    // Generate raw token and hash
    const rawToken = generateResetToken();
    const tokenHash = hashToken(rawToken);

    // Set expiry to 15 minutes from now
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // Store in database
    await query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, tokenHash, expiresAt, ipAddress, userAgent]
    );

    logger.info('Password reset token created', { userId, email, ipAddress });

    return rawToken;
  } catch (error) {
    logger.error('Failed to create password reset token', { 
      error: (error as Error).message, 
      userId,
      email 
    });
    return null;
  }
};

/**
 * Verify a password reset token.
 * Returns the user ID if valid, null if invalid.
 */
export const verifyResetToken = async (rawToken: string): Promise<string | null> => {
  try {
    const tokenHash = hashToken(rawToken);

    // Look up the token
    const result = await query(
      `SELECT user_id, expires_at, used 
       FROM password_reset_tokens 
       WHERE token_hash = $1`,
      [tokenHash]
    );

    if (result.rowCount === 0) {
      return null;
    }

    const token = result.rows[0];

    // Check if already used
    if (token.used) {
      return null;
    }

    // Check if expired
    if (new Date() > new Date(token.expires_at)) {
      return null;
    }

    return token.user_id;
  } catch (error) {
    logger.error('Failed to verify reset token', { error: (error as Error).message });
    return null;
  }
};

/**
 * Reset a user's password.
 * Validates token, hashes new password, updates user, marks token used, revokes refresh tokens.
 */
export const resetPassword = async (
  rawToken: string,
  newPassword: string,
  ipAddress: string
): Promise<{ success: boolean; message: string }> => {
  try {
    // Verify the token
    const userId = await verifyResetToken(rawToken);

    if (!userId) {
      // Return generic error - never reveal if token expired or was already used
      return { success: false, message: 'Invalid or expired reset token' };
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);

    // Update user's password
    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [passwordHash, userId]
    );

    // Mark token as used
    const tokenHash = hashToken(rawToken);
    await query(
      'UPDATE password_reset_tokens SET used = true WHERE token_hash = $1',
      [tokenHash]
    );

    // Revoke all refresh tokens for the user (force re-login)
    await query(
      'UPDATE refresh_tokens SET revoked = true WHERE user_id = $1',
      [userId]
    );

    // Delete all other unused reset tokens for this user
    await query(
      `DELETE FROM password_reset_tokens 
       WHERE user_id = $1 AND token_hash != $2 AND used = false`,
      [userId, tokenHash]
    );

    // Log the event
    logger.info('Password reset completed', { userId, ipAddress });

    // Send alert for security monitoring
    alertService.send({
      timestamp: new Date(),
      severity: 'medium',
      title: 'Password Reset Completed',
      description: `User ${userId} has reset their password from IP ${ipAddress}`,
      environment: env.NODE_ENV,
      serverId: env.SERVER_ID,
      affectedUserId: userId,
    });

    return { success: true, message: 'Password reset successful' };
  } catch (error) {
    logger.error('Failed to reset password', { 
      error: (error as Error).message,
      ipAddress 
    });
    return { success: false, message: 'Failed to reset password' };
  }
};

/**
 * Send password reset email.
 * Generates the reset link with the raw token.
 */
export const sendPasswordResetEmail = async (
  email: string,
  rawToken: string
): Promise<boolean> => {
  try {
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${rawToken}`;

    // Email sending would be implemented here using nodemailer
    // For now, log the reset URL (in production, this would be sent via email)
    logger.info('Password reset email prepared', { 
      email, 
      resetUrl: resetUrl.substring(0, resetUrl.indexOf('?') + 10) + '...' // Log partial URL only
    });

    return true;
  } catch (error) {
    logger.error('Failed to send password reset email', { 
      error: (error as Error).message,
      email 
    });
    return false;
  }
};

/**
 * Forgot password handler.
 * ALWAYS returns the same response regardless of whether email exists.
 * This prevents user enumeration attacks.
 */
export const forgotPassword = async (
  email: string,
  ipAddress: string,
  userAgent: string
): Promise<{ message: string }> => {
  try {
    // Look up user by email
    const userResult = await query(
      'SELECT id, email FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (userResult.rowCount === 0) {
      // User not found - return same message anyway to prevent enumeration
      logger.info('Password reset requested for non-existent email', { email, ipAddress });
      return { 
        message: 'If an account with that email exists, a reset link has been sent.' 
      };
    }

    const user = userResult.rows[0];

    // Create reset token
    const rawToken = await createPasswordResetToken(
      user.id,
      user.email,
      ipAddress,
      userAgent
    );

    if (!rawToken) {
      // Return same message even if token creation failed
      return { 
        message: 'If an account with that email exists, a reset link has been sent.' 
      };
    }

    // Send reset email
    await sendPasswordResetEmail(user.email, rawToken);

    logger.info('Password reset email sent', { userId: user.id, email, ipAddress });

    return { 
      message: 'If an account with that email exists, a reset link has been sent.' 
    };
  } catch (error) {
    logger.error('Failed to process forgot password request', { 
      error: (error as Error).message,
      email,
      ipAddress 
    });
    // Still return the same message on error
    return { 
      message: 'If an account with that email exists, a reset link has been sent.' 
    };
  }
};
