import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { spacing, borderRadius, typography } from "../../constants/theme";
import { useTheme } from "../../contexts/ThemeContext";

interface ListItemProps {
  icon?: {
    name: string;
    color?: string;
    backgroundColor?: string;
  };
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  showBorder?: boolean;
  disabled?: boolean;
  variant?: "default" | "danger" | "success";
}

/**
 * Reusable ListItem component for consistent list styling
 *
 * @param icon - Optional icon configuration
 * @param title - Main item title
 * @param subtitle - Optional subtitle
 * @param rightElement - Custom right element (e.g., switch, chevron)
 * @param onPress - Press handler
 * @param showBorder - Whether to show bottom border
 * @param disabled - Whether item is disabled
 * @param variant - Item style variant
 */
export default function ListItem({
  icon,
  title,
  subtitle,
  rightElement,
  onPress,
  showBorder = true,
  disabled = false,
  variant = "default",
}: ListItemProps) {
  const { colors } = useTheme();

  // Early return if colors is not available
  if (!colors) {
    return null;
  }

  const getVariantColors = () => {
    switch (variant) {
      case "danger":
        return {
          titleColor: colors.error[600],
          iconColor: colors.error[600],
          iconBackground: colors.error[100],
        };
      case "success":
        return {
          titleColor: colors.success[600],
          iconColor: colors.success[600],
          iconBackground: colors.success[100],
        };
      default:
        return {
          titleColor: colors.text.primary,
          iconColor: colors.primary.main,
          iconBackground: colors.primary.main[100],
        };
    }
  };

  const variantColors = getVariantColors();

  const getContainerStyle = () => {
    const baseStyle = {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
    };

    if (showBorder) {
      return {
        ...baseStyle,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
      };
    }

    return baseStyle;
  };

  const getIconStyle = () => {
    return {
      width: 40,
      height: 40,
      borderRadius: borderRadius.lg,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      marginRight: spacing.md,
      backgroundColor: icon?.backgroundColor || variantColors.iconBackground,
    };
  };

  const getTitleStyle = () => {
    return {
      fontSize: typography.fontSizes.base,
      fontWeight: "600" as const,
      color: disabled ? colors.text.tertiary : variantColors.titleColor,
    };
  };

  const getSubtitleStyle = () => {
    return {
      fontSize: typography.fontSizes.sm,
      color: disabled ? colors.text.tertiary : colors.text.secondary,
      marginTop: spacing.xs,
    };
  };

  const Container = onPress ? TouchableOpacity : View;
  const containerProps = onPress ? { onPress, activeOpacity: 0.7 } : {};

  return (
    <Container
      style={[getContainerStyle(), disabled && styles.disabled]}
      {...containerProps}
    >
      {/* Left side - Icon */}
      {icon && (
        <View style={getIconStyle()}>
          <Ionicons
            name={icon.name as any}
            size={20}
            color={icon.color || variantColors.iconColor}
          />
        </View>
      )}

      {/* Center - Content */}
      <View style={styles.content}>
        <Text style={getTitleStyle()}>{title}</Text>
        {subtitle && <Text style={getSubtitleStyle()}>{subtitle}</Text>}
      </View>

      {/* Right side - Custom element or chevron */}
      <View style={styles.rightSection}>
        {rightElement ||
          (onPress && (
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.primary.main}
            />
          ))}
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  rightSection: {
    alignItems: "flex-end",
  },
  disabled: {
    opacity: 0.5,
  },
});
