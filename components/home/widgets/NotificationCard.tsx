import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { useNotifications, NotificationHistoryItem } from '../../../contexts/NotificationContext';
import { SHADOWS, SPACING, BORDER_RADIUS } from '../../../constants/Colors';

export const NotificationCard: React.FC = () => {
  const { colors } = useTheme();
  const router = useRouter();
  const { notifications, unreadCount, markAsRead } = useNotifications();

  // Show top 3 most recent notifications
  const recentNotifications = notifications.slice(0, 3);

  const handleNotificationPress = (notification: NotificationHistoryItem) => {
    // Mark as read
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'transaction':
        router.push('/(tabs)/spending');
        break;
      case 'budget':
        router.push('/(tabs)/spending');
        break;
      case 'account':
        router.push('/(tabs)/account');
        break;
      case 'insight':
        router.push('/ai-assistant');
        break;
      case 'security':
        router.push('/security');
        break;
      default:
        router.push('/notifications');
        break;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'transaction':
        return 'swap-horizontal-outline';
      case 'budget':
        return 'pie-chart-outline';
      case 'account':
        return 'card-outline';
      case 'security':
        return 'shield-checkmark-outline';
      case 'insight':
        return 'bulb-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'transaction':
        return colors.primary.main;
      case 'budget':
        return colors.warning.main;
      case 'account':
        return colors.primary.main;
      case 'security':
        return colors.error.main;
      case 'insight':
        return colors.accent.main;
      default:
        return colors.text.secondary;
    }
  };

  // Don't show the card if there are no notifications
  if (notifications.length === 0) {
    return null;
  }

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.background.primary }]}
        onPress={() => router.push('/notifications')}
        activeOpacity={0.8}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="notifications" size={20} color={colors.accent.main} />
            <Text style={styles.headerTitle}>Recent Notifications</Text>
          </View>
          <View style={styles.headerRight}>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount.toString()}
                </Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={16} color={colors.text.secondary} />
          </View>
        </View>

        {/* Notifications List */}
        <View style={styles.notificationsList}>
          {recentNotifications.map((notification, index) => (
            <TouchableOpacity
              key={notification.id || `notification-${index}`}
              style={[
                styles.notificationItem,
                index < recentNotifications.length - 1 && styles.notificationItemBorder,
                !notification.read && styles.unreadNotification
              ]}
              onPress={() => handleNotificationPress(notification)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.notificationIcon,
                { backgroundColor: getNotificationColor(notification.type) + '15' }
              ]}>
                <Ionicons
                  name={getNotificationIcon(notification.type) as any}
                  size={16}
                  color={getNotificationColor(notification.type)}
                />
              </View>

              <View style={styles.notificationContent}>
                <View style={styles.notificationHeader}>
                  <Text
                    style={[
                      styles.notificationTitle,
                      !notification.read && styles.unreadNotificationTitle
                    ]}
                    numberOfLines={1}
                  >
                    {notification.title}
                  </Text>
                  <View style={styles.notificationMeta}>
                    <Text style={styles.notificationTime}>{notification.time}</Text>
                    {!notification.read && <View style={styles.unreadDot} />}
                  </View>
                </View>
                <Text style={styles.notificationMessage} numberOfLines={1}>
                  {notification.message}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* View All Button */}
        {notifications.length > 3 && (
          <View style={styles.viewAllContainer}>
            <Text style={styles.viewAllText}>
              View all {notifications.length} notifications
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.sm,
  },
  card: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.md
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginLeft: SPACING.sm
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm
  },
  unreadBadge: {
    backgroundColor: colors.error.main,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.background.primary
  },
  notificationsList: {
    marginBottom: SPACING.sm
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SPACING.sm,
    gap: SPACING.sm
  },
  notificationItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light
  },
  unreadNotification: {
    backgroundColor: colors.primary.main + '05'
  },
  notificationIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2
  },
  notificationContent: {
    flex: 1
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
    marginRight: SPACING.sm
  },
  unreadNotificationTitle: {
    fontWeight: '700'
  },
  notificationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs
  },
  notificationTime: {
    fontSize: 11,
    color: colors.text.tertiary,
    fontWeight: '500'
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary.main
  },
  notificationMessage: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 16
  },
  viewAllContainer: {
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    alignItems: 'center'
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent.main
  }
});