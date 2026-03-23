import { redisClient } from '../config/rateLimiter';
import { logger } from '../config/logger';

/**
 * Metrics Collector Service.
 * Tracks rolling windows for spike detection using Redis sorted sets with TTL.
 */
class MetricsCollector {
  private readonly keyPrefix = 'metrics:';
  private readonly defaultTtl = 3600; // 1 hour

  /**
   * Record an event for tracking.
   */
  async recordEvent(
    eventType: string,
    key: string,
    value: number = 1
  ): Promise<void> {
    const fullKey = `${this.keyPrefix}${eventType}:${key}`;
    const timestamp = Date.now();
    
    try {
      // Add to sorted set with timestamp as score
      await redisClient.zAdd(fullKey, { score: timestamp, value: timestamp.toString() });
      
      // Set expiry on the key
      await redisClient.expire(fullKey, this.defaultTtl);
    } catch (error) {
      logger.error('Failed to record metric', { error: (error as Error).message, eventType, key });
    }
  }

  /**
   * Get event count within a time window.
   */
  async getEventCount(
    eventType: string,
    key: string,
    windowMs: number
  ): Promise<number> {
    const fullKey = `${this.keyPrefix}${eventType}:${key}`;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    try {
      // Remove expired entries
      await redisClient.zRemRangeByScore(fullKey, 0, windowStart);
      
      // Count entries in window
      const count = await redisClient.zCard(fullKey);
      return count;
    } catch (error) {
      logger.error('Failed to get metric count', { error: (error as Error).message, eventType, key });
      return 0;
    }
  }

  /**
   * Check if threshold is exceeded.
   */
  async isThresholdExceeded(
    eventType: string,
    key: string,
    windowMs: number,
    threshold: number
  ): Promise<boolean> {
    const count = await this.getEventCount(eventType, key, windowMs);
    return count >= threshold;
  }

  /**
   * Record a 5xx error.
   */
  async record5xxError(): Promise<void> {
    await this.recordEvent('5xx_errors', 'global');
  }

  /**
   * Check for 5xx error spike (>10 in 60 seconds).
   */
  async is5xxSpike(): Promise<boolean> {
    return this.isThresholdExceeded('5xx_errors', 'global', 60000, 10);
  }

  /**
   * Record a failed login attempt.
   */
  async recordFailedLogin(ip: string): Promise<void> {
    await this.recordEvent('failed_logins', ip);
  }

  /**
   * Check for failed login spike from an IP (>20 in 10 minutes).
   */
  async isFailedLoginSpike(ip: string): Promise<boolean> {
    return this.isThresholdExceeded('failed_logins', ip, 600000, 20);
  }

  /**
   * Record a rate limit block.
   */
  async recordRateLimitBlock(ip: string): Promise<void> {
    await this.recordEvent('rate_limit_blocks', ip);
  }

  /**
   * Check for rate limit threshold breach (>50 blocks from same IP in 5 minutes).
   */
  async isRateLimitBreach(ip: string): Promise<boolean> {
    return this.isThresholdExceeded('rate_limit_blocks', ip, 300000, 50);
  }

  /**
   * Record a password reset request.
   */
  async recordPasswordResetRequest(): Promise<void> {
    await this.recordEvent('password_reset_requests', 'global');
  }

  /**
   * Check for password reset flood (>10 in 1 hour).
   */
  async isPasswordResetFlood(): Promise<boolean> {
    return this.isThresholdExceeded('password_reset_requests', 'global', 3600000, 10);
  }

  /**
   * Record response time.
   */
  async recordResponseTime(responseTimeMs: number): Promise<void> {
    const key = `${this.keyPrefix}response_times`;
    const timestamp = Date.now();
    
    try {
      await redisClient.zAdd(key, { score: timestamp, value: responseTimeMs.toString() });
      await redisClient.expire(key, 300); // 5 minute window
    } catch (error) {
      logger.error('Failed to record response time', { error: (error as Error).message });
    }
  }

  /**
   * Calculate P95 response time over the last 5 minutes.
   */
  async getP95ResponseTime(): Promise<number> {
    const key = `${this.keyPrefix}response_times`;
    const now = Date.now();
    const windowStart = now - 300000; // 5 minutes
    
    try {
      // Remove expired entries
      await redisClient.zRemRangeByScore(key, 0, windowStart);
      
      // Get all response times in window
      const entries = await redisClient.zRange(key, 0, -1);
      
      if (entries.length === 0) return 0;
      
      // Parse and sort values
      const values = entries.map(e => parseInt(e, 10)).sort((a, b) => a - b);
      
      // Calculate P95
      const p95Index = Math.ceil(values.length * 0.95) - 1;
      return values[p95Index] || 0;
    } catch (error) {
      logger.error('Failed to calculate P95 response time', { error: (error as Error).message });
      return 0;
    }
  }

  /**
   * Record admin login IP.
   */
  async recordAdminLogin(adminId: string, ip: string): Promise<void> {
    const key = `admin_known_ips:${adminId}`;
    
    try {
      await redisClient.sAdd(key, ip);
      await redisClient.expire(key, 2592000); // 30 days
    } catch (error) {
      logger.error('Failed to record admin login IP', { error: (error as Error).message });
    }
  }

  /**
   * Check if IP is known for admin.
   */
  async isAdminKnownIp(adminId: string, ip: string): Promise<boolean> {
    const key = `admin_known_ips:${adminId}`;
    
    try {
      return await redisClient.sIsMember(key, ip);
    } catch (error) {
      logger.error('Failed to check admin known IP', { error: (error as Error).message });
      return false;
    }
  }
}

// Export singleton instance
export const metricsCollector = new MetricsCollector();
