import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface LoginScreenProps {
  onLoginSuccess?: () => void;
}

export default function LoginScreen({
  onLoginSuccess,
}: LoginScreenProps): React.JSX.Element {
  const insets = useSafeAreaInsets();

  const handleGoogleSignIn = () => {
    console.log('Sign in with Google');
    setTimeout(() => {
      onLoginSuccess?.();
    }, 500);
  };

  const handleOutlookSignIn = () => {
    console.log('Sign in with Outlook');
    setTimeout(() => {
      onLoginSuccess?.();
    }, 500);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>N</Text>
          </View>
        </View>
        <Text style={styles.title}>Welcome to Nebubots</Text>
        <Text style={styles.subtitle}>AI-Powered Email Assistant</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.description}>
          Connect your email account to get started
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.googleButton]}
            onPress={handleGoogleSignIn}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <View style={styles.iconContainer}>
                <Text style={styles.googleIcon}>G</Text>
              </View>
              <Text style={styles.buttonText}>Sign in with Google</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.outlookButton]}
            onPress={handleOutlookSignIn}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <View style={[styles.iconContainer, styles.outlookIconContainer]}>
                <Text style={styles.outlookIcon}>O</Text>
              </View>
              <Text style={styles.outlookButtonText}>Sign in with Outlook</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <Text style={styles.footerText}>
          By continuing, you agree to our Terms of Service
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6366f1',
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#e0e7ff',
    fontWeight: '500',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  description: {
    fontSize: 16,
    color: '#c7d2fe',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  buttonContainer: {
    gap: 16,
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  googleButton: {
    backgroundColor: '#ffffff',
  },
  outlookButton: {
    backgroundColor: '#0078d4', // Outlook blue
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  outlookIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4285f4',
  },
  outlookIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    letterSpacing: 0.3,
  },
  outlookButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  footer: {
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#c7d2fe',
    textAlign: 'center',
    lineHeight: 18,
  },
});
