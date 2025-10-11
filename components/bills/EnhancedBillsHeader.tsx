import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAuth } from '../../app/auth/AuthContext';

interface EnhancedBillsHeaderProps {
  totalBills: number;
  monthlyTotal: number;
  upcomingCount: number;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const EnhancedBillsHeader: React.FC<EnhancedBillsHeaderProps> = ({
  totalBills,
  monthlyTotal,
  upcomingCount,
  onRefresh,
  isRefreshing,
}) => {
  const router = useRouter();
  const { colors } = useTheme();
  const { unreadCount } = useNotifications();
  const { user } = useAuth();

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <Text style={[styles.greeting, { color: colors.text.primary }]}>
            {user?.name ? `Hi, ${user.name.split(" ")[0]}` : 'Welcome back'}
          </Text>
          <Text style={[styles.subGreeting, { color: colors.text.secondary }]}>
            Manage your recurring bills
          </Text>
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.notificationButton, { backgroundColor: colors.background.secondary }]}
            onPress={() => router.push("/notifications")}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.primary[500]} />
            {unreadCount > 0 && (
              <View style={[styles.notificationBadge, { backgroundColor: colors.error[500] }]}>
                <Text style={[styles.badgeText, { color: colors.background.primary }]}>
                  {unreadCount > 99 ? '99+' : unreadCount.toString()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.refreshButton, { backgroundColor: colors.background.secondary }]}
            onPress={onRefresh}
            disabled={isRefreshing}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={isRefreshing ? "refresh" : "refresh-outline"} 
              size={22} 
              color={colors.primary[500]} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.background.secondary }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.primary[100] }]}>
              <Ionicons name="receipt-outline" size={20} color={colors.primary[500]} />
            </View>
            <Text style={[styles.statValue, { color: colors.text.primary }]}>
              {totalBills}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
              Total Bills
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.background.secondary }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.warning[100] }]}>
              <Ionicons name="calendar-outline" size={20} color={colors.warning[500]} />
            </View>
            <Text style={[styles.statValue, { color: colors.text.primary }]}>
              £{Math.abs(monthlyTotal).toFixed(0)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
              Monthly Total
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.background.secondary }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.error[100] }]}>
              <Ionicons name="time-outline" size={20} color={colors.error[500]} />
            </View>
            <Text style={[styles.statValue, { color: colors.text.primary }]}>
              {upcomingCount}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
              Due Soon
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <TouchableOpacity
          style={[styles.quickActionButton, { backgroundColor: colors.primary[500] }]}
          onPress={() => router.push("/upcoming-bills")}
          activeOpacity={0.8}
        >
          <Ionicons name="calendar" size={18} color="white" />
          <Text style={styles.quickActionText}>Upcoming</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionButton, { backgroundColor: colors.background.secondary }]}
          onPress={() => router.push("/transactions")}
          activeOpacity={0.8}
        >
          <Ionicons name="list-outline" size={18} color={colors.primary[500]} />
          <Text style={[styles.quickActionText, { color: colors.primary[500] }]}>Transactions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionButton, { backgroundColor: colors.background.secondary }]}
          onPress={() => router.push("/add-transaction")}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle-outline" size={18} color={colors.primary[500]} />
          <Text style={[styles.quickActionText, { color: colors.primary[500] }]}>Add Bill</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = {
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  topHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 16,
    fontWeight: '400' as const,
  },
  headerRight: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    position: 'relative' as const,
  },
  notificationBadge: {
    position: 'absolute' as const,
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600' as const,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  statsContainer: {
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center' as const,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
    textAlign: 'center' as const,
  },
  quickActionsContainer: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'white',
  },
};
