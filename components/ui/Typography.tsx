import React from "react";
import { Text, StyleSheet, TextStyle } from "react-native";
import { typography } from "../../constants/theme";
import { useTheme } from "../../contexts/ThemeContext";

interface TypographyProps {
  children: React.ReactNode;
  variant?: "h1" | "h2" | "h3" | "h4" | "body" | "caption" | "label";
  color?:
    | "primary"
    | "secondary"
    | "tertiary"
    | "inverse"
    | "success"
    | "error"
    | "warning";
  weight?: "normal" | "medium" | "semibold" | "bold" | "extrabold" | "black";
  align?: "left" | "center" | "right";
  style?: TextStyle | TextStyle[];
}

export default function Typography({
  children,
  variant = "body",
  color = "primary",
  weight = "normal",
  align = "left",
  style,
}: TypographyProps) {
  const { colors } = useTheme();

  // Early return if colors is not available
  if (!colors) {
    return (
      <Text style={[styles.base, styles[variant], style]}>{children}</Text>
    );
  }

  const getColorStyle = () => {
    switch (color) {
      case "primary":
        return { color: colors.text.primary };
      case "secondary":
        return { color: colors.text.secondary };
      case "tertiary":
        return { color: colors.text.tertiary };
      case "inverse":
        return { color: colors.text.inverse };
      case "success":
        return { color: colors.success.main };
      case "error":
        return { color: colors.error.main };
      case "warning":
        return { color: colors.warning.main };
      default:
        return { color: colors.text.primary };
    }
  };

  const textStyle = [
    styles.base,
    styles[variant],
    getColorStyle(),
    styles[`weight${weight.charAt(0).toUpperCase() + weight.slice(1)}`],
    styles[`align${align.charAt(0).toUpperCase() + align.slice(1)}`],
    style,
  ];

  return <Text style={textStyle}>{children}</Text>;
}

const styles = StyleSheet.create({
  base: {
    // Color will be applied dynamically
  },

  // Variants
  h1: {
    fontSize: typography.fontSizes["3xl"],
    fontWeight: typography.fontWeights.bold as any,
    lineHeight: typography.lineHeights.tight * typography.fontSizes["3xl"],
  },

  h2: {
    fontSize: typography.fontSizes["2xl"],
    fontWeight: typography.fontWeights.bold as any,
    lineHeight: typography.lineHeights.tight * typography.fontSizes["2xl"],
  },

  h3: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold as any,
    lineHeight: typography.lineHeights.tight * typography.fontSizes.xl,
  },

  h4: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold as any,
    lineHeight: typography.lineHeights.normal * typography.fontSizes.lg,
  },

  body: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.normal as any,
    lineHeight: typography.lineHeights.normal * typography.fontSizes.base,
  },

  caption: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.normal as any,
    lineHeight: typography.lineHeights.normal * typography.fontSizes.sm,
  },

  label: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold as any,
    lineHeight: typography.lineHeights.normal * typography.fontSizes.sm,
  },

  // Weights
  weightNormal: {
    fontWeight: typography.fontWeights.normal as any,
  },

  weightMedium: {
    fontWeight: typography.fontWeights.medium as any,
  },

  weightSemibold: {
    fontWeight: typography.fontWeights.semibold as any,
  },

  weightBold: {
    fontWeight: typography.fontWeights.bold as any,
  },

  weightExtrabold: {
    fontWeight: typography.fontWeights.bold as any,
  },

  weightBlack: {
    fontWeight: typography.fontWeights.bold as any,
  },

  // Alignment
  alignLeft: {
    textAlign: "left",
  },

  alignCenter: {
    textAlign: "center",
  },

  alignRight: {
    textAlign: "right",
  },
});
