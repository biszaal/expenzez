import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../ui';
import { useTheme } from '../../contexts/ThemeContext';
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
  const { colors, isDark } = useTheme();

  // Only show on iOS devices
  if (Platform.OS !== 'ios') {
    return null;
  }

  const buttonText = type === 'sign-up' ? 'Sign up with Apple' : 'Sign in with Apple';

  return (
    <TouchableOpacity
      style={[
        styles.appleButton,
        {
          backgroundColor: isDark ? '#fff' : '#000',
          opacity: disabled ? 0.6 : 1,
        }
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.appleButtonContent}>
        <Ionicons 
          name="logo-apple" 
          size={18} 
          color={isDark ? '#000' : '#fff'} 
          style={styles.appleIcon}
        />
        <Typography
          variant="body"
          weight="medium"
          style={[
            styles.appleButtonText,
            { color: isDark ? '#000' : '#fff' }
          ]}
        >
          {buttonText}
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
      if (!isAvailable) {
        throw new Error('Apple Sign In is not available on this device');
      }

      // Request Apple Authentication
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      return credential;
    } catch (error: any) {
      console.log('Apple Sign In error details:', error);
      
      // Handle different types of cancellation and errors
      if (error.code === 'ERR_REQUEST_CANCELED') {
        // User canceled the sign-in flow - return null to indicate cancellation
        console.log('User canceled Apple Sign In');
        return null;
      } else if (error.code === 'ERR_INVALID_RESPONSE') {
        // Apple returned an invalid response
        console.error('Apple Sign In invalid response:', error);
        throw new Error('Apple Sign In encountered an issue. Please try again.');
      } else if (error.code === 'ERR_REQUEST_FAILED') {
        // Network or server error
        console.error('Apple Sign In request failed:', error);
        throw new Error('Network error during Apple Sign In. Please check your connection.');
      } else if (error.message?.toLowerCase().includes('not available')) {
        // Apple Sign In not available
        console.error('Apple Sign In not available:', error);
        throw new Error('Apple Sign In is not available on this device.');
      }
      
      // Re-throw other errors with more context
      console.error('Unexpected Apple Sign In error:', error);
      throw error;
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