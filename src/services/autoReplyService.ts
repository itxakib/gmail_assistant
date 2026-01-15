import { AppState, AppStateStatus } from 'react-native';
import { getSettings, fetchEmails, generateReply, sendReply, Email } from './api';
import { getApiToken } from './api-token';

let replyCheckInterval: NodeJS.Timeout | null = null;
let appStateSubscription: { remove: () => void } | null = null;
let isRunning = false;
let lastCheckedTimestamp: string | null = null;

const REPLY_CHECK_INTERVAL_MS = 15 * 60 * 1000; // Check every 15 minutes

/**
 * Start auto reply service
 */
export const startAutoReply = async (): Promise<void> => {
  if (isRunning) {
    return;
  }

  try {
    const token = await getApiToken();
    if (!token) {
      return;
    }

    const settings = await getSettings();
    if (!settings.settings.auto_reply_enabled) {
      return;
    }

    isRunning = true;

    // Perform initial check
    await checkAndReplyToEmails();

    // Set up interval
    replyCheckInterval = setInterval(async () => {
      const currentState = AppState.currentState;
      if (currentState === 'active') {
        await checkAndReplyToEmails();
      }
    }, REPLY_CHECK_INTERVAL_MS);

    // Listen to app state changes
    appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && isRunning) {
        checkAndReplyToEmails().catch(console.error);
      }
    });
  } catch (error) {
    console.error('Auto Reply: Error starting:', error);
    isRunning = false;
  }
};

/**
 * Stop auto reply service
 */
export const stopAutoReply = (): void => {
  if (!isRunning) {
    return;
  }

  isRunning = false;

  if (replyCheckInterval) {
    clearInterval(replyCheckInterval);
    replyCheckInterval = null;
  }

  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
  }

  lastCheckedTimestamp = null;
};

/**
 * Check for unread emails and reply automatically
 */
const checkAndReplyToEmails = async (): Promise<void> => {
  try {
    const token = await getApiToken();
    if (!token) {
      return;
    }

    // Double check settings before replying
    const settings = await getSettings();
    if (!settings.settings.auto_reply_enabled) {
      stopAutoReply();
      return;
    }

    // Fetch unread emails (first page only for efficiency)
    const response = await fetchEmails(1, 20);
    const unreadEmails = response.emails.filter(email => !email.read && !email.replied_at);

    if (unreadEmails.length === 0) {
      return;
    }

    // Process emails one by one
    for (const email of unreadEmails) {
      try {
        // Skip if already replied or missing required fields
        if (email.replied_at || !email.from_email || !email.to_email) {
          continue;
        }

        // Skip no-reply addresses
        const fromEmailLower = email.from_email.toLowerCase();
        if (
          fromEmailLower.includes('noreply') ||
          fromEmailLower.includes('no-reply') ||
          fromEmailLower.includes('donotreply') ||
          fromEmailLower.includes('do-not-reply') ||
          fromEmailLower.includes('mailer-daemon') ||
          fromEmailLower.includes('postmaster')
        ) {
          continue;
        }

        // Generate AI reply
        const replyResponse = await generateReply(email.id);
        const replyText = replyResponse.reply?.trim();

        if (!replyText || replyText.length === 0) {
          continue;
        }

        // Truncate if too long
        const trimmedReply = replyText.length > 50000 ? replyText.substring(0, 50000) : replyText;

        // Send the reply
        const sendResponse = await sendReply(email.id, trimmedReply);
        if (!sendResponse.success) {
          console.error(`Auto Reply: Failed to send reply for email ${email.id}: ${sendResponse.message}`);
        }

        // Add small delay between replies to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Auto Reply: Error processing email ${email.id}:`, error instanceof Error ? error.message : String(error));
        // Continue with next email even if one fails
      }
    }

    lastCheckedTimestamp = new Date().toISOString();
  } catch (error) {
    console.error('Auto Reply: Error during check:', error);
  }
};

/**
 * Initialize auto reply based on current settings
 */
export const initializeAutoReply = async (): Promise<void> => {
  try {
    const token = await getApiToken();
    if (!token) {
      return;
    }

    const settings = await getSettings();
    if (settings.settings.auto_reply_enabled) {
      await startAutoReply();
    } else {
      stopAutoReply();
    }
  } catch (error) {
    console.error('Auto Reply: Error initializing:', error);
  }
};

/**
 * Get last check timestamp
 */
export const getLastCheckTimestamp = (): string | null => {
  return lastCheckedTimestamp;
};
