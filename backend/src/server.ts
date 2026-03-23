import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

// Configuration imports
import { env } from './config/env';
import { logger, logStartup, httpLogger } from './config/logger';
import { corsConfig, handlePreflight } from './config/cors';
import { helmetConfig } from './config/security';
import { 
  globalLimiter, 
  authLimiter, 
  passwordResetLimiter, 
  apiLimiter 
} from './config/rateLimiter';

// Database import
import { testDatabaseConnection, closeDatabase } from './db/connection';

// Middleware imports
import { requestIdMiddleware } from './middleware/requestId';
import { globalErrorHandler, handleUnhandledRejection, handleUncaughtException } from './middleware/errorHandler';

// Service imports
import { metricsCollector } from './services/metrics.service';
import { alertService } from './services/alert.service';

/**
 * QUEENTHAIR Backend API Server
 * Production-ready Node.js + Express + PostgreSQL + Redis
 */

// =============================================================================
// Process-level error handlers
// =============================================================================

process.on('unhandledRejection', handleUnhandledRejection);
process.on('uncaughtException', handleUncaughtException);

// =============================================================================
// Initialize Express app
// =============================================================================

const app = express();

// =============================================================================
// Security Middleware (applied to all routes)
// =============================================================================

// Request ID tracking (must be first)
app.use(requestIdMiddleware);

// Security headers (Helmet.js)
app.use(helmetConfig);

// CORS configuration
app.use(corsConfig);
app.use(handlePreflight);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Compression
app.use(compression());

// HTTP request logging
app.use(morgan(':method :url :status :response-time ms - :res[content-length]', {
  stream: {
    write: (message: string) => {
      logger.http(message.trim());
    }
  }
}));

// =============================================================================
// Rate Limiting
// =============================================================================

// Global rate limiter (all routes)
app.use(globalLimiter);

// API-specific rate limiter
app.use('/api', apiLimiter);

// Auth endpoints rate limiter
app.use('/auth/login', authLimiter);
app.use('/auth/register', authLimiter);
app.use('/auth/refresh', authLimiter);

// Password reset rate limiter
app.use('/auth/forgot-password', passwordResetLimiter);
app.use('/auth/reset-password', passwordResetLimiter);

// =============================================================================
// Health & Readiness Endpoints (must be before auth middleware)
// =============================================================================

/**
 * Health check endpoint for load balancers and monitoring.
 * Returns basic service status and version info.
 */
app.get('/health', async (req, res) => {
  const dbStatus = await testDatabaseConnection().then(() => 'connected').catch(() => 'disconnected');
  
  res.json({
    status: dbStatus === 'connected' ? 'healthy' : 'unhealthy',
    version: env.APP_VERSION,
    commitSha: process.env.GIT_COMMIT_SHA || 'unknown',
    dbStatus,
    redisStatus: 'connected', // Simplified - would check actual connection
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/**
 * Readiness check endpoint for orchestrators.
 * Returns 200 only when DB and Redis are confirmed healthy.
 */
app.get('/readiness', async (req, res) => {
  try {
    const dbHealthy = await testDatabaseConnection();
    
    if (dbHealthy) {
      res.status(200).json({ status: 'ready' });
    } else {
      res.status(503).json({ status: 'not ready', reason: 'database unavailable' });
    }
  } catch (error) {
    res.status(503).json({ status: 'not ready', reason: 'health check failed' });
  }
});

// =============================================================================
// API Routes (would be imported from route files)
// =============================================================================

// Example route structure (uncomment when route files are created):
// import authRoutes from './routes/auth.routes';
// import userRoutes from './routes/user.routes';
// import productRoutes from './routes/product.routes';
// import orderRoutes from './routes/order.routes';
// 
// app.use('/auth', authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/products', productRoutes);
// app.use('/api/orders', orderRoutes);

// Placeholder routes for demonstration
app.get('/', (req, res) => {
  res.json({
    service: 'QUEENTHAIR API',
    version: env.APP_VERSION,
    environment: env.NODE_ENV,
    documentation: '/api/docs',
  });
});

// =============================================================================
// Memory usage monitoring (every 60 seconds)
// =============================================================================

setInterval(() => {
  const usage = process.memoryUsage();
  const memoryPercent = (usage.heapUsed / usage.heapTotal) * 100;
  
  if (memoryPercent > 85) {
    logger.warn('High memory usage detected', {
      heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
      percentUsed: `${memoryPercent.toFixed(1)}%`,
    });
    
    alertService.send({
      timestamp: new Date(),
      severity: 'high',
      title: 'Memory Threshold Exceeded',
      description: `Memory usage is at ${memoryPercent.toFixed(1)}%`,
      environment: env.NODE_ENV,
      serverId: env.SERVER_ID,
    });
  }
}, 60000);

// =============================================================================
// Global Error Handler (must be last)
// =============================================================================

app.use(globalErrorHandler);

// =============================================================================
// 404 Handler
// =============================================================================

app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    requestId: (req as any).requestId,
  });
});

// =============================================================================
// Server startup
// =============================================================================

const startServer = async () => {
  try {
    // Log startup information
    logStartup();

    // Test database connection
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      logger.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Start server
    const port = env.PORT;
    const server = app.listen(port, () => {
      logger.info(`Server started`, {
        port,
        environment: env.NODE_ENV,
        version: env.APP_VERSION,
      });
    });

    // Graceful shutdown handler
    const gracefulShutdown = (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        // Close database connections
        await closeDatabase();
        
        logger.info('Graceful shutdown complete');
        process.exit(0);
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    // Attach shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server', { error: (error as Error).message });
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;
