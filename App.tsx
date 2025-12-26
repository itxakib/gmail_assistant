import React, { useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import InboxScreen from './src/screens/InboxScreen';
import ComposeEmailScreen from './src/screens/ComposeEmailScreen';
import AutoAssistantScreen from './src/screens/AutoAssistantScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import BottomTabBar, { Tab } from './src/components/BottomTabBar';

type Screen = 'Splash' | 'Login' | 'Main';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('Splash');
  const [activeTab, setActiveTab] = useState<Tab>('Home');

  const handleSplashFinish = () => {
    setCurrentScreen('Login');
  };

  const handleLoginSuccess = () => {
    setCurrentScreen('Main');
  };

  const renderMainScreen = () => {
    switch (activeTab) {
      case 'Home':
        return <HomeScreen onNavigate={setActiveTab} />;
      case 'Inbox':
        return <InboxScreen onNavigate={setActiveTab} />;
      case 'Compose':
        return <ComposeEmailScreen onNavigate={setActiveTab} />;
      case 'Assistant':
        return <AutoAssistantScreen />;
      case 'Settings':
        return <SettingsScreen />;
      default:
        return <HomeScreen onNavigate={setActiveTab} />;
    }
  };

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        {currentScreen === 'Splash' ? (
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
    </SafeAreaProvider>
  );
}
