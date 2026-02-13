import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Platform,
  Image,
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
  authenticateWithOutlook,
} from '../services/api';
import { saveSession } from '../services/session';
import { GOOGLE_WEB_CLIENT_ID, IOS_CLIENT_ID, MICROSOFT_CLIENT_ID } from '../config/constants';
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

  // ---------------- OUTLOOK CONFIG ----------------
  const outlookDiscovery = {
    authorizationEndpoint:
      'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  };

  // const redirectUri = AuthSession.makeRedirectUri({
  //   scheme: 'msauth',
  //   native:
  //     Platform.OS === 'android'
  //       ? 'msauth://com.gmailassistant.app/iYE37wRdkWwvRNZbe2SyARIv20s%3D'
  //       : undefined,
  // });
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: Platform.OS === 'ios' ? 'msauth.com.gmailassistant.app' : 'msauth',
    path: Platform.OS === 'ios' ? 'auth' : undefined,
    native:
      Platform.OS === 'android'
        ? 'msauth://com.gmailassistant.app/iYE37wRdkWwvRNZbe2SyARIv20s%3D'
        : undefined,
  });
  

  console.log('Redirect URI:', redirectUri);

  const [outlookRequest, outlookResponse, promptOutlookAsync] =
    AuthSession.useAuthRequest(
      {
        clientId: MICROSOFT_CLIENT_ID,
        scopes: ['openid', 'profile', 'email', 'User.Read', 'Mail.Read', 'Mail.Send'],
        redirectUri,
        responseType:
          Platform.OS === 'android'
            ? AuthSession.ResponseType.Code
            : AuthSession.ResponseType.Token,
        usePKCE: Platform.OS === 'android',
      },
      outlookDiscovery
    );

  // ---------------- GOOGLE CONFIG ----------------
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      iosClientId: IOS_CLIENT_ID,
      offlineAccess: true,
      scopes: [
        'profile',
        'email',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.modify',
      ],
    });
  }, []);

  // ---------------- EXCHANGE OUTLOOK CODE ----------------
  const exchangeCodeForToken = async (code: string) => {
    try {
      const body = new URLSearchParams({
        client_id: MICROSOFT_CLIENT_ID,
        scope: 'openid profile email User.Read Mail.Read Mail.Send',
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        code_verifier: outlookRequest?.codeVerifier || '', // <-- add this
      });
  
      const response = await fetch(
        'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString(),
        }
      );
  
      const data = await response.json();
      console.log('OUTLOOK TOKEN RESPONSE 👉', data);
  
      if (data.access_token) {
        console.log('Outlook Access Token:', data.access_token);
  
        // Optional: send token to backend
        const authResponse = await authenticateWithOutlook(data.access_token);
        await saveSession(authResponse.api_token, authResponse.user);
        onLoginSuccess?.();
      } else {
        console.log('No access token received');
      }
    } catch (err) {
      console.error('Error exchanging code:', err);
    }
  };
  
  // ---------------- HANDLE OUTLOOK RESPONSE ----------------
  useEffect(() => {
    if (outlookResponse?.type === 'success') {
      const { code, access_token } = outlookResponse.params;
  
      // ✅ iOS
      if (access_token) {
        authenticateWithOutlook(access_token)
          .then(async (authResponse) => {
            await saveSession(authResponse.api_token, authResponse.user);
            onLoginSuccess?.();
          });
      }
  
      // ✅ Android
      if (code) {
        exchangeCodeForToken(code);
      }
    }
  }, [outlookResponse]);

  // ---------------- GOOGLE SIGN-IN ----------------
  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await GoogleSignin.signOut();
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (isSuccessResponse(response)) {
        console.log('Google Sign-In successful:', response.data.user);

        const tokens = await GoogleSignin.getTokens();
        const accessToken = tokens.accessToken;

        console.log('Google Access Token obtained',accessToken);

        const authResponse = await authenticateWithGoogle(accessToken);
        console.log('API Token received:', authResponse.api_token);
        console.log('User data:', authResponse.user);

        await saveSession(authResponse.api_token, authResponse.user);

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
        console.error('Authentication error:', error);
        showAlert('Authentication Error', error instanceof Error ? error.message : String(error));
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

  // ---------------- UI ----------------
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar
        barStyle="light-content"
        translucent={Platform.OS === 'android'}
        backgroundColor={Platform.OS === 'android' ? '#6366f1' : undefined}
      />

      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/chero.jpeg')}
            style={styles.logoImage}
            resizeMode="cover"
          />
        </View>
        <Text style={styles.title}>Welcome to Chero</Text>
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

// ---------------- STYLES ----------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#6366f1' },
  header: { alignItems: 'center', paddingTop: 40, paddingBottom: 20 },
  logoContainer: { marginBottom: 24 },
  logoImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: { fontSize: 32, fontWeight: 'bold', color: '#ffffff', letterSpacing: 0.5, marginBottom: 8, textAlign: 'center' },
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