import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../ui';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../app/auth/AuthContext';
import { spacing, borderRadius } from '../../constants/theme';
import { GOOGLE_WEB_CLIENT_ID } from '../../config/googleAuth';

// Android surfaces Google Play Services failures as the stringified GMS status
// int (see ErrorDto.kt in @react-native-google-signin). `statusCodes` only
// exports four of them, so the ones we care about are pinned here — otherwise
// every other failure collapses into an untraceable "please try again".
const GMS_STATUS = {
  NETWORK_ERROR: '7',
  INTERNAL_ERROR: '8',
  DEVELOPER_ERROR: '10', // package name / SHA-1 not registered for this OAuth client
  SIGN_IN_FAILED: '12500',
  SIGN_IN_CANCELLED: '12501',
  SIGN_IN_CURRENTLY_IN_PROGRESS: '12502',
} as const;

// Conditional import - only load on Android in production builds
let GoogleSignin: any;
let statusCodes: any;
let isGoogleSignInAvailable = false;

if (Platform.OS === 'android') {
  try {
    const googleModule = require('@react-native-google-signin/google-signin');
    GoogleSignin = googleModule.GoogleSignin;
    statusCodes = googleModule.statusCodes;
    isGoogleSignInAvailable = true;
  } catch (error) {
    // Google Sign-In not available (Expo Go)
    console.log('⚠️ Google Sign-In package not available. Use development build or production build.');
    isGoogleSignInAvailable = false;
  }
}

