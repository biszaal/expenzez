import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { bankingAPI } from "../../services/api";
import {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
} from "../../constants/theme";

export default function BankCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Processing bank connection...");

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // In a real app, you'd process the callback parameters
      // and complete the bank connection
      const { requisitionId } = params;
      
      if (requisitionId) {
        // Complete the bank connection
        await bankingAPI.getAccounts();
        setStatus("success");
        setMessage("Bank account connected successfully!");
        
        setTimeout(() => {
          router.replace("/banks");
        }, 2000);
      } else {
        setStatus("error");
        setMessage("Connection failed. Please try again.");
      }
    } catch (error) {
      console.error("Bank callback error:", error);
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "loading":
        return <ActivityIndicator size="large" color="white" />;
      case "success":
        return <Ionicons name="checkmark-circle" size={64} color="white" />;
      case "error":
        return <Ionicons name="close-circle" size={64} color="white" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "loading":
        return [colors.primary[500], "#8B5CF6"];
      case "success":
        return ["#10B981", "#059669"];
      case "error":
        return ["#DC2626", "#B91C1C"];
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <LinearGradient
          colors={getStatusColor()}
          style={styles.statusCard}
        >
          {getStatusIcon()}
          <Text style={styles.statusTitle}>
            {status === "loading" && "Connecting..."}
            {status === "success" && "Success!"}
            {status === "error" && "Error"}
          </Text>
          <Text style={styles.statusMessage}>{message}</Text>
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  statusCard: {
    borderRadius: borderRadius["3xl"],
    padding: spacing["2xl"],
    alignItems: "center",
    justifyContent: "center",
    ...shadows.lg,
    minHeight: 300,
    width: "100%",
  },
  statusTitle: {
    fontSize: typography.fontSizes["2xl"],
    fontWeight: "700" as const,
    color: "white",
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  statusMessage: {
    fontSize: typography.fontSizes.base,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center" as const,
    lineHeight: typography.fontSizes.base * 1.5,
  },
}); 