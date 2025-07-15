import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { spacing, borderRadius, typography } from "../../constants/theme";
import { useTheme } from "../../contexts/ThemeContext";

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightButton?: {
    icon: string;
    onPress: () => void;
    color?: string;
  };
  variant?: "default" | "transparent";
}

/**
 * Reusable Header component for consistent navigation across screens
 *
 * @param title - Main header title
 * @param subtitle - Optional subtitle below the title
 * @param showBackButton - Whether to show the back button (default: true)
 * @param onBackPress - Custom back button handler
 * @param rightButton - Optional right button configuration
 * @param variant - Header style variant
 */
export default function Header({
  title,
  subtitle,
  showBackButton = true,
  onBackPress,
  rightButton,
  variant = "default",
}: HeaderProps) {
  const router = useRouter();
  const { colors, shadows } = useTheme();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const getContainerStyle = () => {
    const baseStyle = {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
    };

    if (variant === "transparent") {
      return {
        ...baseStyle,
        backgroundColor: "transparent",
      };
    }

    return {
      ...baseStyle,
      backgroundColor: colors.background.primary,
    };
  };

  const getBackButtonStyle = () => {
    return {
      width: 40,
      height: 40,
      borderRadius: borderRadius.xl,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      backgroundColor: colors.background.primary,
      ...shadows.sm,
    };
  };

  const getActionButtonStyle = () => {
    return {
      width: 40,
      height: 40,
      borderRadius: borderRadius.xl,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      backgroundColor: colors.primary[100],
      ...shadows.sm,
    };
  };

  const getTitleStyle = () => {
    return {
      fontSize: typography.fontSizes.xl,
      fontWeight: "700" as const,
      color: colors.text.primary,
      textAlign: "center" as const,
    };
  };

  const getSubtitleStyle = () => {
    return {
      fontSize: typography.fontSizes.base,
      color: colors.text.secondary,
      marginTop: spacing.xs,
      textAlign: "center" as const,
    };
  };

  return (
    <View style={getContainerStyle()}>
      <View style={styles.content}>
        {/* Left side - Back button or empty space */}
        <View style={styles.leftSection}>
          {showBackButton ? (
            <TouchableOpacity
              style={getBackButtonStyle()}
              onPress={handleBackPress}
              activeOpacity={0.7}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color={colors.primary[500]}
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholder} />
          )}
        </View>

        {/* Center - Title and subtitle */}
        <View style={styles.centerSection}>
          <Text style={getTitleStyle()}>{title}</Text>
          {subtitle && <Text style={getSubtitleStyle()}>{subtitle}</Text>}
        </View>

        {/* Right side - Action button or empty space */}
        <View style={styles.rightSection}>
          {rightButton ? (
            <TouchableOpacity
              style={getActionButtonStyle()}
              onPress={rightButton.onPress}
              activeOpacity={0.7}
            >
              <Ionicons
                name={rightButton.icon as any}
                size={20}
                color={rightButton.color || colors.primary[500]}
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholder} />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftSection: {
    width: 40,
    alignItems: "flex-start",
  },
  centerSection: {
    flex: 1,
    alignItems: "center",
  },
  rightSection: {
    width: 40,
    alignItems: "flex-end",
  },
  placeholder: {
    width: 40,
    height: 40,
  },
});
