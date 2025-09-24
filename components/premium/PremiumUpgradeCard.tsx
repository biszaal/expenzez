import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

  const getTrialText = () => {
    if (isTrialActive && daysUntilTrialExpires) {
      return `Trial ends in ${daysUntilTrialExpires} day${daysUntilTrialExpires !== 1 ? 's' : ''}`;
    }
    return "Start your free trial";
  };

  const styles = createStyles(colors, compact);

  if (compact) {
    return (
      <TouchableOpacity
        style={styles.compactContainer}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['rgba(245, 158, 11, 0.1)', 'rgba(245, 158, 11, 0.05)']}
          style={styles.compactGradient}
        >
          <View style={styles.compactContent}>
            <Ionicons name="diamond" size={20} color="#F59E0B" />
            <Text style={styles.compactText}>
              {feature ? `Premium: ${feature}` : 'Get Premium'}
            </Text>
            <Ionicons name="arrow-forward" size={16} color="#F59E0B" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={[colors.primary[500], colors.primary[600], colors.accent.main]}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="diamond" size={32} color="white" />
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>

            {isTrialActive && (
              <Text style={styles.trialText}>{getTrialText()}</Text>
            )}
          </View>

          <View style={styles.actionContainer}>
            <View style={styles.priceContainer}>
              <Text style={styles.priceText}>From £4.99/month</Text>
              <Text style={styles.savingsText}>Save 17% annually</Text>
            </View>

            <View style={styles.upgradeButton}>
              <Text style={styles.upgradeButtonText}>
                {isTrialActive ? 'Upgrade Now' : 'Try Free'}
              </Text>
              <Ionicons name="arrow-forward" size={16} color="white" />
            </View>
          </View>
        </View>
      </LinearGradient>
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

  gradient: {
    padding: spacing.lg,
  },

  compactGradient: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
    color: 'white',
    marginBottom: spacing.xs,
  },

  description: {
    fontSize: typography.sizes.base,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
    marginBottom: spacing.xs,
  },

  trialText: {
    fontSize: typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.8)',
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
    color: 'white',
    fontWeight: typography.weights.semibold as any,
  },

  savingsText: {
    fontSize: typography.sizes.xs,
    color: 'rgba(255, 255, 255, 0.8)',
  },

  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },

  upgradeButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold as any,
    color: 'white',
  },

  compactText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold as any,
    color: '#F59E0B',
    flex: 1,
    marginLeft: spacing.sm,
  },
});