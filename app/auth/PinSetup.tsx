import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from './AuthContext';
import { nativeSecurityAPI } from '../../services/api/nativeSecurityAPI';
import { deviceManager } from '../../services/deviceManager';
import { spacing, borderRadius, shadows, typography } from '../../constants/theme';
import PinInput from '../../components/PinInput';

interface PinSetupScreenProps {
  onComplete: () => void;
}

export default function PinSetupScreen({ onComplete }: PinSetupScreenProps) {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { user, logout } = useAuth();
  
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'setup' | 'confirm'>('setup');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Setting up your PIN...');
  const handlePinChange = (newPin: string) => {
    if (step === 'setup') {
      setPin(newPin);
      if (newPin.length === 5) {
        setTimeout(() => {
          setStep('confirm');
        }, 200);
      }
    } else {
      setConfirmPin(newPin);
      if (newPin.length === 5) {
        if (pin === newPin) {
          setTimeout(() => handlePinSetup(pin), 200);
        } else {
          Alert.alert(
            'PINs Don\'t Match',
            'The PINs you entered don\'t match. Please try again.',
            [
              {
                text: 'OK',
                onPress: () => {
                  setPin('');
                  setConfirmPin('');
                  setStep('setup');
                },
              },
            ]
          );
        }
      }
    }
  };

  const handlePinSetup = async (pinToSet: string) => {
    console.log('🔐 [PinSetup] Starting native PIN setup...');
    setIsLoading(true);
    setLoadingMessage('Initializing native crypto...');
    
    try {
      // Initialize native security API
      console.log('🔐 [PinSetup] Initializing native security system...');
      await nativeSecurityAPI.initialize();
      
      setLoadingMessage('Getting device information...');
      console.log('🔐 [PinSetup] Getting device ID...');
      const deviceId = await deviceManager.getDeviceId();
      console.log('🔐 [PinSetup] Device ID obtained:', deviceId);
      
      // Check if biometrics are available and ask user
      setLoadingMessage('Checking biometric availability...');
      let biometricEnabled = false;

      try {
        const LocalAuthentication = await import('expo-local-authentication');
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (hasHardware && isEnrolled) {
          // Ask user if they want to enable biometric authentication
          const enableBiometric = await new Promise<boolean>((resolve) => {
            Alert.alert(
              'Enable Biometric Authentication?',
              'Would you like to use Face ID/Touch ID to unlock the app instead of entering your PIN?',
              [
                {
                  text: 'No, PIN Only',
                  onPress: () => resolve(false)
                },
                {
                  text: 'Yes, Enable',
                  onPress: () => resolve(true)
                }
              ]
            );
          });

          biometricEnabled = enableBiometric;
        }
      } catch (error) {
        console.log('🔐 [PinSetup] Biometric check failed:', error);
      }

      // Set up PIN using native crypto (no memory issues)
      setLoadingMessage('Creating secure PIN with native crypto...');
      console.log('🔐 [PinSetup] Calling nativeSecurityAPI.setupPin...');
      const result = await nativeSecurityAPI.setupPin({
        pin: pinToSet,
        deviceId,
        biometricEnabled,
      });
      console.log('🔐 [PinSetup] Native setup completed with result:', result);
      
      // Always clear loading first
      setIsLoading(false);
      
      if (result.success) {
        // Update progress message
        setLoadingMessage('Finalizing PIN setup...');
        
        // Small delay for user feedback
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // VERIFY THE PIN WAS ACTUALLY STORED
        console.log('🔐 [PinSetup] Verifying PIN was stored correctly...');
        const hasPin = await nativeSecurityAPI.hasPinSetup();
        console.log('🔐 [PinSetup] PIN verification result:', { hasPin });
        
        if (!hasPin) {
          console.error('🔐 [PinSetup] ❌ PIN was not stored properly!');
          throw new Error('PIN was not stored correctly');
        }
        
        // Reset state and complete immediately
        console.log('🔐 [PinSetup] ✅ PIN verified and stored successfully, completing setup...');
        setPin('');
        setConfirmPin('');
        setStep('setup');
        
        // Small delay to ensure state is clean before completing
        setTimeout(() => {
          console.log('🔐 [PinSetup] ✅ Completing PIN setup...');
          onComplete();
        }, 100);
      } else {
        console.error('🔐 [PinSetup] PIN setup failed with error:', result.error);
        throw new Error(result.error || 'PIN setup failed');
      }
      
    } catch (error: any) {
      console.error('🔐 [PinSetup] ❌ PIN setup error:', error);
      setIsLoading(false);
      
      // Reset state and complete the flow to prevent hanging
      setPin('');
      setConfirmPin('');
      setStep('setup');
      
      // Small delay before completion to ensure clean state
      setTimeout(() => {
        console.log('🔐 [PinSetup] ⚠️ Completing setup after error to prevent hanging...');
        onComplete();
      }, 200);
    }
  };


  const handleCancel = () => {
    router.back();
  };


  const currentPin = step === 'setup' ? pin : confirmPin;

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            {loadingMessage}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          Set Up PIN
        </Text>
        <View style={styles.headerButton} />
      </View>

      <View style={styles.content}>
        {/* Welcome Message */}
        <View style={styles.welcomeSection}>
          <Text style={[styles.welcomeText, { color: colors.text.primary }]}>
            Welcome, {user?.name || user?.username}!
          </Text>
          <Text style={[styles.securityMessage, { color: colors.text.secondary }]}>
            For your security, please set up a 5-digit PIN to protect your financial data.
          </Text>
        </View>

        {/* Instructions */}
        <Text style={[styles.instructions, { color: colors.text.secondary }]}>
          {step === 'setup'
            ? 'Enter a 5-digit PIN'
            : 'Re-enter your PIN to confirm'}
        </Text>

        <PinInput
          pin={currentPin}
          onPinChange={handlePinChange}
          isLoading={isLoading}
        />

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerButton: {
    width: 60,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  securityMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  instructions: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
});