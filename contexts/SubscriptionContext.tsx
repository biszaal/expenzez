/**
 * Subscription Context (Legacy Adapter)
 *
 * This file maintains backwards compatibility with the old subscription context
 * while using the new RevenueCat implementation under the hood.
 *
 * @deprecated Use useRevenueCat or the new useSubscription hook from hooks/useSubscription.ts instead
 */

import React, { createContext, useContext, useMemo } from 'react';
import { useRevenueCat } from './RevenueCatContext';

interface Subscription {
  tier: 'free' | 'premium';
  trialEndDate?: string;
}

interface SubscriptionContextType {
  subscription: Subscription;
  isTrialActive: boolean;
  daysUntilTrialExpires: number | null;
  isLoading: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  subscription: { tier: 'free' },
  isTrialActive: false,
  daysUntilTrialExpires: null,
  isLoading: false,
});

/**
 * Legacy SubscriptionProvider - now uses RevenueCat under the hood
 * @deprecated This provider is no longer needed. RevenueCatProvider is used instead.
 */
export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    isPro,
    isLoading,
    isInTrialPeriod,
    subscriptionExpiryDate,
  } = useRevenueCat();

  const value = useMemo(() => {
    const daysUntilTrialExpires = subscriptionExpiryDate
      ? Math.ceil((subscriptionExpiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      subscription: {
        tier: isPro ? ('premium' as const) : ('free' as const),
        trialEndDate: subscriptionExpiryDate?.toISOString(),
      },
      isTrialActive: isInTrialPeriod,
      daysUntilTrialExpires,
      isLoading,
    };
  }, [isPro, isLoading, isInTrialPeriod, subscriptionExpiryDate]);

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

/**
 * Legacy useSubscription hook
 * @deprecated Use the new useSubscription from hooks/useSubscription.ts instead
 */
export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
