import React, { useState } from "react";
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
        safeNavigate("/(tabs)/account", true);
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

        {/* Summary card */}
        {notifications.length > 0 && (
          <View style={styles.summaryWrap}>
            <View
              style={[
                styles.summaryCard,
                { borderColor: colors.border.dark },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.text.secondary,
                    fontFamily: fontFamily.medium,
                  }}
                >
                  All activity
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "baseline",
                    gap: 8,
                    marginTop: 2,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 22,
                      color: colors.text.primary,
                      fontFamily: fontFamily.monoMedium,
                      letterSpacing: -0.6,
                    }}
                  >
                    {notifications.length}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.text.secondary,
                      fontFamily: fontFamily.medium,
                    }}
                  >
                    {notifications.length === 1 ? "item" : "items"}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 11.5,
                    color: unreadCount > 0 ? colors.lime[500] : colors.text.tertiary,
                    fontFamily: fontFamily.semibold,
                    marginTop: 6,
                  }}
                >
                  {unreadCount > 0
                    ? `${unreadCount} unread`
                    : "All caught up"}
                </Text>
              </View>
              {unreadCount > 0 && (
                <Pressable
                  onPress={markAllAsRead}
                  style={[
                    styles.markAllChip,
                    {
                      backgroundColor: colors.card.background,
                      borderColor: colors.border.medium,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.primary[500],
                      fontFamily: fontFamily.semibold,
                    }}
                  >
                    Mark all
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* Section label */}
        {notifications.length > 0 && (
          <Text
            style={[
              styles.sectionLabel,
              { color: colors.text.tertiary, fontFamily: fontFamily.semibold },
            ]}
          >
            RECENT
          </Text>
        )}

        {/* Notifications List */}
        {notifications.length > 0 ? (
          notifications.map((notification, index) => (
            <NotificationCard
              key={`${notification.id}_${index}_${notification.time}`}
              notification={notification}
              onPress={() => handleNotificationPress(notification)}
              isLast={index === notifications.length - 1}
            />
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
      backgroundColor: "rgba(157,91,255,0.06)",
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
