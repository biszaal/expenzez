import React from "react";
import { View, Text, TouchableOpacity, useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

interface UpgradeBannerProps {
  variant?: "subtle" | "prominent";
  message?: string;
  actionLabel?: string;
  onDismiss?: () => void;
}

/**
 * UpgradeBanner - Persistent banner to encourage premium upgrade
 * Displays at the top of screens with clear CTA
 */
export const UpgradeBanner: React.FC<UpgradeBannerProps> = ({
  variant = "subtle",
  message = "Upgrade to Premium for unlimited budgets & AI chats",
  actionLabel = "Upgrade Now",
  onDismiss,
}) => {
  const router = useRouter();
  const isDark = useColorScheme() === "dark";

  const handleUpgradePress = () => {
    router.push("/subscription/plans");
  };

  if (variant === "subtle") {
    const primaryPurple = "#8B5CF6";
    const lightPurple = isDark ? "#7C3AED" : "#F3E8FF";
    const textPrimary = isDark ? "#F3E8FF" : "#4C1D95";
    const textSecondary = isDark ? "#E9D5FF" : "#6B21A8";

    return (
      <View
        style={[
          {
            backgroundColor: lightPurple,
            paddingHorizontal: 16,
            paddingVertical: 16,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          },
        ]}
      >
        <View style={{ flex: 1, flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
          {/* Icon with background */}
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: primaryPurple,
              justifyContent: "center",
              alignItems: "center",
              flexShrink: 0,
              marginTop: 2,
            }}
          >
            <Ionicons name="sparkles" size={20} color="#FFFFFF" />
          </View>

          {/* Text content */}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: textPrimary,
                fontSize: 14,
                fontWeight: "700",
                marginBottom: 4,
              }}
            >
              Unlock Premium
            </Text>
            <Text
              style={{
                color: textSecondary,
                fontSize: 12,
                fontWeight: "500",
                lineHeight: 18,
              }}
            >
              {message}
            </Text>
          </View>
        </View>

        {/* Action button */}
        <TouchableOpacity
          onPress={handleUpgradePress}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 8,
            backgroundColor: primaryPurple,
            borderRadius: 8,
            flexShrink: 0,
          }}
        >
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 13,
              fontWeight: "700",
            }}
          >
            {actionLabel}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Prominent variant
  return (
    <View
      style={[
        {
          backgroundColor: isDark ? "#7C3AED" : "#8B5CF6",
          paddingHorizontal: 16,
          paddingVertical: 16,
        },
      ]}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Ionicons name="sparkles" size={20} color="#FFFFFF" />
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 16,
                fontWeight: "700",
              }}
            >
              Go Premium
            </Text>
          </View>
          <Text
            style={{
              color: "#F3E8FF",
              fontSize: 14,
              fontWeight: "500",
              marginBottom: 12,
            }}
          >
            {message}
          </Text>
          <TouchableOpacity
            onPress={handleUpgradePress}
            style={{
              backgroundColor: "#FFFFFF",
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 8,
              alignSelf: "flex-start",
            }}
          >
            <Text
              style={{
                color: "#7C3AED",
                fontSize: 13,
                fontWeight: "700",
              }}
            >
              {actionLabel}
            </Text>
          </TouchableOpacity>
        </View>
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
