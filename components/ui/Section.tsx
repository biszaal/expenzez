import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { spacing, typography } from "../../constants/theme";
import { useTheme } from "../../contexts/ThemeContext";

interface SectionProps {
  title?: string;
  children: React.ReactNode;
  marginTop?: number;
  marginBottom?: number;
}

/**
 * Reusable Section component for organizing content with consistent spacing
 *
 * @param title - Optional section title
 * @param children - Section content
 * @param marginTop - Custom top margin
 * @param marginBottom - Custom bottom margin
 */
export default function Section({
  title,
  children,
  marginTop = spacing.lg,
  marginBottom = 0,
}: SectionProps) {
  const { colors } = useTheme();

  const getTitleStyle = () => {
    return {
      fontSize: typography.fontSizes.lg,
      fontWeight: "700" as const,
      color: colors.text.primary,
      marginBottom: spacing.md,
    };
  };

  return (
    <View style={[styles.container, { marginTop, marginBottom }]}>
      {title && <Text style={getTitleStyle()}>{title}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
  },
});
