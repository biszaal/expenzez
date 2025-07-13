import React from "react";
import { Text, StyleSheet, TextStyle } from "react-native";
import { colors, typography } from "../../constants/theme";

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
  style?: TextStyle;
}

export default function Typography({
  children,
  variant = "body",
  color = "primary",
  weight = "normal",
  align = "left",
  style,
}: TypographyProps) {
  const textStyle = [
    styles.base,
    styles[variant],
    styles[`color${color.charAt(0).toUpperCase() + color.slice(1)}`],
    styles[`weight${weight.charAt(0).toUpperCase() + weight.slice(1)}`],
    styles[`align${align.charAt(0).toUpperCase() + align.slice(1)}`],
    style,
  ];

  return <Text style={textStyle}>{children}</Text>;
}

const styles = StyleSheet.create({
  base: {
    color: colors.text.primary,
  },

  // Variants
  h1: {
    fontSize: typography.fontSizes["3xl"],
    fontWeight: typography.fontWeights.black,
    lineHeight: typography.lineHeights.tight * typography.fontSizes["3xl"],
  },

  h2: {
    fontSize: typography.fontSizes["2xl"],
    fontWeight: typography.fontWeights.bold,
    lineHeight: typography.lineHeights.tight * typography.fontSizes["2xl"],
  },

  h3: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    lineHeight: typography.lineHeights.tight * typography.fontSizes.xl,
  },

  h4: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    lineHeight: typography.lineHeights.normal * typography.fontSizes.lg,
  },

  body: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.normal,
    lineHeight: typography.lineHeights.normal * typography.fontSizes.base,
  },

  caption: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.normal,
    lineHeight: typography.lineHeights.normal * typography.fontSizes.sm,
  },

  label: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    lineHeight: typography.lineHeights.normal * typography.fontSizes.sm,
  },

  // Colors
  colorPrimary: {
    color: colors.text.primary,
  },

  colorSecondary: {
    color: colors.text.secondary,
  },

  colorTertiary: {
    color: colors.text.tertiary,
  },

  colorInverse: {
    color: colors.text.inverse,
  },

  colorSuccess: {
    color: colors.success[500],
  },

  colorError: {
    color: colors.error[500],
  },

  colorWarning: {
    color: colors.warning[500],
  },

  // Weights
  weightNormal: {
    fontWeight: typography.fontWeights.normal,
  },

  weightMedium: {
    fontWeight: typography.fontWeights.medium,
  },

  weightSemibold: {
    fontWeight: typography.fontWeights.semibold,
  },

  weightBold: {
    fontWeight: typography.fontWeights.bold,
  },

  weightExtrabold: {
    fontWeight: typography.fontWeights.extrabold,
  },

  weightBlack: {
    fontWeight: typography.fontWeights.black,
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
