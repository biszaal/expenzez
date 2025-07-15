import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import {
  spacing,
  borderRadius,
  shadows,
  typography,
} from "../../constants/theme";

interface NotificationSetting {
  id: string;
  title: string;
  subtitle: string;
  enabled: boolean;
  icon: string;
}

const notificationSettings: NotificationSetting[] = [
  {
    id: "push",
    title: "Push Notifications",
    subtitle: "Receive instant alerts on your device",
    enabled: true,
    icon: "notifications",
  },
  {
    id: "email",
    title: "Email Notifications",
    subtitle: "Get updates via email",
    enabled: true,
    icon: "mail",
  },
  {
    id: "sms",
    title: "SMS Notifications",
    subtitle: "Receive text message alerts",
    enabled: false,
    icon: "chatbubble",
  },
  {
    id: "spending",
    title: "Spending Alerts",
    subtitle: "Get notified about unusual spending",
    enabled: true,
    icon: "card",
  },
  {
    id: "budget",
    title: "Budget Reminders",
    subtitle: "Stay on track with your budget",
    enabled: true,
    icon: "trending-up",
  },
  {
    id: "credit",
    title: "Credit Score Updates",
    subtitle: "Monitor your credit score changes",
    enabled: false,
    icon: "analytics",
  },
  {
    id: "security",
    title: "Security Alerts",
    subtitle: "Important security notifications",
    enabled: true,
    icon: "shield",
  },
  {
    id: "promotions",
    title: "Promotional Offers",
    subtitle: "Receive special offers and deals",
    enabled: false,
    icon: "gift",
  },
];

