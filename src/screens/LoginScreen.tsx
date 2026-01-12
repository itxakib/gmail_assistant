import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  GoogleSignin,
  isSuccessResponse,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import {
  authenticateWithGoogle,
} from '../services/api';
import { saveSession } from '../services/session';
import { GOOGLE_WEB_CLIENT_ID, MICROSOFT_CLIENT_ID } from '../config/constants';
import { useAlert } from '../services/alertService';

WebBrowser.maybeCompleteAuthSession();

interface LoginScreenProps {
  onLoginSuccess?: () => void;
}

export default function LoginScreen({
  onLoginSuccess,
}: LoginScreenProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const [isLoading, setIsLoading] = useState(false);

  // Outlook OAuth configuration
  const outlookDiscovery = {
    authorizationEndpoint:
      'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  };

  const [outlookRequest, outlookResponse, promptOutlookAsync] =
    AuthSession.useAuthRequest(
      {
        clientId: MICROSOFT_CLIENT_ID,
        scopes: ['openid', 'profile', 'email', 'User.Read'],
        redirectUri: AuthSession.makeRedirectUri(),
        responseType: AuthSession.ResponseType.Token,
      },
      outlookDiscovery
    );

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      offlineAccess: true,
      scopes: [
        'profile',
        'email',
        'https://www.googleapis.com/auth/gmail.readonly', // read emails
        'https://www.googleapis.com/auth/gmail.send', // send emails
        'https://www.googleapis.com/auth/gmail.modify', // read/write/delete
      ],
    });
  }, []);

  // Handle Outlook response
  useEffect(() => {
    if (outlookResponse?.type === 'success') {
      const { access_token } = outlookResponse.params;
      console.log('OUTLOOK ACCESS TOKEN 👉', access_token);
      onLoginSuccess?.();
    } else if (outlookResponse?.type === 'error') {
      console.log('Outlook sign-in error:', outlookResponse.error);
    }
  }, [outlookResponse, onLoginSuccess]);

  // Google Sign-In with Gmail scopes
  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);

      // Sign out first to ensure fresh sign-in
      await GoogleSignin.signOut();
      await GoogleSignin.hasPlayServices();

      // Sign in with Google
      const response = await GoogleSignin.signIn();

      if (isSuccessResponse(response)) {
        console.log('Google Sign-In successful:', response.data.user);

        // Get access token from Google
        const tokens = await GoogleSignin.getTokens();
        const accessToken = tokens.accessToken;
        console.log('Google Access Token obtained');

        // Authenticate with Nebubots backend
        console.log('Authenticating with Nebubots API...');
        const authResponse = await authenticateWithGoogle(accessToken);
        console.log('API Token received:', authResponse.api_token);
        console.log('User data:', authResponse.user);

        // Save session with token and user data
        await saveSession(authResponse.api_token, authResponse.user);
        console.log('Session saved successfully');

        // Navigate to main screen
        onLoginSuccess?.();
      }
    } catch (error) {
      setIsLoading(false);

      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.SIGN_IN_CANCELLED:
            showAlert('Sign-In Cancelled', 'You cancelled the sign-in process.');
            break;
          case statusCodes.IN_PROGRESS:
            showAlert('Sign-In In Progress', 'Sign-in is already in progress.');
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            showAlert(
              'Play Services Unavailable',
              'Google Play Services is not available on this device.'
            );
            break;
          default:
            console.error('Google Sign-in error:', error);
            showAlert('Sign-In Error', 'An error occurred during sign-in. Please try again.');
        }
      } else {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred. Please try again.';
        console.error('Authentication error:', error);
        showAlert('Authentication Error', errorMessage);
      }
    }
  };

  const handleOutlookSignIn = () => {
    if (outlookRequest) {
      promptOutlookAsync();
    } else {
      console.log('Outlook request not ready yet');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar
        barStyle="light-content"
        translucent={Platform.OS === 'android'}
        backgroundColor={Platform.OS === 'android' ? '#6366f1' : undefined}
      />

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
            disabled={isLoading}
          >
            <View style={styles.buttonContent}>
              {isLoading ? (
                <ActivityIndicator color="#4285f4" />
              ) : (
                <>
                  <View style={styles.iconContainer}>
                    <Text style={styles.googleIcon}>G</Text>
                  </View>
                  <Text style={styles.buttonText}>Sign in with Google</Text>
                </>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.outlookButton]}
            onPress={handleOutlookSignIn}
            activeOpacity={0.8}
            disabled={!outlookRequest}
          >
            <View style={styles.buttonContent}>
              <View
                style={[styles.iconContainer, styles.outlookIconContainer]}
              >
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
  container: { flex: 1, backgroundColor: '#6366f1' },
  header: { alignItems: 'center', paddingTop: 40, paddingBottom: 20 },
  logoContainer: { marginBottom: 24 },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: { fontSize: 48, fontWeight: 'bold', color: '#6366f1' },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: { fontSize: 16, color: '#e0e7ff', fontWeight: '500', letterSpacing: 0.3, textAlign: 'center' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  description: { fontSize: 16, color: '#c7d2fe', textAlign: 'center', marginBottom: 40, lineHeight: 24 },
  buttonContainer: { gap: 16 },
  button: { width: '100%', height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  googleButton: { backgroundColor: '#ffffff' },
  outlookButton: { backgroundColor: '#0078d4' },
  buttonContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  iconContainer: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  outlookIconContainer: { backgroundColor: 'rgba(255, 255, 255, 0.3)' },
  googleIcon: { fontSize: 18, fontWeight: 'bold', color: '#4285f4' },
  outlookIcon: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#1f2937', letterSpacing: 0.3 },
  outlookButtonText: { fontSize: 16, fontWeight: '600', color: '#ffffff', letterSpacing: 0.3 },
  footer: { paddingHorizontal: 32, alignItems: 'center' },
  footerText: { fontSize: 12, color: '#c7d2fe', textAlign: 'center', lineHeight: 18 },
});
