import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useNotifications } from "../../contexts/NotificationContext";
import {
  spacing,
  borderRadius,
  shadows,
  typography,
} from "../../constants/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import {
  getNotificationSettings,
  getRecentNotifications,
} from "../../services/dataSource";

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

// Removed hardcoded notifications - now using real data from NotificationContext

export default function NotificationsScreen() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { colors, isDark } = useTheme();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    preferences,
    updatePreferences,
    loading,
    error,
  } = useNotifications();

  // Remove the old fetch logic as we now use the notification context

  // Request permissions for push notifications
  React.useEffect(() => {
    if (Platform.OS !== "web") {
      Notifications.requestPermissionsAsync();
    }
  }, []);


  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
  };

  const handleMarkAllAsRead = () => {
    Alert.alert(
      "Mark All as Read",
      "Mark all notifications as read?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mark Read",
          style: "default",
          onPress: () => markAllAsRead(),
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
            <View style={{ width: 32 }} />
          </View>
        </View>



        {/* Recent Notifications Section */}
        <View style={{ marginVertical: 16 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
              paddingHorizontal: 16,
            }}
          >
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Recent Notifications
            </Text>
            {notifications.length > 0 && (
              <TouchableOpacity onPress={handleMarkAllAsRead}>
                <Text style={{ color: colors.primary[600], fontWeight: "600" }}>
                  Mark All Read
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {notifications.length === 0 ? (
            <View style={{ alignItems: "center", marginVertical: 32 }}>
              <MaterialCommunityIcons
                name="bell-off-outline"
                size={64}
                color={colors.gray[300]}
              />
              <Text
                style={{
                  color: colors.text.secondary,
                  fontSize: 18,
                  marginTop: 12,
                  fontWeight: "600",
                }}
              >
                No notifications
              </Text>
              <Text
                style={{
                  color: colors.text.tertiary,
                  fontSize: 14,
                  marginTop: 4,
                }}
              >
                You&apos;re all caught up!
              </Text>
            </View>
          ) : (
            notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: notification.read
                    ? colors.background.primary
                    : colors.primary[50],
                  borderColor: colors.border.light,
                  borderWidth: 1,
                  borderRadius: 16,
                  marginHorizontal: 16,
                  marginBottom: 14,
                  paddingVertical: 16,
                  paddingHorizontal: 16,
                  shadowColor: colors.gray[900],
                  shadowOpacity: 0.06,
                  shadowRadius: 4,
                  shadowOffset: { width: 0, height: 2 },
                  position: "relative",
                }}
                activeOpacity={0.85}
                onPress={() => handleMarkAsRead(notification.id)}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor:
                      notification.type === "transaction"
                        ? colors.primary[100]
                        : notification.type === "budget"
                          ? colors.warning[100]
                          : notification.type === "account"
                            ? colors.success[100]
                            : notification.type === "security"
                              ? colors.error[100]
                              : notification.type === "insight"
                                ? colors.primary[100]
                                : colors.primary[50],
                    marginRight: 16,
                  }}
                >
                  <MaterialCommunityIcons
                    name={
                      notification.type === "transaction"
                        ? "swap-horizontal"
                        : notification.type === "budget"
                          ? "chart-line"
                          : notification.type === "account"
                            ? "bank"
                            : notification.type === "security"
                              ? "shield-check"
                              : notification.type === "insight"
                                ? "lightbulb"
                                : "bell"
                    }
                    size={28}
                    color={
                      notification.type === "transaction"
                        ? colors.primary[500]
                        : notification.type === "budget"
                          ? colors.warning[500]
                          : notification.type === "account"
                            ? colors.success[500]
                            : notification.type === "security"
                              ? colors.error[500]
                              : notification.type === "insight"
                                ? colors.primary[500]
                                : colors.primary[500]
                    }
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.text.primary,
                      fontWeight: notification.read ? "400" : "700",
                      fontSize: 16,
                      marginBottom: 2,
                    }}
                  >
                    {notification.title}
                  </Text>
                  <Text
                    style={{
                      color: colors.text.secondary,
                      fontSize: 14,
                      marginBottom: 2,
                    }}
                  >
                    {notification.message}
                  </Text>
                  <Text style={{ color: colors.text.tertiary, fontSize: 12 }}>
                    {notification.time}
                  </Text>
                </View>
                {!notification.read && (
                  <View
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 14,
                      backgroundColor: colors.primary[500],
                      borderRadius: 8,
                      paddingHorizontal: 7,
                      paddingVertical: 2,
                    }}
                  >
                    <Text
                      style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}
                    >
                      NEW
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
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
    borderRadius: borderRadius["4xl"],
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
  settingIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  notificationIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  unreadBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "red",
    borderRadius: borderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 1,
  },
});
