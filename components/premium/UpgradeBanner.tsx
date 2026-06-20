import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRevenueCat } from "../../contexts/RevenueCatContext";
import { useTheme } from "../../contexts/ThemeContext";

interface UpgradeBannerProps {
  variant?: "subtle" | "prominent";
  message?: string;
  actionLabel?: string;
  onDismiss?: () => void;
}

/**
 * UpgradeBanner - premium upgrade prompt, styled on the app's Midnight Cobalt
 * design language (navy card surface, hairline border, cobalt accent + a mint
 * "PRO" mark) rather than the old flat-purple slab. Theme-token driven.
 */
export const UpgradeBanner: React.FC<UpgradeBannerProps> = ({
  variant = "subtle",
  message = "Upgrade to Premium for unlimited budgets & AI chats",
  actionLabel = "Upgrade Now",
  onDismiss,
}) => {
  const router = useRouter();
  const { colors } = useTheme();
  const { isPro, isLoading } = useRevenueCat();

  const handleUpgradePress = () => {
    router.push("/subscription/plans");
  };

  // Don't show banner if user is premium or still loading
  if (isLoading || isPro) {
    return null;
  }

  // Cobalt icon chip with a soft glow — the one accent that draws the eye.
  const IconChip = ({ size = 40 }: { size?: number }) => (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        backgroundColor: colors.primary[500],
        justifyContent: "center",
        alignItems: "center",
        flexShrink: 0,
        shadowColor: colors.primary[500],
        shadowOpacity: 0.45,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
      }}
    >
      <Ionicons name="sparkles" size={size * 0.5} color="#FFFFFF" />
    </View>
  );

  // Small mint capsule — a touch of the app's positive accent, sparingly used.
  const ProTag = () => (
    <View
      style={{
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 6,
        backgroundColor: colors.posBg,
      }}
    >
      <Text
        style={{
          color: colors.posFg,
          fontSize: 10,
          fontWeight: "800",
          letterSpacing: 0.6,
        }}
      >
        PRO
      </Text>
    </View>
  );

  if (variant === "subtle") {
    return (
      <View
        style={{
          borderRadius: 20,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: colors.card.border,
          backgroundColor: colors.card.background,
        }}
      >
        {/* Diagonal cobalt wash for depth instead of a flat fill */}
        <LinearGradient
          colors={[colors.primary[500] + "26", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 16,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <IconChip size={40} />

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 3 }}>
              <Text style={{ color: colors.text.primary, fontSize: 15, fontWeight: "800", letterSpacing: -0.2 }}>
                Unlock Premium
              </Text>
              <ProTag />
            </View>
            <Text
              style={{
                color: colors.text.secondary,
                fontSize: 12.5,
                fontWeight: "500",
                lineHeight: 17,
              }}
            >
              {message}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleUpgradePress}
            activeOpacity={0.85}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              paddingLeft: 14,
              paddingRight: 12,
              paddingVertical: 9,
              backgroundColor: colors.primary[500],
              borderRadius: 12,
              flexShrink: 0,
            }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700" }}>
              {actionLabel}
            </Text>
            <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Prominent variant — a fuller cobalt-washed card with a stacked CTA.
  return (
    <View
      style={{
        borderRadius: 22,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: colors.card.border,
        backgroundColor: colors.card.background,
      }}
    >
      <LinearGradient
        colors={[colors.primary[500] + "33", colors.primary[700] + "1A", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <View style={{ padding: 18 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <IconChip size={36} />
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={{ color: colors.text.primary, fontSize: 17, fontWeight: "800", letterSpacing: -0.3 }}>
                Go Premium
              </Text>
              <ProTag />
            </View>
          </View>
          {onDismiss && (
            <TouchableOpacity onPress={onDismiss} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>

        <Text
          style={{
            color: colors.text.secondary,
            fontSize: 13.5,
            fontWeight: "500",
            lineHeight: 19,
            marginBottom: 14,
          }}
        >
          {message}
        </Text>

        <TouchableOpacity
          onPress={handleUpgradePress}
          activeOpacity={0.85}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            backgroundColor: colors.primary[500],
            paddingVertical: 13,
            borderRadius: 14,
            shadowColor: colors.primary[500],
            shadowOpacity: 0.35,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 6 },
            elevation: 6,
          }}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "700" }}>
            {actionLabel}
          </Text>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};