interface GoogleSignInButtonProps {
  onPress: (idToken: string, user: any) => Promise<void>;
  type?: 'sign-in' | 'sign-up';
  disabled?: boolean;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onPress,
  type = 'sign-in',
  disabled = false
}) => {
  // Hooks must be called before any conditional returns (React Rules of Hooks)
  const { colors } = useTheme();
  const { isLoggedIn } = useAuth();
  const [isChecking, setIsChecking] = React.useState(true);
  const [isSigningIn, setIsSigningIn] = React.useState(false);

  React.useEffect(() => {
    // Skip initialization if user is already logged in or Google Sign-In not available
    if (isLoggedIn || Platform.OS !== 'android' || !isGoogleSignInAvailable) {
      setIsChecking(false);
      return;
    }

    const configureGoogleSignIn = async () => {
      try {
        // Web client ID from Google Cloud Console (for backend token verification).
        // Sourced from config/googleAuth.ts so it cannot drift from app.json and
        // the backend's expected token audience.
        GoogleSignin.configure({
          webClientId: GOOGLE_WEB_CLIENT_ID,
          offlineAccess: true,
        });

        console.log('🔍 [GoogleButton] Google Sign-In configured');
        setIsChecking(false);
      } catch (error) {
        console.error('🔍 [GoogleButton] Configuration failed:', error);
        setIsChecking(false);
      }
    };

    configureGoogleSignIn();
  }, [isLoggedIn]);

  // Only show on Android devices with Google Sign-In available
  if (Platform.OS !== 'android' || !isGoogleSignInAvailable) {
    return null;
  }

  // 🚨 SECURITY: Hide Google Sign-In if user is already authenticated
  if (isLoggedIn) {
    return null;
  }

  const handleGoogleSignIn = async () => {
    if (isSigningIn) {
      return;
    }

    try {
      setIsSigningIn(true);
      console.log('🔍 [GoogleButton] Starting Google Sign-In flow...');

      // Check if device supports Google Play Services
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Sign in with Google.
      // v13 returns { type: 'success' | 'cancelled', data }, where the user
      // details and idToken live under `data` — NOT directly on the response.
      // (Accessing `userInfo.user` here threw a TypeError after a successful
      // native sign-in, which is why Android Google Sign-In always failed.)
      const response = await GoogleSignin.signIn();

      if (response.type === 'cancelled' || !response.data) {
        console.log('🔍 [GoogleButton] User cancelled sign-in');
        return;
      }

      const { user, idToken } = response.data;
      console.log('🔍 [GoogleButton] Sign-in successful:', user.email);

      // The idToken is returned directly by signIn() in v13; fall back to
      // getTokens() only if it is somehow missing.
      let token = idToken;
      if (!token) {
        const tokens = await GoogleSignin.getTokens();
        token = tokens.idToken;
      }
      console.log('🔍 [GoogleButton] Got ID token');

      // Call parent onPress handler with token and user info
      await onPress(token, user);

    } catch (error: any) {
      // `code` is a string on Android; normalise so comparisons are reliable.
      const code = error?.code != null ? String(error.code) : undefined;

      console.error('🔍 [GoogleButton] Sign-in error:', {
        code,
        message: error?.message,
        webClientId: GOOGLE_WEB_CLIENT_ID,
      });

      // statusCodes is read defensively: if the native module ever fails to
      // provide constants, a TypeError in here would swallow the real error.
      if (
        code === String(statusCodes?.SIGN_IN_CANCELLED) ||
        code === GMS_STATUS.SIGN_IN_CANCELLED
      ) {
        console.log('🔍 [GoogleButton] User cancelled sign-in');
      } else if (
        code === String(statusCodes?.IN_PROGRESS) ||
        code === GMS_STATUS.SIGN_IN_CURRENTLY_IN_PROGRESS
      ) {
        console.log('🔍 [GoogleButton] Sign-in already in progress');
      } else if (code === String(statusCodes?.PLAY_SERVICES_NOT_AVAILABLE)) {
        Alert.alert(
          'Google Play Services Required',
          'Google Play Services is not available or outdated. Please update it from the Play Store.',
          [{ text: 'OK' }]
        );
      } else if (code === GMS_STATUS.DEVELOPER_ERROR) {
        // Google returns this when Play Services cannot match this build's
        // package name + signing certificate SHA-1 to an Android OAuth client
        // in the same project as webClientId. It is always a console
        // misconfiguration, never something the user can retry their way out of.
        console.error(
          '🚨 [GoogleButton] DEVELOPER_ERROR — the SHA-1 of this build is not registered ' +
            'against an Android OAuth client in Google Cloud project ' +
            `${GOOGLE_WEB_CLIENT_ID.split('-')[0]}, for package com.biszaaltech.expenzez. ` +
            'Play App Signing re-signs uploads, so the Play build needs the App Signing ' +
            'SHA-1 registered as well as the EAS upload-key SHA-1.'
        );
        Alert.alert(
          'Google Sign-In Unavailable',
          "Google Sign-In isn't set up correctly for this build. Please sign in with your " +
            'email and password — we\'re fixing this.',
          [{ text: 'OK' }]
        );
      } else if (code === GMS_STATUS.NETWORK_ERROR) {
        Alert.alert(
          'No Connection',
          'Could not reach Google. Check your internet connection and try again.',
          [{ text: 'OK' }]
        );
      } else {
        // Surface the code — without it a failure screenshot is undiagnosable.
        Alert.alert(
          'Sign In Failed',
          'Unable to sign in with Google. Please try again or use email/password.' +
            (code ? `\n\n(Error ${code})` : ''),
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const buttonText = type === 'sign-up'
    ? (isSigningIn ? 'Signing up...' : 'Sign up with Google')
    : (isSigningIn ? 'Signing in...' : 'Sign in with Google');

  if (isChecking) {
    return (
      <TouchableOpacity
        style={[
          styles.googleButton,
          {
            backgroundColor: colors.background.secondary,
            borderColor: colors.border,
          }
        ]}
        disabled={true}
      >
        <View style={styles.googleButtonContent}>
          <Ionicons
            name="logo-google"
            size={18}
            color={colors.text.tertiary}
            style={styles.googleIcon}
          />
          <Typography
            variant="body"
            weight="medium"
            style={[
              styles.googleButtonText,
              { color: colors.text.tertiary }
            ]}
          >
            Checking Google Sign In...
          </Typography>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.googleButton,
        {
          backgroundColor: '#fff',
          borderColor: colors.border,
          opacity: disabled || isSigningIn ? 0.6 : 1,
        }
      ]}
      onPress={handleGoogleSignIn}
      disabled={disabled || isSigningIn}
    >
      <View style={styles.googleButtonContent}>
        <Ionicons
          name="logo-google"
          size={18}
          color="#4285F4"
          style={styles.googleIcon}
        />
        <Typography
          variant="body"
          weight="medium"
          style={[
            styles.googleButtonText,
            { color: '#000' }
          ]}
        >
          {buttonText}
        </Typography>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  googleButton: {
    width: '100%',
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    marginRight: spacing.sm,
  },
  googleButtonText: {
    fontSize: 15,
  },
});
