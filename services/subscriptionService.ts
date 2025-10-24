/**
 * Subscription Service
 * Helper functions for subscription management and feature access control
 */

import { CustomerInfo, PurchasesPackage } from 'react-native-purchases';

// Premium features that require subscription
export enum PremiumFeature {
  // AI Features
  AI_CHAT = 'ai_chat',
  AI_INSIGHTS = 'ai_insights',
  AI_PREDICTIONS = 'ai_predictions',

  // Alerts & Briefs
  PROACTIVE_ALERTS = 'proactive_alerts',
  DAILY_BRIEFS = 'daily_briefs',
  ADVANCED_ALERTS = 'advanced_alerts',

  // Budgets
  UNLIMITED_BUDGETS = 'unlimited_budgets',
  BUDGET_GOALS = 'budget_goals',

  // Analytics
  ADVANCED_ANALYTICS = 'advanced_analytics',
  TREND_ANALYSIS = 'trend_analysis',
  EXPORT_REPORTS = 'export_reports',

  // Banking
  OPEN_BANKING = 'open_banking',
  BANK_SYNC = 'bank_sync',

  // Data Management
  CSV_IMPORT = 'csv_import',

  // Other
  AD_FREE = 'ad_free',
  PRIORITY_SUPPORT = 'priority_support',
  CUSTOM_CATEGORIES = 'custom_categories',
}

// Free tier limits
export const FREE_TIER_LIMITS = {
  MAX_BUDGETS: 3,
  MAX_AI_QUERIES_PER_DAY: 5,
  MAX_TRANSACTIONS: 1000,
  MAX_CATEGORIES: 10,
};

export interface SubscriptionStatus {
  isPremium: boolean;
  isInTrial: boolean;
  expiryDate: Date | null;
  daysRemaining: number | null;
  productId: string | null;
  isCancelled: boolean;
}

export interface FeatureAccess {
  hasAccess: boolean;
  reason?: string;
  upgradeMessage?: string;
}

class SubscriptionService {
  /**
   * Check if user has access to a premium feature
   */
  hasFeatureAccess(
    feature: PremiumFeature,
    isPremium: boolean,
    currentUsage?: { [key: string]: number }
  ): FeatureAccess {
    // If user is premium, they have access to everything
    if (isPremium) {
      return { hasAccess: true };
    }

    // Check feature-specific access for free tier
    switch (feature) {
      case PremiumFeature.AI_CHAT:
      case PremiumFeature.AI_INSIGHTS:
        const aiUsageToday = currentUsage?.aiQueriesToday || 0;
        if (aiUsageToday < FREE_TIER_LIMITS.MAX_AI_QUERIES_PER_DAY) {
          return {
            hasAccess: true,
            reason: `${FREE_TIER_LIMITS.MAX_AI_QUERIES_PER_DAY - aiUsageToday} AI queries remaining today`,
          };
        }
        return {
          hasAccess: false,
          reason: 'Daily AI query limit reached',
          upgradeMessage: 'Upgrade to Premium for unlimited AI queries',
        };

      case PremiumFeature.UNLIMITED_BUDGETS:
        const budgetCount = currentUsage?.budgetCount || 0;
        if (budgetCount < FREE_TIER_LIMITS.MAX_BUDGETS) {
          return { hasAccess: true };
        }
        return {
          hasAccess: false,
          reason: `Maximum of ${FREE_TIER_LIMITS.MAX_BUDGETS} budgets reached`,
          upgradeMessage: 'Upgrade to Premium for unlimited budgets',
        };

      case PremiumFeature.PROACTIVE_ALERTS:
        // Basic alerts available for free
        return {
          hasAccess: true,
          reason: 'Basic alerts only',
        };

      case PremiumFeature.DAILY_BRIEFS:
        // Daily briefs available for free (view only)
        return {
          hasAccess: true,
          reason: 'View only - limited features',
        };

      // Premium-only features
      case PremiumFeature.AI_PREDICTIONS:
      case PremiumFeature.ADVANCED_ALERTS:
      case PremiumFeature.BUDGET_GOALS:
      case PremiumFeature.ADVANCED_ANALYTICS:
      case PremiumFeature.TREND_ANALYSIS:
      case PremiumFeature.EXPORT_REPORTS:
      case PremiumFeature.OPEN_BANKING:
      case PremiumFeature.BANK_SYNC:
      case PremiumFeature.CSV_IMPORT:
      case PremiumFeature.PRIORITY_SUPPORT:
      case PremiumFeature.CUSTOM_CATEGORIES:
      case PremiumFeature.AD_FREE:
        return {
          hasAccess: false,
          reason: 'Premium feature',
          upgradeMessage: 'Upgrade to Premium to unlock this feature',
        };

      default:
        return { hasAccess: false };
    }
  }

