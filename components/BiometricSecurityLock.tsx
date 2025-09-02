import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  Dimensions,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../contexts/ThemeContext";
import { spacing, borderRadius, shadows, typography } from "../constants/theme";

const { width, height } = Dimensions.get('window');

interface BiometricSecurityLockProps {
  isVisible: boolean;
  onUnlock: () => Promise<void>;
}

export default function BiometricSecurityLock({ isVisible, onUnlock }: BiometricSecurityLockProps) {
  const { colors } = useTheme();
  const [pin, setPin] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [hasBiometric, setHasBiometric] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [showPinInput, setShowPinInput] = useState(false);
  const [biometricType, setBiometricType] = useState<string>("finger-print");
  const [scaleAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (isVisible) {
      checkBiometricAvailability();
      loadBiometricSettings();
    }
  }, [isVisible]);

  useEffect(() => {
    if (isVisible && hasBiometric && isBiometricEnabled) {
      // Auto-trigger biometric authentication when screen becomes visible
      setTimeout(() => {
        handleBiometricAuth();
      }, 500);
    }
  }, [isVisible, hasBiometric, isBiometricEnabled]);

  const checkBiometricAvailability = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      const biometricAvailable = hasHardware && isEnrolled;
      setHasBiometric(biometricAvailable);
      
      // Set biometric type icon based on supported types
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType("face-recognition");
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType("finger-print");
      }
      
    } catch (error) {
      // Silently handle error
    }
  };

  const loadBiometricSettings = async () => {
    try {
      const biometricEnabled = await AsyncStorage.getItem("@expenzez_biometric_enabled");
      setIsBiometricEnabled(biometricEnabled === "true");
    } catch (error) {
      // Silently handle error
    }
  };

  const handleBiometricAuth = async () => {
    if (!hasBiometric || !isBiometricEnabled) {
      return; // Don't show PIN fallback, just stay on PIN screen
    }

    setIsAuthenticating(true);
    
    // Signal to SecurityContext that we're authenticating
    if ((global as any).__setAuthenticating) {
      (global as any).__setAuthenticating(true);
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock Expenzez",
        fallbackLabel: "Use PIN",
        cancelLabel: "Cancel",
      });
      
      if (result.success) {
        await onUnlock();
        
        // Reset authentication flag after delay
        setTimeout(() => {
          if ((global as any).__setAuthenticating) {
            (global as any).__setAuthenticating(false);
          }
        }, 1500);
      }
    } catch (error) {
      // Silently handle error
    } finally {
      setIsAuthenticating(false);
      
      // Reset authentication flag
      setTimeout(() => {
        if ((global as any).__setAuthenticating) {
          (global as any).__setAuthenticating(false);
        }
      }, 500);
    }
  };

  const handlePinPress = (digit: string) => {
    if (digit === 'backspace') {
      setPin(prev => prev.slice(0, -1));
    } else if (digit === 'biometric') {
      handleBiometricAuth();
    } else if (pin.length < 5) {
      const newPin = pin + digit;
      setPin(newPin);
      
      // Auto-submit when 5 digits entered
      if (newPin.length === 5) {
        setTimeout(() => handlePinSubmit(newPin), 100);
      }
    }
  };

  const handlePinSubmit = async (pinToCheck: string) => {
    try {
      const storedPassword = await AsyncStorage.getItem("@expenzez_app_password");
      
      if (!storedPassword) {
        Alert.alert(
          "No PIN Set Up", 
          "You need to set up a PIN first. Please go to Settings > Security to set up your PIN.",
          [
            {
              text: "OK",
              onPress: () => {
                // You could navigate to security settings here if needed
              }
            }
          ]
        );
        return;
      }

      if (pinToCheck === storedPassword) {
        await onUnlock();
        setPin("");
      } else {
        Alert.alert("Incorrect PIN", "Please try again.");
        setPin("");
      }
    } catch (error) {
      Alert.alert("Error", "Authentication failed. Please try again.");
      setPin("");
    }
  };

  const PinDot = ({ filled }: { filled: boolean }) => (
    <View style={[
      styles.pinDot,
      { 
        borderColor: colors.primary[500],
        backgroundColor: filled ? colors.primary[500] : 'transparent'
      }
    ]} />
  );

  const NumberButton = ({ digit, onPress }: { digit: string, onPress: (digit: string) => void }) => (
    <TouchableOpacity
      style={[
        styles.numberButton,
        { 
          backgroundColor: colors.background.secondary,
          borderWidth: 1,
          borderColor: colors.border.medium
        }
      ]}
      onPress={() => onPress(digit)}
      activeOpacity={0.7}
    >
      <Text style={[styles.numberButtonText, { color: colors.text.primary }]}>
        {digit}
      </Text>
    </TouchableOpacity>
  );

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      animationType="fade"
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
        {/* Always show PIN Input Screen */}
        <View style={styles.pinContainer}>
          {/* Title */}
          <Text style={[styles.pinTitle, { color: colors.text.primary }]}>
            Enter PIN
          </Text>

          {/* PIN Dots */}
          <View style={styles.pinDotsContainer}>
            {[0, 1, 2, 3, 4].map(index => (
              <PinDot key={index} filled={index < pin.length} />
            ))}
          </View>

          {/* Number Pad */}
          <View style={styles.numberPad}>
            <View style={styles.numberRow}>
              <NumberButton digit="1" onPress={handlePinPress} />
              <NumberButton digit="2" onPress={handlePinPress} />
              <NumberButton digit="3" onPress={handlePinPress} />
            </View>
            <View style={styles.numberRow}>
              <NumberButton digit="4" onPress={handlePinPress} />
              <NumberButton digit="5" onPress={handlePinPress} />
              <NumberButton digit="6" onPress={handlePinPress} />
            </View>
            <View style={styles.numberRow}>
              <NumberButton digit="7" onPress={handlePinPress} />
              <NumberButton digit="8" onPress={handlePinPress} />
              <NumberButton digit="9" onPress={handlePinPress} />
            </View>
            <View style={styles.numberRow}>
              {/* Face ID Button - always show if biometrics are supported */}
              <TouchableOpacity
                style={[
                  styles.specialButton,
                  { 
                    backgroundColor: colors.background.secondary,
                    borderWidth: 1,
                    borderColor: colors.border.medium,
                    opacity: (hasBiometric && isBiometricEnabled) ? 1 : 0.5
                  }
                ]}
                onPress={() => handlePinPress('biometric')}
                disabled={!hasBiometric || !isBiometricEnabled}
              >
                <Ionicons name="finger-print" size={28} color={colors.primary[500]} />
              </TouchableOpacity>
              
              <NumberButton digit="0" onPress={handlePinPress} />
              
              {/* Backspace Button */}
              <TouchableOpacity
                style={[
                  styles.specialButton,
                  { 
                    backgroundColor: colors.background.secondary,
                    borderWidth: 1,
                    borderColor: colors.border.medium
                  }
                ]}
                onPress={() => handlePinPress('backspace')}
              >
                <Ionicons name="backspace-outline" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  biometricContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  biometricIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl * 2,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl * 3,
  },
  statusText: {
    fontSize: typography.fontSizes.lg,
    textAlign: 'center',
    fontWeight: '400',
  },
  pinFallbackButton: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    position: 'absolute',
    bottom: 120,
  },
  pinFallbackText: {
    fontSize: typography.fontSizes.base,
    fontWeight: '400',
  },
  pinContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  pinTitle: {
    fontSize: typography.fontSizes.xl * 1.3,
    fontWeight: '300',
    marginBottom: spacing.xl * 3,
    marginTop: -spacing.xl * 2,
  },
  pinDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 160,
    marginBottom: spacing.xl * 4,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  numberPad: {
    alignItems: 'center',
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: width * 0.7,
    marginBottom: spacing.xl * 1.2,
  },
  numberButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberButtonText: {
    fontSize: typography.fontSizes.xl * 2.2,
    fontWeight: '200',
  },
  specialButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceIdRow: {
    width: width * 0.7,
    alignItems: 'flex-start',
    marginBottom: spacing.xl * 1.2,
  },
  faceIdButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});