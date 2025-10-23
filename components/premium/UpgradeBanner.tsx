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
    return (
      <View
        style={[
          {
            backgroundColor: isDark ? "#1F2937" : "#F3F4F6",
            borderBottomWidth: 1,
            borderBottomColor: isDark ? "#374151" : "#E5E7EB",
            paddingHorizontal: 16,
            paddingVertical: 12,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          },
        ]}
      >
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Ionicons
            name="star"
            size={16}
            color={isDark ? "#FBBF24" : "#F59E0B"}
          />
          <Text
            style={[
              {
                color: isDark ? "#E5E7EB" : "#374151",
                fontSize: 13,
                fontWeight: "500",
                flex: 1,
              },
            ]}
          >
            {message}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleUpgradePress}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            backgroundColor: isDark ? "#3B82F6" : "#3B82F6",
            borderRadius: 6,
          }}
        >
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 12,
              fontWeight: "600",
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
