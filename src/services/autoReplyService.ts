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
      console.log('Auto Reply: No token found, stopping');
      return;
    }

    const settings = await getSettings();
    if (!settings.settings.auto_reply_enabled) {
      console.log('Auto Reply: Disabled in settings');
      return;
    }

    isRunning = true;
    console.log('Auto Reply: Starting...');

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
        // Check for new emails when app comes to foreground
        checkAndReplyToEmails().catch(console.error);
      }
    });
    console.log('Auto Reply: Started successfully');
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

  console.log('Auto Reply: Stopping...');
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
  console.log('Auto Reply: Stopped');
};

/**
 * Check for unread emails and reply automatically
 */
const checkAndReplyToEmails = async (): Promise<void> => {
  try {
    const token = await getApiToken();
    if (!token) {
      console.log('Auto Reply: No token, skipping check');
      return;
    }

    // Double check settings before replying
    const settings = await getSettings();
    if (!settings.settings.auto_reply_enabled) {
      console.log('Auto Reply: Disabled in settings, stopping');
      stopAutoReply();
      return;
    }

    console.log('Auto Reply: Checking for unread emails...');

    // Fetch unread emails (first page only for efficiency)
    const response = await fetchEmails(1, 20);
    const unreadEmails = response.emails.filter(email => !email.read && !email.replied_at);

    if (unreadEmails.length === 0) {
      console.log('Auto Reply: No unread emails to reply to');
      return;
    }

    console.log(`Auto Reply: Found ${unreadEmails.length} unread email(s)`);

    // Process emails one by one
    for (const email of unreadEmails) {
      try {
        // Skip if already replied
        if (email.replied_at) {
          continue;
        }

        console.log(`Auto Reply: Generating reply for email ${email.id}...`);

        // Generate AI reply
        const replyResponse = await generateReply(email.id);
        const replyText = replyResponse.reply;

        if (!replyText || replyText.trim().length === 0) {
          console.log(`Auto Reply: No reply generated for email ${email.id}`);
          continue;
        }

        // Send the reply
        console.log(`Auto Reply: Sending reply for email ${email.id}...`);
        const sendResponse = await sendReply(email.id, replyText);

        if (sendResponse.success) {
          console.log(`Auto Reply: Successfully replied to email ${email.id}`);
        } else {
          console.log(`Auto Reply: Failed to send reply for email ${email.id}:`, sendResponse.message);
        }

        // Add small delay between replies to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Auto Reply: Error processing email ${email.id}:`, error);
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
