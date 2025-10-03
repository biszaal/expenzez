import React, { useEffect, useState } from 'react';
import { ScrollView, RefreshControl, StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { NotificationsSkeleton } from '../../components/ui/SkeletonLoader';
import { EmptyState } from '../../components/ui/EmptyState';
import { NotificationCard, NotificationCategories, SmartNotificationInsights } from '../../components/notifications';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/Colors';

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
    preferences
  } = useNotifications();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = (notification: any) => {
    console.log('[NotificationsScreen] Notification pressed:', notification);

    // Mark as read
    if (!notification.read) {
      markAsRead(notification.id);
    }

    try {
      // Navigate based on notification type with robust error handling
      switch (notification.type) {
        case 'transaction':
          console.log('[NotificationsScreen] Navigating to spending tab');
          // Use replace to avoid navigation stack issues
          router.replace('/(tabs)/spending');
          break;
        case 'budget':
          console.log('[NotificationsScreen] Navigating to spending tab for budget');
          router.replace('/(tabs)/spending');
          break;
        case 'account':
          console.log('[NotificationsScreen] Navigating to account tab');
          router.replace('/(tabs)/account');
          break;
        case 'insight':
          console.log('[NotificationsScreen] Navigating to AI assistant');
          // First navigate to home, then to AI assistant to ensure proper stack
          router.replace('/(tabs)');
          setTimeout(() => {
            router.push('/ai-assistant');
          }, 100);
          break;
        case 'security':
          console.log('[NotificationsScreen] Navigating to security settings');
          // First navigate to account tab, then to security
          router.replace('/(tabs)/account');
          setTimeout(() => {
            router.push('/security');
          }, 100);
          break;
        default:
          console.log('[NotificationsScreen] Unknown notification type, showing alert');
          // Show details in alert for now
          Alert.alert(
            notification.title,
            notification.message,
            [{ text: 'OK' }]
          );
          break;
      }
    } catch (error: any) {
      console.error('[NotificationsScreen] Navigation error:', error);
      Alert.alert(
        'Navigation Error',
        `Unable to navigate to ${notification.type} section. Please try again.`,
        [
          {
            text: 'Show Details',
            onPress: () => Alert.alert(notification.title, notification.message)
          },
          {
            text: 'Go to Home',
            onPress: () => {
              try {
                router.replace('/(tabs)');
              } catch (err) {
                console.error('[NotificationsScreen] Failed to navigate to home:', err);
              }
            }
          },
          { text: 'OK' }
        ]
      );
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (selectedCategory === 'all') return true;
    return notification.type === selectedCategory;
  });

  const categories = [
    { id: 'all', title: 'All', icon: 'list-outline', count: notifications.length },
    { id: 'transaction', title: 'Transactions', icon: 'swap-horizontal-outline', count: notifications.filter(n => n.type === 'transaction').length },
    { id: 'budget', title: 'Budget', icon: 'pie-chart-outline', count: notifications.filter(n => n.type === 'budget').length },
    { id: 'insight', title: 'Insights', icon: 'bulb-outline', count: notifications.filter(n => n.type === 'insight').length },
    { id: 'security', title: 'Security', icon: 'shield-checkmark-outline', count: notifications.filter(n => n.type === 'security').length },
  ];

  const styles = createStyles(colors);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.secondary }]}>
        <NotificationsSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.markAllReadButton}
              onPress={markAllAsRead}
            >
              <Text style={styles.markAllReadText}>Mark all read</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push('/notifications/preferences')}
          >
            <Ionicons name="settings-outline" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
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
        {/* Smart Insights Section */}
        <SmartNotificationInsights />

        {/* Category Filter */}
        <NotificationCategories
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        {/* Error State */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.error.main} />
            <Text style={styles.errorTitle}>Error Loading Notifications</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Notifications List */}
        <View style={styles.notificationsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory === 'all' ? 'All Notifications' : categories.find(c => c.id === selectedCategory)?.title}
            </Text>
            <Text style={styles.sectionSubtitle}>
              {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
            </Text>
          </View>

          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification, index) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onPress={() => handleNotificationPress(notification)}
                isLast={index === filteredNotifications.length - 1}
              />
            ))
          ) : (
            <EmptyState
              type="notifications"
              iconName={selectedCategory === 'all' ? 'notifications-off-outline' : categories.find(c => c.id === selectedCategory)?.icon as any}
              title={`No ${selectedCategory === 'all' ? '' : categories.find(c => c.id === selectedCategory)?.title?.toLowerCase() + ' '}notifications`}
              description={
                selectedCategory === 'all'
                  ? "You're all caught up! New notifications will appear here."
                  : `No ${categories.find(c => c.id === selectedCategory)?.title?.toLowerCase()} notifications yet.`
              }
            />
          )}
        </View>

        {/* Clear All Option */}
        {notifications.length > 0 && (
          <View style={styles.clearSection}>
            <TouchableOpacity
              style={styles.clearAllButton}
              onPress={() => {
                Alert.alert(
                  'Clear All Notifications',
                  'Are you sure you want to clear all notifications? This action cannot be undone.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Clear All',
                      style: 'destructive',
                      onPress: clearNotifications
                    }
                  ]
                );
              }}
            >
              <Ionicons name="trash-outline" size={16} color={colors.error.main} />
              <Text style={styles.clearAllText}>Clear All Notifications</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light
  },
  backButton: {
    padding: SPACING.sm
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: SPACING.md
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm
  },
  markAllReadButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: colors.primary.main + '15',
    borderRadius: BORDER_RADIUS.sm
  },
  markAllReadText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary.main
  },
  settingsButton: {
    padding: SPACING.sm
  },
  scrollView: {
    flex: 1
  },
  notificationsSection: {
    marginTop: SPACING.lg
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500'
  },
  emptyState: {
    backgroundColor: colors.background.primary,
    margin: SPACING.lg,
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    ...SHADOWS.sm
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm
  },
  emptyText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20
  },
  clearSection: {
    margin: SPACING.lg,
    marginTop: SPACING.xl
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error.main + '10',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: colors.error.main + '30'
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error.main,
    marginLeft: SPACING.sm
  },
  errorContainer: {
    backgroundColor: colors.background.primary,
    margin: SPACING.lg,
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    ...SHADOWS.sm
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm
  },
  errorText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: SPACING.lg
  },
  retryButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.background.primary
  }
});