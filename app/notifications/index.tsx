import React, { useState, useEffect } from "react";
import {
  ScrollView,
  RefreshControl,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";
import { useNotifications } from "../../contexts/NotificationContext";
import { NotificationsSkeleton } from "../../components/ui/SkeletonLoader";
import { EmptyState } from "../../components/ui/EmptyState";
import { NotificationCard } from "../../components/notifications";
import { SPACING, BORDER_RADIUS, SHADOWS } from "../../constants/Colors";
import { fontFamily } from "../../constants/theme";

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  } = useNotifications();

  const [refreshing, setRefreshing] = useState(false);

  // Always load the latest notifications when the screen opens. The list used
  // to rely only on a one-time context init (which can run before data is
  // ready), so opening it often showed an empty list despite stored history.
  useEffect(() => {
    refreshNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = (notification: any) => {
    console.log("[NotificationsScreen] Notification pressed:", notification);

    // Mark as read first
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Safe navigation function
    const safeNavigate = (route: string, isReplace = false) => {
      try {
        if (isReplace) {
          router.replace(route as any);
        } else {
          router.push(route as any);
        }
      } catch (navError) {
        console.error("[NotificationsScreen] Navigation failed:", navError);
        // Show notification details as fallback
        Alert.alert(notification.title, notification.message, [{ text: "OK" }]);
      }
    };

    // Navigate based on notification type
    switch (notification.type) {
      case "transaction":
        safeNavigate("/(tabs)/spending", true);
        break;
      case "budget":
        safeNavigate("/(tabs)/spending", true);
        break;
      case "account":
        safeNavigate("/settings", true);
        break;
      case "insight":
        // Navigate to AI assistant
        router.back();
        setTimeout(() => {
          safeNavigate("/ai-assistant");
        }, 150);
        break;
      case "security":
        // Navigate to security settings
        router.back();
        setTimeout(() => {
          safeNavigate("/security");
        }, 150);
        break;
      default:
        // For unknown types, just show the notification details
        Alert.alert(notification.title, notification.message, [{ text: "OK" }]);
        break;
    }
  };

  // Group by calendar day so a long feed reads as a timeline instead of an
  // undifferentiated wall. Anything without a timestamp falls into "Earlier"
  // rather than being dropped.
  const groupedNotifications = React.useMemo(() => {
    const dayMs = 24 * 60 * 60 * 1000;
    const startOfToday = new Date().setHours(0, 0, 0, 0);

    const labelFor = (timestamp?: number): { key: string; label: string } => {
      if (!timestamp || Number.isNaN(timestamp)) {
        return { key: "earlier", label: "EARLIER" };
      }
      const startOfDay = new Date(timestamp).setHours(0, 0, 0, 0);
      if (startOfDay === startOfToday) return { key: "today", label: "TODAY" };
      if (startOfDay === startOfToday - dayMs) {
        return { key: "yesterday", label: "YESTERDAY" };
      }
      return {
        key: String(startOfDay),
        label: new Date(timestamp)
          .toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year:
              new Date(timestamp).getFullYear() === new Date().getFullYear()
                ? undefined
                : "numeric",
          })
          .toUpperCase(),
      };
    };

    const groups = new Map<
      string,
      { key: string; label: string; sort: number; items: typeof notifications }
    >();

    for (const notification of notifications) {
      const { key, label } = labelFor(notification.timestamp);
      const existing = groups.get(key);
      if (existing) {
        existing.items.push(notification);
      } else {
        groups.set(key, {
          key,
          label,
          // Undated items sink to the bottom.
          sort: notification.timestamp ?? 0,
          items: [notification],
        });
      }
    }

    return Array.from(groups.values()).sort((a, b) => b.sort - a.sort);
  }, [notifications]);

  const styles = createStyles(colors);

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: colors.background.secondary },
        ]}
      >
        <NotificationsSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={[
            styles.headerChip,
            {
              backgroundColor: colors.card.background,
              borderColor: colors.border.medium,
            },
          ]}
        >
          <Ionicons name="chevron-back" size={18} color={colors.text.secondary} />
        </Pressable>
        <Text
          style={[
            styles.headerTitleText,
            { color: colors.text.primary, fontFamily: fontFamily.semibold },
          ]}
        >
          Activity
        </Text>
        <Pressable
          onPress={() => router.push("/notifications/preferences")}
          style={[
            styles.headerChip,
            {
              backgroundColor: colors.card.background,
              borderColor: colors.border.medium,
            },
          ]}
        >
          <Ionicons
            name="settings-outline"
            size={18}
            color={colors.text.secondary}
          />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary.main}
          />
        }
      >
        {/* Error State */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons
              name="alert-circle-outline"
              size={48}
              color={colors.error.main}
            />
            <Text style={styles.errorTitle}>Error Loading Notifications</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Unread line + one-tap clear. The old summary card restated the
            list count in a large box; the only thing worth acting on here is
            "how many are unread", so that is all this shows. */}
        {notifications.length > 0 && (
          <View style={styles.statusRow}>
            <Text
              style={{
                fontSize: 13,
                color:
                  unreadCount > 0 ? colors.text.primary : colors.text.tertiary,
                fontFamily: fontFamily.medium,
              }}
            >
              {unreadCount > 0
                ? `${unreadCount} unread`
                : "You're all caught up"}
            </Text>
            {unreadCount > 0 && (
              <Pressable onPress={markAllAsRead} hitSlop={8}>
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.primary[500],
                    fontFamily: fontFamily.semibold,
                  }}
                >
                  Mark all read
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Notifications List */}
        {notifications.length > 0 ? (
          groupedNotifications.map((group) => (
            <View key={group.key}>
              <Text
                style={[
                  styles.dayHeader,
                  {
                    color: colors.text.tertiary,
                    fontFamily: fontFamily.semibold,
                  },
                ]}
              >
                {group.label}
              </Text>
              {group.items.map((notification, index) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onPress={() => handleNotificationPress(notification)}
                  isLast={index === group.items.length - 1}
                />
              ))}
            </View>
          ))
        ) : (
          <EmptyState
            type="notifications"
            iconName="notifications-off-outline"
            title="No notifications"
            description="You're all caught up! New notifications will appear here."
          />
        )}

        {/* Clear All Option */}
        {notifications.length > 0 && (
          <View style={styles.clearSection}>
            <Pressable
              onPress={() => {
                Alert.alert(
                  "Clear All Notifications",
                  "Are you sure you want to clear all notifications? This action cannot be undone.",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Clear All",
                      style: "destructive",
                      onPress: clearNotifications,
                    },
                  ]
                );
              }}
              style={[
                styles.clearAllButton,
                {
                  backgroundColor: colors.negBg,
                  borderColor: "rgba(214,58,102,0.18)",
                },
              ]}
            >
              <Ionicons name="trash-outline" size={16} color={colors.rose[500]} />
              <Text
                style={[
                  styles.clearAllText,
                  { color: colors.rose[500], fontFamily: fontFamily.semibold },
                ]}
              >
                Clear all
              </Text>
            </Pressable>
          </View>
        )}

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 22,
      paddingTop: 6,
      paddingBottom: 14,
    },
    headerChip: {
      width: 40,
      height: 40,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: StyleSheet.hairlineWidth,
    },
    headerTitleText: {
      fontSize: 16,
      letterSpacing: -0.2,
    },
    scrollView: { flex: 1 },
    summaryWrap: {
      paddingHorizontal: 22,
      paddingTop: 6,
    },
    summaryCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      padding: 18,
      borderRadius: 22,
      borderWidth: StyleSheet.hairlineWidth,
      backgroundColor: "rgba(78,124,255,0.06)",
    },
    markAllChip: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
    },
    sectionLabel: {
      paddingHorizontal: 28,
      paddingTop: 22,
      paddingBottom: 10,
      fontSize: 11,
      letterSpacing: 1.2,
    },
    statusRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 28,
      paddingTop: 18,
    },
    dayHeader: {
      paddingHorizontal: 28,
      paddingTop: 22,
      paddingBottom: 10,
      fontSize: 11,
      letterSpacing: 1.2,
    },
    clearSection: {
      paddingHorizontal: 22,
      marginTop: 12,
    },
    clearAllButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 13,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
    },
    clearAllText: { fontSize: 13.5 },
    errorContainer: {
      marginHorizontal: 22,
      marginTop: 14,
      padding: 18,
      borderRadius: 18,
      alignItems: "center",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border.medium,
      backgroundColor: colors.card.background,
    },
    errorTitle: {
      fontSize: 15,
      fontFamily: fontFamily.semibold,
      color: colors.text.primary,
      marginTop: 10,
      marginBottom: 4,
    },
    errorText: {
      fontSize: 13,
      color: colors.text.secondary,
      textAlign: "center",
      marginBottom: 14,
      fontFamily: fontFamily.medium,
      lineHeight: 18,
    },
    retryButton: {
      backgroundColor: colors.primary[500],
      paddingHorizontal: 18,
      paddingVertical: 11,
      borderRadius: 12,
    },
    retryButtonText: {
      fontSize: 13,
      fontFamily: fontFamily.semibold,
      color: "#fff",
    },
  });
