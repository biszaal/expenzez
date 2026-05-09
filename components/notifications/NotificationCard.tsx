import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { NotificationHistoryItem } from '../../contexts/NotificationContext';
import { fontFamily } from '../../constants/theme';

// v1.5 redesign — hairline 18px row, category-tinted icon, primary
// accent stripe for unread, mono numerals for time + amount.

interface NotificationCardProps {
  notification: NotificationHistoryItem;
  onPress: () => void;
  isLast?: boolean;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onPress,
  isLast = false,
}) => {
  const { colors, isDark } = useTheme();

  const getNotificationIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'transaction':
        return 'swap-horizontal';
      case 'budget':
        return 'wallet';
      case 'account':
        return 'card';
      case 'security':
        return 'shield-checkmark';
      case 'insight':
        return 'sparkles';
      default:
        return 'notifications';
    }
  };

  const getNotificationAccent = (type: string) => {
    switch (type) {
      case 'transaction':
        return colors.primary[500];
      case 'budget':
        return colors.amber[500];
      case 'account':
        return colors.cyan[500];
      case 'security':
        return colors.rose[500];
      case 'insight':
        return colors.lime[500];
      default:
        return colors.text.secondary;
    }
  };

  const getNotificationTint = (type: string) => {
    const accent = getNotificationAccent(type);
    if (type === 'security') return colors.negBg;
    if (type === 'insight') return colors.posBg;
    return isDark ? `${accent}26` : `${accent}1F`;
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

  const accent = getNotificationAccent(notification.type);
  const tintBg = getNotificationTint(notification.type);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: colors.card.background,
          borderColor: !notification.read
            ? isDark
              ? 'rgba(157,91,255,0.28)'
              : 'rgba(123,63,228,0.22)'
            : colors.border.medium,
        },
        isLast && { marginBottom: 24 },
      ]}
    >
      {!notification.read && (
        <View
          style={[styles.unreadStripe, { backgroundColor: colors.primary[500] }]}
        />
      )}

      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: tintBg }]}>
          <Ionicons
            name={getNotificationIcon(notification.type)}
            size={18}
            color={accent}
          />
        </View>

        <View style={styles.textContent}>
          <View style={styles.headerRow}>
            <Text
              numberOfLines={1}
              style={[
                styles.title,
                {
                  color: colors.text.primary,
                  fontFamily: notification.read
                    ? fontFamily.medium
                    : fontFamily.semibold,
                },
              ]}
            >
              {notification.title}
            </Text>
            {notification.data?.amount && (
              <Text
                style={[
                  styles.amount,
                  {
                    color:
                      notification.data.amount > 0
                        ? colors.lime[500]
                        : colors.text.primary,
                    fontFamily: fontFamily.monoMedium,
                  },
                ]}
              >
                {notification.data.amount > 0 ? '+' : '−'}
                {formatAmount(notification.data.amount)}
              </Text>
            )}
          </View>

          <Text
            numberOfLines={2}
            style={[
              styles.message,
              { color: colors.text.secondary, fontFamily: fontFamily.medium },
            ]}
          >
            {notification.message}
          </Text>

          <View style={styles.metaRow}>
            <View
              style={[
                styles.tag,
                {
                  backgroundColor: isDark
                    ? 'rgba(255,255,255,0.05)'
                    : 'rgba(40,20,80,0.05)',
                },
              ]}
            >
              <Text
                style={{
                  fontSize: 10,
                  color: colors.text.tertiary,
                  fontFamily: fontFamily.semibold,
                  letterSpacing: 0.4,
                }}
              >
                {notification.type.toUpperCase()}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 11,
                color: colors.text.tertiary,
                fontFamily: fontFamily.mono,
              }}
            >
              {notification.time}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 22,
    marginBottom: 8,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  unreadStripe: {
    position: 'absolute',
    left: 0,
    top: 14,
    width: 3,
    height: 22,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 12,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContent: { flex: 1, minWidth: 0 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: { fontSize: 14, flex: 1, letterSpacing: -0.1 },
  amount: { fontSize: 14, letterSpacing: -0.4 },
  message: { fontSize: 12.5, lineHeight: 17, marginTop: 3 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  tag: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
});
