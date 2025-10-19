import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { spacing, borderRadius, typography } from "../../constants/theme";
import { useTheme } from "../../contexts/ThemeContext";

interface BadgeProps {
  text: string;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  size?: "small" | "medium" | "large";
}

/**
 * Reusable Badge component for status indicators and labels
 *
 * @param text - Badge text content
 * @param variant - Color variant for different states
 * @param size - Size variant for different contexts
 */
export default function Badge({
  text,
  variant = "default",
  size = "medium",
}: BadgeProps) {
  const { colors } = useTheme();

  // Early return if colors is not available
  if (!colors) {
    return null;
  }

  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return {
          backgroundColor: colors.success[100],
          textColor: colors.success[600],
        };
      case "warning":
        return {
          backgroundColor: colors.warning[100],
          textColor: colors.warning[600],
        };
      case "danger":
        return {
          backgroundColor: colors.error[100],
          textColor: colors.error[600],
        };
      case "info":
        return {
          backgroundColor: colors.primary[100],
          textColor: colors.primary[600],
        };
      default:
        return {
          backgroundColor: colors.primary[100],
          textColor: colors.primary[500],
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return {
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          fontSize: typography.fontSizes.xs,
        };
      case "large":
        return {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          fontSize: typography.fontSizes.base,
        };
      default:
        return {
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          fontSize: typography.fontSizes.sm,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: variantStyles.backgroundColor,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          paddingVertical: sizeStyles.paddingVertical,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: variantStyles.textColor,
            fontSize: sizeStyles.fontSize,
          },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.full,
    alignSelf: "flex-start",
  },
  text: {
    fontWeight: "600" as const,
    textAlign: "center" as const,
  },
});
