import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { useRouter } from "expo-router";

interface PremiumPaywallProps {
  feature?: string;
  onClose?: () => void;
}

export default function PremiumPaywall({
  feature,
  onClose,
}: PremiumPaywallProps) {
  const { colors } = useTheme();
  const router = useRouter();

  const handleUpgrade = () => {
    router.push("/subscription/plans");
  };

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background.primary }]}
    >
      <View
        style={[styles.content, { backgroundColor: colors.card.background }]}
      >
        <Ionicons
          name="lock-closed"
          size={48}
          color={colors.primary.main}
          style={styles.icon}
        />

        <Text style={[styles.title, { color: colors.text.primary }]}>
          Premium Feature
        </Text>

        <Text style={[styles.description, { color: colors.text.secondary }]}>
          {feature
            ? `This feature requires a premium subscription: ${feature}`
            : "This feature requires a premium subscription."}
        </Text>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary.main }]}
          onPress={handleUpgrade}
        >
          <Text style={[styles.buttonText, { color: colors.text.inverse }]}>
            Upgrade to Premium
          </Text>
        </TouchableOpacity>

        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={[styles.closeText, { color: colors.text.tertiary }]}>
              Maybe Later
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  content: {
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    maxWidth: 300,
    width: "100%",
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 14,
  },
});

