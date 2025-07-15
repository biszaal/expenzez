import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuthGuard } from "../../hooks/useAuthGuard";
import { useAlert } from "../../hooks/useAlert";
import { useTheme } from "../../contexts/ThemeContext";
import {
  spacing,
  borderRadius,
  shadows,
  typography,
} from "../../constants/theme";

export default function BankCallbackScreen() {
  const router = useRouter();
  const { isLoggedIn } = useAuthGuard();
  const { showAlert, showError } = useAlert();
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("Processing bank connection...");

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // Extract parameters from the callback URL
      const { requisition_id, status: callbackStatus } = params;

      if (callbackStatus === "success" && requisition_id) {
        setStatus("success");
        setMessage("Bank account connected successfully!");

        // Show success message
        showAlert(
          "Connection Successful",
          "Your bank account has been connected successfully. You can now view your transactions and balances."
        );

        // Navigate back to accounts after a delay
        setTimeout(() => {
          router.push("/(tabs)/account");
        }, 2000);
      } else {
        setStatus("error");
        setMessage("Bank connection failed. Please try again.");

        showError(
          "Connection Failed",
          "Failed to connect your bank account. Please try again."
        );
      }
    } catch (error) {
      console.error("Bank callback error:", error);
      setStatus("error");
      setMessage("An error occurred during bank connection.");

      showError(
        "Connection Error",
        "An error occurred while connecting your bank account."
      );
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "loading":
        return "time-outline";
      case "success":
        return "checkmark-circle";
      case "error":
        return "close-circle";
      default:
        return "time-outline";
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "loading":
        return colors.primary[500];
      case "success":
        return colors.success[500];
      case "error":
        return colors.error[500];
      default:
        return colors.primary[500];
    }
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background.secondary },
      ]}
    >
      <View style={styles.content}>
        <View
          style={[
            styles.statusCard,
            {
              backgroundColor: colors.background.primary,
            },
            shadows.lg,
          ]}
        >
          <View style={styles.iconContainer}>
            {status === "loading" ? (
              <ActivityIndicator size={64} color={getStatusColor()} />
            ) : (
              <Ionicons
                name={getStatusIcon()}
                size={64}
                color={getStatusColor()}
              />
            )}
          </View>

          <Text style={[styles.title, { color: colors.text.primary }]}>
            {status === "loading" && "Connecting Bank Account"}
            {status === "success" && "Connection Successful"}
            {status === "error" && "Connection Failed"}
          </Text>

          <Text style={[styles.message, { color: colors.text.secondary }]}>
            {message}
          </Text>

          {status !== "loading" && (
            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: colors.primary[500],
                },
                shadows.sm,
              ]}
              onPress={() => router.push("/(tabs)/account")}
            >
              <Text style={styles.buttonText}>
                {status === "success" ? "View Accounts" : "Try Again"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Info Card */}
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: colors.background.primary,
            },
            shadows.sm,
          ]}
        >
          <Ionicons
            name="information-circle"
            size={24}
            color={colors.primary[500]}
          />
          <Text style={[styles.infoText, { color: colors.text.secondary }]}>
            Your bank data is securely encrypted and only accessible to you. We
            never store your login credentials.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  statusCard: {
    alignItems: "center",
    padding: spacing["2xl"],
    borderRadius: borderRadius["2xl"],
    marginBottom: spacing.xl,
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSizes.xl,
    fontWeight: "700",
    marginBottom: spacing.md,
    textAlign: "center",
  },
  message: {
    fontSize: typography.fontSizes.base,
    textAlign: "center",
    lineHeight: typography.fontSizes.base * 1.4,
    marginBottom: spacing.xl,
  },
  button: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  buttonText: {
    color: "white",
    fontSize: typography.fontSizes.base,
    fontWeight: "600",
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSizes.sm,
    lineHeight: typography.fontSizes.sm * 1.4,
    marginLeft: spacing.sm,
  },
});
