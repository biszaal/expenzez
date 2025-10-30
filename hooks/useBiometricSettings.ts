import { useState, useCallback, useEffect } from "react";
import { Alert } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const useBiometricSettings = (isSecurityEnabled: boolean) => {
  const [hasBiometric, setHasBiometric] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);

  const checkBiometricAvailability = useCallback(async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const available = hasHardware && isEnrolled;
      setHasBiometric(available);
      return available;
    } catch (error) {
      console.error("Error checking biometric availability:", error);
      return false;
    }
  }, []);

  const loadBiometricSettings = useCallback(async () => {
    try {
      const biometricEnabled = await AsyncStorage.getItem("@expenzez_biometric_enabled");
      const enabled = biometricEnabled === "true";
      setIsBiometricEnabled(enabled);
      return enabled;
    } catch (error) {
      console.error("Error loading biometric settings:", error);
      return false;
    }
  }, []);

  const handleBiometricToggle = useCallback(
    async (enabled: boolean) => {
      if (!hasBiometric) {
        Alert.alert(
          "Biometric Not Available",
          "Biometric authentication is not available on this device."
        );
        return false;
      }

      try {
        await AsyncStorage.setItem("@expenzez_biometric_enabled", enabled.toString());
        setIsBiometricEnabled(enabled);

        Alert.alert(
          enabled ? "Biometric Enabled" : "Biometric Disabled",
          enabled
            ? "You can now use biometric authentication to unlock the app."
            : "Biometric authentication has been disabled."
        );
        return true;
      } catch (error) {
        console.error("Error toggling biometric:", error);
        Alert.alert("Error", "Failed to update biometric settings.");
        return false;
      }
    },
    [hasBiometric]
  );

  // Auto-load biometric settings when security is enabled
  useEffect(() => {
    if (isSecurityEnabled) {
      checkBiometricAvailability();
      loadBiometricSettings();
    }
  }, [isSecurityEnabled, checkBiometricAvailability, loadBiometricSettings]);

  return {
    hasBiometric,
    isBiometricEnabled,
    checkBiometricAvailability,
    loadBiometricSettings,
    handleBiometricToggle,
  };
};
