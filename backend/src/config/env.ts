import { z } from 'zod';

/**
 * Environment variable validation schema using Zod.
 * The application will refuse to start if required environment variables are missing or invalid.
 */
const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  APP_VERSION: z.string().default('1.0.0'),
  SERVER_ID: z.string().default('queenthair-api-01'),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  // Database
  DATABASE_URL: z.string().regex(
    /^postgresql:\/\/.+:.+@.+:\d+\/.+$/,
    'DATABASE_URL must be a valid PostgreSQL connection string'
  ),
  DB_POOL_MIN: z.string().transform(Number).default('2'),
  DB_POOL_MAX: z.string().transform(Number).default('10'),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // CORS
  ALLOWED_ORIGINS: z.string().min(1, 'ALLOWED_ORIGINS is required'),

  // Rate Limiting
  RATE_LIMIT_WHITELIST: z.string().default('127.0.0.1'),

  // Email
  SMTP_HOST: z.string().default('smtp.sendgrid.net'),
  SMTP_PORT: z.string().transform(Number).default('587'),
  SMTP_USER: z.string().default('apikey'),
  SMTP_PASS: z.string().min(1, 'SMTP_PASS is required for email functionality'),
  SMTP_FROM: z.string().email().default('noreply@queenthair.com'),
  ALERT_EMAIL_TO: z.string().default('admin@queenthair.com'),

  // Slack
  SLACK_WEBHOOK_URL: z.string().url().optional(),

  // Twilio
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM: z.string().optional(),
  TWILIO_ALERT_TO: z.string().optional(),

  // Security
  BCRYPT_ROUNDS: z.string().transform(Number).default('12'),

  // Frontend
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),

  // Feature Flags
  ENABLE_SMS_ALERTS: z.string().transform((v) => v === 'true').default('true'),
  ENABLE_SLACK_ALERTS: z.string().transform((v) => v === 'true').default('true'),
  ENABLE_EMAIL_ALERTS: z.string().transform((v) => v === 'true').default('true'),
});

/**
 * Parse and validate environment variables.
 * @throws Error if validation fails - application will refuse to start
 */
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:');
  parsedEnv.error.errors.forEach((error) => {
    console.error(`  - ${error.path.join('.')}: ${error.message}`);
  });
  process.exit(1);
}

/**
 * Validated environment configuration.
 * All values are guaranteed to be of the correct type and format.
 */
export const env = {
  ...parsedEnv.data,
  
  /** Parse ALLOWED_ORIGINS into an array */
  getAllowedOrigins(): string[] {
    return this.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim());
  },

  /** Parse RATE_LIMIT_WHITELIST into an array */
  getRateLimitWhitelist(): string[] {
    return this.RATE_LIMIT_WHITELIST.split(',').map((ip) => ip.trim());
  },

  /** Parse ALERT_EMAIL_TO into an array */
  getAlertEmailRecipients(): string[] {
    return this.ALERT_EMAIL_TO.split(',').map((email) => email.trim());
  },

  /** Check if running in production */
  isProduction(): boolean {
    return this.NODE_ENV === 'production';
  },

  /** Check if running in development */
  isDevelopment(): boolean {
    return this.NODE_ENV === 'development';
  },
};

export type Env = typeof env;
