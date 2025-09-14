import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../auth/AuthContext";
import {
  spacing,
  borderRadius,
  shadows,
  typography,
} from "../../constants/theme";
import PinInput from "../../components/PinInput";

export default function ChangePinScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1); // 1: Old PIN, 2: New PIN, 3: Confirm PIN
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Debug function to check current PIN storage
  const debugPinStorage = async () => {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const storedPin = await AsyncStorage.getItem('@expenzez_app_password');
      const securityEnabled = await AsyncStorage.getItem('@expenzez_security_enabled');
      const biometricEnabled = await AsyncStorage.getItem('@expenzez_biometric_enabled');

      console.log('🔍 [Change PIN] Current storage state:', {
        hasStoredPin: !!storedPin,
        storedPin: storedPin?.substring(0, 2) + '***',
        securityEnabled,
        biometricEnabled
      });

      return { storedPin, securityEnabled, biometricEnabled };
    } catch (error) {
      console.error('🔍 [Change PIN] Error checking storage:', error);
      return null;
    }
  };

  // Check storage on component mount
  useEffect(() => {
    debugPinStorage();
  }, []);


  // New function that accepts PIN parameter directly
  const handleOldPinVerificationWithPin = async (pinToVerify: string) => {
    // First check what's actually stored
    await debugPinStorage();
    // Add detailed logging to debug the issue
    console.log('🔐 [Change PIN] Validating old PIN with parameter:', {
      pin: pinToVerify,
      length: pinToVerify.length,
      isString: typeof pinToVerify === 'string',
      regexTest: /^\d{5}$/.test(pinToVerify),
      charCodes: pinToVerify.split('').map(c => c.charCodeAt(0))
    });

    // Clean the PIN of any whitespace or non-digit characters
    const cleanPin = pinToVerify.trim().replace(/[^0-9]/g, '');
    console.log('🔐 [Change PIN] Clean PIN:', cleanPin, 'length:', cleanPin.length);

    if (cleanPin.length !== 5 || !/^\d{5}$/.test(cleanPin)) {
      Alert.alert("Invalid PIN", "PIN must be exactly 5 digits");
      return;
    }

    // Check if there's actually a PIN stored before trying to validate
    const storageCheck = await debugPinStorage();
    if (!storageCheck?.storedPin) {
      Alert.alert(
        "No PIN Found",
        "It looks like no PIN is currently set up. Would you like to set up a new PIN or disable app lock?",
        [
          {
            text: "Set Up New PIN",
            onPress: () => router.replace('/security/create-pin')
          },
          {
            text: "Disable App Lock",
            style: "destructive",
            onPress: async () => {
              try {
                const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
                await AsyncStorage.multiRemove([
                  '@expenzez_security_enabled',
                  '@expenzez_app_locked',
                  '@expenzez_last_unlock',
                  '@expenzez_biometric_enabled'
                ]);
                Alert.alert("App Lock Disabled", "You can re-enable it anytime from Security settings.");
                router.replace('/security');
              } catch (error) {
                console.error('Error disabling security:', error);
                Alert.alert("Error", "Failed to disable app lock. Please try again.");
              }
            }
          },
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => router.back()
          }
        ]
      );
      return;
    }

    // Use the cleaned PIN for validation
    const pinToValidate = cleanPin;

    setIsLoading(true);
    try {
      const { securityAPI } = await import('../../services/api/securityAPI');
      const { deviceManager } = await import('../../services/deviceManager');
      
      const deviceId = await deviceManager.getDeviceId();
      const result = await securityAPI.validatePin({
        pin: pinToValidate,
        deviceId
      });
      
      if (result.success) {
        setCurrentStep(2); // Move to new PIN entry
      } else {
        console.log('🔐 [Change PIN] PIN validation failed:', result);
        Alert.alert("Incorrect PIN", "Please try again.");
        setOldPin("");
      }
    } catch (error) {
      console.log('🔐 [Change PIN] Error during PIN validation:', error);
      Alert.alert("Error", "Failed to verify current PIN. Please try again.");
      setOldPin("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewPinEntryWithPin = (pinToVerify: string) => {
    const cleanNewPin = pinToVerify.trim().replace(/[^0-9]/g, '');
    console.log('🔐 [Change PIN] New PIN validation:', { newPin: pinToVerify, cleanNewPin, length: cleanNewPin.length });

    if (cleanNewPin.length !== 5 || !/^\d{5}$/.test(cleanNewPin)) {
      Alert.alert("Invalid PIN", "PIN must be exactly 5 digits");
      return;
    }

    if (cleanNewPin === oldPin.trim().replace(/[^0-9]/g, '')) {
      Alert.alert("Error", "New PIN must be different from current PIN");
      return;
    }

    // Update newPin with cleaned version
    setNewPin(cleanNewPin);
    setCurrentStep(3); // Move to confirm PIN
  };

  const handlePinChangeWithPin = async (confirmPinParam: string) => {
    const cleanNewPin = newPin.trim().replace(/[^0-9]/g, '');
    const cleanConfirmPin = confirmPinParam.trim().replace(/[^0-9]/g, '');

    console.log('🔐 [Change PIN] Final PIN validation:', {
      newPin: cleanNewPin,
      confirmPin: cleanConfirmPin,
      match: cleanNewPin === cleanConfirmPin
    });

    if (cleanNewPin !== cleanConfirmPin) {
      Alert.alert("PIN Mismatch", "PINs do not match. Please try again.");
      setConfirmPin("");
      return;
    }

    setIsLoading(true);
    try {
      const { securityAPI } = await import('../../services/api/securityAPI');
      const { deviceManager } = await import('../../services/deviceManager');
      
      const deviceId = await deviceManager.getDeviceId();
      const cleanOldPin = oldPin.trim().replace(/[^0-9]/g, '');
      const result = await securityAPI.changePin(deviceId, cleanOldPin, cleanNewPin);
      
      if (result.success) {
        Alert.alert(
          "PIN Changed Successfully", 
          "Your PIN has been updated.",
          [
            {
              text: "OK",
              onPress: () => router.back()
            }
          ]
        );
      } else {
        Alert.alert("Error", result.error || "Failed to change PIN. Please try again.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to change PIN. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Wrapper functions for backward compatibility
  const handleOldPinVerification = async () => {
    return handleOldPinVerificationWithPin(oldPin);
  };

  const handleNewPinEntry = () => {
    return handleNewPinEntryWithPin(newPin);
  };

  const handlePinChange = async () => {
    return handlePinChangeWithPin(confirmPin);
  };


  const renderOldPinStep = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.text.primary }]}>
        Enter Current PIN
      </Text>
      <Text style={[styles.stepDescription, { color: colors.text.secondary }]}>
        Enter your current 5-digit PIN
      </Text>

      <PinInput
        pin={oldPin}
        onPinChange={(pin) => {
          console.log('🔐 [Change PIN] PIN updated to:', pin, 'length:', pin.length);
          setOldPin(pin);
          if (pin.length === 5) {
            // Use the pin parameter directly instead of state since state update is async
            setTimeout(() => {
              console.log('🔐 [Change PIN] Auto-validating PIN:', pin);
              handleOldPinVerificationWithPin(pin);
            }, 300);
          }
        }}
        isLoading={isLoading}
      />
    </View>
  );

  const renderNewPinStep = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.text.primary }]}>
        Enter New PIN
      </Text>
      <Text style={[styles.stepDescription, { color: colors.text.secondary }]}>
        Create a new 5-digit PIN
      </Text>

      <PinInput
        pin={newPin}
        onPinChange={(pin) => {
          setNewPin(pin);
          if (pin.length === 5) {
            setTimeout(() => handleNewPinEntryWithPin(pin), 300);
          }
        }}
        isLoading={false}
      />
    </View>
  );

  const renderConfirmPinStep = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.text.primary }]}>
        Confirm New PIN
      </Text>
      <Text style={[styles.stepDescription, { color: colors.text.secondary }]}>
        Re-enter your new PIN to confirm
      </Text>

      <PinInput
        pin={confirmPin}
        onPinChange={(pin) => {
          setConfirmPin(pin);
          if (pin.length === 5) {
            setTimeout(() => handlePinChangeWithPin(pin), 300);
          }
        }}
        isLoading={isLoading}
      />

      {isLoading && (
        <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
          Changing PIN...
        </Text>
      )}
    </View>
  );

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
          Change PIN
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {[1, 2, 3].map((step) => (
          <View
            key={step}
            style={[
              styles.progressStep,
              {
                backgroundColor: step <= currentStep ? colors.primary[500] : colors.gray[200],
              },
            ]}
          />
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentStep === 1 && renderOldPinStep()}
        {currentStep === 2 && renderNewPinStep()}
        {currentStep === 3 && renderConfirmPinStep()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
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
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  progressStep: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  stepContainer: {
    paddingTop: spacing.xl * 2,
    alignItems: "center",
  },
  stepTitle: {
    fontSize: typography.fontSizes.xl * 1.2,
    fontWeight: "600",
    marginBottom: spacing.md,
    textAlign: "center",
  },
  stepDescription: {
    fontSize: typography.fontSizes.base,
    textAlign: "center",
    marginBottom: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.lg,
    fontSize: typography.fontSizes.base,
    textAlign: "center",
  },
});