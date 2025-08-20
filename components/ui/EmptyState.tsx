import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { spacing, borderRadius, typography } from "../../constants/theme";
import { useTheme } from "../../contexts/ThemeContext";

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
  actionButton?: {
    title: string;
    onPress: () => void;
  };
  variant?: "default" | "small" | "large";
}

/**
 * Reusable EmptyState component for consistent empty state displays
 *
 * @param icon - Ionicons icon name
 * @param title - Main empty state title
 * @param subtitle - Optional subtitle
 * @param actionButton - Optional action button configuration
 * @param variant - Size variant for different contexts
 */
export default function EmptyState({
  icon,
  title,
  subtitle,
  actionButton,
  variant = "default",
}: EmptyStateProps) {
  const { colors } = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case "small":
        return {
          iconSize: 32,
          titleSize: typography.fontSizes.base,
          subtitleSize: typography.fontSizes.sm,
          padding: spacing.lg,
          container: { alignItems: 'center' as const, justifyContent: 'center' as const },
        };
      case "large":
        return {
          iconSize: 64,
          titleSize: typography.fontSizes.xl,
          subtitleSize: typography.fontSizes.base,
          padding: spacing.xl,
          container: { alignItems: 'center' as const, justifyContent: 'center' as const },
        };
      default:
        return {
          iconSize: 48,
          titleSize: typography.fontSizes.lg,
          subtitleSize: typography.fontSizes.base,
          padding: spacing.xl,
          container: { alignItems: 'center' as const, justifyContent: 'center' as const },
        };
    }
  };

  const getIconContainerStyle = () => {
    const styles = getVariantStyles();
    return {
      borderRadius: borderRadius.full,
      backgroundColor: colors.gray[100],
      alignItems: "center" as const,
      justifyContent: "center" as const,
      marginBottom: spacing.md,
      width: styles.iconSize,
      height: styles.iconSize,
    };
  };

  const getTitleStyle = () => {
    const styles = getVariantStyles();
    return {
      fontWeight: "600" as const,
      color: colors.text.secondary,
      textAlign: "center" as const,
      marginBottom: spacing.sm,
      fontSize: styles.titleSize,
    };
  };

  const getSubtitleStyle = () => {
    const styles = getVariantStyles();
    return {
      color: colors.text.tertiary,
      textAlign: "center" as const,
      lineHeight: typography.fontSizes.base * 1.5,
      paddingHorizontal: spacing.lg,
      fontSize: styles.subtitleSize,
    };
  };

  const getActionButtonStyle = () => {
    return {
      backgroundColor: colors.primary[500],
      borderRadius: borderRadius.xl,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      marginTop: spacing.lg,
    };
  };

  const getActionButtonTextStyle = () => {
    return {
      color: "white",
      fontWeight: "700" as const,
      fontSize: typography.fontSizes.base,
    };
  };

  const styles = getVariantStyles();

  return (
    <View style={[styles.container, { 
      padding: styles.padding 
    }]}>
      {/* Icon */}
      <View style={getIconContainerStyle()}>
        <Ionicons
          name={icon as any}
          size={styles.iconSize * 0.6}
          color={colors.gray[400]}
        />
      </View>

      {/* Title */}
      <Text style={getTitleStyle()}>{title}</Text>

      {/* Subtitle */}
      {subtitle && <Text style={getSubtitleStyle()}>{subtitle}</Text>}

      {/* Action Button */}
      {actionButton && (
        <TouchableOpacity
          style={getActionButtonStyle()}
          onPress={actionButton.onPress}
          activeOpacity={0.7}
        >
          <Text style={getActionButtonTextStyle()}>{actionButton.title}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
});
