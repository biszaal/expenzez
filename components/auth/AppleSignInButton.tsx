import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../ui';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../app/auth/AuthContext';
import { spacing, borderRadius, layout } from '../../constants/theme';

interface AppleSignInButtonProps {
  onPress: () => Promise<void>;
  type?: 'sign-in' | 'sign-up';
  disabled?: boolean;
}

export const AppleSignInButton: React.FC<AppleSignInButtonProps> = ({
  onPress,
  type = 'sign-in',
  disabled = false
}) => {
  const { isDark } = useTheme();
  const { isLoggedIn } = useAuth();
  const [isChecking, setIsChecking] = React.useState(true);
  const [isAvailable, setIsAvailable] = React.useState(false);

  React.useEffect(() => {
    // Skip initialization if user is already logged in
    if (isLoggedIn) {
      setIsChecking(false);
      setIsAvailable(false);
      return;
    }

    // Only check availability on iOS devices
    if (Platform.OS !== 'ios') {
      setIsChecking(false);
      setIsAvailable(false);
      return;
    }
    const checkAvailability = async () => {
      try {
        const available = await AppleAuthentication.isAvailableAsync();
        console.log('🍎 [AppleButton] Availability check result:', available);
        setIsAvailable(available);
      } catch (error) {
        console.log('🍎 [AppleButton] Availability check failed:', error);
        setIsAvailable(false);
      } finally {
        setIsChecking(false);
      }
    };
    
    checkAvailability();
  }, [isLoggedIn]);

  // 🚨 SECURITY: Hide Apple Sign-In if user is already authenticated
  if (isLoggedIn) {
    console.log('🚨 [SECURITY] Apple Sign-In hidden - user already authenticated');
    return null;
  }

  // Only show on iOS devices
  if (Platform.OS !== 'ios') {
    return null;
  }

  const buttonText = type === 'sign-up' ? 'Sign up with Apple' : 'Sign in with Apple';
  const unavailableText = 'Apple Sign In (Dev Build Required)';

  if (isChecking) {
    return (
      <TouchableOpacity
        style={[
          styles.appleButton,
          {
            backgroundColor: isDark ? '#666' : '#ccc',
          }
        ]}
        disabled={true}
      >
        <View style={styles.appleButtonContent}>
          <Ionicons 
            name="logo-apple" 
            size={18} 
            color={isDark ? '#ccc' : '#666'} 
            style={styles.appleIcon}
          />
          <Typography
            variant="body"
            weight="medium"
            style={[
              styles.appleButtonText,
              { color: isDark ? '#ccc' : '#666' }
            ]}
          >
            Checking Apple Sign In...
          </Typography>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.appleButton,
        {
          backgroundColor: isAvailable ? (isDark ? '#fff' : '#000') : (isDark ? '#444' : '#888'),
          opacity: (disabled || !isAvailable) ? 0.6 : 1,
        }
      ]}
      onPress={isAvailable ? onPress : undefined}
      disabled={disabled || !isAvailable}
    >
      <View style={styles.appleButtonContent}>
        <Ionicons 
          name="logo-apple" 
          size={18} 
          color={isAvailable ? (isDark ? '#000' : '#fff') : (isDark ? '#888' : '#ccc')} 
          style={styles.appleIcon}
        />
        <Typography
          variant="body"
          weight="medium"
          style={[
            styles.appleButtonText,
            { color: isAvailable ? (isDark ? '#000' : '#fff') : (isDark ? '#888' : '#ccc') }
          ]}
        >
          {isAvailable ? buttonText : unavailableText}
        </Typography>
      </View>
    </TouchableOpacity>
  );
};

export const useAppleSignIn = () => {
  const handleAppleSignIn = async (): Promise<AppleAuthentication.AppleAuthenticationCredential | null> => {
    try {
      // Check if Apple Authentication is available
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      console.log('🍎 [Apple Auth] Availability check:', { isAvailable });
      
      if (!isAvailable) {
        throw new Error('Apple Sign In is not available. This feature requires a development build with Expo SDK 54+.');
      }

      console.log('🍎 [Apple Auth] Starting sign in process...');
      
      // Request Apple Authentication
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      console.log('🍎 [Apple Auth] Sign in successful:', {
        hasIdentityToken: !!credential.identityToken,
        hasAuthorizationCode: !!credential.authorizationCode,
        hasUser: !!credential.user,
        hasEmail: !!credential.email,
      });

      return credential;
    } catch (error: any) {
      console.error('🍎 [Apple Auth] Error details:', {
        message: error.message,
        code: error.code,
        name: error.name,
        stack: error.stack?.split('\n').slice(0, 3),
      });
      
      // Handle different types of cancellation and errors
      if (error.code === 'ERR_REQUEST_CANCELED') {
        // User canceled the sign-in flow - return null to indicate cancellation
        console.log('🍎 [Apple Auth] User canceled Apple Sign In');
        return null;
      } else if (error.code === 'ERR_INVALID_RESPONSE') {
        // Apple returned an invalid response
        console.error('🍎 [Apple Auth] Invalid response:', error);
        throw new Error('Apple Sign In encountered an issue. Please try again.');
      } else if (error.code === 'ERR_REQUEST_FAILED') {
        // Network or server error
        console.error('🍎 [Apple Auth] Request failed:', error);
        throw new Error('Network error during Apple Sign In. Please check your connection.');
      } else if (error.message?.toLowerCase().includes('not available')) {
        // Apple Sign In not available - likely Expo Go limitation
        console.error('🍎 [Apple Auth] Not available (likely Expo Go limitation):', error);
        throw new Error('Apple Sign In requires a development build. Use "npx expo run:ios" or build with EAS to enable this feature.');
      } else if (error.message?.includes('development build')) {
        // Development build required
        console.error('🍎 [Apple Auth] Development build required:', error);
        throw new Error('Apple Sign In requires a development build. This feature is not supported in Expo Go.');
      }
      
      // Re-throw other errors with more context
      console.error('🍎 [Apple Auth] Unexpected error:', error);
      throw new Error(`Apple Sign In failed: ${error.message || 'Unknown error'}`);
    }
  };

  return { handleAppleSignIn };
};

const styles = StyleSheet.create({
  appleButton: {
    borderRadius: borderRadius.md,
    minHeight: layout.buttonHeight,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  appleButtonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
  },
  appleIcon: {
    marginRight: spacing.xs,
  },
  appleButtonText: {
    fontSize: 16,
  },
});