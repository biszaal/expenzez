import React from "react";
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View, Dimensions, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";

const { width } = Dimensions.get('window');

// Responsive sizing based on screen width
const getResponsiveSizes = () => {
  if (width < 375) {
    // Small devices (iPhone SE, etc.)
    return { fontSize: 12, iconSize: 14, paddingH: 10, paddingV: 7 };
  } else if (width < 414) {
    // Medium devices (iPhone 12, 13, etc.)
    return { fontSize: 13, iconSize: 16, paddingH: 12, paddingV: 8 };
  } else {
    // Large devices (iPhone 14 Plus, etc.)
    return { fontSize: 14, iconSize: 18, paddingH: 14, paddingV: 9 };
  }
};

interface AIButtonProps {
  onPress: () => void;
  loading?: boolean;
  active?: boolean;
  disabled?: boolean;
  label?: string;
  disabledMessage?: string;
  rateLimited?: boolean;
}

/**
 * Reusable AI button component for toggling AI insights
 * Shows sparkles icon and optional loading state
 * Responsive design adapts to different screen sizes
 */
export const AIButton: React.FC<AIButtonProps> = ({
  onPress,
  loading = false,
  active = false,
  disabled = false,
  label = "AI Insight",
  disabledMessage,
  rateLimited = false,
}) => {
  const { colors } = useTheme();
  const sizes = getResponsiveSizes();

  const isDisabled = disabled || loading || rateLimited;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: active
            ? `${colors.primary.main}15`
            : isDisabled
            ? colors.background.tertiary
            : colors.background.secondary,
          borderColor: active
            ? colors.primary.main
            : isDisabled
            ? colors.border.light
            : colors.primary.main,
          opacity: isDisabled && !active ? 0.6 : 1,
          paddingHorizontal: sizes.paddingH,
          paddingVertical: sizes.paddingV,
          shadowColor: active ? colors.primary.main : "#000",
          shadowOffset: { width: 0, height: active ? 4 : 2 },
          shadowOpacity: active ? 0.3 : 0.1,
          shadowRadius: active ? 8 : 4,
          elevation: active ? 6 : 2,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={isDisabled}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary.main} />
          <Text
            style={[
              styles.label,
              {
                color: colors.primary.main,
                fontSize: sizes.fontSize,
                marginLeft: 8,
              },
            ]}
          >
            Analyzing...
          </Text>
        </View>
      ) : (
        <>
          <Ionicons
            name="sparkles"
            size={sizes.iconSize}
            color={
              active
                ? colors.primary.main
                : isDisabled
                ? colors.text.tertiary
                : colors.primary.main
            }
          />
          <Text
            style={[
              styles.label,
              {
                color: active
                  ? colors.primary.main
                  : isDisabled
                  ? colors.text.tertiary
                  : colors.primary.main,
                fontSize: sizes.fontSize,
              },
            ]}
          >
            {rateLimited
              ? "Rate Limited"
              : disabledMessage && isDisabled
              ? disabledMessage
              : label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 24,
    borderWidth: 1.5,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
      },
      android: {
        elevation: 2,
      },
    }),
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  label: {
    fontWeight: "600",
    letterSpacing: -0.2,
  },
});
