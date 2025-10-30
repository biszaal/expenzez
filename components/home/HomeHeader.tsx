import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useNotifications } from "../../contexts/NotificationContext";
import { APP_STRINGS } from "../../constants/strings";
import { styles } from "./HomeHeader.styles";

export const HomeHeader: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const { unreadCount } = useNotifications();

  // Early return if colors is not available
  if (!colors) {
    return null;
  }

  return (
    <View
      style={[
        styles.professionalHeader,
        { backgroundColor: colors.background.secondary },
      ]}
    >
      <View style={styles.professionalHeaderContent}>
        <View style={styles.professionalBrandSection}>
          <Text
            style={[
              styles.professionalHeaderTitle,
              { color: colors.text.primary },
            ]}
          >
            {APP_STRINGS.APP_NAME}
          </Text>
          <View
            style={[
              styles.professionalBrandDot,
              { backgroundColor: colors.primary.main },
            ]}
          />
        </View>
        <View style={styles.professionalHeaderRight}>
          <TouchableOpacity
            style={[
              styles.professionalNotificationButton,
              { backgroundColor: colors.background.primary },
            ]}
            onPress={() => router.push("/notifications")}
            activeOpacity={0.7}
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={colors.primary.main}
            />
            {unreadCount > 0 && (
              <View
                style={[
                  styles.professionalNotificationBadge,
                  { backgroundColor: colors.error.main },
                ]}
              >
                <Text
                  style={[
                    styles.professionalNotificationBadgeText,
                    { color: colors.background.primary },
                  ]}
                >
                  {unreadCount > 99 ? "99+" : unreadCount.toString()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
