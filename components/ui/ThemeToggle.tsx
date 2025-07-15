import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import Typography from "./Typography";
import { spacing, borderRadius } from "../../constants/theme";

interface ThemeToggleProps {
  variant?: "icon" | "button" | "full";
  size?: "small" | "medium" | "large";
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = "icon",
  size = "medium",
}) => {
  const { isDark, toggleTheme, colorScheme } = useTheme();

  const getIconName = () => {
    if (colorScheme === "system") {
      return "contrast-outline";
    }
    return isDark ? "sunny-outline" : "moon-outline";
  };

  const getSize = () => {
    switch (size) {
      case "small":
        return 20;
      case "large":
        return 28;
      default:
        return 24;
    }
  };

  const getPadding = () => {
    switch (size) {
      case "small":
        return spacing.sm;
      case "large":
        return spacing.lg;
      default:
        return spacing.md;
    }
  };

  if (variant === "icon") {
    return (
      <TouchableOpacity
        style={[styles.iconButton, { padding: getPadding() }]}
        onPress={toggleTheme}
        activeOpacity={0.7}
      >
        <Ionicons
          name={getIconName()}
          size={getSize()}
          color={isDark ? "#FCD34D" : "#F59E0B"}
        />
      </TouchableOpacity>
    );
  }

  if (variant === "button") {
    return (
      <TouchableOpacity
        style={[styles.button, { padding: getPadding() }]}
        onPress={toggleTheme}
        activeOpacity={0.7}
      >
        <Ionicons
          name={getIconName()}
          size={getSize()}
          color={isDark ? "#FCD34D" : "#F59E0B"}
        />
        <Typography
          variant="caption"
          color="secondary"
          style={styles.buttonText}
        >
          {isDark ? "Light" : "Dark"}
        </Typography>
      </TouchableOpacity>
    );
  }

  // Full variant with system option
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.fullButton,
          colorScheme === "light" && styles.activeButton,
        ]}
        onPress={() => toggleTheme()}
        activeOpacity={0.7}
      >
        <Ionicons
          name="sunny-outline"
          size={20}
          color={colorScheme === "light" ? "#F59E0B" : "#9CA3AF"}
        />
        <Typography
          variant="caption"
          color={colorScheme === "light" ? "primary" : "secondary"}
          style={styles.fullButtonText}
        >
          Light
        </Typography>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.fullButton,
          colorScheme === "dark" && styles.activeButton,
        ]}
        onPress={() => toggleTheme()}
        activeOpacity={0.7}
      >
        <Ionicons
          name="moon-outline"
          size={20}
          color={colorScheme === "dark" ? "#FCD34D" : "#9CA3AF"}
        />
        <Typography
          variant="caption"
          color={colorScheme === "dark" ? "primary" : "secondary"}
          style={styles.fullButtonText}
        >
          Dark
        </Typography>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.fullButton,
          colorScheme === "system" && styles.activeButton,
        ]}
        onPress={() => toggleTheme()}
        activeOpacity={0.7}
      >
        <Ionicons
          name="contrast-outline"
          size={20}
          color={colorScheme === "system" ? "#3B82F6" : "#9CA3AF"}
        />
        <Typography
          variant="caption"
          color={colorScheme === "system" ? "primary" : "secondary"}
          style={styles.fullButtonText}
        >
          Auto
        </Typography>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  iconButton: {
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  buttonText: {
    marginLeft: spacing.xs,
  },
  container: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  fullButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: spacing.xs,
  },
  activeButton: {
    backgroundColor: "#F3F4F6",
    borderColor: "#D1D5DB",
  },
  fullButtonText: {
    fontWeight: "600",
  },
});
