import React from "react";
import { View, Text, TouchableOpacity, Modal, useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

interface LimitReachedPromptProps {
  visible: boolean;
  limitType: "ai" | "budgets"; // Type of limit reached
  currentUsage: number;
  limit: number;
  resetTime?: string; // For AI: when limit resets
  message?: string;
  onDismiss: () => void;
}

/**
 * LimitReachedPrompt - Modal shown when user hits daily/monthly limits
 * Provides upgrade CTA and helpful messaging
 */
export const LimitReachedPrompt: React.FC<LimitReachedPromptProps> = ({
  visible,
  limitType,
  currentUsage,
  limit,
  resetTime,
  message,
  onDismiss,
}) => {
  const router = useRouter();
  const isDark = useColorScheme() === "dark";

  const defaultMessages = {
    ai: `You've reached your daily AI chat limit (${limit} per day). Come back tomorrow or upgrade to Premium for 100 daily chats.`,
    budgets: `You've reached the budget limit on your Free plan (${limit} budgets). Upgrade to Premium for unlimited budgets.`,
  };

  const displayMessage = message || defaultMessages[limitType];
  const icon = limitType === "ai" ? "chatbubble" : "wallet";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 20,
          }}
        >
          {/* Close button */}
          <TouchableOpacity
            onPress={onDismiss}
            style={{ alignSelf: "flex-end", marginBottom: 16 }}
          >
            <Ionicons
              name="close"
              size={24}
              color={isDark ? "#9CA3AF" : "#6B7280"}
            />
          </TouchableOpacity>

          {/* Icon */}
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: "#FEF3C7",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 16,
              alignSelf: "center",
            }}
          >
            <Ionicons name={icon} size={28} color="#D97706" />
          </View>

          {/* Title */}
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: isDark ? "#F3F4F6" : "#111827",
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            Limit Reached
          </Text>

          {/* Message */}
          <Text
            style={{
              fontSize: 14,
              color: isDark ? "#D1D5DB" : "#4B5563",
              textAlign: "center",
              marginBottom: 16,
              lineHeight: 20,
            }}
          >
            {displayMessage}
          </Text>

          {/* Reset time if applicable */}
          {resetTime && limitType === "ai" && (
            <View
              style={{
                backgroundColor: isDark ? "#374151" : "#F3F4F6",
                borderRadius: 8,
                padding: 12,
                marginBottom: 20,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: isDark ? "#9CA3AF" : "#6B7280",
                  textAlign: "center",
                }}
              >
                Your limit resets tomorrow at {resetTime}
              </Text>
            </View>
          )}

          {/* Buttons */}
          <View style={{ gap: 12 }}>
            <TouchableOpacity
              onPress={() => {
                router.push("/subscription/plans");
                onDismiss();
              }}
              style={{
                backgroundColor: "#8B5CF6",
                paddingVertical: 14,
                borderRadius: 8,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: "#FFFFFF",
                }}
              >
                Upgrade to Premium
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onDismiss}
              style={{
                paddingVertical: 14,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: isDark ? "#4B5563" : "#D1D5DB",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: isDark ? "#E5E7EB" : "#374151",
                }}
              >
                Not Now
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
