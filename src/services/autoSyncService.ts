import { AppState, AppStateStatus } from 'react-native';
import { getSettings, syncEmails } from './api';
import { getApiToken } from './api-token';

let syncInterval: NodeJS.Timeout | null = null;
let appStateSubscription: { remove: () => void } | null = null;
let isRunning = false;

const SYNC_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes default

/**
 * Start auto sync service
 */
export const startAutoSync = async (): Promise<void> => {
  if (isRunning) {
    return;
  }

  try {
    const token = await getApiToken();
    if (!token) {
      console.log('Auto Sync: No token found, stopping');
      return;
    }

    const settings = await getSettings();
    if (!settings.settings.auto_sync_enabled) {
      console.log('Auto Sync: Disabled in settings');
      return;
    }

    isRunning = true;
    console.log('Auto Sync: Starting...');

    // Perform initial sync
    await performSync();

    // Set up interval based on frequency (convert hours to milliseconds)
    const frequencyMs = (settings.settings.auto_sync_frequency || 1) * 60 * 60 * 1000;
    syncInterval = setInterval(async () => {
      const currentState = AppState.currentState;
      if (currentState === 'active') {
        await performSync();
      }
    }, frequencyMs);

    // Listen to app state changes
    appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && isRunning) {
        // Perform sync when app comes to foreground
        performSync().catch(console.error);
      }
    });
    console.log('Auto Sync: Started successfully');
  } catch (error) {
    console.error('Auto Sync: Error starting:', error);
    isRunning = false;
  }
};

/**
 * Stop auto sync service
 */
export const stopAutoSync = (): void => {
  if (!isRunning) {
    return;
  }

  console.log('Auto Sync: Stopping...');
  isRunning = false;

  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }

  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
  }

  console.log('Auto Sync: Stopped');
};

/**
 * Perform email sync
 */
const performSync = async (): Promise<void> => {
  try {
    const token = await getApiToken();
    if (!token) {
      console.log('Auto Sync: No token, skipping sync');
      return;
    }

    // Double check settings before syncing
    const settings = await getSettings();
    if (!settings.settings.auto_sync_enabled) {
      console.log('Auto Sync: Disabled in settings, stopping');
      stopAutoSync();
      return;
    }

    console.log('Auto Sync: Syncing emails...');
    const response = await syncEmails();
    
    if (response.success) {
      console.log('Auto Sync: Sync completed successfully');
    } else {
      console.log('Auto Sync: Sync failed:', response.message);
    }
  } catch (error) {
    console.error('Auto Sync: Error during sync:', error);
  }
};

/**
 * Initialize auto sync based on current settings
 */
export const initializeAutoSync = async (): Promise<void> => {
  try {
    const token = await getApiToken();
    if (!token) {
      return;
    }

    const settings = await getSettings();
    if (settings.settings.auto_sync_enabled) {
      await startAutoSync();
    } else {
      stopAutoSync();
    }
  } catch (error) {
    console.error('Auto Sync: Error initializing:', error);
  }
};