const recentNotifications = [
  {
    id: "1",
    title: "Budget Alert",
    message: "You've spent 80% of your monthly budget",
    time: "2 hours ago",
    type: "warning",
    read: false,
  },
  {
    id: "2",
    title: "Transaction Complete",
    message: "Payment of £45.20 to Tesco completed",
    time: "1 day ago",
    type: "info",
    read: true,
  },
  {
    id: "3",
    title: "Credit Score Update",
    message: "Your credit score increased by 15 points",
    time: "2 days ago",
    type: "success",
    read: true,
  },
  {
    id: "4",
    title: "Security Alert",
    message: "New device logged into your account",
    time: "3 days ago",
    type: "warning",
    read: true,
  },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { colors, isDark } = useTheme();
  const [settings, setSettings] =
    useState<NotificationSetting[]>(notificationSettings);
  const [notifications, setNotifications] = useState(recentNotifications);

  const toggleSetting = (id: string) => {
    setSettings((prev) =>
      prev.map((setting) =>
        setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
      )
    );
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const clearAllNotifications = () => {
    Alert.alert(
      "Clear All Notifications",
      "Are you sure you want to clear all notifications?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => setNotifications([]),
        },
      ]
    );
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background.secondary },
      ]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            { backgroundColor: colors.background.primary },
          ]}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={[
                styles.backButton,
                { backgroundColor: colors.background.secondary },
                shadows.sm,
              ]}
              onPress={() => router.back()}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color={colors.primary[500]}
              />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
              Notifications
            </Text>
            <TouchableOpacity
              style={[
                styles.clearButton,
                { backgroundColor: colors.primary[100] },
                shadows.sm,
              ]}
              onPress={clearAllNotifications}
            >
              <Text
                style={[styles.clearButtonText, { color: colors.primary[500] }]}
              >
                Clear All
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Notification Settings
          </Text>
          <View
            style={[
              styles.settingsCard,
              {
                backgroundColor: colors.background.primary,
                borderColor: colors.border.light,
              },
              shadows.sm,
            ]}
          >
            {settings.map((setting, index) => (
              <View
                key={setting.id}
                style={[
                  styles.settingItem,
                  index !== settings.length - 1 && {
                    borderBottomColor: colors.border.light,
                    borderBottomWidth: 1,
                  },
                ]}
              >
                <View style={styles.settingLeft}>
                  <View
                    style={[
                      styles.settingIcon,
                      { backgroundColor: colors.primary[100] },
                    ]}
                  >
                    <Ionicons
                      name={setting.icon as any}
                      size={20}
                      color={colors.primary[500]}
                    />
                  </View>
                  <View style={styles.settingContent}>
                    <Text
                      style={[
                        styles.settingTitle,
                        { color: colors.text.primary },
                      ]}
                    >
                      {setting.title}
                    </Text>
                    <Text
                      style={[
                        styles.settingSubtitle,
                        { color: colors.text.secondary },
                      ]}
                    >
                      {setting.subtitle}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={setting.enabled}
                  onValueChange={() => toggleSetting(setting.id)}
                  trackColor={{
                    false: colors.gray[200],
                    true: colors.primary[500],
                  }}
                  thumbColor={setting.enabled ? "white" : colors.gray[300]}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Recent Notifications */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Recent Notifications
          </Text>
          <View
            style={[
              styles.notificationsCard,
              {
                backgroundColor: colors.background.primary,
                borderColor: colors.border.light,
              },
              shadows.sm,
            ]}
          >
            {notifications.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name="notifications-off"
                  size={48}
                  color={colors.gray[400]}
                />
                <Text
                  style={[styles.emptyTitle, { color: colors.text.primary }]}
                >
                  No notifications
                </Text>
                <Text
                  style={[
                    styles.emptySubtitle,
                    { color: colors.text.secondary },
                  ]}
                >
                  You're all caught up!
                </Text>
              </View>
            ) : (
              notifications.map((notification, index) => (
                <TouchableOpacity
                  key={notification.id}
                  style={[
                    styles.notificationItem,
                    index !== notifications.length - 1 && {
                      borderBottomColor: colors.border.light,
                      borderBottomWidth: 1,
                    },
                    !notification.read && {
                      backgroundColor: colors.primary[100],
                    },
                  ]}
                  onPress={() => markAsRead(notification.id)}
                >
                  <View style={styles.notificationLeft}>
                    <View
                      style={[
                        styles.notificationIcon,
                        {
                          backgroundColor:
                            notification.type === "warning"
                              ? colors.warning[100]
                              : notification.type === "success"
                                ? colors.success[100]
                                : colors.primary[100],
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          notification.type === "warning"
                            ? "warning"
                            : notification.type === "success"
                              ? "checkmark-circle"
                              : "information-circle"
                        }
                        size={20}
                        color={
                          notification.type === "warning"
                            ? colors.warning[500]
                            : notification.type === "success"
                              ? colors.success[500]
                              : colors.primary[500]
                        }
                      />
                    </View>
                    <View style={styles.notificationContent}>
                      <Text
                        style={[
                          styles.notificationTitle,
                          { color: colors.text.primary },
                        ]}
                      >
                        {notification.title}
                      </Text>
                      <Text
                        style={[
                          styles.notificationMessage,
                          { color: colors.text.secondary },
                        ]}
                      >
                        {notification.message}
                      </Text>
                      <Text
                        style={[
                          styles.notificationTime,
                          { color: colors.text.tertiary },
                        ]}
                      >
                        {notification.time}
                      </Text>
                    </View>
                  </View>
                  {!notification.read && (
                    <View
                      style={[
                        styles.unreadDot,
                        { backgroundColor: colors.primary[500] },
                      ]}
                    />
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Quick Actions
          </Text>
          <View
            style={[
              styles.actionsCard,
              {
                backgroundColor: colors.background.primary,
                borderColor: colors.border.light,
              },
              shadows.lg,
            ]}
          >
            <TouchableOpacity
              style={[
                styles.actionItem,
                { borderBottomColor: colors.border.light },
              ]}
            >
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: colors.primary[100] },
                ]}
              >
                <Ionicons
                  name="time-outline"
                  size={20}
                  color={colors.primary[500]}
                />
              </View>
              <View style={styles.actionContent}>
                <Text
                  style={[styles.actionTitle, { color: colors.text.primary }]}
                >
                  Set Quiet Hours
                </Text>
                <Text
                  style={[
                    styles.actionSubtitle,
                    { color: colors.text.secondary },
                  ]}
                >
                  Configure do not disturb times
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.primary[500]}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionItem,
                { borderBottomColor: colors.border.light },
              ]}
            >
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: colors.primary[100] },
                ]}
              >
                <Ionicons
                  name="filter-outline"
                  size={20}
                  color={colors.primary[500]}
                />
              </View>
              <View style={styles.actionContent}>
                <Text
                  style={[styles.actionTitle, { color: colors.text.primary }]}
                >
                  Notification Filters
                </Text>
                <Text
                  style={[
                    styles.actionSubtitle,
                    { color: colors.text.secondary },
                  ]}
                >
                  Customize what you receive
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.primary[500]}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem}>
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: colors.primary[100] },
                ]}
              >
                <Ionicons
                  name="download-outline"
                  size={20}
                  color={colors.primary[500]}
                />
              </View>
              <View style={styles.actionContent}>
                <Text
                  style={[styles.actionTitle, { color: colors.text.primary }]}
                >
                  Export Notifications
                </Text>
                <Text
                  style={[
                    styles.actionSubtitle,
                    { color: colors.text.secondary },
                  ]}
                >
                  Download notification history
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.primary[500]}
              />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing["2xl"],
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: "700" as const,
  },
  clearButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  clearButtonText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: "600" as const,
  },
  section: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: "700" as const,
    marginBottom: spacing.md,
  },
  settingsCard: {
    borderRadius: borderRadius["2xl"],
    borderWidth: 1,
    overflow: "hidden",
  },
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
    fontSize: typography.fontSizes.base,
    fontWeight: "600" as const,
    marginBottom: spacing.xs,
  },
  settingSubtitle: {
    fontSize: typography.fontSizes.sm,
  },
  notificationsCard: {
    borderRadius: borderRadius["2xl"],
    borderWidth: 1,
    overflow: "hidden",
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  notificationLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: "600" as const,
    marginBottom: spacing.xs,
  },
  notificationMessage: {
    fontSize: typography.fontSizes.sm,
    marginBottom: spacing.xs,
  },
  notificationTime: {
    fontSize: typography.fontSizes.xs,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
  },
  emptyState: {
    alignItems: "center" as const,
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: "600" as const,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: typography.fontSizes.sm,
  },
  actionsCard: {
    borderRadius: borderRadius["3xl"],
    borderWidth: 1,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: "600" as const,
  },
  actionSubtitle: {
    fontSize: typography.fontSizes.sm,
    marginTop: spacing.xs,
  },
});
