import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSubscription, SubscriptionFeatures } from '../../contexts/SubscriptionContext';
import { useRevenueCat } from '../../contexts/RevenueCatContext';
import { useTheme } from '../../contexts/ThemeContext';
import { UpgradePrompt } from './UpgradePrompt';
import { styles } from './PremiumGate.styles';

interface PremiumGateProps {
  /**
   * Feature to check access for
   */
  feature: keyof SubscriptionFeatures;

  /**
   * Content to show when user has access
   */
  children: React.ReactNode;

  /**
   * Custom message to show in upgrade prompt
   */
  upgradeMessage?: string;

  /**
   * Whether to show a preview of the feature
   */
  showPreview?: boolean;

  /**
   * Preview content to show (when showPreview is true)
   */
  previewContent?: React.ReactNode;

  /**
   * Custom style for the container
   */
  style?: ViewStyle;

  /**
   * Whether to show a subtle overlay instead of blocking access
   */
  overlayMode?: boolean;

  /**
   * Custom onUpgrade callback
   */
  onUpgrade?: () => void;

  /**
   * Whether to allow trial access
   */
  allowTrialAccess?: boolean;
}

export const PremiumGate: React.FC<PremiumGateProps> = ({
  feature,
  children,
  upgradeMessage,
  showPreview = false,
  previewContent,
  style,
  overlayMode = false,
  onUpgrade,
  allowTrialAccess = true,
}) => {
  const { checkFeatureAccess, isPremium, isTrialActive, subscription } = useSubscription();
  const { isPro: isRevenueCatPro } = useRevenueCat();
  const { colors } = useTheme();
  const router = useRouter();

  // Check if user has access to this feature
  const hasAccess = checkFeatureAccess(feature);
  const hasTrialAccess = allowTrialAccess && isTrialActive;
  const hasRevenueCatAccess = isRevenueCatPro;
  const canAccess = hasAccess || hasTrialAccess || hasRevenueCatAccess;

  // If user has access, render children normally
  if (canAccess) {
    return <>{children}</>;
  }

  // Generate default upgrade message based on feature
  const getDefaultUpgradeMessage = (): string => {
    const featureMessages: Record<keyof SubscriptionFeatures, string> = {
      bankConnections: "Connect your bank accounts automatically with Premium",
      unlimitedTransactionHistory: "Access unlimited transaction history with Premium",
      advancedAnalytics: "Unlock advanced analytics and insights with Premium",
      unlimitedAIChat: "Get unlimited AI financial advice with Premium",
      unlimitedGoals: "Create unlimited financial goals with Premium",
      unlimitedBudgets: "Set up unlimited budgets with Premium",
      creditScoreMonitoring: "Monitor your credit score with Premium",
      billPrediction: "Get smart bill predictions with Premium",
      smartNotifications: "Receive intelligent notifications with Premium",
      biometricAuth: "Enable biometric security with Premium",
      csvImport: "Import CSV data with Premium",
      dataExport: "Export your data with Premium",
    };

    return upgradeMessage || featureMessages[feature] || "This feature requires Premium";
  };

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      router.push('/subscription/plans');
    }
  };

  // Overlay mode - show content with upgrade overlay
  if (overlayMode) {
    return (
      <View style={[styles.overlayContainer, style]}>
        {children}
        <View style={[styles.overlay, { backgroundColor: colors.background.primary + 'E6' }]}>
          <UpgradePrompt
            title="Premium Feature"
            message={getDefaultUpgradeMessage()}
            onUpgrade={handleUpgrade}
            compact={true}
          />
        </View>
      </View>
    );
  }

  // Preview mode - show preview content with upgrade prompt
  if (showPreview && previewContent) {
    return (
      <View style={[styles.previewContainer, style]}>
        <View style={styles.previewContent}>
          {previewContent}
        </View>
        <View style={[styles.previewOverlay, { backgroundColor: colors.background.primary + 'F0' }]}>
          <UpgradePrompt
            title="Premium Preview"
            message={getDefaultUpgradeMessage()}
            onUpgrade={handleUpgrade}
            showTrialOption={true}
          />
        </View>
      </View>
    );
  }

  // Default mode - show upgrade prompt only
  return (
    <View style={[styles.gateContainer, style]}>
      <UpgradePrompt
        title="Premium Feature"
        message={getDefaultUpgradeMessage()}
        onUpgrade={handleUpgrade}
        showTrialOption={true}
      />
    </View>
  );
};

/**
 * Hook to check if a feature is available
 */
export const useFeatureAccess = (feature: keyof SubscriptionFeatures) => {
  const { checkFeatureAccess, isPremium, isTrialActive } = useSubscription();
  const { isPro: isRevenueCatPro } = useRevenueCat();

  const hasAccess = checkFeatureAccess(feature);
  const hasTrialAccess = isTrialActive;
  const hasRevenueCatAccess = isRevenueCatPro;

  return {
    hasAccess: hasAccess || hasTrialAccess || hasRevenueCatAccess,
    isPremium: isPremium || isRevenueCatPro,
    isTrialActive,
    requiresUpgrade: !hasAccess && !hasTrialAccess && !hasRevenueCatAccess,
  };
};

/**
 * Higher-order component to wrap entire screens with premium gates
 */
export const withPremiumGate = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  feature: keyof SubscriptionFeatures,
  options?: {
    upgradeMessage?: string;
    allowTrialAccess?: boolean;
  }
) => {
  const WithPremiumGate = (props: P) => (
    <PremiumGate
      feature={feature}
      upgradeMessage={options?.upgradeMessage}
      allowTrialAccess={options?.allowTrialAccess}
    >
      <WrappedComponent {...props} />
    </PremiumGate>
  );

  WithPremiumGate.displayName = `WithPremiumGate(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithPremiumGate;
};

/**
 * Component to show premium badge
 */
export const PremiumBadge: React.FC<{
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}> = ({ size = 'medium', style }) => {
  const { colors } = useTheme();

  const sizeStyles = {
    small: styles.badgeSmall,
    medium: styles.badgeMedium,
    large: styles.badgeLarge,
  };

  return (
    <View style={[styles.premiumBadge, { backgroundColor: colors.primary[500] }, sizeStyles[size], style]}>
      <Ionicons name="diamond" size={size === 'small' ? 10 : size === 'medium' ? 12 : 16} color="white" />
      <Text style={[styles.badgeText, { color: 'white' }]}>
        {size === 'small' ? 'PRO' : 'PREMIUM'}
      </Text>
    </View>
  );
};