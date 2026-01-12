import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppState, AppStateStatus } from 'react-native';
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import InboxScreen from './src/screens/InboxScreen';
import AutoAssistantScreen from './src/screens/AutoAssistantScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import BottomTabBar, { Tab } from './src/components/BottomTabBar';
import { verifySession, updateLastActivity } from './src/services/session';
import { initializeAutoSync } from './src/services/autoSyncService';
import { initializeAutoReply } from './src/services/autoReplyService';
import { APP_CONFIG } from './src/config/constants';
import { AlertProvider } from './src/services/alertService';

type Screen = 'Splash' | 'Login' | 'Main';

// Safe error handler that won't crash if console is unavailable in production
const safeErrorHandler = (error: unknown) => {
  try {
    if (typeof console !== 'undefined' && console.error) {
      console.error(error);
    }
  } catch {
    // Ignore if console is not available
  }
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('Splash');
  const [activeTab, setActiveTab] = useState<Tab>('Home');
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const isMountedRef = useRef(true);

  // Expose checkSession function for SettingsScreen logout
  const checkSessionAndNavigate = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    try {
      setIsCheckingSession(true);
      
      // Run session check and minimum duration in parallel
      const [sessionResult] = await Promise.all([
        verifySession(true).catch(() => ({ isValid: false })),
        // Ensure minimum splash duration
        new Promise(resolve => setTimeout(resolve, APP_CONFIG.MIN_SPLASH_DURATION)),
      ]);
      
      // Check if component is still mounted before updating state
      if (!isMountedRef.current) return;
      
      // Wait for both to complete, then navigate
      const { isValid } = sessionResult;
      
      if (isValid) {
        // Navigate after minimum splash duration
        setCurrentScreen('Main');
        setIsCheckingSession(false);
        
        // Initialize auto sync and auto reply services after login
        initializeAutoSync().catch(safeErrorHandler);
        initializeAutoReply().catch(safeErrorHandler);
        
        // Verify with backend in background (non-blocking)
        verifySession(false).then(({ isValid: backendValid }) => {
          if (!isMountedRef.current) return;
          if (!backendValid) {
            setCurrentScreen((prevScreen) => {
              if (prevScreen === 'Main') {
                return 'Login';
              }
              return prevScreen;
            });
          }
        }).catch(() => {
          // Ignore background verification errors
        });
      } else {
        setCurrentScreen('Login');
        setIsCheckingSession(false);
      }
    } catch (error) {
      safeErrorHandler(error);
      // Ensure minimum splash even on error
      await new Promise(resolve => setTimeout(resolve, APP_CONFIG.MIN_SPLASH_DURATION));
      if (!isMountedRef.current) return;
      setCurrentScreen('Login');
      setIsCheckingSession(false);
    }
  }, []);

  // Check session on app launch
  useEffect(() => {
    checkSessionAndNavigate();
  }, [checkSessionAndNavigate]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      // App came to foreground - update last activity (non-blocking)
      updateLastActivity().catch(safeErrorHandler);
      // Verify session in background (non-blocking)
      if (currentScreen === 'Main') {
        verifySession(false).then(({ isValid }) => {
          if (!isMountedRef.current) return;
          if (!isValid) {
            setCurrentScreen('Login');
          }
        }).catch(() => {
          // Ignore verification errors in background
        });
      }
    }
  }, [currentScreen]);

  // Update last activity when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [handleAppStateChange]);


  const handleSplashFinish = () => {
    // Session check already happens on mount, this just prevents premature navigation
    // The session check will handle navigation automatically
  };

  const handleLoginSuccess = () => {
    setCurrentScreen('Main');
    // Initialize auto sync and auto reply services after login
    initializeAutoSync().catch(safeErrorHandler);
    initializeAutoReply().catch(safeErrorHandler);
  };

  const renderMainScreen = () => {
    try {
      switch (activeTab) {
        case 'Home':
          return <HomeScreen onNavigate={setActiveTab} />;
        case 'Inbox':
          return <InboxScreen onNavigate={setActiveTab} />;
        case 'Assistant':
          return <AutoAssistantScreen />;
        case 'Settings':
          return <SettingsScreen onLogout={checkSessionAndNavigate} />;
        default:
          return <HomeScreen onNavigate={setActiveTab} />;
      }
    } catch (error) {
      safeErrorHandler(error);
      // Return a fallback screen on error
      return <HomeScreen onNavigate={setActiveTab} />;
    }
  };

  return (
    <SafeAreaProvider>
      <AlertProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          {currentScreen === 'Splash' || isCheckingSession ? (
            <SplashScreen onFinish={handleSplashFinish} />
          ) : currentScreen === 'Login' ? (
            <LoginScreen onLoginSuccess={handleLoginSuccess} />
          ) : (
            <>
              {renderMainScreen()}
              <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
            </>
          )}
        </GestureHandlerRootView>
      </AlertProvider>
    </SafeAreaProvider>
  );
}
