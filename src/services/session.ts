import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiToken, removeApiToken, verifyApiToken } from './api';
import { saveApiToken } from './api-token';

const SESSION_KEY = '@nebubots_session';
const LAST_ACTIVITY_KEY = '@nebubots_last_activity';
const LAST_VERIFICATION_KEY = '@nebubots_last_verification';
const TOKEN_EXPIRY_DAYS = 30; // Token valid for 30 days
const VERIFICATION_CACHE_HOURS = 24; // Cache verification for 24 hours

export interface SessionData {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    image_url?: string;
  };
  createdAt: string;
  lastActivity: string;
}

/**
 * Save session data with token and user information
 */
export const saveSession = async (
  token: string,
  user: { id: number; email: string; name: string; image_url?: string }
): Promise<void> => {
  try {
    const now = new Date().toISOString();
    const sessionData: SessionData = {
      token,
      user,
      createdAt: now,
      lastActivity: now,
    };
    // Save all data in parallel for speed
    await Promise.all([
      AsyncStorage.setItem(SESSION_KEY, JSON.stringify(sessionData)),
      AsyncStorage.setItem(LAST_ACTIVITY_KEY, now),
      AsyncStorage.setItem(LAST_VERIFICATION_KEY, now), // Mark as verified on login
      saveApiToken(token),
    ]);
  } catch (error) {
    console.error('Error saving session:', error);
    throw error;
  }
};

/**
 * Get current session data
 */
export const getSession = async (): Promise<SessionData | null> => {
  try {
    const sessionData = await AsyncStorage.getItem(SESSION_KEY);
    if (!sessionData) return null;
    return JSON.parse(sessionData) as SessionData;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
};

/**
 * Update last activity timestamp
 */
export const updateLastActivity = async (): Promise<void> => {
  try {
    const now = new Date().toISOString();
    const session = await getSession();
    if (session) {
      session.lastActivity = now;
      // Update in parallel
      await Promise.all([
        AsyncStorage.setItem(LAST_ACTIVITY_KEY, now),
        AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session)),
      ]);
    } else {
      await AsyncStorage.setItem(LAST_ACTIVITY_KEY, now);
    }
  } catch (error) {
    console.error('Error updating last activity:', error);
  }
};

/**
 * Check if session is expired based on last activity
 */
export const isSessionExpired = async (): Promise<boolean> => {
  try {
    const lastActivity = await AsyncStorage.getItem(LAST_ACTIVITY_KEY);
    if (!lastActivity) return true;

    const lastActivityDate = new Date(lastActivity);
    const now = new Date();
    const daysDiff = (now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24);

    return daysDiff > TOKEN_EXPIRY_DAYS;
  } catch (error) {
    console.error('Error checking session expiry:', error);
    return true;
  }
};

/**
 * Fast local session check (no network call) - optimized for speed
 */
export const checkLocalSession = async (): Promise<{
  isValid: boolean;
  user?: { id: number; email: string; name: string; image_url?: string };
}> => {
  try {
    // Get all session data in parallel for maximum speed
    const [sessionData, lastActivity, token, lastVerification] = await Promise.all([
      AsyncStorage.getItem(SESSION_KEY),
      AsyncStorage.getItem(LAST_ACTIVITY_KEY),
      getApiToken(),
      AsyncStorage.getItem(LAST_VERIFICATION_KEY),
    ]);

    // No session data or token - fast fail
    if (!sessionData || !token) {
      return { isValid: false };
    }

    // Parse session
    const session: SessionData = JSON.parse(sessionData);
    const now = new Date();

    // Check if expired locally (fast check)
    if (lastActivity) {
      const lastActivityDate = new Date(lastActivity);
      const daysDiff = (now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysDiff > TOKEN_EXPIRY_DAYS) {
        // Clear in background, don't wait
        clearSession().catch(console.error);
        return { isValid: false };
      }
    }

    // Check if verification was recent (within cache period) - skip network check
    if (lastVerification) {
      const lastVerificationDate = new Date(lastVerification);
      const hoursDiff = (now.getTime() - lastVerificationDate.getTime()) / (1000 * 60 * 60);
      
      // If verified within last 24 hours, trust local session (skip network)
      if (hoursDiff < VERIFICATION_CACHE_HOURS) {
        return {
          isValid: true,
          user: session.user,
        };
      }
    }

    // Session exists but needs backend verification (will be done in background)
    return {
      isValid: true,
      user: session.user,
    };
  } catch (error) {
    console.error('Error checking local session:', error);
    return { isValid: false };
  }
};

/**
 * Verify token with backend (network call)
 */
export const verifySessionWithBackend = async (): Promise<{
  isValid: boolean;
  user?: { id: number; email: string; name: string };
}> => {
  try {
    const token = await getApiToken();
    if (!token) {
      return { isValid: false };
    }

    // Verify token with backend
    const verifyResponse = await verifyApiToken(token);
    if (verifyResponse.valid) {
      // Cache verification result
      await AsyncStorage.setItem(LAST_VERIFICATION_KEY, new Date().toISOString());
      await updateLastActivity();
      return {
        isValid: true,
        user: verifyResponse.user,
      };
    } else {
      await clearSession();
      return { isValid: false };
    }
  } catch (error) {
    // Network error - don't clear session, just return invalid
    console.log('Token verification error (network):', error);
    return { isValid: false };
  }
};

/**
 * Verify if stored token is still valid
 * Fast local check first, backend verification in background if needed
 */
export const verifySession = async (skipNetworkCheck: boolean = false): Promise<{
  isValid: boolean;
  user?: { id: number; email: string; name: string };
}> => {
  try {
    // Fast local check first
    const localCheck = await checkLocalSession();
    
    if (!localCheck.isValid) {
      return { isValid: false };
    }

    // If skipping network check, return local result
    if (skipNetworkCheck) {
      return localCheck;
    }

    // Background verification (don't await if recently verified)
    const lastVerification = await AsyncStorage.getItem(LAST_VERIFICATION_KEY);
    if (lastVerification) {
      const lastVerificationDate = new Date(lastVerification);
      const now = new Date();
      const hoursDiff = (now.getTime() - lastVerificationDate.getTime()) / (1000 * 60 * 60);
      
      // If verified within last 6 hours, skip network check for speed
      if (hoursDiff < 6) {
        return localCheck;
      }
    }

    // Verify with backend (with timeout)
    try {
      const backendVerification = await Promise.race([
        verifySessionWithBackend(),
        new Promise<{ isValid: boolean }>((resolve) => {
          setTimeout(() => resolve({ isValid: true }), 3000); // 3 second timeout
        }),
      ]);

      if (!backendVerification.isValid) {
        await clearSession();
        return { isValid: false };
      }

      return backendVerification;
    } catch (error) {
      // Network timeout or error - trust local session
      console.log('Backend verification timeout, using local session');
      return localCheck;
    }
  } catch (error) {
    console.error('Error verifying session:', error);
    return { isValid: false };
  }
};

/**
 * Clear all session data
 */
export const clearSession = async (): Promise<void> => {
  try {
    await Promise.all([
      AsyncStorage.removeItem(SESSION_KEY),
      AsyncStorage.removeItem(LAST_ACTIVITY_KEY),
      AsyncStorage.removeItem(LAST_VERIFICATION_KEY),
      removeApiToken(),
    ]);
  } catch (error) {
    console.error('Error clearing session:', error);
    throw error;
  }
};

/**
 * Get session user info
 */
export const getSessionUser = async (): Promise<{ id: number; email: string; name: string; image_url?: string } | null> => {
  const session = await getSession();
  return session ? session.user : null;
};
