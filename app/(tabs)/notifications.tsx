import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useTheme } from '../../contexts/ThemeContext';
import { notificationAPI } from '../../services/api/notificationAPI';
import { TabLoadingScreen } from '../../components/ui';

interface NotificationItem {
  notificationId: string;
  type: 'transaction' | 'budget' | 'account' | 'security' | 'insight';
  title: string;
  message: string;
  data?: Record<string, any>;
  priority: 'low' | 'normal' | 'high';
  sentAt: number;
  status: 'sent' | 'delivered' | 'failed';
}

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      console.log('[Notifications] Loading notification history...');
      const response = await notificationAPI.getHistory(100); // Load last 100 notifications

      if (response.success && response.notifications) {
        const sortedNotifications = response.notifications.sort(
          (a: NotificationItem, b: NotificationItem) => b.sentAt - a.sentAt
        );
        setNotifications(sortedNotifications);
        console.log('[Notifications] Loaded', sortedNotifications.length, 'notifications');
      } else {
        console.log('[Notifications] No notifications found or API response unsuccessful');
        setNotifications([]);
      }
    } catch (error) {
      console.error('[Notifications] Error loading notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const onRefresh = () => {
    loadNotifications(true);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'budget':
        return 'warning';
      case 'transaction':
        return 'card';
      case 'account':
        return 'calendar';
      case 'security':
        return 'shield-checkmark';
      case 'insight':
        return 'bulb';
      default:
        return 'notifications';
    }
  };


  const getTypeColor = (type: string) => {
    switch (type) {
      case 'budget':
        return '#F59E0B'; // Orange
      case 'transaction':
        return '#10B981'; // Green
      case 'account':
        return colors.primary[500]; // Blue
      case 'security':
        return '#EF4444'; // Red
      case 'insight':
        return '#8B5CF6'; // Purple
      default:
        return colors.primary[500];
    }
  };

  const formatDate = (timestamp: number) => {
    const date = dayjs(timestamp);
    const now = dayjs();

    if (date.isSame(now, 'day')) {
      return `Today ${date.format('HH:mm')}`;
    } else if (date.isSame(now.subtract(1, 'day'), 'day')) {
      return `Yesterday ${date.format('HH:mm')}`;
    } else if (date.isAfter(now.subtract(7, 'days'))) {
      return date.format('ddd HH:mm');
    } else {
      return date.format('MMM DD, HH:mm');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'checkmark-circle';
      case 'failed':
        return 'close-circle';
      default:
        return 'time';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return '#10B981'; // Green
      case 'failed':
        return '#EF4444'; // Red
      default:
        return '#6B7280'; // Gray
    }
  };

  if (loading) {
    return <TabLoadingScreen />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Notifications
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.text.secondary }]}>
          {notifications.length} notifications
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary[500]]}
            tintColor={colors.primary[500]}
          />
        }
      >
        {notifications.length > 0 ? (
          <View style={styles.notificationsList}>
            {notifications.map((notification) => (
              <TouchableOpacity
                key={notification.notificationId}
                style={[
                  styles.notificationCard,
                  {
                    backgroundColor: colors.background.secondary,
                    borderLeftColor: getTypeColor(notification.type),
                  }
                ]}
                activeOpacity={0.7}
              >
                <View style={styles.notificationRow}>
                  <View style={styles.notificationLeft}>
                    <View
                      style={[
                        styles.notificationIconContainer,
                        { backgroundColor: getTypeColor(notification.type) + '20' }
                      ]}
                    >
                      <Ionicons
                        name={getNotificationIcon(notification.type)}
                        size={20}
                        color={getTypeColor(notification.type)}
                      />
                    </View>
                    <View style={styles.notificationContent}>
                      <Text style={[styles.notificationTitle, { color: colors.text.primary }]}>
                        {notification.title}
                      </Text>
                      <Text style={[styles.notificationMessage, { color: colors.text.secondary }]}>
                        {notification.message}
                      </Text>
                      <View style={styles.notificationMeta}>
                        <Text style={[styles.notificationTime, { color: colors.text.tertiary }]}>
                          {formatDate(notification.sentAt)}
                        </Text>
                        <View style={styles.notificationBadges}>
                          <View
                            style={[
                              styles.typeBadge,
                              { backgroundColor: getTypeColor(notification.type) + '15' }
                            ]}
                          >
                            <Text
                              style={[
                                styles.typeBadgeText,
                                { color: getTypeColor(notification.type) }
                              ]}
                            >
                              {notification.type}
                            </Text>
                          </View>
                          {notification.priority === 'high' && (
                            <View
                              style={[
                                styles.priorityBadge,
                                { backgroundColor: '#EF4444' + '15' }
                              ]}
                            >
                              <Text style={[styles.priorityBadgeText, { color: '#EF4444' }]}>
                                urgent
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                  <View style={styles.notificationRight}>
                    <Ionicons
                      name={getStatusIcon(notification.status)}
                      size={16}
                      color={getStatusColor(notification.status)}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.background.secondary }]}>
              <Ionicons name="notifications-outline" size={48} color={colors.text.tertiary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
              No notifications yet
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.text.secondary }]}>
              You&apos;ll see bill reminders and other important updates here.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  notificationsList: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  notificationCard: {
    marginBottom: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 20,
  },
  notificationMessage: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 18,
    marginBottom: 8,
  },
  notificationMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  notificationBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  notificationRight: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});