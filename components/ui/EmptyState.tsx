import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

export type EmptyStateType =
  | 'transactions'
  | 'bills'
  | 'savings'
  | 'categories'
  | 'notifications'
  | 'achievements'
  | 'devices'
  | 'general';

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

const EMPTY_STATE_CONFIGS: Record<
  EmptyStateType,
  {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    description: string;
    actionLabel?: string;
  }
> = {
  transactions: {
    icon: 'receipt-outline',
    title: 'No Transactions Yet',
    description:
      'Start tracking your expenses and income to get insights into your spending habits.',
    actionLabel: 'Add Transaction',
  },
  bills: {
    icon: 'calendar-outline',
    title: 'No Bills Scheduled',
    description:
      'Never miss a payment! Add your recurring bills and get reminders before they\'re due.',
    actionLabel: 'Add Bill',
  },
  savings: {
    icon: 'trophy-outline',
    title: 'No Savings Goals',
    description:
      'Dream big, save bigger! Set savings goals and watch your progress grow.',
    actionLabel: 'Create Goal',
  },
  categories: {
    icon: 'apps-outline',
    title: 'No Categories',
    description:
      'Organize your spending by adding categories to your transactions.',
    actionLabel: 'Browse Transactions',
  },
  notifications: {
    icon: 'notifications-off-outline',
    title: 'No Notifications',
    description: 'You\'re all caught up! We\'ll notify you of important updates.',
  },
  achievements: {
    icon: 'star-outline',
    title: 'Start Your Journey',
    description:
      'Complete transactions, save money, and unlock achievements!',
    actionLabel: 'View Challenges',
  },
  devices: {
    icon: 'phone-portrait-outline',
    title: 'No Trusted Devices',
    description:
      'We\'ll remember devices you use regularly for added security.',
  },
  general: {
    icon: 'folder-open-outline',
    title: 'No Data',
    description: 'There\'s nothing here yet.',
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'general',
  title: customTitle,
  description: customDescription,
  iconName: customIconName,
  actionLabel: customActionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}) => {
  const { colors } = useTheme();
  const config = EMPTY_STATE_CONFIGS[type];

  const title = customTitle || config.title;
  const description = customDescription || config.description;
  const iconName = customIconName || config.icon;
  const actionLabel = customActionLabel || config.actionLabel;

  return (
    <View style={styles.container}>
      {/* Animated Icon Background */}
      <View
        style={[
          styles.iconBackground,
          {
            backgroundColor: `${colors.primary.main}15`,
          },
        ]}
      >
        <View
          style={[
            styles.iconInnerCircle,
            {
              backgroundColor: `${colors.primary.main}10`,
            },
          ]}
        >
          <Ionicons
            name={iconName}
            size={64}
            color={colors.primary.main}
          />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            {
              color: colors.text.primary,
            },
          ]}
        >
          {title}
        </Text>

        <Text
          style={[
            styles.description,
            {
              color: colors.text.secondary,
            },
          ]}
        >
          {description}
        </Text>

        {/* Action Buttons */}
        {onAction && actionLabel && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                {
                  backgroundColor: colors.primary.main,
                },
              ]}
              onPress={onAction}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>{actionLabel}</Text>
              <Ionicons name="arrow-forward" size={18} color="white" />
            </TouchableOpacity>

            {onSecondaryAction && secondaryActionLabel && (
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  {
                    borderColor: colors.border.light,
                  },
                ]}
                onPress={onSecondaryAction}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.secondaryButtonText,
                    {
                      color: colors.text.primary,
                    },
                  ]}
                >
                  {secondaryActionLabel}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Decorative Elements */}
      <View style={[styles.decoration1, { backgroundColor: `${colors.primary.main}08` }]} />
      <View style={[styles.decoration2, { backgroundColor: `${colors.primary.main}05` }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
    minHeight: 400,
  },
  iconBackground: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconInnerCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 32,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  actionsContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  decoration1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -50,
    right: -50,
    opacity: 0.3,
  },
  decoration2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    bottom: -30,
    left: -30,
    opacity: 0.3,
  },
});
