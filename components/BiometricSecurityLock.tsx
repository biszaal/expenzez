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
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../app/auth/AuthContext";
import { nativeSecurityAPI } from "../services/api/nativeSecurityAPI";
import { enhancedSecurityAPI } from "../services/api/enhancedSecurityAPI";
import { deviceManager } from "../services/deviceManager";
import { spacing, borderRadius, shadows, typography } from "../constants/theme";
import PinInput from "./PinInput";

const { width, height } = Dimensions.get('window');

interface BiometricSecurityLockProps {
  isVisible: boolean;
  onUnlock: () => Promise<void>;
}

export default function BiometricSecurityLock({ isVisible, onUnlock }: BiometricSecurityLockProps) {
  const { colors } = useTheme();
  const { isLoggedIn, user } = useAuth();
  const [pin, setPin] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [hasBiometric, setHasBiometric] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [showPinInput, setShowPinInput] = useState(false);
  const [biometricType, setBiometricType] = useState<string>("finger-print");
  const [scaleAnim] = useState(new Animated.Value(1));
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [pinAttempts, setPinAttempts] = useState(0);
  const [maxAttempts] = useState(5);
  const [showAttemptsWarning, setShowAttemptsWarning] = useState(false);

  useEffect(() => {
    if (isVisible) {
      checkBiometricAvailability();
      loadBiometricSettings();
      // Reset attempts when PIN screen becomes visible (new session)
      setPinAttempts(0);
      setShowAttemptsWarning(false);
    }
  }, [isVisible]);

  useEffect(() => {
    if (isVisible && hasBiometric && isBiometricEnabled && isLoggedIn) {
      // Auto-trigger biometric authentication when screen becomes visible
      // Only if user is still logged in
      setTimeout(() => {
        handleBiometricAuth();
      }, 500);
    }
  }, [isVisible, hasBiometric, isBiometricEnabled, isLoggedIn]);

  // Animate loading spinner
  useEffect(() => {
    if (isAuthenticating) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    } else {
      scaleAnim.setValue(1);
    }
  }, [isAuthenticating]);

  const checkBiometricAvailability = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      // Check if actual biometrics are available (not just device passcode)
      const hasFaceID = supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
      const hasTouchID = supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);
      const hasActualBiometrics = hasFaceID || hasTouchID;

      console.log('🔐 [BiometricLock] Biometric check:', {
        hasHardware,
        isEnrolled,
        supportedTypes,
        hasFaceID,
        hasTouchID,
        hasActualBiometrics
      });

      // Enable if we have hardware and enrollment - errors will be handled during actual auth
      const biometricAvailable = hasHardware && isEnrolled && hasActualBiometrics;
      setHasBiometric(biometricAvailable);
      
      // Set biometric type icon based on supported types
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType("face-recognition");
        console.log('🔐 [BiometricLock] Face ID available');
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType("finger-print");
        console.log('🔐 [BiometricLock] Touch ID/Fingerprint available');
      } else {
        setBiometricType("finger-print"); // Default fallback
        console.log('🔐 [BiometricLock] Using fingerprint icon as fallback');
      }
      
      console.log('🔐 [BiometricLock] Biometric final state:', {
        biometricAvailable,
        biometricType
      });
    } catch (error) {
      console.log('🔐 [BiometricLock] Error checking biometric availability:', error);
    }
  };

  const loadBiometricSettings = async () => {
    try {
      const biometricEnabled = await AsyncStorage.getItem("@expenzez_biometric_enabled");
      console.log('🔐 [BiometricLock] Loaded biometric setting:', biometricEnabled);
      setIsBiometricEnabled(biometricEnabled === "true");
      
      // If biometrics are available but not enabled, and user has a PIN, auto-enable biometrics
      if (!biometricEnabled && hasBiometric) {
        console.log('🔐 [BiometricLock] Biometric hardware available but not enabled, auto-enabling...');
        await AsyncStorage.setItem("@expenzez_biometric_enabled", "true");
        setIsBiometricEnabled(true);
      }
    } catch (error) {
      console.log('🔐 [BiometricLock] Error loading biometric settings:', error);
    }
  };

  const handleBiometricAuth = async () => {
    console.log('🔐 [BiometricLock] Biometric auth requested:', {
      hasBiometric,
      isBiometricEnabled,
      canProceed: hasBiometric && isBiometricEnabled
    });

    if (!hasBiometric || !isBiometricEnabled) {
      console.log('🔐 [BiometricLock] Biometric auth not available, staying on PIN screen');
      return;
    }

    setIsAuthenticating(true);

    // Signal to SecurityContext that we're authenticating
    if ((global as any).__setAuthenticating) {
      (global as any).__setAuthenticating(true);
    }

    try {
      console.log('🔐 [BiometricLock] Requesting biometric authentication...');
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock Expenzez",
        fallbackLabel: "Use App PIN",
        cancelLabel: "Cancel",
        disableDeviceFallback: true, // Only allow actual biometrics, not device passcode
        requireConfirmation: false
      });

      console.log('🔐 [BiometricLock] Biometric auth result:', result);

      if (result.success) {
        console.log('🔐 [BiometricLock] ✅ Biometric authentication successful');
        await onUnlock();

        // Reset authentication flag after delay
        setTimeout(() => {
          if ((global as any).__setAuthenticating) {
            (global as any).__setAuthenticating(false);
          }
        }, 1500);
      } else {
        console.log('🔐 [BiometricLock] ❌ Biometric authentication failed:', result);

        // Check if it's the missing usage description error (Expo Go limitation)
        if (!result.success && (result as any).error === 'missing_usage_description') {
          console.log('🔐 [BiometricLock] Face ID not available in Expo Go - disabling biometric features');
          // Disable biometric features for this session since it's not supported in Expo Go
          setHasBiometric(false);
          setIsBiometricEnabled(false);
          Alert.alert(
            "Face ID Not Available",
            "Face ID requires a development build. For now, please use your PIN to unlock the app.",
            [{ text: "OK" }]
          );
        }
      }
    } catch (error) {
      console.log('🔐 [BiometricLock] ❌ Biometric auth error:', error);
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
      
      // Auto-submit when 5 digits entered (only if not currently authenticating)
      if (newPin.length === 5 && !isAuthenticating) {
        setTimeout(() => handlePinSubmit(newPin), 100);
      }
    }
  };

  const handlePinSubmit = async (pinToCheck: string) => {
    setIsAuthenticating(true);
    try {
      // Check if user is still logged in - if not, don't attempt PIN validation
      if (!isLoggedIn) {
        console.log('🔐 [BiometricLock] User not logged in, skipping PIN validation');
        Alert.alert(
          "Session Expired", 
          "Your session has expired. Please log in again.",
          [
            {
              text: "OK",
              onPress: () => {
                // Close the PIN screen since user needs to log in
                setPin("");
                setIsAuthenticating(false);
              }
            }
          ]
        );
        return;
      }

      // Check if max attempts reached
      if (pinAttempts >= maxAttempts) {
        console.log('🔐 [BiometricLock] Max attempts reached, showing password option');
        Alert.alert(
          "Too Many Attempts", 
          "You've exceeded the maximum number of PIN attempts. Please use your account password to unlock.",
          [
            {
              text: "Use Password",
              onPress: () => setShowPasswordModal(true)
            }
          ]
        );
        setPin("");
        setIsAuthenticating(false);
        return;
      }

      const deviceId = await deviceManager.getDeviceId();
      
      console.log('🔐 [BiometricLock] Attempting PIN validation with secure API, attempt:', pinAttempts + 1);
      
      // EMERGENCY CHECK: If no PIN exists, auto-unlock to prevent infinite loop
      const hasPinSetup = await nativeSecurityAPI.hasPinSetup();
      if (!hasPinSetup) {
        await AsyncStorage.multiRemove([
          '@expenzez_security_enabled',
          '@expenzez_app_locked', 
          '@expenzez_last_unlock'
        ]);
        await onUnlock();
        return;
      }
      
      // Use cross-device PIN validation (validates against all user devices)
      const result = await enhancedSecurityAPI.validatePinCrossDevice(pinToCheck);
      
      if (result.success) {
        console.log('🔐 [BiometricLock] PIN validation successful, resetting attempts');
        setPinAttempts(0); // Reset attempts on success
        setShowAttemptsWarning(false);
        await onUnlock();
        setTimeout(() => setPin(""), 100); // Clear after successful unlock
      } else {
        // Increment attempts and show error
        const newAttempts = pinAttempts + 1;
        setPinAttempts(newAttempts);
        
        const attemptsLeft = maxAttempts - newAttempts;
        console.log('🔐 [BiometricLock] PIN validation failed, attempts left:', attemptsLeft);

        // Always show attempts warning after any failed attempt
        setShowAttemptsWarning(true);
        
        if (attemptsLeft === 0) {
          Alert.alert(
            "Too Many Attempts",
            "You've exceeded the maximum number of PIN attempts. Please use your account password to unlock.",
            [
              {
                text: "Use Password",
                onPress: () => setShowPasswordModal(true)
              }
            ]
          );
        } else {
          const warningMessage = attemptsLeft <= 2
            ? `Incorrect PIN. ${attemptsLeft} ${attemptsLeft === 1 ? 'attempt' : 'attempts'} remaining.`
            : "Incorrect PIN. Please try again.";

          console.log('🔐 [BiometricLock] Setting attempts warning in UI:', {
            showAttemptsWarning: attemptsLeft <= 2,
            attemptsRemaining: attemptsLeft
          });
        }

        // Clear PIN with slight delay to prevent rapid re-submission
        setTimeout(() => setPin(""), 300);
      }
    } catch (error: any) {
      console.error('🔐 [BiometricLock] PIN validation error:', error);

      // Handle specific error cases gracefully without technical details
      if (error.response?.status === 400) {
        // 400 means incorrect PIN - this should be handled above in the normal flow
        // If we reach here, it's likely a validation error, so treat as incorrect PIN
        const newAttempts = pinAttempts + 1;
        setPinAttempts(newAttempts);

        const attemptsLeft = maxAttempts - newAttempts;
        console.log('🔐 [BiometricLock] PIN validation failed (400 error), attempts left:', attemptsLeft);

        if (attemptsLeft <= 2) {
          setShowAttemptsWarning(true);
        }

        if (attemptsLeft === 0) {
          Alert.alert(
            "Too Many Attempts",
            "You've exceeded the maximum number of PIN attempts. Please use your account password to unlock.",
            [
              {
                text: "Use Password",
                onPress: () => setShowPasswordModal(true)
              }
            ]
          );
        } else {
          const warningMessage = attemptsLeft <= 2
            ? `Incorrect PIN. ${attemptsLeft} ${attemptsLeft === 1 ? 'attempt' : 'attempts'} remaining.`
            : "Incorrect PIN. Please try again.";

          Alert.alert("Incorrect PIN", warningMessage);
        }
      } else if (error.response?.status === 404) {
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
      } else if (error.message?.includes('Session expired') || error.response?.status === 401) {
        // Handle session expired separately without counting as PIN attempt
        Alert.alert(
          "Session Expired",
          "Your session has expired. Please use your password to unlock.",
          [
            {
              text: "Use Password",
              onPress: () => setShowPasswordModal(true)
            }
          ]
        );
      } else {
        // Network or other errors - don't count as PIN attempts
        Alert.alert(
          "Connection Error",
          "Unable to verify PIN due to connection issues. Please try again or use your password.",
          [
            {
              text: "Try Again",
              onPress: () => {}
            },
            {
              text: "Use Password",
              onPress: () => setShowPasswordModal(true)
            }
          ]
        );
      }
      // Clear PIN with delay to prevent rapid re-submission
      setTimeout(() => setPin(""), 300);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handlePasswordAuthentication = () => {
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = async () => {
    if (!password.trim()) {
      Alert.alert("Error", "Please enter your password");
      return;
    }

    setIsAuthenticating(true);
    try {
      // Debug: Log all available user data
      console.log('🔐 [BiometricLock] User from AuthContext:', user);
      console.log('🔐 [BiometricLock] Available user properties:', user ? Object.keys(user) : 'null');
      
      // Try to get user email from multiple sources
      let email = user?.email;
      
      // Check all possible email fields in user object
      if (!email && user) {
        email = user.username || (user as any).email_address || (user as any).emailAddress || (user as any).Email;
        console.log('🔐 [BiometricLock] Trying alternate user fields, found:', email?.substring(0, 3) + '***');
      }
      
      // If AuthContext doesn't have email, try AsyncStorage as fallback
      if (!email) {
        console.log('🔐 [BiometricLock] Email not in AuthContext, trying AsyncStorage fallback');
        try {
          const userString = await AsyncStorage.getItem('user');
          if (userString) {
            const storedUser = JSON.parse(userString);
            console.log('🔐 [BiometricLock] AsyncStorage user object:', storedUser);
            console.log('🔐 [BiometricLock] AsyncStorage user keys:', Object.keys(storedUser));
            email = storedUser.email || storedUser.username || storedUser.emailAddress || storedUser.Email;
            console.log('🔐 [BiometricLock] Found email in AsyncStorage:', email?.substring(0, 3) + '***');
          }
        } catch (storageError) {
          console.log('🔐 [BiometricLock] AsyncStorage fallback failed:', storageError);
        }
      } else {
        console.log('🔐 [BiometricLock] Using email from AuthContext:', email.substring(0, 3) + '***');
      }

      // If still no email, try getting from login credentials storage
      if (!email) {
        console.log('🔐 [BiometricLock] No email found, checking for stored login credentials');
        try {
          // Check all possible storage keys for login data
          const storageKeys = ['rememberMe', 'loginCredentials', 'lastLogin', 'storedLogin'];
          
          for (const key of storageKeys) {
            const storedData = await AsyncStorage.getItem(key);
            if (storedData) {
              try {
                const loginData = JSON.parse(storedData);
                console.log(`🔐 [BiometricLock] Found data in ${key}:`, loginData);
                email = loginData.email || loginData.username || loginData.identifier;
                if (email) {
                  console.log('🔐 [BiometricLock] Found email in stored login:', email?.substring(0, 3) + '***');
                  break;
                }
              } catch (parseError) {
                console.log(`🔐 [BiometricLock] Failed to parse ${key}:`, parseError);
              }
            }
          }
        } catch (loginError) {
          console.log('🔐 [BiometricLock] Stored login check failed:', loginError);
        }
      }

      if (!email) {
        console.log('🔐 [BiometricLock] No email found in any source');
        Alert.alert(
          "Authentication Error", 
          "Unable to find your account information. Please log in again.",
          [{ text: "OK" }]
        );
        setIsAuthenticating(false);
        return;
      }

      // Import auth API dynamically
      const { authAPI } = await import('../services/api');
      
      // Attempt to authenticate with Cognito
      const response = await authAPI.login({ email, password });
      
      // Check if login was successful
      const responseData = response.data || response;
      if (responseData && responseData.idToken && responseData.accessToken) {
        console.log('🔐 [BiometricLock] Password authentication successful');
        // Reset PIN attempts since user successfully used password
        setPinAttempts(0);
        setShowAttemptsWarning(false);
        // Close password modal
        setShowPasswordModal(false);
        setPassword("");
        // Unlock the app
        await onUnlock();
      } else {
        Alert.alert("Incorrect Password", "The password you entered is incorrect. Please try again.");
        setPassword("");
      }
    } catch (error: any) {
      console.error('🔐 [BiometricLock] Password authentication failed:', error);
      let errorMessage = "Password authentication failed. Please try again.";
      
      if (error.response?.status === 401 || error.message?.includes('NotAuthorizedException')) {
        errorMessage = "Incorrect password. Please try again.";
      }
      
      Alert.alert("Authentication Failed", errorMessage);
      setPassword("");
    } finally {
      setIsAuthenticating(false);
    }
  };


  if (!isVisible) return null;


  // Don't show PIN screen if user is not logged in (session expired)
  if (!isLoggedIn) {
    console.log('🔐 [BiometricLock] User not logged in, not showing PIN screen');
    return null;
  }

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
        {/* Always show PIN Input Screen */}
        <View style={styles.pinContainer}>
          {/* Title */}
          <Text style={[styles.pinTitle, { color: colors.text.primary }]}>
            Enter PIN
          </Text>

          <PinInput
            pin={pin}
            onPinChange={(newPin) => {
              setPin(newPin);
              if (newPin.length === 5 && !isAuthenticating) {
                setTimeout(() => handlePinSubmit(newPin), 100);
              }
            }}
            isLoading={isAuthenticating}
            showBiometric={hasBiometric}
            onBiometricPress={handleBiometricAuth}
            isBiometricEnabled={isBiometricEnabled}
            showPassword={true}
            onPasswordPress={handlePasswordAuthentication}
            showAttemptsWarning={showAttemptsWarning}
            attemptsRemaining={maxAttempts - pinAttempts}
          />

          {/* Loading Overlay */}
          {isAuthenticating && (
            <View style={[StyleSheet.absoluteFillObject, styles.loadingOverlay, { backgroundColor: colors.background.primary + 'CC' }]}>
              <View style={styles.loadingContainer}>
                <Animated.View style={[styles.loadingSpinner, { transform: [{ scale: scaleAnim }] }]}>
                  <Ionicons name="lock-closed" size={40} color={colors.primary[500]} />
                </Animated.View>
                <Text style={[styles.loadingText, { color: colors.text.primary }]}>
                  Verifying PIN...
                </Text>
              </View>
            </View>
          )}
        </View>
      </SafeAreaView>

      {/* Password Authentication Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
          <View style={styles.passwordModalContainer}>
            {/* Header */}
            <View style={styles.passwordModalHeader}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowPasswordModal(false);
                  setPassword("");
                }}
                disabled={isAuthenticating}
              >
                <Text style={[styles.cancelButtonText, { color: colors.primary[500] }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <Text style={[styles.passwordModalTitle, { color: colors.text.primary }]}>
                Enter Password
              </Text>
              <View style={styles.headerRight} />
            </View>

            {/* Content */}
            <View style={styles.passwordModalContent}>
              <Text style={[styles.passwordInstructions, { color: colors.text.secondary }]}>
                Please enter your account password to unlock the app
              </Text>

              <View style={[styles.passwordInputContainer, { 
                backgroundColor: colors.background.secondary,
                borderColor: colors.border.medium,
              }]}>
                <TextInput
                  style={[styles.passwordInput, { color: colors.text.primary }]}
                  placeholder="Password"
                  placeholderTextColor={colors.text.secondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoFocus
                  editable={!isAuthenticating}
                  onSubmitEditing={handlePasswordSubmit}
                />
              </View>

              <TouchableOpacity
                style={[styles.passwordSubmitButton, { 
                  backgroundColor: colors.primary[500],
                  opacity: (!password.trim() || isAuthenticating) ? 0.5 : 1
                }]}
                onPress={handlePasswordSubmit}
                disabled={!password.trim() || isAuthenticating}
              >
                {isAuthenticating ? (
                  <View style={styles.passwordSubmitContent}>
                    <Animated.View style={[styles.passwordLoadingSpinner, { transform: [{ scale: scaleAnim }] }]}>
                      <Ionicons name="sync" size={20} color="white" />
                    </Animated.View>
                    <Text style={styles.passwordSubmitButtonText}>
                      Verifying...
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.passwordSubmitButtonText}>
                    Unlock App
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
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
  loadingOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: borderRadius.xl,
    padding: spacing.xl * 2,
    minWidth: 120,
    minHeight: 120,
  },
  loadingSpinner: {
    marginBottom: spacing.md,
  },
  loadingText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: '500',
    textAlign: 'center',
  },
  passwordModalContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  passwordModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  cancelButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  cancelButtonText: {
    fontSize: typography.fontSizes.base,
    fontWeight: '500',
  },
  passwordModalTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: '600',
  },
  passwordModalContent: {
    flex: 1,
    paddingTop: spacing.xl * 2,
    alignItems: 'center',
  },
  passwordInstructions: {
    fontSize: typography.fontSizes.base,
    textAlign: 'center',
    marginBottom: spacing.xl * 2,
    paddingHorizontal: spacing.md,
    lineHeight: 22,
  },
  passwordInputContainer: {
    width: '100%',
    borderWidth: 2,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.xl * 2,
  },
  passwordInput: {
    fontSize: typography.fontSizes.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    textAlign: 'center',
  },
  passwordSubmitButton: {
    width: '100%',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  passwordSubmitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passwordSubmitButtonText: {
    color: 'white',
    fontSize: typography.fontSizes.lg,
    fontWeight: '600',
  },
  passwordLoadingSpinner: {
    marginRight: spacing.sm,
  },
  attemptsWarningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  attemptsWarningText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: '500',
  },
  alternativeSection: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  passwordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  passwordButtonText: {
    fontSize: 16,
    marginLeft: spacing.sm,
  },
  headerRight: {
    width: 60,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});