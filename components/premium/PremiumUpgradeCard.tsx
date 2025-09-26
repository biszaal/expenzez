import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { spacing, borderRadius, typography } from '../../constants/theme';

interface PremiumUpgradeCardProps {
  title?: string;
  description?: string;
  feature?: string;
  compact?: boolean;
  onPress?: () => void;
}

export const PremiumUpgradeCard: React.FC<PremiumUpgradeCardProps> = ({
  title = "Upgrade to Premium",
  description = "Unlock unlimited features and advanced insights",
  feature,
  compact = false,
  onPress,
}) => {
  const { colors } = useTheme();
  const router = useRouter();
  const { isPremium, isTrialActive, daysUntilTrialExpires } = useSubscription();

  if (isPremium) return null;

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push('/subscription/plans');
    }
  };


  const styles = createStyles(colors, compact);

  if (compact) {
    return (
      <TouchableOpacity
        style={styles.compactContainer}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={styles.compactGradient}>
          <View style={styles.compactContent}>
            <Ionicons name="diamond" size={20} color={colors.primary.main} />
            <Text style={styles.compactText}>
              {feature ? `Premium: ${feature}` : 'Get Premium'}
            </Text>
            <Ionicons name="arrow-forward" size={16} color={colors.primary.main} />
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.cardContent}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="diamond" size={32} color={colors.primary[600]} />
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
          </View>

          <View style={styles.actionContainer}>
            <View style={styles.priceContainer}>
              <Text style={styles.priceText}>From £4.99/month</Text>
              <Text style={styles.savingsText}>Save 17% annually</Text>
            </View>

            <TouchableOpacity style={styles.upgradeButton} onPress={handlePress}>
              <Text style={styles.upgradeButtonText}>
                {isTrialActive ? 'Upgrade' : 'Try Free →'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (colors: any, compact: boolean) => StyleSheet.create({
  container: {
    margin: spacing.md,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },

  compactContainer: {
    marginVertical: spacing.xs,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },

  cardContent: {
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },

  compactGradient: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[200],
  },

  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },

  textContainer: {
    flex: 1,
    marginRight: spacing.md,
  },

  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as any,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },

  description: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },

  trialText: {
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
    fontWeight: typography.weights.semibold as any,
  },

  actionContainer: {
    alignItems: 'flex-end',
  },

  priceContainer: {
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
  },

  priceText: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    fontWeight: typography.weights.semibold as any,
  },

  savingsText: {
    fontSize: typography.sizes.xs,
    color: colors.text.tertiary,
  },

  upgradeButton: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },

  upgradeButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold as any,
    color: 'white',
  },

  compactText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold as any,
    color: colors.primary.main,
    flex: 1,
    marginLeft: spacing.sm,
  },
});