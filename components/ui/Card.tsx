import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { borderRadius, spacing } from "../../constants/theme";
import { useTheme } from "../../contexts/ThemeContext";

interface CardProps {
  children: React.ReactNode;
  variant?: "default" | "elevated" | "outlined";
  padding?: "none" | "small" | "medium" | "large";
  margin?: "none" | "small" | "medium" | "large";
  style?: ViewStyle;
}

export default function Card({
  children,
  variant = "default",
  padding = "medium",
  margin = "none",
  style,
}: CardProps) {
  const { colors, shadows } = useTheme();

  const getVariantStyle = () => {
    switch (variant) {
      case "default":
        return {
          backgroundColor: colors.background.primary,
          borderWidth: 1,
          borderColor: colors.border.light,
        };
      case "elevated":
        return {
          backgroundColor: colors.background.primary,
          ...shadows.md,
        };
      case "outlined":
        return {
          backgroundColor: colors.background.primary,
          borderWidth: 2,
          borderColor: colors.border.medium,
        };
      default:
        return {
          backgroundColor: colors.background.primary,
        };
    }
  };

  const getPaddingStyle = () => {
    switch (padding) {
      case "none":
        return { padding: 0 };
      case "small":
        return { padding: spacing.md };
      case "large":
        return { padding: spacing.xl };
      default:
        return { padding: spacing.lg };
    }
  };

  const getMarginStyle = () => {
    switch (margin) {
      case "none":
        return { margin: 0 };
      case "small":
        return { margin: spacing.md };
      case "large":
        return { margin: spacing.xl };
      default:
        return { margin: spacing.lg };
    }
  };

  const cardStyle = [
    styles.base,
    getVariantStyle(),
    getPaddingStyle(),
    getMarginStyle(),
    style,
  ];

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.xl,
  },
});
