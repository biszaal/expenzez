import React, { useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  ScrollView,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSecurity } from "../../contexts/SecurityContext";
import { useTheme } from "../../contexts/ThemeContext";
import PinInput from "../../components/PinInput";
import { EmptyState } from "../../components/ui/EmptyState";
import { spacing, shadows } from "../../constants/theme";

// Import custom hooks
import { useDeviceManagement } from "../../hooks/useDeviceManagement";
import { useBiometricSettings } from "../../hooks/useBiometricSettings";
import { useSecurityActions } from "../../hooks/useSecurityActions";

// Import utilities
import {
  formatDeviceType,
  formatLastSeen,
  getDeviceIcon,
} from "../../utils/deviceFormatters";

// Import styles
import { securityStyles as styles } from "./styles";

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
    unlockApp,
    extendSession,
  } = useSecurity();

  // Custom hooks for device management
  const {
    devices,
    loadingDevices,
    currentDeviceId,
    loadDevices,
    loadCurrentDeviceId,
    handleRevokeDevice,
    handleTrustDevice,
  } = useDeviceManagement();

  // Custom hook for biometric settings
  const {
    hasBiometric,
    isBiometricEnabled,
    checkBiometricAvailability,
    loadBiometricSettings,
    handleBiometricToggle,
  } = useBiometricSettings(isSecurityEnabled);

  // Custom hook for security actions
  const {
    isLoading,
    showPinVerification,
    pinInput,
    setPinInput,
    setShowPinVerification,
    handleSecurityToggle,
    verifyPinAndDisableSecurity,
    changePassword,
    resetSecurity,
  } = useSecurityActions({
    enableSecurity,
    disableSecurity,
    unlockApp,
  });

  // Local state for UI updates
  const [localSecurityEnabled, setLocalSecurityEnabled] =
    React.useState(isSecurityEnabled);

  // Debouncing refs
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitializedRef = useRef(false);

  // Auto-verification effect for PIN
  React.useEffect(() => {
    if (pinInput.length === 5 && !isLoading) {
      const timeoutId = setTimeout(() => {
        verifyPinAndDisableSecurity();
      }, 200);
      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [pinInput, isLoading, verifyPinAndDisableSecurity]);

  // Sync local state with context state
  React.useEffect(() => {
    if (isSecurityEnabled !== localSecurityEnabled) {
      setLocalSecurityEnabled(isSecurityEnabled);
    }
  }, [isSecurityEnabled, localSecurityEnabled]);

  // Debounced security status check
  const debouncedCheckSecurityStatus = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      checkSecurityStatus();
    }, 300);
  }, [checkSecurityStatus]);

  // Initialize screen
  React.useEffect(() => {
    const initializeScreen = async () => {
      if (isInitializedRef.current) return;
      isInitializedRef.current = true;

      try {
        await extendSession();
      } catch (error) {
        console.warn("Failed to extend session:", error);
      }

      checkBiometricAvailability().catch(console.error);
      loadBiometricSettings().catch(console.error);
      loadDevices().catch(console.error);
      loadCurrentDeviceId().catch(console.error);
      debouncedCheckSecurityStatus();
    };

    initializeScreen();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh on focus
  useFocusEffect(
    React.useCallback(() => {
      const refreshWithDelay = async () => {
        try {
          await extendSession();
        } catch (error) {
          console.warn("Failed to extend unlock session:", error);
        }

        try {
          await checkSecurityStatus();
        } catch (error) {
          console.error("Error checking security status:", error);
        }

        setTimeout(async () => {
          const securityEnabled = await AsyncStorage.getItem(
            "@expenzez_security_enabled"
          );

          if (securityEnabled === "true" && !isSecurityEnabled) {
            setLocalSecurityEnabled(true);
          } else if (securityEnabled === "false" && isSecurityEnabled) {
            setLocalSecurityEnabled(false);
          }
        }, 100);
      };
      refreshWithDelay();
    }, [isSecurityEnabled, extendSession, checkSecurityStatus])
  );

  // Cleanup debounce timeout
  React.useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background.secondary }]}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background.primary }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={[
              styles.backButton,
              { backgroundColor: colors.background.secondary },
              shadows.sm,
            ]}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.primary.main} />
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
                    { backgroundColor: colors.primary.main[100] },
                  ]}
                >
                  <Ionicons name="lock-closed" size={20} color={colors.primary.main} />
                </View>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, { color: colors.text.primary }]}>
                    App Lock
                  </Text>
                  <Text
                    style={[styles.settingSubtitle, { color: colors.text.secondary }]}
                  >
                    {securityPreferences?.appLockEnabled
                      ? "Synced across all devices"
                      : "Require PIN to unlock app"}
                  </Text>
                </View>
              </View>
              <Switch
                value={localSecurityEnabled}
                onValueChange={handleSecurityToggle}
                disabled={isLoading}
                trackColor={{
                  false: colors.gray[200],
                  true: colors.primary.main,
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
                {
                  backgroundColor: colors.warning[50],
                  borderWidth: 1,
                  borderColor: colors.warning[200],
                },
                shadows.sm,
              ]}
            >
              <TouchableOpacity
                style={styles.settingItem}
                onPress={() => router.push("/security/create-pin")}
              >
                <View style={styles.settingLeft}>
                  <View
                    style={[
                      styles.settingIcon,
                      { backgroundColor: colors.warning[100] },
                    ]}
                  >
                    <Ionicons name="warning" size={20} color={colors.warning[600]} />
                  </View>
                  <View style={styles.settingContent}>
                    <Text
                      style={[styles.settingTitle, { color: colors.warning[700] }]}
                    >
                      Create PIN
                    </Text>
                    <Text
                      style={[styles.settingSubtitle, { color: colors.warning[600] }]}
                    >
                      Set up PIN on this device
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.warning[600]} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Biometric Section */}
        {isSecurityEnabled && !needsPinSetup && hasBiometric && (
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
                    <Ionicons name="finger-print" size={20} color={colors.success.main} />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={[styles.settingTitle, { color: colors.text.primary }]}>
                      Biometric Unlock
                    </Text>
                    <Text
                      style={[styles.settingSubtitle, { color: colors.text.secondary }]}
                    >
                      Use fingerprint or Face ID
                    </Text>
                  </View>
                </View>
                <Switch
                  value={isBiometricEnabled}
                  onValueChange={(value) => {
                    handleBiometricToggle(value).catch(console.error);
                  }}
                  trackColor={{
                    false: colors.gray[200],
                    true: colors.success.main,
                  }}
                  thumbColor={isBiometricEnabled ? "white" : colors.gray[300]}
                />
              </View>
            </View>
          </View>
        )}

        {/* PIN Management Section */}
        {isSecurityEnabled && !needsPinSetup && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              PIN Management
            </Text>
            <View
              style={[
                styles.card,
                { backgroundColor: colors.background.primary },
                shadows.sm,
              ]}
            >
              <TouchableOpacity style={styles.settingItem} onPress={changePassword}>
                <View style={styles.settingLeft}>
                  <View
                    style={[
                      styles.settingIcon,
                      { backgroundColor: colors.primary.main[100] },
                    ]}
                  >
                    <Ionicons name="key" size={20} color={colors.primary.main} />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={[styles.settingTitle, { color: colors.text.primary }]}>
                      Change PIN
                    </Text>
                    <Text
                      style={[styles.settingSubtitle, { color: colors.text.secondary }]}
                    >
                      Update your PIN code
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.gray[300]} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Device Management Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Trusted Devices
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.background.primary },
              shadows.sm,
            ]}
          >
            {loadingDevices ? (
              <View style={styles.loadingDevicesContainer}>
                <ActivityIndicator size="small" color={colors.primary.main} />
                <Text
                  style={[
                    styles.loadingDevicesText,
                    { color: colors.text.secondary },
                  ]}
                >
                  Loading devices...
                </Text>
              </View>
            ) : devices.length === 0 ? (
              <View style={styles.emptyDevicesContainer}>
                <Ionicons name="phone-portrait" size={40} color={colors.gray[300]} />
                <Text
                  style={[styles.emptyDevicesText, { color: colors.text.primary }]}
                >
                  No devices yet
                </Text>
                <Text
                  style={[styles.emptyDevicesSubtext, { color: colors.text.secondary }]}
                >
                  Your trusted devices will appear here
                </Text>
              </View>
            ) : (
              devices.map((device, index) => {
                const isCurrentDevice = device.deviceId === currentDeviceId;
                return (
                  <View key={device.deviceId}>
                    <View style={styles.deviceItem}>
                      <View style={styles.deviceLeft}>
                        <View
                          style={[
                            styles.deviceIcon,
                            {
                              backgroundColor: isCurrentDevice
                                ? colors.primary.main[100]
                                : colors.gray[100],
                            },
                          ]}
                        >
                          <Ionicons
                            name={getDeviceIcon(device) as any}
                            size={20}
                            color={
                              isCurrentDevice ? colors.primary.main : colors.gray[400]
                            }
                          />
                        </View>
                        <View style={styles.deviceContent}>
                          <View style={styles.deviceHeader}>
                            <Text
                              style={[
                                styles.deviceName,
                                { color: colors.text.primary },
                              ]}
                            >
                              {device.deviceName}
                            </Text>
                            {isCurrentDevice && (
                              <Text
                                style={[
                                  styles.currentDeviceBadge,
                                  { color: colors.primary.main },
                                ]}
                              >
                                This device
                              </Text>
                            )}
                            {device.isTrusted && (
                              <View
                                style={[
                                  styles.trustedBadge,
                                  { backgroundColor: colors.success[100] },
                                ]}
                              >
                                <Ionicons
                                  name="shield-checkmark"
                                  size={12}
                                  color={colors.success[600]}
                                />
                                <Text
                                  style={[
                                    styles.trustedBadgeText,
                                    { color: colors.success[600] },
                                  ]}
                                >
                                  Trusted
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text
                            style={[styles.deviceType, { color: colors.text.secondary }]}
                          >
                            {formatDeviceType(device)}
                          </Text>
                          <Text
                            style={[
                              styles.deviceLastSeen,
                              { color: colors.text.secondary },
                            ]}
                          >
                            Last active: {formatLastSeen(device.lastSeen)}
                          </Text>
                          {device.location && (
                            <Text
                              style={[
                                styles.deviceLocation,
                                { color: colors.text.secondary },
                              ]}
                            >
                              📍 {device.location}
                            </Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.deviceActions}>
                        {!device.isTrusted && (
                          <TouchableOpacity
                            style={[
                              styles.deviceActionButton,
                              { backgroundColor: colors.success[50] },
                            ]}
                            onPress={() =>
                              handleTrustDevice(device.deviceId, device.deviceName)
                            }
                          >
                            <Ionicons
                              name="shield-checkmark"
                              size={16}
                              color={colors.success[600]}
                            />
                          </TouchableOpacity>
                        )}
                        {!isCurrentDevice && (
                          <TouchableOpacity
                            style={[
                              styles.deviceActionButton,
                              { backgroundColor: colors.error[50] },
                            ]}
                            onPress={() =>
                              handleRevokeDevice(device.deviceId, device.deviceName)
                            }
                          >
                            <Ionicons name="trash" size={16} color={colors.error[600]} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                    {index < devices.length - 1 && (
                      <View
                        style={[
                          styles.deviceSeparator,
                          { backgroundColor: colors.gray[200] },
                        ]}
                      />
                    )}
                  </View>
                );
              })
            )}
          </View>
        </View>

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
              <Ionicons name="shield-checkmark" size={20} color={colors.success.main} />
              <Text style={[styles.infoText, { color: colors.text.secondary }]}>
                Your financial data is encrypted and secure
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="lock-closed" size={20} color={colors.primary.main} />
              <Text style={[styles.infoText, { color: colors.text.secondary }]}>
                App locks automatically when backgrounded
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="finger-print" size={20} color={colors.success.main} />
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
            <Ionicons name="refresh" size={20} color={colors.error.main} />
            <Text style={[styles.resetButtonText, { color: colors.error.main }]}>
              Reset Security Settings
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* PIN Verification Modal */}
      <Modal
        visible={showPinVerification}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => {
          setPinInput("");
          setShowPinVerification(false);
        }}
      >
        <View
          style={[
            styles.verificationContainer,
            { backgroundColor: colors.background.primary },
          ]}
        >
          <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.verificationHeader}>
              <TouchableOpacity
                onPress={() => {
                  setPinInput("");
                  setShowPinVerification(false);
                }}
                style={[
                  styles.closeButton,
                  { backgroundColor: colors.background.secondary },
                ]}
              >
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
              <Text
                style={[styles.verificationTitle, { color: colors.text.primary }]}
              >
                Verify Your PIN
              </Text>
              <View style={{ width: 40 }} />
            </View>

            {/* Content */}
            <View style={styles.verificationContent}>
              <View style={styles.verificationTextSection}>
                <Text
                  style={[
                    styles.verificationMainText,
                    { color: colors.text.primary },
                  ]}
                >
                  Disable App Security
                </Text>
                <Text
                  style={[
                    styles.verificationSubText,
                    { color: colors.text.secondary },
                  ]}
                >
                  Enter your 5-digit PIN to remove app lock protection
                </Text>
              </View>

              <View style={styles.verificationPinSection}>
                <PinInput
                  pin={pinInput}
                  onPinChange={setPinInput}
                  isLoading={isLoading}
                  maxLength={5}
                  showBiometric={false}
                />

                <View style={styles.statusContainer}>
                  {isLoading ? (
                    <View style={styles.loadingSection}>
                      <ActivityIndicator size="small" color={colors.primary.main} />
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color: colors.primary.main,
                            marginLeft: spacing.sm,
                          },
                        ]}
                      >
                        Verifying PIN...
                      </Text>
                    </View>
                  ) : (
                    <View style={{ height: 40 }} />
                  )}
                </View>

                <View style={{ height: 60 }} />
              </View>
            </View>

            {/* Loading Overlay */}
            {isLoading && (
              <View
                style={[
                  styles.loadingOverlay,
                  { backgroundColor: colors.background.primary + "90" },
                ]}
              >
                <View
                  style={[
                    styles.loadingCard,
                    { backgroundColor: colors.background.primary },
                  ]}
                >
                  <ActivityIndicator size="large" color={colors.primary.main} />
                  <Text style={[styles.loadingText, { color: colors.text.primary }]}>
                    Verifying PIN...
                  </Text>
                  <Text
                    style={[styles.loadingSubtext, { color: colors.text.secondary }]}
                  >
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
