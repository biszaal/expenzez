import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { colors, borderRadius, shadows, spacing } from "../../constants/theme";

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
  const cardStyle = [
    styles.base,
    styles[variant],
    styles[`padding${padding.charAt(0).toUpperCase() + padding.slice(1)}`],
    styles[`margin${margin.charAt(0).toUpperCase() + margin.slice(1)}`],
    style,
  ];

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.xl,
  },

  // Variants
  default: {
    borderWidth: 1,
    borderColor: colors.border.light,
  },

  elevated: {
    ...shadows.md,
  },

  outlined: {
    borderWidth: 2,
    borderColor: colors.border.medium,
  },

  // Padding variants
  paddingNone: {
    padding: 0,
  },

  paddingSmall: {
    padding: spacing.md,
  },

  paddingMedium: {
    padding: spacing.lg,
  },

  paddingLarge: {
    padding: spacing.xl,
  },

  // Margin variants
  marginNone: {
    margin: 0,
  },

  marginSmall: {
    margin: spacing.md,
  },

  marginMedium: {
    margin: spacing.lg,
  },

  marginLarge: {
    margin: spacing.xl,
  },
});
