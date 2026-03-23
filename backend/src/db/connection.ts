import { Pool, PoolClient, QueryResult } from 'pg';
import { env } from '../config/env';
import { logger } from '../config/logger';

/**
 * PostgreSQL database connection pool configuration.
 * Used for all database operations throughout the application.
 */

/**
 * Database connection pool.
 * Configured with environment-specific settings.
 */
export const dbPool = new Pool({
  connectionString: env.DATABASE_URL,
  min: env.DB_POOL_MIN,
  max: env.DB_POOL_MAX,
  // Connection timeout
  connectionTimeoutMillis: 5000,
  // Idle timeout
  idleTimeoutMillis: 30000,
  // Connection lifetime
  maxUses: 7500,
});

/**
 * Database connection event handlers.
 */
dbPool.on('connect', () => {
  logger.info('New database connection established');
});

dbPool.on('error', (err) => {
  logger.error('Unexpected database pool error', { error: err.message });
});

/**
 * Test database connection on startup.
 * @returns Promise<boolean> - True if connection successful
 */
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    const client = await dbPool.connect();
    const result: QueryResult = await client.query('SELECT NOW() as current_time');
    client.release();
    
    logger.info('Database connection successful', {
      currentTime: result.rows[0].current_time,
    });
    return true;
  } catch (error: any) {
    logger.error('Database connection failed', { error: error.message });
    return false;
  }
};

/**
 * Execute a query with parameters.
 * Uses parameterized queries to prevent SQL injection.
 * 
 * @param text - SQL query text
 * @param params - Query parameters
 * @returns Query result
 */
export const query = async (text: string, params?: any[]): Promise<QueryResult> => {
  const start = Date.now();
  try {
    const result = await dbPool.query(text, params);
    const duration = Date.now() - start;
    
    // Log slow queries (over 100ms)
    if (duration > 100) {
      logger.warn('Slow query detected', {
        query: text,
        duration: `${duration}ms`,
        rows: result.rowCount,
      });
    }
    
    return result;
  } catch (error: any) {
    logger.error('Database query error', {
      query: text,
      error: error.message,
    });
    throw error;
  }
};

/**
 * Get a client from the pool for transactions.
 * Remember to release the client when done!
 * 
 * @returns Database client
 */
export const getClient = async (): Promise<PoolClient> => {
  const client = await dbPool.connect();
  const query = client.query.bind(client);
  const release = client.release.bind(client);
  
  // Log queries in development
  if (env.isDevelopment()) {
    // @ts-ignore - monkey patching for logging
    client.query = async (...args: any[]) => {
      const start = Date.now();
      // @ts-ignore
      const result = await query(...args);
      const duration = Date.now() - start;
      logger.debug('Query executed', {
        query: args[0],
        duration: `${duration}ms`,
        rows: result.rowCount,
      });
      return result;
    };
  }
  
  return client;
};

/**
 * Close all database connections.
 * Used for graceful shutdown.
 */
export const closeDatabase = async (): Promise<void> => {
  await dbPool.end();
  logger.info('Database connections closed');
};
