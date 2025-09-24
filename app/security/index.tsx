import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
  ScrollView,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import * as LocalAuthentication from "expo-local-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSecurity } from "../../contexts/SecurityContext";
import { useTheme } from "../../contexts/ThemeContext";
import { enhancedSecurityAPI } from "../../services/api/enhancedSecurityAPI";
import { nativeSecurityAPI } from "../../services/api/nativeSecurityAPI";
import { deviceManager } from "../../services/deviceManager";
import PinInput from "../../components/PinInput";
import {
  spacing,
  borderRadius,
  shadows,
  typography,
} from "../../constants/theme";

export default function SecurityScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const {
    isSecurityEnabled,
    needsPinSetup,
    securityPreferences,
    enableSecurity,
    disableSecurity,
    checkSecurityStatus,
    syncSecurityPreferences,
    unlockApp,
    extendSession
  } = useSecurity();
  const [hasBiometric, setHasBiometric] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPinVerification, setShowPinVerification] = useState(false);
  const [pinInput, setPinInput] = useState('');

  // Auto-verification effect
  React.useEffect(() => {
    if (pinInput.length === 5 && !isLoading) {
      console.log('🔐 [Security] useEffect: PIN length 5, triggering auto-verification');
      const timeoutId = setTimeout(() => {
        console.log('🔐 [Security] useEffect: Executing verification after timeout');
        verifyPinAndDisableSecurity();
      }, 200);

      // Cleanup timeout if component unmounts or pinInput changes
      return () => clearTimeout(timeoutId);
    }
  }, [pinInput, isLoading]);

  // Local state to force UI updates when context state changes
  const [localSecurityEnabled, setLocalSecurityEnabled] = useState(isSecurityEnabled);

  // Debouncing refs to prevent excessive API calls
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitializedRef = useRef(false);

  // Sync local state with context state
  React.useEffect(() => {
    if (isSecurityEnabled !== localSecurityEnabled) {
      setLocalSecurityEnabled(isSecurityEnabled);
    }
  }, [isSecurityEnabled, localSecurityEnabled]);


  // Debounced security status check to prevent excessive API calls
  const debouncedCheckSecurityStatus = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      checkSecurityStatus();
    }, 300);
  }, [checkSecurityStatus]);

  React.useEffect(() => {
    const initializeScreen = async () => {
      if (isInitializedRef.current) {
        return;
      }

      isInitializedRef.current = true;

      // Extend unlock session when accessing security settings to prevent auto-lock during disable
      try {
        await extendSession();
      } catch (error) {
        console.warn('Failed to extend session:', error);
      }

      // Load all settings
      checkBiometricAvailability();
      loadBiometricSettings();

      // Use debounced check to prevent excessive API calls
      debouncedCheckSecurityStatus();
    };

    initializeScreen();
  }, []); // Remove checkSecurityStatus from dependencies to prevent infinite loop

  // Refresh security status when screen comes into focus (debounced)
  useFocusEffect(
    React.useCallback(() => {
      const refreshWithDelay = async () => {
        // Extend unlock session to prevent auto-lock while in security settings
        try {
          await extendSession();
        } catch (error) {
          console.warn('Failed to extend unlock session:', error);
        }

        // Only check security status with a delay if needed
        setTimeout(async () => {
          // Force component re-render by checking local state without triggering API calls
          const securityEnabled = await AsyncStorage.getItem('@expenzez_security_enabled');

          // Only sync local state if there's a clear mismatch
          if (securityEnabled === 'true' && !isSecurityEnabled) {
            console.log('🔐 [SecuritySettings] Syncing enabled state from storage');
            setLocalSecurityEnabled(true);
          } else if (securityEnabled === 'false' && isSecurityEnabled) {
            console.log('🔐 [SecuritySettings] Syncing disabled state from storage');
            setLocalSecurityEnabled(false);
          }
        }, 100); // Reduced delay to make UI more responsive
      };
      refreshWithDelay();
    }, [isSecurityEnabled, extendSession]) // Include extendSession dependency
  );

  // React to direct security state changes (without excessive API calls)
  React.useEffect(() => {
    console.log('🔐 [SecuritySettings] Security state changed:', { isSecurityEnabled });
    // Only update biometric settings when security state changes
    if (isSecurityEnabled) {
      checkBiometricAvailability();
      loadBiometricSettings();
    }
  }, [isSecurityEnabled]);

  // Cleanup debounce timeout on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setHasBiometric(hasHardware && isEnrolled);
    } catch (error) {
      console.error("Error checking biometric availability:", error);
    }
  };

  const loadBiometricSettings = async () => {
    try {
      const biometricEnabled = await AsyncStorage.getItem(
        "@expenzez_biometric_enabled"
      );
      setIsBiometricEnabled(biometricEnabled === "true");
    } catch (error) {
      console.error("Error loading biometric settings:", error);
    }
  };

  const handleSecurityToggle = async (enabled: boolean) => {
    setIsLoading(true);
    try {
      if (enabled) {
        // ALWAYS require creating a new PIN when enabling security
        // This ensures fresh PIN creation after any disable/reset
        Alert.alert(
          "Create PIN",
          "You need to create a 5-digit PIN to enable app security.",
          [
            { 
              text: "Cancel", 
              style: "cancel",
              onPress: () => {
                // Reset loading state when cancelled
                setIsLoading(false);
              }
            },
            {
              text: "Create PIN",
              onPress: () => {
                // Don't clear loading here - let the user see we're navigating
                console.log('🔐 [Security] Navigating to PIN creation (always create new PIN)');
                router.push('/security/create-pin');
                // Clear loading after a short delay
                setTimeout(() => setIsLoading(false), 500);
              }
            }
          ]
        );
        return; // Don't execute finally block immediately
      } else {
        Alert.alert(
          "Disable Security",
          "Enter your PIN to disable app security. This will remove password protection.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Enter PIN",
              style: "destructive",
              onPress: () => {
                setPinInput('');
                setShowPinVerification(true);
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error("Error toggling security:", error);
      Alert.alert("Error", "Failed to update security settings.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricToggle = async (enabled: boolean) => {
    if (!hasBiometric) {
      Alert.alert(
        "Biometric Not Available",
        "Biometric authentication is not available on this device."
      );
      return;
    }

    try {
      await AsyncStorage.setItem(
        "@expenzez_biometric_enabled",
        enabled.toString()
      );
      setIsBiometricEnabled(enabled);

      Alert.alert(
        enabled ? "Biometric Enabled" : "Biometric Disabled",
        enabled
          ? "You can now use biometric authentication to unlock the app."
          : "Biometric authentication has been disabled."
      );
    } catch (error) {
      console.error("Error toggling biometric:", error);
      Alert.alert("Error", "Failed to update biometric settings.");
    }
  };

  const changePassword = () => {
    Alert.alert(
      "Change PIN",
      "This will require you to verify your account password and current PIN. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          onPress: () => {
            router.push("/security/change-pin");
          },
        },
      ]
    );
  };

  const verifyPinAndDisableSecurity = async () => {
    console.log('🔐 [Security] verifyPinAndDisableSecurity called', {
      isLoading,
      pinInputLength: pinInput.length,
      pinInput: pinInput.replace(/./g, '*') // Hide PIN in logs
    });

    // Prevent multiple calls while loading or invalid PIN length
    if (isLoading) {
      console.log('🔐 [Security] Already loading, skipping verification');
      return;
    }

    if (pinInput.length !== 5) {
      console.log('🔐 [Security] PIN length not 5, skipping verification');
      return;
    }

    try {
      console.log('🔐 [Security] Starting PIN verification...');
      setIsLoading(true);

      let validation: { success: boolean; error?: any } = { success: false };

      const deviceId = await deviceManager.getDeviceId();
      console.log('🔐 [Security] Got device ID:', deviceId.slice(0, 8) + '...');

      console.log('🔐 [Security] Calling nativeSecurityAPI.validatePin...');
      validation = await nativeSecurityAPI.validatePin({
        pin: pinInput,
        deviceId,
      });
      console.log('🔐 [Security] PIN validation completed:', validation);

      console.log('🔐 [Security] PIN validation result:', validation.success);

      if (validation.success) {
        // PIN is correct, proceed with disabling security
        console.log('🔐 [Security] PIN correct, disabling security...');

        // Small delay to show success state
        await new Promise(resolve => setTimeout(resolve, 500));

        setShowPinVerification(false);
        setPinInput('');

        console.log('🔐 [Security] Calling unlockApp...');
        await unlockApp();
        console.log('🔐 [Security] Calling disableSecurity...');
        await disableSecurity();
        console.log('🔐 [Security] Security disabled successfully');

        Alert.alert(
          "Security Disabled",
          "App security has been disabled successfully."
        );
      } else {
        // PIN is incorrect - reset PIN input and show error
        console.log('🔐 [Security] PIN incorrect, showing error');
        setPinInput('');
        Alert.alert(
          "Incorrect PIN",
          "The PIN you entered is incorrect. Please try again. (Try 00000 for test mode)",
          [
            {
              text: "Try Again",
              onPress: () => {
                console.log('🔐 [Security] User chose to try again');
                setPinInput('');
              }
            },
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => {
                console.log('🔐 [Security] User cancelled verification');
                setShowPinVerification(false);
                setPinInput('');
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error("🔐 [Security] Error verifying PIN:", error);
      console.error("🔐 [Security] Error details:", {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      });
      setPinInput('');
      Alert.alert(
        "Verification Failed",
        `Failed to verify PIN: ${error?.message || 'Unknown error'}. Try 00000 for test mode.`,
        [
          {
            text: "Try Again",
            onPress: () => {
              console.log('🔐 [Security] User chose to retry after error');
              setPinInput('');
            }
          },
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => {
              console.log('🔐 [Security] User cancelled after error');
              setShowPinVerification(false);
              setPinInput('');
            }
          }
        ]
      );
    } finally {
      console.log('🔐 [Security] PIN verification completed, clearing loading');
      setIsLoading(false);
    }
  };

  const resetSecurity = () => {
    Alert.alert(
      "Reset Security Settings",
      "This will remove all security settings and require you to set them up again. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              // IMMEDIATE UNLOCK: Unlock the app immediately before resetting security
              await unlockApp();

              await AsyncStorage.multiRemove([
                "@expenzez_app_password",
                "@expenzez_security_enabled",
                "@expenzez_biometric_enabled",
                "@expenzez_app_locked",
              ]);
              await disableSecurity();
              Alert.alert(
                "Security Reset",
                "All security settings have been reset."
              );
            } catch (error) {
              console.error("Error resetting security:", error);
              Alert.alert("Error", "Failed to reset security settings.");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background.secondary },
      ]}
    >
      {/* Header */}
      <View
        style={[styles.header, { backgroundColor: colors.background.primary }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={[
              styles.backButton,
              { backgroundColor: colors.background.secondary },
              shadows.sm,
            ]}
            onPress={() => router.back()}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={colors.primary[500]}
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            Security Settings
          </Text>
          <View style={styles.headerRight} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* App Security Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            App Security
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.background.primary },
              shadows.sm,
            ]}
          >
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View
                  style={[
                    styles.settingIcon,
                    { backgroundColor: colors.primary[100] },
                  ]}
                >
                  <Ionicons
                    name="lock-closed"
                    size={20}
                    color={colors.primary[500]}
                  />
                </View>
                <View style={styles.settingContent}>
                  <Text
                    style={[
                      styles.settingTitle,
                      { color: colors.text.primary },
                    ]}
                  >
                    App Lock
                  </Text>
                  <Text
                    style={[
                      styles.settingSubtitle,
                      { color: colors.text.secondary },
                    ]}
                  >
                    {securityPreferences?.appLockEnabled ?
                      "Synced across all devices" :
                      "Require PIN to unlock app"
                    }
                  </Text>
                </View>
              </View>
              <Switch
                value={localSecurityEnabled}
                onValueChange={handleSecurityToggle}
                disabled={isLoading}
                trackColor={{
                  false: colors.gray[200],
                  true: colors.primary[500],
                }}
                thumbColor={localSecurityEnabled ? "white" : colors.gray[300]}
              />
            </View>
          </View>
        </View>

        {/* Device PIN Setup Section */}
        {isSecurityEnabled && needsPinSetup && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Device Setup Required
            </Text>
            <View
              style={[
                styles.card,
                { backgroundColor: colors.warning[50], borderWidth: 1, borderColor: colors.warning[200] },
                shadows.sm,
              ]}
            >
              <TouchableOpacity
                style={styles.settingItem}
                onPress={() => router.push('/security/create-pin')}
              >
                <View style={styles.settingLeft}>
                  <View
                    style={[
                      styles.settingIcon,
                      { backgroundColor: colors.warning[100] },
                    ]}
                  >
                    <Ionicons
                      name="warning"
                      size={20}
                      color={colors.warning[600]}
                    />
                  </View>
                  <View style={styles.settingContent}>
                    <Text
                      style={[
                        styles.settingTitle,
                        { color: colors.warning[700] },
                      ]}
                    >
                      Set up PIN for this device
                    </Text>
                    <Text
                      style={[
                        styles.settingSubtitle,
                        { color: colors.warning[600] },
                      ]}
                    >
                      App lock is enabled but this device needs a PIN
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.warning[500]}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Security Status Section */}
        {securityPreferences && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Security Status
            </Text>
            <View
              style={[
                styles.card,
                { backgroundColor: colors.background.primary },
                shadows.sm,
              ]}
            >
              <View style={styles.infoItem}>
                <Ionicons
                  name="shield-checkmark"
                  size={16}
                  color={securityPreferences.appLockEnabled ? colors.success[500] : colors.gray[400]}
                />
                <Text style={[styles.infoText, { color: colors.text.secondary }]}>
                  App Lock: {securityPreferences.appLockEnabled ? 'Enabled across all devices' : 'Disabled'}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons
                  name="phone-portrait"
                  size={16}
                  color={!needsPinSetup ? colors.success[500] : colors.warning[500]}
                />
                <Text style={[styles.infoText, { color: colors.text.secondary }]}>
                  This Device: {needsPinSetup ? 'PIN setup required' : 'PIN configured'}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons
                  name="time"
                  size={16}
                  color={colors.primary[500]}
                />
                <Text style={[styles.infoText, { color: colors.text.secondary }]}>
                  Session Timeout: {Math.round((securityPreferences.sessionTimeout || 300000) / 60000)} minutes
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Biometric Authentication Section */}
        {hasBiometric && localSecurityEnabled && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Biometric Authentication
            </Text>
            <View
              style={[
                styles.card,
                { backgroundColor: colors.background.primary },
                shadows.sm,
              ]}
            >
              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <View
                    style={[
                      styles.settingIcon,
                      { backgroundColor: colors.success[100] },
                    ]}
                  >
                    <Ionicons
                      name="finger-print"
                      size={20}
                      color={colors.success[500]}
                    />
                  </View>
                  <View style={styles.settingContent}>
                    <Text
                      style={[
                        styles.settingTitle,
                        { color: colors.text.primary },
                      ]}
                    >
                      Biometric Login
                    </Text>
                    <Text
                      style={[
                        styles.settingSubtitle,
                        { color: colors.text.secondary },
                      ]}
                    >
                      Use fingerprint or face ID
                    </Text>
                  </View>
                </View>
                <Switch
                  value={isBiometricEnabled}
                  onValueChange={handleBiometricToggle}
                  trackColor={{
                    false: colors.gray[200],
                    true: colors.success[500],
                  }}
                  thumbColor={isBiometricEnabled ? "white" : colors.gray[300]}
                />
              </View>
            </View>
          </View>
        )}

        {/* Password Management Section */}
        {localSecurityEnabled && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Password Management
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.background.primary },
              shadows.sm,
            ]}
          >
            <TouchableOpacity
              style={styles.settingItem}
              onPress={changePassword}
            >
              <View style={styles.settingLeft}>
                <View
                  style={[
                    styles.settingIcon,
                    { backgroundColor: colors.warning[100] },
                  ]}
                >
                  <Ionicons name="key" size={20} color={colors.warning[500]} />
                </View>
                <View style={styles.settingContent}>
                  <Text
                    style={[
                      styles.settingTitle,
                      { color: colors.text.primary },
                    ]}
                  >
                    Change PIN
                  </Text>
                  <Text
                    style={[
                      styles.settingSubtitle,
                      { color: colors.text.secondary },
                    ]}
                  >
                    Update your 5-digit PIN
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.gray[400]}
              />
            </TouchableOpacity>
          </View>
        </View>
        )}

        {/* Security Info Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Security Information
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.background.primary },
              shadows.sm,
            ]}
          >
            <View style={styles.infoItem}>
              <Ionicons
                name="shield-checkmark"
                size={20}
                color={colors.success[500]}
              />
              <Text style={[styles.infoText, { color: colors.text.secondary }]}>
                Your financial data is encrypted and secure
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons
                name="lock-closed"
                size={20}
                color={colors.primary[500]}
              />
              <Text style={[styles.infoText, { color: colors.text.secondary }]}>
                App locks automatically when backgrounded
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons
                name="finger-print"
                size={20}
                color={colors.success[500]}
              />
              <Text style={[styles.infoText, { color: colors.text.secondary }]}>
                Biometric authentication available
              </Text>
            </View>
          </View>
        </View>

        {/* Reset Security Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[
              styles.resetButton,
              { backgroundColor: colors.error[100] },
              shadows.sm,
            ]}
            onPress={resetSecurity}
          >
            <Ionicons name="refresh" size={20} color={colors.error[500]} />
            <Text
              style={[styles.resetButtonText, { color: colors.error[500] }]}
            >
              Reset Security Settings
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* PIN Verification Screen */}
      <Modal
        visible={showPinVerification}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => {
          setPinInput('');
          setShowPinVerification(false);
        }}
      >
        <View style={[styles.verificationContainer, { backgroundColor: colors.background.primary }]}>
          <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.verificationHeader}>
            <TouchableOpacity
              onPress={() => {
                setPinInput('');
                setShowPinVerification(false);
              }}
              style={[styles.closeButton, { backgroundColor: colors.background.secondary }]}
            >
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={[styles.verificationTitle, { color: colors.text.primary }]}>
              Verify Your PIN
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Content */}
          <View style={styles.verificationContent}>
            {/* Title Section */}
            <View style={styles.verificationTextSection}>
              <Text style={[styles.verificationMainText, { color: colors.text.primary }]}>
                Disable App Security
              </Text>
              <Text style={[styles.verificationSubText, { color: colors.text.secondary }]}>
                Enter your 5-digit PIN to remove app lock protection
              </Text>
            </View>

            {/* PIN Input Section */}
            <View style={styles.verificationPinSection}>
              <PinInput
                pin={pinInput}
                onPinChange={(newPin) => {
                  console.log('🔐 [Security] PIN input changed:', {
                    oldLength: pinInput.length,
                    newLength: newPin.length,
                    isLoading
                  });

                  setPinInput(newPin);

                  // Auto-verification is handled by useEffect above
                }}
                isLoading={isLoading}
                maxLength={5}
                showBiometric={false}
              />

              {/* Fixed Height Status Container */}
              <View style={styles.statusContainer}>
                {isLoading ? (
                  <View style={styles.loadingSection}>
                    <ActivityIndicator size="small" color={colors.primary[500]} />
                    <Text style={[styles.statusText, { color: colors.primary[500], marginLeft: spacing.sm }]}>
                      Verifying PIN...
                    </Text>
                  </View>
                ) : (
                  <View style={{ height: 40 }} />
                )}
              </View>

              {/* Spacer to maintain layout */}
              <View style={{ height: 60 }} />
            </View>

            {/* Emergency Manual Button (hidden unless needed) */}
            {pinInput.length === 5 && !isLoading && false && (
              <TouchableOpacity
                style={[styles.manualVerifyButton, { backgroundColor: colors.error[500] }]}
                onPress={() => {
                  console.log('🔐 [Security] Manual verify button pressed');
                  verifyPinAndDisableSecurity();
                  }}
                >
                  <Text style={[styles.manualVerifyButtonText, { color: 'white' }]}>
                    Disable Security
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Loading Overlay */}
            {isLoading && (
              <View style={[styles.loadingOverlay, { backgroundColor: colors.background.primary + '90' }]}>
                <View style={[styles.loadingCard, { backgroundColor: colors.background.primary }]}>
                  <ActivityIndicator size="large" color={colors.primary[500]} />
                  <Text style={[styles.loadingText, { color: colors.text.primary }]}>
                    Verifying PIN...
                  </Text>
                  <Text style={[styles.loadingSubtext, { color: colors.text.secondary }]}>
                    Please wait while we verify your PIN
                  </Text>
                </View>
              </View>
            )}
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: "700",
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing["2xl"],
  },
  section: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: "700",
    marginBottom: spacing.md,
  },
  card: {
    borderRadius: borderRadius["2xl"],
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  settingSubtitle: {
    fontSize: typography.fontSizes.sm,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  infoText: {
    fontSize: typography.fontSizes.sm,
    marginLeft: spacing.md,
    flex: 1,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  resetButtonText: {
    fontSize: typography.fontSizes.base,
    fontWeight: "600",
    marginLeft: spacing.sm,
  },
  // PIN Verification Screen styles
  verificationContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  verificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.lg,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  verificationTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: '700',
  },
  verificationContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  verificationTextSection: {
    alignItems: 'center',
    paddingTop: spacing['3xl'],
    paddingBottom: spacing.xl,
  },
  verificationMainText: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  verificationSubText: {
    fontSize: typography.fontSizes.base,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  verificationPinSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  statusContainer: {
    marginTop: spacing['2xl'],
    alignItems: 'center',
    minHeight: 60,
    justifyContent: 'center',
  },
  loadingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: typography.fontSizes.base,
    textAlign: 'center',
    fontWeight: '500',
  },
  verifyButton: {
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
    ...shadows.md,
  },
  verifyButtonText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: '600',
  },
  manualVerifyButton: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
    ...shadows.sm,
  },
  manualVerifyButtonText: {
    fontSize: typography.fontSizes.base,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingCard: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing['2xl'],
    borderRadius: borderRadius['2xl'],
    alignItems: 'center',
    minWidth: 200,
    ...shadows.lg,
  },
  loadingText: {
    fontSize: typography.fontSizes.lg,
    marginTop: spacing.lg,
    textAlign: 'center',
    fontWeight: '600',
  },
  loadingSubtext: {
    fontSize: typography.fontSizes.sm,
    marginTop: spacing.sm,
    textAlign: 'center',
    lineHeight: 18,
  },
  // Legacy styles (keeping for compatibility)
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['2xl'],
  },
});
