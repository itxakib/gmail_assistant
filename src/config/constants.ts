/**
 * Application Configuration
 * Store all environment variables and constants here
 */

// Google OAuth Configuration
export const GOOGLE_WEB_CLIENT_ID = '809633911701-6k4idmbflkl03hu6lu5uk6cs5k8urln0.apps.googleusercontent.com';

// Microsoft OAuth Configuration
export const MICROSOFT_CLIENT_ID = '1710f698-09cf-4fef-9ba1-ea503b99d166';

// API Configuration
export const API_BASE_URL = 'https://nebubot-production.up.railway.app/api';

// App Configuration
export const APP_CONFIG = {
  MIN_SPLASH_DURATION: 1500, // 1.5 seconds
  EMAILS_PER_PAGE: 20,
  AUTO_SYNC_INTERVAL_MS: 15 * 60 * 1000, // 15 minutes
  AUTO_REPLY_CHECK_INTERVAL_MS: 15 * 60 * 1000, // 15 minutes
  SESSION_EXPIRY_DAYS: 30,
  VERIFICATION_CACHE_HOURS: 24,
} as const;
