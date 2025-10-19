/**
 * Subscription Hook
 * Convenient hook for managing subscription state and feature access
 */

import { useMemo } from "react";
import { useRevenueCat } from "../contexts/RevenueCatContext";
import {
  subscriptionService,
  PremiumFeature,
  SubscriptionStatus,
  FeatureAccess,
} from "../services/subscriptionService";
// Note: PurchasesPackage type is handled dynamically in RevenueCatContext

export interface UseSubscriptionReturn {
  // Premium status
  isPremium: boolean;
  isLoading: boolean;

  // Subscription details
  subscriptionStatus: SubscriptionStatus;

  // Feature access
  hasFeatureAccess: (
    feature: PremiumFeature,
    currentUsage?: { [key: string]: number }
  ) => FeatureAccess;

  // Purchase actions
  purchasePackage: (pkg: any) => Promise<{ success: boolean; error?: string }>;
  restorePurchases: () => Promise<{ success: boolean; error?: string }>;

  // Offerings
  offerings: any | null;
  monthlyPackage: any | undefined;
  annualPackage: any | undefined;

  // Helpers
  formatPrice: (pkg: any) => string;
  calculateSavings: () => string;
  getUpgradeMessage: (feature: PremiumFeature) => string;
  isTrialEligible: boolean;
  trialMessage: string;
}

/**
 * Hook for managing subscriptions and premium features
 *
 * @example
 * ```tsx
 * const { isPremium, hasFeatureAccess, purchasePackage } = useSubscription();
 *
 * // Check if user can access a feature
 * const aiAccess = hasFeatureAccess(PremiumFeature.AI_CHAT, { aiQueriesToday: 3 });
 * if (!aiAccess.hasAccess) {
 *   showUpgradePrompt(aiAccess.upgradeMessage);
 * }
 *
 * // Purchase a subscription
 * if (monthlyPackage) {
 *   await purchasePackage(monthlyPackage);
 * }
 * ```
 */
export const useSubscription = (): UseSubscriptionReturn => {
  const {
    isPro,
    isLoading,
    customerInfo,
    offerings,
    purchasePackage,
    restorePurchases,
    isInTrialPeriod,
    subscriptionExpiryDate,
    activeProductIdentifier,
  } = useRevenueCat();

  // Get subscription status
  const subscriptionStatus = useMemo(
    () => subscriptionService.getSubscriptionStatus(customerInfo),
    [customerInfo]
  );

  // Get available packages
  const monthlyPackage = useMemo(() => {
    if (!offerings?.current) return undefined;
    return offerings.current.availablePackages.find(
      (pkg) =>
        pkg.identifier === "$rc_monthly" ||
        pkg.product.identifier.includes("monthly")
    );
  }, [offerings]);

  const annualPackage = useMemo(() => {
    if (!offerings?.current) return undefined;
    return offerings.current.availablePackages.find(
      (pkg) =>
        pkg.identifier === "$rc_annual" ||
        pkg.product.identifier.includes("annual")
    );
  }, [offerings]);

  // Check if user can access a specific feature
  const hasFeatureAccess = (
    feature: PremiumFeature,
    currentUsage?: { [key: string]: number }
  ): FeatureAccess => {
    return subscriptionService.hasFeatureAccess(feature, isPro, currentUsage);
  };

  // Format package price
  const formatPrice = (pkg: any): string => {
    return subscriptionService.formatSubscriptionPrice(pkg);
  };

  // Calculate annual savings
  const calculateSavings = (): string => {
    return subscriptionService.calculateAnnualSavings(
      monthlyPackage,
      annualPackage
    );
  };

  // Get upgrade message for a feature
  const getUpgradeMessage = (feature: PremiumFeature): string => {
    return subscriptionService.getFeatureUpgradeMessage(feature);
  };

  // Check if trial is eligible
  const isTrialEligible = useMemo(() => {
    return subscriptionService.isTrialEligible(customerInfo);
  }, [customerInfo]);

  // Get trial message
  const trialMessage = useMemo(() => {
    const daysRemaining = subscriptionStatus.daysRemaining;
    return subscriptionService.getTrialMessage(isInTrialPeriod, daysRemaining);
  }, [isInTrialPeriod, subscriptionStatus.daysRemaining]);

  return {
    // Premium status
    isPremium: isPro,
    isLoading,

    // Subscription details
    subscriptionStatus,

    // Feature access
    hasFeatureAccess,

    // Purchase actions
    purchasePackage,
    restorePurchases,

    // Offerings
    offerings,
    monthlyPackage,
    annualPackage,

    // Helpers
    formatPrice,
    calculateSavings,
    getUpgradeMessage,
    isTrialEligible,
    trialMessage,
  };
};

/**
 * Hook for checking access to a specific premium feature
 *
 * @example
 * ```tsx
 * const { hasAccess, reason, upgradeMessage } = useFeatureAccess(
 *   PremiumFeature.AI_CHAT,
 *   { aiQueriesToday: 3 }
 * );
 *
 * if (!hasAccess) {
 *   return <UpgradePrompt message={upgradeMessage} />;
 * }
 * ```
 */
export const useFeatureAccess = (
  feature: PremiumFeature,
  currentUsage?: { [key: string]: number }
): FeatureAccess => {
  const { hasFeatureAccess } = useSubscription();
  return useMemo(
    () => hasFeatureAccess(feature, currentUsage),
    [hasFeatureAccess, feature, currentUsage]
  );
};

/**
 * Hook for getting formatted subscription pricing
 *
 * @example
 * ```tsx
 * const { monthlyPrice, annualPrice, savings } = useSubscriptionPricing();
 *
 * return (
 *   <View>
 *     <Text>Monthly: {monthlyPrice}</Text>
 *     <Text>Annual: {annualPrice} (Save {savings})</Text>
 *   </View>
 * );
 * ```
 */
export const useSubscriptionPricing = () => {
  const { monthlyPackage, annualPackage, formatPrice, calculateSavings } =
    useSubscription();

  return useMemo(
    () => ({
      monthlyPrice: monthlyPackage ? formatPrice(monthlyPackage) : null,
      annualPrice: annualPackage ? formatPrice(annualPackage) : null,
      savings: calculateSavings(),
      monthlyPackage,
      annualPackage,
    }),
    [monthlyPackage, annualPackage, formatPrice, calculateSavings]
  );
};

/**
 * Hook for getting subscription status information
 *
 * @example
 * ```tsx
 * const { isPremium, isInTrial, expiryDate, willRenew } = useSubscriptionStatus();
 *
 * return (
 *   <View>
 *     <Text>Premium: {isPremium ? 'Yes' : 'No'}</Text>
 *     {isInTrial && <Text>Trial expires: {expiryDate?.toDateString()}</Text>}
 *     {!willRenew && <Text>Subscription will not renew</Text>}
 *   </View>
 * );
 * ```
 */
export const useSubscriptionStatus = () => {
  const { subscriptionStatus } = useSubscription();

  return useMemo(
    () => ({
      isPremium: subscriptionStatus.isPremium,
      isInTrial: subscriptionStatus.isInTrial,
      expiryDate: subscriptionStatus.expiryDate,
      daysRemaining: subscriptionStatus.daysRemaining,
      productId: subscriptionStatus.productId,
      willRenew: !subscriptionStatus.isCancelled,
    }),
    [subscriptionStatus]
  );
};
