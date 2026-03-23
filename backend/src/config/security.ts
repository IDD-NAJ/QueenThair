import helmet from 'helmet';
import { env } from '../config/env';

/**
 * Helmet.js security headers configuration.
 * Applied only in production environments.
 */

/**
 * Content Security Policy configuration.
 * Defines allowed sources for scripts, styles, images, etc.
 */
const contentSecurityPolicy = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      // Allow scripts from same origin only
      // Add trusted CDN domains if needed:
      // 'https://cdn.jsdelivr.net',
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'", // Required for some CSS-in-JS solutions
      // Add trusted style sources:
      // 'https://fonts.googleapis.com',
    ],
    imgSrc: [
      "'self'",
      'data:',
      'blob:',
      // Allow product images from storage:
      'https://*.amazonaws.com', // S3
      'https://*.supabase.co',   // Supabase Storage
    ],
    connectSrc: [
      "'self'",
      // API endpoints:
      'https://api.queenthair.com',
      // Payment processors:
      'https://api.stripe.com',
    ],
    fontSrc: [
      "'self'",
      // 'https://fonts.gstatic.com',
    ],
    objectSrc: ["'none'"], // Disable Flash/object embeds
    mediaSrc: ["'self'"],
    frameSrc: [
      "'self'",
      // Payment iframes:
      'https://js.stripe.com',
    ],
    upgradeInsecureRequests: env.isProduction() ? [] : undefined,
  },
};

/**
 * Permissions Policy configuration.
 * Disables unnecessary browser features.
 */
const permissionsPolicy = {
  camera: "'none'",
  microphone: "'none'",
  geolocation: "'none'",
  payment: "'self'",
  usb: "'none'",
  magnetometer: "'none'",
  gyroscope: "'none'",
  speaker: "'self'",
  vibrate: "'none'",
  fullscreen: "'self'",
};

/**
 * Helmet configuration object.
 */
export const helmetConfig = helmet({
  contentSecurityPolicy: env.isProduction() ? contentSecurityPolicy : false,
  
  crossOriginEmbedderPolicy: env.isProduction(),
  
  crossOriginOpenerPolicy: {
    policy: 'same-origin',
  },
  
  crossOriginResourcePolicy: {
    policy: 'same-site',
  },
  
  dnsPrefetchControl: {
    allow: false,
  },
  
  expectCt: env.isProduction() ? {
    maxAge: 86400,
    enforce: true,
  } : undefined,
  
  frameguard: {
    action: 'deny',
  },
  
  hidePoweredBy: true,
  
  hsts: env.isProduction() ? {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  } : undefined,
  
  ieNoOpen: true,
  
  noSniff: true,
  
  originAgentCluster: true,
  
  permittedCrossDomainPolicies: {
    permittedPolicies: 'none',
  },
  
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
  
  xssFilter: true,
  
  // Add permissions policy (Permissions-Policy header)
  ...(env.isProduction() && {
    // @ts-ignore - permissionsPolicy is available in newer helmet versions
    permissionsPolicy: {
      features: permissionsPolicy,
    },
  }),
});
