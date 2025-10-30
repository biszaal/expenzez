import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { spacing, borderRadius } from "../../constants/theme";

interface SecurityToggleProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBackgroundColor?: string;
  title: string;
  subtitle: string;
  value?: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
  disabled?: boolean;
  showSwitch?: boolean;
  showArrow?: boolean;
  customTrackColor?: string;
}

export const SecurityToggle: React.FC<SecurityToggleProps> = ({
  icon,
  iconColor,
  iconBackgroundColor,
  title,
  subtitle,
  value = false,
  onToggle,
  onPress,
  disabled = false,
  showSwitch = true,
  showArrow = false,
}) => {
  const { colors } = useTheme();

  const finalIconColor = iconColor || colors.primary.main;
  const finalIconBgColor = iconBackgroundColor || colors.primary.main[100];

  const content = (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <View
          style={[
            styles.settingIcon,
            { backgroundColor: finalIconBgColor },
          ]}
        >
          <Ionicons
            name={icon}
            size={20}
            color={finalIconColor}
          />
        </View>
        <View style={styles.settingContent}>
          <Text
            style={[
              styles.settingTitle,
              { color: colors.text.primary },
            ]}
          >
            {title}
          </Text>
          <Text
            style={[
              styles.settingSubtitle,
              { color: colors.text.secondary },
            ]}
          >
            {subtitle}
          </Text>
        </View>
      </View>
      {showSwitch && onToggle && (
        <Switch
          value={value}
          onValueChange={onToggle}
          disabled={disabled}
          trackColor={{
            false: colors.gray[200],
            true: iconColor || colors.primary.main,
          }}
          thumbColor={value ? "white" : colors.gray[300]}
        />
      )}
      {showArrow && (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.gray[400]}
        />
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} disabled={disabled}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
});
