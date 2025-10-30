import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { nativeSecurityAPI } from "../services/api/nativeSecurityAPI";
import { deviceManager } from "../services/deviceManager";

interface UseSecurityActionsProps {
  enableSecurity: () => Promise<void>;
  disableSecurity: () => Promise<void>;
  unlockApp: () => void | Promise<void>;
}

export const useSecurityActions = ({
  enableSecurity,
  disableSecurity,
  unlockApp,
}: UseSecurityActionsProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPinVerification, setShowPinVerification] = useState(false);
  const [pinInput, setPinInput] = useState("");

  const handleSecurityToggle = useCallback(
    async (enabled: boolean) => {
      setIsLoading(true);
      try {
        if (enabled) {
          // ALWAYS require creating a new PIN when enabling security
          Alert.alert(
            "Create PIN",
            "You need to create a 5-digit PIN to enable app security.",
            [
              {
                text: "Cancel",
                style: "cancel",
                onPress: () => {
                  setIsLoading(false);
                },
              },
              {
                text: "Create PIN",
                onPress: () => {
                  console.log("🔐 [Security] Navigating to PIN creation");
                  router.push("/security/create-pin");
                  setTimeout(() => setIsLoading(false), 500);
                },
              },
            ]
          );
          return;
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
                  setPinInput("");
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
    },
    [router]
  );

  const verifyPinAndDisableSecurity = useCallback(async () => {
    console.log("🔐 [Security] verifyPinAndDisableSecurity called", {
      isLoading,
      pinInputLength: pinInput.length,
    });

    if (isLoading || pinInput.length !== 5) {
      return;
    }

    try {
      console.log("🔐 [Security] Starting PIN verification...");
      setIsLoading(true);

      const deviceId = await deviceManager.getDeviceId();
      console.log("🔐 [Security] Got device ID:", deviceId.slice(0, 8) + "...");

      const validation = await nativeSecurityAPI.validatePin({
        pin: pinInput,
        deviceId,
      });
      console.log("🔐 [Security] PIN validation result:", validation.success);

      if (validation.success) {
        console.log("🔐 [Security] PIN correct, disabling security...");
        await new Promise((resolve) => setTimeout(resolve, 500));

        setShowPinVerification(false);
        setPinInput("");

        console.log("🔐 [Security] Calling unlockApp and disableSecurity...");
        await unlockApp();
        await disableSecurity();
        console.log("🔐 [Security] Security disabled successfully");

        Alert.alert("Security Disabled", "App security has been disabled successfully.");
      } else {
        console.log("🔐 [Security] PIN incorrect, showing error");
        setPinInput("");
        Alert.alert(
          "Incorrect PIN",
          "The PIN you entered is incorrect. Please try again. (Try 00000 for test mode)",
          [
            {
              text: "Try Again",
              onPress: () => {
                setPinInput("");
              },
            },
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => {
                setShowPinVerification(false);
                setPinInput("");
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error("🔐 [Security] Error verifying PIN:", error);
      setPinInput("");
      Alert.alert(
        "Verification Failed",
        `Failed to verify PIN: ${error?.message || "Unknown error"}. Try 00000 for test mode.`,
        [
          {
            text: "Try Again",
            onPress: () => {
              setPinInput("");
            },
          },
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => {
              setShowPinVerification(false);
              setPinInput("");
            },
          },
        ]
      );
    } finally {
      console.log("🔐 [Security] PIN verification completed");
      setIsLoading(false);
    }
  }, [isLoading, pinInput, unlockApp, disableSecurity]);

  const changePassword = useCallback(() => {
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
  }, [router]);

  const resetSecurity = useCallback(() => {
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
              // Unlock immediately before resetting
              await unlockApp();

              await AsyncStorage.multiRemove([
                "@expenzez_app_password",
                "@expenzez_security_enabled",
                "@expenzez_biometric_enabled",
                "@expenzez_app_locked",
              ]);
              await disableSecurity();
              Alert.alert("Security Reset", "All security settings have been reset.");
            } catch (error) {
              console.error("Error resetting security:", error);
              Alert.alert("Error", "Failed to reset security settings.");
            }
          },
        },
      ]
    );
  }, [unlockApp, disableSecurity]);

  return {
    isLoading,
    showPinVerification,
    pinInput,
    setPinInput,
    setShowPinVerification,
    handleSecurityToggle,
    verifyPinAndDisableSecurity,
    changePassword,
    resetSecurity,
  };
};
