import React, { useState, useEffect, useCallback } from 'react';
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

type Screen = 'Splash' | 'Login' | 'Main';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('Splash');
  const [activeTab, setActiveTab] = useState<Tab>('Home');
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Expose checkSession function for SettingsScreen logout
  const checkSessionAndNavigate = useCallback(async () => {
    try {
      setIsCheckingSession(true);
      
      // Run session check and minimum duration in parallel
      const [sessionResult] = await Promise.all([
        verifySession(true).catch(() => ({ isValid: false })),
        // Ensure minimum splash duration
        new Promise(resolve => setTimeout(resolve, APP_CONFIG.MIN_SPLASH_DURATION)),
      ]);
      
      // Wait for both to complete, then navigate
      const { isValid } = sessionResult;
      
      if (isValid) {
        // Navigate after minimum splash duration
        setCurrentScreen('Main');
        setIsCheckingSession(false);
        
        // Initialize auto sync and auto reply services after login
        initializeAutoSync().catch(console.error);
        initializeAutoReply().catch(console.error);
        
        // Verify with backend in background (non-blocking)
        verifySession(false).then(({ isValid: backendValid }) => {
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
      console.error('Error checking session:', error);
      // Ensure minimum splash even on error
      await new Promise(resolve => setTimeout(resolve, APP_CONFIG.MIN_SPLASH_DURATION));
      setCurrentScreen('Login');
      setIsCheckingSession(false);
    }
  }, []);

  // Check session on app launch
  useEffect(() => {
    checkSessionAndNavigate();
  }, [checkSessionAndNavigate]);

  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      // App came to foreground - update last activity (non-blocking)
      updateLastActivity().catch(console.error);
      // Verify session in background (non-blocking)
      if (currentScreen === 'Main') {
        verifySession(false).then(({ isValid }) => {
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
    initializeAutoSync().catch(console.error);
    initializeAutoReply().catch(console.error);
  };

  // Show splash screen while checking session
  if (currentScreen === 'Splash' || isCheckingSession) {
    return (
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SplashScreen onFinish={handleSplashFinish} />
        </GestureHandlerRootView>
      </SafeAreaProvider>
    );
  }

  const renderMainScreen = () => {
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
  };

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        {currentScreen === 'Login' ? (
          <LoginScreen onLoginSuccess={handleLoginSuccess} />
        ) : (
          <>
            {renderMainScreen()}
            <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
          </>
        )}
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
