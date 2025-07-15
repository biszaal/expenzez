import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../contexts/ThemeContext";
import { spacing, borderRadius, shadows, typography } from "../constants/theme";

interface SecurityLockProps {
  onUnlock: () => void;
  isVisible: boolean;
}

export default function SecurityLock({
  onUnlock,
  isVisible,
}: SecurityLockProps) {
  const { colors, isDark } = useTheme();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [hasBiometric, setHasBiometric] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
    loadSecuritySettings();
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

  const loadSecuritySettings = async () => {
    try {
      const biometricEnabled = await AsyncStorage.getItem(
        "@expenzez_biometric_enabled"
      );
      setIsBiometricEnabled(biometricEnabled === "true");
    } catch (error) {
      console.error("Error loading security settings:", error);
    }
  };

  const handleBiometricAuth = async () => {
    if (!hasBiometric) {
      Alert.alert(
        "Biometric Not Available",
        "Biometric authentication is not available on this device."
      );
      return;
    }

    setIsAuthenticating(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to unlock Expenzez",
        fallbackLabel: "Use password",
        cancelLabel: "Cancel",
      });

      if (result.success) {
        onUnlock();
      } else {
        // Only show error for actual failures, not user cancellation
        Alert.alert(
          "Authentication Failed",
          "Please try again or use password."
        );
      }
    } catch (error) {
      console.error("Biometric authentication error:", error);
      Alert.alert(
        "Authentication Error",
        "An error occurred during authentication."
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handlePasswordAuth = async () => {
    try {
      const storedPassword = await AsyncStorage.getItem(
        "@expenzez_app_password"
      );

      if (!storedPassword) {
        // First time setup
        setIsSettingUp(true);
        setShowPasswordModal(true);
        return;
      }

      if (password === storedPassword) {
        onUnlock();
        setPassword("");
      } else {
        Alert.alert("Incorrect Password", "Please try again.");
        setPassword("");
      }
    } catch (error) {
      console.error("Password authentication error:", error);
      Alert.alert("Error", "An error occurred during authentication.");
    }
  };

  const setupPassword = async () => {
    if (password.length < 4) {
      Alert.alert(
        "Password Too Short",
        "Password must be at least 4 characters long."
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        "Passwords Don&apos;t Match",
        "Please make sure both passwords are the same."
      );
      return;
    }

    try {
      await AsyncStorage.setItem("@expenzez_app_password", password);
      await AsyncStorage.setItem("@expenzez_security_enabled", "true");

      if (isBiometricEnabled) {
        await AsyncStorage.setItem("@expenzez_biometric_enabled", "true");
      }

      setShowPasswordModal(false);
      setPassword("");
      setConfirmPassword("");
      setIsSettingUp(false);

      Alert.alert(
        "Security Setup Complete",
        "Your app is now protected with a password."
      );
      onUnlock();
    } catch (error) {
      console.error("Error setting up password:", error);
      Alert.alert("Error", "Failed to set up password. Please try again.");
    }
  };

  const toggleBiometric = async () => {
    if (!hasBiometric) {
      Alert.alert(
        "Biometric Not Available",
        "Biometric authentication is not available on this device."
      );
      return;
    }

    try {
      const newValue = !isBiometricEnabled;
      await AsyncStorage.setItem(
        "@expenzez_biometric_enabled",
        newValue.toString()
      );
      setIsBiometricEnabled(newValue);

      Alert.alert(
        newValue ? "Biometric Enabled" : "Biometric Disabled",
        newValue
          ? "You can now use biometric authentication to unlock the app."
          : "Biometric authentication has been disabled."
      );
    } catch (error) {
      console.error("Error toggling biometric:", error);
      Alert.alert("Error", "Failed to update biometric settings.");
    }
  };

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      animationType="fade"
      presentationStyle="fullScreen"
    >
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: colors.background.secondary },
        ]}
      >
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          {/* Header */}
          <View style={styles.header}>
            <Ionicons
              name="lock-closed"
              size={48}
              color={colors.primary[500]}
            />
            <Text style={[styles.title, { color: colors.text.primary }]}>
              {isSettingUp ? "Set Up Security" : "Unlock Expenzez"}
            </Text>
            <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
              {isSettingUp
                ? "Create a password to protect your financial data"
                : "Authenticate to access your account"}
            </Text>
          </View>

          {/* Authentication Options */}
          <View style={styles.authContainer}>
            {/* Biometric Option */}
            {hasBiometric && (
              <TouchableOpacity
                style={[
                  styles.authButton,
                  { backgroundColor: colors.primary[500] },
                  shadows.lg,
                ]}
                onPress={handleBiometricAuth}
                disabled={isAuthenticating}
              >
                <Ionicons name="finger-print" size={24} color="white" />
                <Text style={styles.authButtonText}>
                  {isAuthenticating ? "Authenticating..." : "Use Biometric"}
                </Text>
              </TouchableOpacity>
            )}

            {/* Password Option */}
            <TouchableOpacity
              style={[
                styles.authButton,
                { backgroundColor: colors.background.primary },
                shadows.lg,
              ]}
              onPress={() => setShowPasswordModal(true)}
            >
              <Ionicons
                name="key-outline"
                size={24}
                color={colors.primary[500]}
              />
              <Text
                style={[styles.authButtonText, { color: colors.primary[500] }]}
              >
                Use Password
              </Text>
            </TouchableOpacity>

            {/* Biometric Toggle */}
            {hasBiometric && (
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  { backgroundColor: colors.background.primary },
                  shadows.sm,
                ]}
                onPress={toggleBiometric}
              >
                <Ionicons
                  name={
                    isBiometricEnabled ? "checkmark-circle" : "ellipse-outline"
                  }
                  size={20}
                  color={
                    isBiometricEnabled ? colors.success[500] : colors.gray[400]
                  }
                />
                <Text
                  style={[styles.toggleText, { color: colors.text.primary }]}
                >
                  Enable Biometric Authentication
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Security Info */}
          <View style={styles.infoContainer}>
            <Text style={[styles.infoText, { color: colors.text.secondary }]}>
              Your financial data is protected with industry-standard encryption
            </Text>
          </View>
        </KeyboardAvoidingView>

        {/* Password Modal */}
        <Modal
          visible={showPasswordModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView
            style={[
              styles.modalContainer,
              { backgroundColor: colors.background.secondary },
            ]}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowPasswordModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                {isSettingUp ? "Create Password" : "Enter Password"}
              </Text>
            </View>

            <View style={styles.modalContent}>
              <TextInput
                style={[
                  styles.passwordInput,
                  {
                    backgroundColor: colors.background.primary,
                    borderColor: colors.border.light,
                    color: colors.text.primary,
                  },
                ]}
                placeholder="Enter password"
                placeholderTextColor={colors.text.tertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoFocus
                onSubmitEditing={isSettingUp ? undefined : handlePasswordAuth}
              />

              {isSettingUp && (
                <TextInput
                  style={[
                    styles.passwordInput,
                    {
                      backgroundColor: colors.background.primary,
                      borderColor: colors.border.light,
                      color: colors.text.primary,
                    },
                  ]}
                  placeholder="Confirm password"
                  placeholderTextColor={colors.text.tertiary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  onSubmitEditing={setupPassword}
                />
              )}

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { backgroundColor: colors.primary[500] },
                  shadows.lg,
                ]}
                onPress={isSettingUp ? setupPassword : handlePasswordAuth}
              >
                <Text style={styles.submitButtonText}>
                  {isSettingUp ? "Set Password" : "Unlock"}
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing["2xl"],
  },
  title: {
    fontSize: typography.fontSizes["2xl"],
    fontWeight: "700",
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSizes.base,
    textAlign: "center",
    lineHeight: typography.fontSizes.base * 1.4,
  },
  authContainer: {
    marginBottom: spacing["2xl"],
  },
  authButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius["2xl"],
    marginBottom: spacing.md,
  },
  authButtonText: {
    color: "white",
    fontSize: typography.fontSizes.lg,
    fontWeight: "600",
    marginLeft: spacing.sm,
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    marginTop: spacing.md,
  },
  toggleText: {
    fontSize: typography.fontSizes.base,
    fontWeight: "500",
    marginLeft: spacing.sm,
  },
  infoContainer: {
    alignItems: "center",
  },
  infoText: {
    fontSize: typography.fontSizes.sm,
    textAlign: "center",
    lineHeight: typography.fontSizes.sm * 1.4,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  closeButton: {
    padding: spacing.sm,
  },
  modalTitle: {
    flex: 1,
    fontSize: typography.fontSizes.lg,
    fontWeight: "600",
    textAlign: "center",
    marginRight: spacing.xl,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing["2xl"],
  },
  passwordInput: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    fontSize: typography.fontSizes.base,
    marginBottom: spacing.lg,
  },
  submitButton: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    alignItems: "center",
  },
  submitButtonText: {
    color: "white",
    fontSize: typography.fontSizes.lg,
    fontWeight: "600",
  },
});
