import React from "react";
import { View, Text, useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface FeatureShowcaseProps {
  title: string;
  features: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    freeValue: string | number;
    premiumValue: string | number;
  }[];
}

/**
 * FeatureShowcase - Shows Free vs Premium feature comparison
 * Highlights the value proposition of premium
 */
export const FeatureShowcase: React.FC<FeatureShowcaseProps> = ({
  title,
  features,
}) => {
  const isDark = useColorScheme() === "dark";

  return (
    <View
      style={{
        marginVertical: 16,
        marginHorizontal: 16,
        backgroundColor: isDark ? "#1F2937" : "#F9FAFB",
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: isDark ? "#374151" : "#E5E7EB",
      }}
    >
      <Text
        style={{
          fontSize: 16,
          fontWeight: "700",
          color: isDark ? "#F3F4F6" : "#111827",
          marginBottom: 16,
        }}
      >
        {title}
      </Text>

      {features.map((feature, index) => (
        <View
          key={index}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: index < features.length - 1 ? 12 : 0,
            paddingBottom: index < features.length - 1 ? 12 : 0,
            borderBottomWidth: index < features.length - 1 ? 1 : 0,
            borderBottomColor: isDark ? "#374151" : "#E5E7EB",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              flex: 1,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                backgroundColor: isDark ? "#374151" : "#E5E7EB",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons
                name={feature.icon}
                size={20}
                color={isDark ? "#3B82F6" : "#3B82F6"}
              />
            </View>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: isDark ? "#E5E7EB" : "#374151",
              }}
            >
              {feature.label}
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: 16 }}>
            <View
              style={{
                minWidth: 60,
                paddingHorizontal: 8,
                paddingVertical: 6,
                backgroundColor: isDark ? "#374151" : "#F3F4F6",
                borderRadius: 6,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: isDark ? "#9CA3AF" : "#6B7280",
                  textAlign: "center",
                }}
              >
                {feature.freeValue}
              </Text>
            </View>
            <View
              style={{
                minWidth: 60,
                paddingHorizontal: 8,
                paddingVertical: 6,
                backgroundColor: "#8B5CF6",
                borderRadius: 6,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: "#FFFFFF",
                  textAlign: "center",
                }}
              >
                {feature.premiumValue}
              </Text>
            </View>
          </View>
        </View>
      ))}

      {/* Header row */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          marginTop: -8,
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: "600", color: isDark ? "#9CA3AF" : "#6B7280" }}>
          Feature
        </Text>
        <View style={{ flexDirection: "row", gap: 16 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: "600",
              color: isDark ? "#9CA3AF" : "#6B7280",
              minWidth: 60,
              textAlign: "center",
            }}
          >
            Free
          </Text>
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: "#8B5CF6",
              minWidth: 60,
              textAlign: "center",
            }}
          >
            Premium
          </Text>
        </View>
      </View>
    </View>
  );
};
