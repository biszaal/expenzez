import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as LocalAuthentication from "expo-local-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSecurity } from "../../contexts/SecurityContext";
import { useTheme } from "../../contexts/ThemeContext";
import {
  spacing,
  borderRadius,
  shadows,
  typography,
} from "../../constants/theme";

export default function SecurityScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { isSecurityEnabled, enableSecurity, disableSecurity } = useSecurity();
  const [hasBiometric, setHasBiometric] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    checkBiometricAvailability();
    loadBiometricSettings();
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
        await enableSecurity();
        Alert.alert(
          "Security Enabled",
          "Your app is now protected with a password."
        );
      } else {
        Alert.alert(
          "Disable Security",
          "Are you sure you want to disable app security? This will remove password protection.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Disable",
              style: "destructive",
              onPress: async () => {
                await disableSecurity();
                Alert.alert(
                  "Security Disabled",
                  "App security has been disabled."
                );
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
      "Change Password",
      "This will require you to set up a new password. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          onPress: () => {
            // This will trigger the security lock screen for password change
            router.push("/(tabs)/account");
          },
        },
      ]
    );
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
                    Require password to unlock app
                  </Text>
                </View>
              </View>
              <Switch
                value={isSecurityEnabled}
                onValueChange={handleSecurityToggle}
                disabled={isLoading}
                trackColor={{
                  false: colors.gray[200],
                  true: colors.primary[500],
                }}
                thumbColor={isSecurityEnabled ? "white" : colors.gray[300]}
              />
            </View>
          </View>
        </View>

        {/* Biometric Authentication Section */}
        {hasBiometric && (
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
                    Change Password
                  </Text>
                  <Text
                    style={[
                      styles.settingSubtitle,
                      { color: colors.text.secondary },
                    ]}
                  >
                    Update your app password
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
});
