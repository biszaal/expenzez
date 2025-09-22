import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { NotificationHistoryItem } from '../../contexts/NotificationContext';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/Colors';

interface NotificationCardProps {
  notification: NotificationHistoryItem;
  onPress: () => void;
  isLast?: boolean;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onPress,
  isLast = false
}) => {
  const { colors } = useTheme();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'transaction':
        return 'swap-horizontal';
      case 'budget':
        return 'pie-chart';
      case 'account':
        return 'card';
      case 'security':
        return 'shield-checkmark';
      case 'insight':
        return 'bulb';
      default:
        return 'notifications';
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

  const formatAmount = (amount?: number) => {
    if (!amount) return null;
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Math.abs(amount));
  };

  const styles = createStyles(colors);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        !notification.read && styles.unreadContainer,
        isLast && styles.lastContainer
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: getNotificationColor(notification.type) + '15' }]}>
          <Ionicons
            name={getNotificationIcon(notification.type) as any}
            size={20}
            color={getNotificationColor(notification.type)}
          />
        </View>

        {/* Content */}
        <View style={styles.textContent}>
          <View style={styles.header}>
            <Text style={[styles.title, !notification.read && styles.unreadTitle]}>
              {notification.title}
            </Text>
            <View style={styles.meta}>
              <Text style={styles.time}>{notification.time}</Text>
              {!notification.read && <View style={styles.unreadDot} />}
            </View>
          </View>

          <Text style={styles.message} numberOfLines={2}>
            {notification.message}
          </Text>

          {/* Additional details for specific notification types */}
          {notification.data && (
            <View style={styles.details}>
              {notification.data.amount && (
                <View style={styles.detailRow}>
                  <Ionicons name="cash-outline" size={14} color={colors.text.tertiary} />
                  <Text style={styles.detailText}>
                    {formatAmount(notification.data.amount)}
                  </Text>
                </View>
              )}
              {notification.data.merchant && (
                <View style={styles.detailRow}>
                  <Ionicons name="storefront-outline" size={14} color={colors.text.tertiary} />
                  <Text style={styles.detailText} numberOfLines={1}>
                    {notification.data.merchant}
                  </Text>
                </View>
              )}
              {notification.data.category && (
                <View style={styles.detailRow}>
                  <Ionicons name="pricetag-outline" size={14} color={colors.text.tertiary} />
                  <Text style={styles.detailText}>
                    {notification.data.category}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Arrow */}
        <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.sm
  },
  unreadContainer: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary.main
  },
  lastContainer: {
    marginBottom: SPACING.lg
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.md,
    gap: SPACING.md
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2
  },
  textContent: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
    marginRight: SPACING.sm
  },
  unreadTitle: {
    fontWeight: '700'
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs
  },
  time: {
    fontSize: 12,
    color: colors.text.tertiary,
    fontWeight: '500'
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary.main
  },
  message: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 18,
    marginBottom: SPACING.sm
  },
  details: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs
  },
  detailText: {
    fontSize: 12,
    color: colors.text.tertiary,
    fontWeight: '500'
  }
});