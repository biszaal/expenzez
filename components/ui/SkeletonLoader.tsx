import React from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const SkeletonPlaceholder: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style
}) => {
  const { colors } = useTheme();
  const animatedValue = new Animated.Value(0);

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.border.medium,
          opacity,
        },
        style,
      ]}
    />
  );
};

export const TransactionSkeleton: React.FC = () => {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.transactionContainer, { backgroundColor: colors.background.secondary }]}>
      <View style={styles.transactionContent}>
        <View style={styles.iconPlaceholder}>
          <SkeletonPlaceholder width={40} height={40} borderRadius={20} />
        </View>
        <View style={styles.transactionDetails}>
          <SkeletonPlaceholder width="70%" height={16} />
          <View style={styles.spacer} />
          <SkeletonPlaceholder width="40%" height={14} />
        </View>
        <View style={styles.amountSection}>
          <SkeletonPlaceholder width={60} height={16} />
          <View style={styles.spacer} />
          <SkeletonPlaceholder width={40} height={12} />
        </View>
      </View>
    </View>
  );
};

export const AccountCardSkeleton: React.FC = () => {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.accountCard, { backgroundColor: colors.background.secondary }]}>
      <View style={styles.accountHeader}>
        <SkeletonPlaceholder width="60%" height={18} />
        <SkeletonPlaceholder width={24} height={24} borderRadius={12} />
      </View>
      <View style={styles.spacer} />
      <SkeletonPlaceholder width="80%" height={14} />
      <View style={styles.spacer} />
      <View style={styles.accountFooter}>
        <SkeletonPlaceholder width="40%" height={24} />
        <SkeletonPlaceholder width="30%" height={14} />
      </View>
    </View>
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <View style={styles.dashboardContainer}>
      {/* Header Section */}
      <View style={styles.headerSection}>
        <SkeletonPlaceholder width="50%" height={24} />
        <View style={styles.spacer} />
        <SkeletonPlaceholder width="30%" height={16} />
      </View>
      
      <View style={styles.spacer} />
      
      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <SkeletonPlaceholder width="40%" height={16} />
        <View style={styles.spacer} />
        <SkeletonPlaceholder width="60%" height={32} />
        <View style={styles.spacer} />
        <View style={styles.balanceFooter}>
          <SkeletonPlaceholder width="30%" height={14} />
          <SkeletonPlaceholder width="25%" height={14} />
        </View>
      </View>
      
      <View style={styles.spacer} />
      
      {/* Quick Actions */}
      <View style={styles.quickActions}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.quickActionItem}>
            <SkeletonPlaceholder width={48} height={48} borderRadius={24} />
            <View style={styles.miniSpacer} />
            <SkeletonPlaceholder width={60} height={12} />
          </View>
        ))}
      </View>
      
      <View style={styles.spacer} />
      
      {/* Recent Transactions */}
      <SkeletonPlaceholder width="50%" height={20} />
      <View style={styles.spacer} />
      
      {[1, 2, 3].map((i) => (
        <React.Fragment key={i}>
          <TransactionSkeleton />
          <View style={styles.miniSpacer} />
        </React.Fragment>
      ))}
    </View>
  );
};

export const ProfileSkeleton: React.FC = () => {
  return (
    <View style={styles.profileContainer}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <SkeletonPlaceholder width={80} height={80} borderRadius={40} />
        <View style={styles.spacer} />
        <SkeletonPlaceholder width="60%" height={24} />
        <View style={styles.miniSpacer} />
        <SkeletonPlaceholder width="40%" height={16} />
      </View>
      
      <View style={styles.spacer} />
      
      {/* Profile Options */}
      {[1, 2, 3, 4, 5].map((i) => (
        <React.Fragment key={i}>
          <View style={styles.profileOption}>
            <View style={styles.profileOptionLeft}>
              <SkeletonPlaceholder width={24} height={24} borderRadius={4} />
              <View style={styles.miniSpacer} />
              <SkeletonPlaceholder width="70%" height={16} />
            </View>
            <SkeletonPlaceholder width={16} height={16} borderRadius={2} />
          </View>
          <View style={styles.miniSpacer} />
        </React.Fragment>
      ))}
    </View>
  );
};

// Spending Tab Skeleton
export const SpendingSkeleton: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={styles.spendingContainer}>
      {/* Month Picker Skeleton */}
      <View style={[styles.monthPicker, { backgroundColor: colors.background.primary }]}>
        <SkeletonPlaceholder width={120} height={24} />
      </View>

      <View style={styles.spacer} />

      {/* Budget Card Skeleton */}
      <View style={[styles.budgetCard, { backgroundColor: colors.background.primary }]}>
        <SkeletonPlaceholder width="60%" height={20} style={{ marginBottom: 12 }} />
        <SkeletonPlaceholder width={200} height={200} borderRadius={100} style={{ alignSelf: 'center', marginVertical: 16 }} />
        <View style={styles.budgetStats}>
          <View style={styles.budgetStatItem}>
            <SkeletonPlaceholder width={80} height={24} />
            <View style={styles.miniSpacer} />
            <SkeletonPlaceholder width={60} height={14} />
          </View>
          <View style={styles.budgetStatItem}>
            <SkeletonPlaceholder width={80} height={24} />
            <View style={styles.miniSpacer} />
            <SkeletonPlaceholder width={60} height={14} />
          </View>
        </View>
      </View>

      <View style={styles.spacer} />

      {/* Tab Switcher Skeleton */}
      <View style={styles.tabSwitcher}>
        <SkeletonPlaceholder width="45%" height={40} borderRadius={12} />
        <SkeletonPlaceholder width="45%" height={40} borderRadius={12} />
      </View>

      <View style={styles.spacer} />

      {/* Category List Skeleton */}
      {[1, 2, 3].map((i) => (
        <View key={i} style={[styles.categoryCard, { backgroundColor: colors.background.primary }]}>
          <View style={styles.categoryContent}>
            <SkeletonPlaceholder width={48} height={48} borderRadius={24} />
            <View style={styles.categoryDetails}>
              <SkeletonPlaceholder width="70%" height={16} />
              <View style={styles.miniSpacer} />
              <SkeletonPlaceholder width="50%" height={14} />
            </View>
            <SkeletonPlaceholder width={80} height={20} />
          </View>
        </View>
      ))}
    </View>
  );
};

