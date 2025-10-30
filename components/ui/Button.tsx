import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import { typography, spacing, borderRadius } from "../../constants/theme";
import { useTheme } from "../../contexts/ThemeContext";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
}: ButtonProps) {
  const { colors, shadows } = useTheme();

  const getVariantStyle = () => {
    switch (variant) {
      case "primary":
        return {
          backgroundColor: colors.primary.main,
          ...shadows.sm,
        };
      case "secondary":
        return {
          backgroundColor: colors.secondary.main,
          ...shadows.sm,
        };
      case "outline":
        return {
          backgroundColor: "transparent",
          borderWidth: 2,
          borderColor: colors.primary.main,
        };
      case "ghost":
        return {
          backgroundColor: "transparent",
        };
      default:
        return {
          backgroundColor: colors.primary.main,
          ...shadows.sm,
        };
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case "small":
        return {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          minHeight: 36,
        };
      case "large":
        return {
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.lg,
          minHeight: 56,
        };
      default:
        return {
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          minHeight: 48,
        };
    }
  };

  const getTextStyle = () => {
    const baseTextStyle = {
      fontWeight: typography.fontWeights.semibold,
      textAlign: "center" as const,
    };

    const variantTextStyle = (() => {
      switch (variant) {
        case "primary":
        case "secondary":
          return { color: colors.text.inverse };
        case "outline":
        case "ghost":
          return { color: colors.primary.main };
        default:
          return { color: colors.text.inverse };
      }
    })();

    const sizeTextStyle = (() => {
      switch (size) {
        case "small":
          return { fontSize: typography.fontSizes.sm };
        case "large":
          return { fontSize: typography.fontSizes.lg };
        default:
          return { fontSize: typography.fontSizes.base };
      }
    })();

    const disabledTextStyle = disabled ? { color: colors.text.tertiary } : {};

    return {
      ...baseTextStyle,
      ...variantTextStyle,
      ...sizeTextStyle,
      ...disabledTextStyle,
    };
  };

  const buttonStyle = [
    styles.base,
    getVariantStyle(),
    getSizeStyle(),
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const buttonTextStyle = [getTextStyle(), textStyle] as any;

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      <Text style={buttonTextStyle}>{loading ? "Loading..." : title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadius.lg,
  },

  // Width
  fullWidth: {
    width: "100%",
  },

  // Disabled state
  disabled: {
    opacity: 0.5,
  },
});
