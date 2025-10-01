import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "../app/auth/AuthContext";
import { api } from "../services/config/apiClient";
import RevenueCatService from "../services/revenueCatService";
import { CustomerInfo } from 'react-native-purchases';

export type SubscriptionTier = "free" | "premium-trial" | "premium-monthly" | "premium-annual" | "expired-trial";

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  startDate: string | null;
  endDate: string | null;
  trialEndDate: string | null;
  isActive: boolean;
  features: SubscriptionFeatures;
  usage: UsageTracking;
}

export interface SubscriptionFeatures {
  bankConnections: boolean;
  unlimitedTransactionHistory: boolean;
  advancedAnalytics: boolean;
  unlimitedAIChat: boolean;
  unlimitedGoals: boolean;
  unlimitedBudgets: boolean;
  creditScoreMonitoring: boolean;
  billPrediction: boolean;
  smartNotifications: boolean;
  biometricAuth: boolean;
  csvImport: boolean;
  dataExport: boolean;
}

export interface UsageTracking {
  monthlyAIChats: number;
  maxAIChats: number;
  goalsCount: number;
  maxGoals: number;
  budgetsCount: number;
  maxBudgets: number;
  lastResetDate: string;
}

interface SubscriptionContextType {
  subscription: SubscriptionInfo;
  isLoading: boolean;
  isPremium: boolean;
  isTrialActive: boolean;
  daysUntilTrialExpires: number | null;
  refreshSubscription: () => Promise<void>;
  purchaseSubscription: (packageId: string) => Promise<boolean>;
  purchaseWithOptions: (packageId: string, options?: {preferWeb?: boolean}) => Promise<{
    success: boolean;
    method: 'native' | 'web';
    webUrl?: string;
    error?: string;
  }>;
  restorePurchases: () => Promise<boolean>;
  checkFeatureAccess: (feature: keyof SubscriptionFeatures) => boolean;
  incrementUsage: (type: 'aiChats' | 'goals' | 'budgets') => Promise<boolean>;
  getUsageDisplay: (type: 'aiChats' | 'goals' | 'budgets') => string;
  getOfferings: () => Promise<any[]>;
  startTrial: () => Promise<boolean>;
  getSupportedPaymentMethods: () => {
    nativePlatformPay: boolean;
    webPayments: boolean;
    platformName: string;
    nativePayName: string;
  };
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// Default free tier configuration
const FREE_TIER_FEATURES: SubscriptionFeatures = {
  bankConnections: false,
  unlimitedTransactionHistory: false,
  advancedAnalytics: false,
  unlimitedAIChat: false,
  unlimitedGoals: false,
  unlimitedBudgets: false,
  creditScoreMonitoring: false,
  billPrediction: false,
  smartNotifications: false,
  biometricAuth: false,
  csvImport: true,
  dataExport: false,
};

const PREMIUM_FEATURES: SubscriptionFeatures = {
  bankConnections: true,
  unlimitedTransactionHistory: true,
  advancedAnalytics: true,
  unlimitedAIChat: true,
  unlimitedGoals: true,
  unlimitedBudgets: true,
  creditScoreMonitoring: true,
  billPrediction: true,
  smartNotifications: true,
  biometricAuth: true,
  csvImport: true,
  dataExport: true,
};

const FREE_TIER_USAGE: UsageTracking = {
  monthlyAIChats: 0,
  maxAIChats: 3,
  goalsCount: 0,
  maxGoals: 1,
  budgetsCount: 0,
  maxBudgets: 1,
  lastResetDate: new Date().toISOString(),
};

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, isLoggedIn } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionInfo>({
    tier: "free",
    startDate: null,
    endDate: null,
    trialEndDate: null,
    isActive: false,
    features: FREE_TIER_FEATURES,
    usage: FREE_TIER_USAGE,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Derived state
  const isTrialActive = subscription.tier === 'premium-trial' && subscription.isActive;
  const isPremium = (subscription.tier.includes('premium') || isTrialActive) && subscription.isActive;

  const daysUntilTrialExpires = subscription.trialEndDate
    ? Math.ceil((new Date(subscription.trialEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Initialize subscription on mount
  useEffect(() => {
    const initializeOnMount = async () => {
      console.log('🚀 SubscriptionContext mounting, isLoggedIn:', isLoggedIn, 'user:', !!user);

      // If authenticated, load from database
      if (isLoggedIn && user) {
        await initializeSubscription();
      } else {
        setIsLoading(false);
        console.log('⏳ Waiting for authentication to complete initialization');
      }
    };

    initializeOnMount();
  }, []);

  // Watch for authentication changes to complete initialization
  useEffect(() => {
    if (isLoggedIn && user) {
      console.log('🔑 Authentication completed, initializing subscription for user:', user.username);
      initializeSubscription();
    } else if (isLoggedIn === false) {
      // Only reset if explicitly logged out (not undefined/loading)
      console.log('🚪 User explicitly logged out, resetting to free tier');
      setSubscription({
        tier: "free",
        startDate: null,
        endDate: null,
        trialEndDate: null,
        isActive: false,
        features: FREE_TIER_FEATURES,
        usage: FREE_TIER_USAGE,
      });
      setIsLoading(false);
    } else {
      // isLoggedIn is undefined (still loading), don't reset subscription
      console.log('⏳ Authentication still loading, keeping current subscription state');
    }
  }, [isLoggedIn, user]);

  // Check for monthly usage reset
  useEffect(() => {
    checkAndResetMonthlyUsage();
  }, [subscription.usage.lastResetDate]);

  const initializeSubscription = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Initializing subscription for user:', user?.username);

      // First, load from database
      await loadSubscriptionFromBackend();

      // Then initialize RevenueCat (but don't let it override database data)
      await initializeRevenueCat();

    } catch (error) {
      console.error("Error initializing subscription:", error);
    } finally {
      setIsLoading(false);
      console.log('✅ Subscription initialization complete. Current tier:', subscription.tier, 'isPremium:', isPremium);
    }
  };

  const initializeRevenueCat = async () => {
    try {
      // Initialize RevenueCat with user ID using new error handling
      const initResult = await RevenueCatService.initialize(user?.username);

      if (!initResult.success) {
        console.error('❌ [SubscriptionContext] RevenueCat initialization failed:', initResult.error);
        // Continue with local subscription data, but log the issue
        return;
      }

      console.log('✅ [SubscriptionContext] RevenueCat initialized successfully');

      // Load subscription status from RevenueCat
      await loadSubscriptionFromRevenueCat();

      // Set up listener for subscription updates
      RevenueCatService.onCustomerInfoUpdated(handleCustomerInfoUpdate);
    } catch (error) {
      console.error("Error initializing RevenueCat:", error);
    }
  };




  const loadSubscriptionFromBackend = async () => {
    try {
      console.log('📡 Loading subscription from backend...');
      // Try to load subscription data from subscription endpoint
      const response = await api.get('/subscription');
      const subscriptionData = response.data;
      console.log('✅ Backend subscription data loaded:', subscriptionData);

      if (subscriptionData && subscriptionData.tier) {
        const backendSubscription = createSubscriptionFromBackendAPI(subscriptionData);

        // Only update if backend has a premium subscription or if we don't have one locally
        if ((backendSubscription.isActive && backendSubscription.tier.includes('premium')) ||
            (!subscription.isActive && subscription.tier === 'free')) {
          setSubscription(backendSubscription);
          console.log('✅ Loaded subscription from backend:', backendSubscription.tier);
        } else {
          console.log('Backend returned data but keeping existing subscription');
        }
      }
    } catch (error) {
      console.error("Error loading subscription from backend:", error);

      // If we have a premium subscription locally but backend failed to load, try to sync it
      if (subscription.isActive && subscription.tier.includes('premium')) {
        console.log('🔄 Backend failed to load but we have premium locally - attempting to sync...');
        try {
          await saveSubscriptionToDatabase(subscription);
          console.log('✅ Successfully synced local premium subscription to backend');
        } catch (syncError) {
          console.warn('⚠️ Failed to sync premium subscription to backend, will retry later');
        }
      }

      // Backend error is not critical, continue with storage/RevenueCat data
    }

    // Check AsyncStorage backup if we still have free tier (backend failed or returned free)
    if (!subscription.isActive || subscription.tier === 'free') {
      try {
        const AsyncStorage = await import('@react-native-async-storage/async-storage');
        const backupData = await AsyncStorage.default.getItem('subscription_backup');

        if (backupData) {
          const backupSubscription = JSON.parse(backupData);
          const backupAge = Date.now() - new Date(backupSubscription.lastUpdated).getTime();
          const maxAge = 15 * 24 * 60 * 60 * 1000; // 15 days

          // Use backup if it's premium and not too old
          if (backupSubscription.isActive &&
              backupSubscription.tier.includes('premium') &&
              backupAge < maxAge) {

            console.log('🔄 Backend returned free tier but found valid premium backup, restoring...');
            console.log('📊 Backup subscription details:', {
              tier: backupSubscription.tier,
              age: Math.round(backupAge / (24 * 60 * 60 * 1000)),
              backendSynced: backupSubscription.backendSynced
            });

            // Create subscription object without backup metadata
            const { backendSynced, lastUpdated, ...restoredSubscription } = backupSubscription;
            setSubscription(restoredSubscription);

            // Try to sync to backend if it wasn't synced before
            if (!backendSynced) {
              console.log('🔄 Attempting to sync restored subscription to backend...');
              try {
                await saveSubscriptionToDatabase(restoredSubscription);
                console.log('✅ Successfully synced restored subscription to backend');
                // Update backup to mark as synced
                await AsyncStorage.default.setItem('subscription_backup', JSON.stringify({
                  ...restoredSubscription,
                  backendSynced: true,
                  lastUpdated: new Date().toISOString()
                }));
              } catch (syncError) {
                console.warn('⚠️ Failed to sync restored subscription to backend, will retry later');
              }
            }
          } else {
            console.log('📊 Found backup subscription but it\'s expired or invalid, ignoring');
          }
        }
      } catch (backupError) {
        console.warn('⚠️ Failed to check subscription backup:', backupError);
      }
    }
  };

  const getSubscriptionFeatures = (isPremium: boolean): SubscriptionFeatures => {
    return {
      bankConnections: isPremium,
      unlimitedTransactionHistory: isPremium,
      advancedAnalytics: isPremium,
      unlimitedAIChat: isPremium,
      unlimitedGoals: isPremium,
      unlimitedBudgets: isPremium,
      creditScoreMonitoring: isPremium,
      billPrediction: isPremium,
      smartNotifications: isPremium,
      biometricAuth: isPremium,
      csvImport: isPremium,
      dataExport: isPremium,
    };
  };

  const createSubscriptionFromBackendAPI = (backendData: any): SubscriptionInfo => {
    return {
      tier: backendData.status === 'trialing' ? 'premium-trial' : (backendData.tier === 'premium' ? 'premium-monthly' : 'free'),
      isActive: backendData.status === 'active' || backendData.status === 'trialing',
      startDate: backendData.startDate,
      endDate: backendData.endDate,
      trialEndDate: backendData.trialEndDate,
      features: getSubscriptionFeatures(backendData.tier === 'premium' || backendData.status === 'trialing'),
      usage: {
        monthlyAIChats: backendData.usage?.aiChats || 0,
        maxAIChats: backendData.tier === 'premium' ? 999 : 5,
        goalsCount: backendData.usage?.goals || 0,
        maxGoals: backendData.tier === 'premium' ? 999 : 3,
        budgetsCount: backendData.usage?.budgets || 0,
        maxBudgets: backendData.tier === 'premium' ? 999 : 3,
        lastResetDate: new Date().toISOString(),
      }
    };
  };

  const createSubscriptionFromBackend = (backendData: any): SubscriptionInfo => {
    return {
      tier: backendData.tier || 'free',
      startDate: backendData.startDate || null,
      endDate: backendData.endDate || null,
      trialEndDate: backendData.trialEndDate || null,
      isActive: backendData.isActive || false,
      features: backendData.isActive && backendData.tier?.includes('premium') ? PREMIUM_FEATURES : FREE_TIER_FEATURES,
      usage: backendData.isActive && backendData.tier?.includes('premium') ?
        { ...FREE_TIER_USAGE, maxAIChats: 999, maxGoals: 999, maxBudgets: 999 } :
        FREE_TIER_USAGE,
    };
  };

  const loadSubscriptionFromRevenueCat = async () => {
    try {
      const subscriptionStatus = await RevenueCatService.getSubscriptionStatus();
      const customerInfo = await RevenueCatService.getCustomerInfo();

      const updatedSubscription = createSubscriptionFromRevenueCat(subscriptionStatus, customerInfo);

      // Only update if RevenueCat has a premium subscription (don't override local premium data)
      if (updatedSubscription.isActive && updatedSubscription.tier.includes('premium')) {
        setSubscription(updatedSubscription);
        console.log('Updated from RevenueCat:', updatedSubscription.tier);
      } else {
        console.log('RevenueCat returned free tier, keeping existing subscription');
      }
    } catch (error) {
      console.error("Error loading subscription from RevenueCat:", error);
    }
  };

  const createSubscriptionFromRevenueCat = (status: any, customerInfo: CustomerInfo | null): SubscriptionInfo => {
    const tier = determineTierFromRevenueCat(status);

    return {
      tier,
      startDate: customerInfo?.originalPurchaseDate || null,
      endDate: status.expirationDate?.toISOString() || null,
      trialEndDate: status.isTrialActive ? status.expirationDate?.toISOString() || null : null,
      isActive: status.isPremium,
      features: status.isPremium ? PREMIUM_FEATURES : FREE_TIER_FEATURES,
      usage: status.isPremium ? { ...FREE_TIER_USAGE, maxAIChats: 999, maxGoals: 999, maxBudgets: 999 } : FREE_TIER_USAGE,
    };
  };

  const determineTierFromRevenueCat = (status: any): SubscriptionTier => {
    if (status.isTrialActive) return 'premium-trial';
    if (status.isPremium) {
      // This would need to be determined from the product identifier
      return 'premium-monthly'; // Default to monthly for now
    }
    return 'free';
  };

  const handleCustomerInfoUpdate = (customerInfo: CustomerInfo) => {
    // Update subscription when RevenueCat detects changes
    loadSubscriptionFromRevenueCat();
  };

  const saveSubscriptionToDatabase = async (subscriptionData: SubscriptionInfo) => {
    try {
      console.log('💾 Saving subscription to database:', subscriptionData.tier);

      const payload = {
        tier: subscriptionData.tier.includes('premium') ? 'premium' : 'free',
        status: subscriptionData.isActive ? (subscriptionData.tier.includes('trial') ? 'trialing' : 'active') : 'cancelled',
        startDate: subscriptionData.startDate || new Date().toISOString(),
        endDate: subscriptionData.endDate,
        trialStartDate: subscriptionData.tier.includes('trial') ? subscriptionData.startDate : undefined,
        trialEndDate: subscriptionData.trialEndDate,
        features: Object.keys(subscriptionData.features).filter(key => subscriptionData.features[key as keyof SubscriptionFeatures])
      };

      console.log('📤 Subscription payload:', payload);
      console.log('🔑 Current user context:', {
        userId: user?.id || user?.username || user?.sub,
        hasUser: !!user
      });

      // Save to backend via subscription management endpoint (AWS database persistence only)
      await api.post('/subscription', payload);

      console.log('✅ Subscription saved to AWS database successfully');
    } catch (error: any) {
      console.error('❌ Error saving subscription to database:', error);
      console.error('❌ Error details:', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        headers: error?.response?.headers
      });

      // For 401 errors during subscription activation, don't trigger logout
      // Check both raw response status and transformed error status
      const isAuthError = error?.response?.status === 401 ||
                         error?.statusCode === 401 ||
                         error?.code === 'AUTH_SESSION_EXPIRED' ||
                         error?.code === 'AUTH_REFRESH_FAILED';

      // Special handling for trial activation save failures
      const isTrialSaveFailure = error?.response?.data?.error?.code === 'TRIAL_SAVE_AUTH_REQUIRED';

      if (isAuthError || isTrialSaveFailure) {
        console.warn('⚠️ Subscription save failed due to authentication issue - this will be retried later');
        console.warn('🔄 Trial activated locally, database sync will happen after authentication is restored');
        // Create a custom error that indicates auth failure but don't throw it to prevent logout
        const authFailureError = new Error('Subscription save failed due to authentication - will retry later');
        authFailureError.name = 'SUBSCRIPTION_SAVE_AUTH_FAILED';
        throw authFailureError;
      }

      throw error; // Re-throw other errors to indicate save failure
    }
  };


  const checkAndResetMonthlyUsage = () => {
    const lastReset = new Date(subscription.usage.lastResetDate);
    const now = new Date();

    // Check if it's a new month
    if (lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
      setSubscription(prev => ({
        ...prev,
        usage: {
          ...prev.usage,
          monthlyAIChats: 0,
          lastResetDate: now.toISOString(),
        },
      }));
    }
  };

  const refreshSubscription = async () => {
    await loadSubscriptionFromRevenueCat();
  };

  const purchaseSubscription = async (packageId: string): Promise<boolean> => {
    try {
      console.log('🛒 Starting purchase for package:', packageId);

      const offerings = await RevenueCatService.getCurrentOffering();
      if (!offerings) {
        console.error('No offerings available');
        return false;
      }

      const packageToPurchase = offerings.availablePackages.find(pkg => pkg.identifier === packageId);
      if (!packageToPurchase) {
        console.error('Package not found:', packageId);
        return false;
      }

      const result = await RevenueCatService.purchasePackage(packageToPurchase);
      console.log('🔍 [SubscriptionContext] Purchase result:', {
        success: result.success,
        hasCustomerInfo: !!result.customerInfo,
        customerInfo: result.customerInfo
      });

      if (result.success && result.customerInfo) {
        // Update local subscription state
        await loadSubscriptionFromRevenueCat();

        // Backend notification is now handled directly in RevenueCat service
        // No need for separate /subscription/verify call since trial data is saved directly

        console.log('🔍 [SubscriptionContext] Purchase successful, returning true');
        return true;
      }

      // Log detailed error information for debugging
      if (result.error) {
        console.error('🔍 [SubscriptionContext] Purchase failed with error:', {
          code: result.error.code,
          message: result.error.message,
          userCancelled: result.error.userCancelled,
          underlyingError: result.error.underlyingErrorMessage,
          userFriendlyMessage: (result as any).userFriendlyMessage
        });
      }

      console.log('🔍 [SubscriptionContext] Purchase failed condition check, returning false');
      return false;
    } catch (error) {
      console.error('❌ [SubscriptionContext] Error purchasing subscription:', error);
      return false;
    }
  };

  const restorePurchases = async (): Promise<boolean> => {
    try {
      console.log('🔄 Restoring purchases...');
      const result = await RevenueCatService.restorePurchases();

      if (result.success) {
        await loadSubscriptionFromRevenueCat();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error restoring purchases:', error);
      return false;
    }
  };

  const startTrial = async (): Promise<boolean> => {
    try {
      // Simulate starting a 14-day trial
      const trialStartDate = new Date().toISOString();
      const trialEndDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(); // 14 days from now

      const trialSubscription: SubscriptionInfo = {
        tier: 'premium-trial',
        isActive: true,
        startDate: trialStartDate,
        endDate: null,
        trialEndDate: trialEndDate,
        features: getSubscriptionFeatures(true),
        usage: {
          monthlyAIChats: 0,
          maxAIChats: 999,
          goalsCount: 0,
          maxGoals: 999,
          budgetsCount: 0,
          maxBudgets: 999,
          lastResetDate: new Date().toISOString(),
        }
      };

      setSubscription(trialSubscription);
      await saveSubscriptionToDatabase(trialSubscription);

      console.log('✅ Trial started successfully');
      return true;
    } catch (error) {
      console.error('Error starting trial:', error);
      return false;
    }
  };

  const getOfferings = async () => {
    try {
      const currentOffering = await RevenueCatService.getCurrentOffering();
      return currentOffering ? [currentOffering] : [];
    } catch (error) {
      console.error('Error getting offerings:', error);
      return [];
    }
  };

  // New method for enhanced purchase options with Apple/Google Pay support
  const purchaseWithOptions = async (packageId: string, options?: {preferWeb?: boolean}) => {
    try {
      const userId = user?.username || user?.id || 'anonymous';

      console.log('🛍️ [SubscriptionContext] Purchase with options:', {
        packageId,
        preferWeb: options?.preferWeb,
        userId
      });

      const result = await RevenueCatService.purchaseWithOptions(packageId, {
        preferWeb: options?.preferWeb,
        userId
      });

      // If web purchase was successful, return web URL for user to complete purchase
      if (result.success && result.method === 'web' && result.webUrl) {
        console.log('🌐 [SubscriptionContext] Web purchase URL generated:', result.webUrl);
        return result;
      }

      // If native purchase was successful, update local state
      if (result.success && result.method === 'native') {
        console.log('📱 [SubscriptionContext] Native purchase completed successfully');
        await loadSubscriptionFromRevenueCat();
        return { success: true, method: 'native' as const };
      }

      return {
        success: false,
        method: 'native' as const,
        error: result.error || 'Purchase failed'
      };

    } catch (error: any) {
      console.error('❌ [SubscriptionContext] Purchase with options failed:', error);
      return {
        success: false,
        method: 'native' as const,
        error: error?.message || 'Unknown purchase error'
      };
    }
  };

  // Get supported payment methods for current platform
  const getSupportedPaymentMethods = () => {
    return RevenueCatService.getSupportedPaymentMethods();
  };

  const checkFeatureAccess = (feature: keyof SubscriptionFeatures): boolean => {
    return subscription.features[feature];
  };

  const incrementUsage = async (type: 'aiChats' | 'goals' | 'budgets'): Promise<boolean> => {
    // Premium users have unlimited usage
    if (isPremium || isTrialActive) return true;

    const currentUsage = subscription.usage;

    switch (type) {
      case 'aiChats':
        if (currentUsage.monthlyAIChats >= currentUsage.maxAIChats) return false;
        break;
      case 'goals':
        if (currentUsage.goalsCount >= currentUsage.maxGoals) return false;
        break;
      case 'budgets':
        if (currentUsage.budgetsCount >= currentUsage.maxBudgets) return false;
        break;
    }

    // Increment usage
    const updatedUsage = { ...currentUsage };
    switch (type) {
      case 'aiChats':
        updatedUsage.monthlyAIChats += 1;
        break;
      case 'goals':
        updatedUsage.goalsCount += 1;
        break;
      case 'budgets':
        updatedUsage.budgetsCount += 1;
        break;
    }

    const updatedSubscription = { ...subscription, usage: updatedUsage };
    setSubscription(updatedSubscription);

    // Update usage tracking in backend (optional - silently fail if endpoint not available)
    try {
      await api.post('/subscription/usage', { type, usage: updatedUsage });
    } catch (error: any) {
      // Silently fail for 404 (endpoint not implemented) or 401 (auth issues)
      if (error?.response?.status === 404 || error?.response?.status === 401) {
        // Usage tracking endpoint not available - continue without backend sync
        console.log('📊 [Usage] Backend sync skipped (endpoint unavailable)');
      } else {
        console.warn('Failed to sync usage with backend:', error);
      }
    }

    return true;
  };

  const getUsageDisplay = (type: 'aiChats' | 'goals' | 'budgets'): string => {
    if (isPremium || isTrialActive) return "Unlimited";

    const usage = subscription.usage;
    switch (type) {
      case 'aiChats':
        return `${usage.monthlyAIChats}/${usage.maxAIChats}`;
      case 'goals':
        return `${usage.goalsCount}/${usage.maxGoals}`;
      case 'budgets':
        return `${usage.budgetsCount}/${usage.maxBudgets}`;
      default:
        return "0/0";
    }
  };

  const value: SubscriptionContextType = {
    subscription,
    isLoading,
    isPremium,
    isTrialActive,
    daysUntilTrialExpires,
    refreshSubscription,
    purchaseSubscription,
    purchaseWithOptions,
    restorePurchases,
    checkFeatureAccess,
    incrementUsage,
    getUsageDisplay,
    getOfferings,
    startTrial,
    getSupportedPaymentMethods,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    // Return a safe default for free tier if context is not available
    return {
      subscription: {
        tier: "free",
        startDate: null,
        endDate: null,
        trialEndDate: null,
        isActive: false,
        features: FREE_TIER_FEATURES,
        usage: FREE_TIER_USAGE,
      },
      isLoading: false,
      isPremium: false,
      isTrialActive: false,
      daysUntilTrialExpires: null,
      refreshSubscription: async () => {},
      purchaseSubscription: async () => false,
      purchaseWithOptions: async () => ({ success: false, method: 'native' }),
      restorePurchases: async () => false,
      getOfferings: async () => [],
      checkFeatureAccess: () => false,
      incrementUsage: async () => false,
      getUsageDisplay: () => "0/0",
      startTrial: async () => false,
      getSupportedPaymentMethods: () => ({
        nativePlatformPay: true,
        webPayments: false,
        platformName: 'Unknown',
        nativePayName: 'Platform Pay'
      }),
    };
  }
  return context;
};