  /**
   * Get subscription status from customer info
   */
  getSubscriptionStatus(customerInfo: CustomerInfo | null): SubscriptionStatus {
    if (!customerInfo) {
      return {
        isPremium: false,
        isInTrial: false,
        expiryDate: null,
        daysRemaining: null,
        productId: null,
        isCancelled: false,
      };
    }

    const hasPremium = customerInfo.entitlements.active['premium'] !== undefined;

    if (!hasPremium) {
      return {
        isPremium: false,
        isInTrial: false,
        expiryDate: null,
        daysRemaining: null,
        productId: null,
        isCancelled: false,
      };
    }

    const premiumEntitlement = customerInfo.entitlements.active['premium'];
    const expiryDate = premiumEntitlement.expirationDate
      ? new Date(premiumEntitlement.expirationDate)
      : null;
    const daysRemaining = expiryDate
      ? Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      isPremium: true,
      isInTrial: premiumEntitlement.periodType === 'trial',
      expiryDate,
      daysRemaining,
      productId: premiumEntitlement.productIdentifier,
      isCancelled: !premiumEntitlement.willRenew,
    };
  }

  /**
   * Format subscription price
   */
  formatSubscriptionPrice(pkg: PurchasesPackage): string {
    const product = pkg.product;
    const price = product.priceString;
    const period = product.subscriptionPeriod;

    if (period?.includes('M') || period?.includes('MONTH')) {
      return `${price}/month`;
    } else if (period?.includes('Y') || period?.includes('YEAR')) {
      return `${price}/year`;
    }

    return price;
  }

  /**
   * Calculate savings for annual subscription
   */
  calculateAnnualSavings(monthlyPackage: PurchasesPackage | undefined, annualPackage: PurchasesPackage | undefined): string {
    if (!monthlyPackage || !annualPackage) return '17%';

    const monthlyPrice = monthlyPackage.product.price;
    const annualPrice = annualPackage.product.price;
    const annualAsMonthly = monthlyPrice * 12;
    const savings = ((annualAsMonthly - annualPrice) / annualAsMonthly) * 100;

    return `${Math.round(savings)}%`;
  }

  /**
   * Get feature upgrade message
   */
  getFeatureUpgradeMessage(feature: PremiumFeature): string {
    const messages: { [key in PremiumFeature]: string } = {
      [PremiumFeature.AI_CHAT]: 'Get unlimited AI financial advice',
      [PremiumFeature.AI_INSIGHTS]: 'Unlock unlimited AI insights',
      [PremiumFeature.AI_PREDICTIONS]: 'Predict future spending with AI',
      [PremiumFeature.PROACTIVE_ALERTS]: 'Get advanced proactive alerts',
      [PremiumFeature.DAILY_BRIEFS]: 'Receive personalized daily briefs',
      [PremiumFeature.ADVANCED_ALERTS]: 'Advanced smart alerts & notifications',
      [PremiumFeature.UNLIMITED_BUDGETS]: 'Create unlimited budgets',
      [PremiumFeature.BUDGET_GOALS]: 'Set and track budget goals',
      [PremiumFeature.ADVANCED_ANALYTICS]: 'Access advanced analytics',
      [PremiumFeature.TREND_ANALYSIS]: 'Analyze spending trends',
      [PremiumFeature.EXPORT_REPORTS]: 'Export reports to PDF/CSV',
      [PremiumFeature.OPEN_BANKING]: 'Connect your bank accounts',
      [PremiumFeature.BANK_SYNC]: 'Automatic transaction sync',
      [PremiumFeature.AD_FREE]: 'Enjoy ad-free experience',
      [PremiumFeature.PRIORITY_SUPPORT]: 'Get priority support',
      [PremiumFeature.CUSTOM_CATEGORIES]: 'Create custom categories',
    };

    return messages[feature] || 'Unlock this premium feature';
  }

  /**
   * Check if trial is eligible
   */
  isTrialEligible(customerInfo: CustomerInfo | null): boolean {
    // User is eligible for trial if they've never had a subscription
    if (!customerInfo) return true;

    const allPurchases = customerInfo.allPurchaseDates;
    return Object.keys(allPurchases).length === 0;
  }

  /**
   * Get trial period message
   */
  getTrialMessage(isInTrial: boolean, daysRemaining: number | null): string {
    if (!isInTrial) return '';

    if (daysRemaining === null) return 'Trial active';

    if (daysRemaining > 1) {
      return `${daysRemaining} days left in your trial`;
    } else if (daysRemaining === 1) {
      return 'Last day of your trial';
    } else {
      return 'Trial ending today';
    }
  }
}

export const subscriptionService = new SubscriptionService();