// Bills Tab Skeleton
export const BillsSkeleton: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={styles.billsContainer}>
      {/* Header */}
      <View style={styles.billsHeader}>
        <SkeletonPlaceholder width="60%" height={28} />
        <SkeletonPlaceholder width={100} height={20} />
      </View>

      <View style={styles.spacer} />

      {/* Category Tabs Skeleton */}
      <View style={styles.categoryTabs}>
        {[1, 2, 3, 4].map((i) => (
          <SkeletonPlaceholder key={i} width={80} height={36} borderRadius={18} style={{ marginRight: 8 }} />
        ))}
      </View>

      <View style={styles.spacer} />

      {/* Bills List Skeleton */}
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={[styles.billCard, { backgroundColor: colors.background.primary }]}>
          <View style={styles.billContent}>
            <SkeletonPlaceholder width={56} height={56} borderRadius={28} />
            <View style={styles.billDetails}>
              <SkeletonPlaceholder width="80%" height={18} />
              <View style={styles.miniSpacer} />
              <SkeletonPlaceholder width="60%" height={14} />
              <View style={styles.miniSpacer} />
              <SkeletonPlaceholder width="40%" height={12} />
            </View>
          </View>
          <View style={styles.billAmount}>
            <SkeletonPlaceholder width={90} height={20} />
            <View style={styles.miniSpacer} />
            <SkeletonPlaceholder width={60} height={14} />
          </View>
        </View>
      ))}
    </View>
  );
};

// Notifications Tab Skeleton
export const NotificationsSkeleton: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={styles.notificationsContainer}>
      {/* Header */}
      <View style={styles.notifHeader}>
        <SkeletonPlaceholder width={32} height={32} borderRadius={16} />
        <SkeletonPlaceholder width="50%" height={24} />
        <SkeletonPlaceholder width={32} height={32} borderRadius={16} />
      </View>

      <View style={styles.spacer} />

      {/* Category Filter Skeleton */}
      <View style={styles.categoryFilter}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.filterItem}>
            <SkeletonPlaceholder width={40} height={40} borderRadius={20} />
            <View style={styles.miniSpacer} />
            <SkeletonPlaceholder width={60} height={12} />
          </View>
        ))}
      </View>

      <View style={styles.spacer} />

      {/* Notifications List */}
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={[styles.notifCard, { backgroundColor: colors.background.primary }]}>
          <SkeletonPlaceholder width={48} height={48} borderRadius={24} />
          <View style={styles.notifContent}>
            <SkeletonPlaceholder width="80%" height={16} />
            <View style={styles.miniSpacer} />
            <SkeletonPlaceholder width="90%" height={14} />
            <View style={styles.miniSpacer} />
            <SkeletonPlaceholder width="40%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  transactionContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconPlaceholder: {
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  amountSection: {
    alignItems: 'flex-end',
  },
  spacer: {
    height: 16,
  },
  miniSpacer: {
    height: 8,
  },
  accountCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dashboardContainer: {
    padding: 16,
  },
  headerSection: {
    alignItems: 'center',
  },
  balanceCard: {
    padding: 20,
    alignItems: 'center',
  },
  balanceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  quickActionItem: {
    alignItems: 'center',
  },
  profileContainer: {
    padding: 16,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  profileOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  profileOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  // Spending Skeleton Styles
  spendingContainer: {
    padding: 16,
  },
  monthPicker: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  budgetCard: {
    padding: 20,
    borderRadius: 16,
  },
  budgetStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  budgetStatItem: {
    alignItems: 'center',
  },
  tabSwitcher: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  categoryCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDetails: {
    flex: 1,
    marginLeft: 12,
  },
  // Bills Skeleton Styles
  billsContainer: {
    padding: 16,
  },
  billsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryTabs: {
    flexDirection: 'row',
  },
  billCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  billContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  billDetails: {
    flex: 1,
    marginLeft: 12,
  },
  billAmount: {
    alignItems: 'flex-end',
  },
  // Notifications Skeleton Styles
  notificationsContainer: {
    padding: 16,
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryFilter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  filterItem: {
    alignItems: 'center',
  },
  notifCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  notifContent: {
    flex: 1,
    marginLeft: 12,
  },
});