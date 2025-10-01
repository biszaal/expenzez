import Purchases, {
  PurchasesOffering,
  PurchasesPackage,
  CustomerInfo,
  PurchasesError,
  LOG_LEVEL
} from 'react-native-purchases';
import { Platform } from 'react-native';

// RevenueCat API Keys - Replace with your actual keys from RevenueCat Dashboard
// Get these from: https://app.revenuecat.com/apps -> Your App -> API Keys
const REVENUECAT_API_KEY = {
  // iOS API Key format: appl_xxxxxxxxxxxxxxxxxxxxxxxx
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || 'appl_YOUR_IOS_API_KEY',
  // Android API Key format: goog_xxxxxxxxxxxxxxxxxxxxxxxx
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || 'goog_YOUR_ANDROID_API_KEY'
};

// Development mode - automatically detect if using placeholder keys
const DEVELOPMENT_MODE = __DEV__ ||
  REVENUECAT_API_KEY.ios === 'appl_YOUR_IOS_API_KEY' ||
  REVENUECAT_API_KEY.android === 'goog_YOUR_ANDROID_API_KEY';

// Mock state for development mode
let mockTrialActive = false;
let mockTrialExpirationDate: Date | null = null;

export class RevenueCatService {
  private static initialized = false;

  static async initialize(userId?: string): Promise<{success: boolean; error?: string}> {
    if (this.initialized) return { success: true };

    try {
      // Handle development mode
      if (DEVELOPMENT_MODE) {
        console.log('🧪 [RevenueCat] Running in development mode with mock services');
        console.log('💡 [RevenueCat] To use real payments, set EXPO_PUBLIC_REVENUECAT_IOS_API_KEY and EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY');
        this.initialized = true;
        return { success: true };
      }

      const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY.ios : REVENUECAT_API_KEY.android;

      // Validate API key format
      const expectedPrefix = Platform.OS === 'ios' ? 'appl_' : 'goog_';
      if (!apiKey.startsWith(expectedPrefix)) {
        const error = `Invalid ${Platform.OS} API key format. Expected: ${expectedPrefix}xxxxxxxxx`;
        console.error('❌ [RevenueCat]', error);
        return { success: false, error };
      }

      // Configure RevenueCat
      await Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO);
      await Purchases.configure({ apiKey });

      // Login user if provided
      if (userId) {
        const loginResult = await this.logIn(userId);
        if (!loginResult.success) {
          console.warn('⚠️ [RevenueCat] User login failed, continuing anonymously:', loginResult.error);
        }
      }

      this.initialized = true;
      console.log('✅ [RevenueCat] Initialized successfully for', Platform.OS);
      return { success: true };

    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown initialization error';
      console.error('❌ [RevenueCat] Initialization failed:', errorMessage);

      // In development, allow app to continue with mock services
      if (DEVELOPMENT_MODE) {
        console.log('🧪 [RevenueCat] Falling back to development mode');
        this.initialized = true;
        return { success: true };
      }

      return { success: false, error: errorMessage };
    }
  }

  static async getOfferings(): Promise<PurchasesOffering[]> {
    try {
      if (DEVELOPMENT_MODE) {
        console.log('RevenueCat: Returning mock offerings for development');
        return [];
      }
      const offerings = await Purchases.getOfferings();
      return Object.values(offerings.all);
    } catch (error) {
      console.error('Failed to get offerings:', error);
      return [];
    }
  }

  static async getCurrentOffering(): Promise<PurchasesOffering | null> {
    try {
      if (DEVELOPMENT_MODE) {
        console.log('🧪 [RevenueCat] Returning mock current offering for development');
        // Return mock offering for development
        return {
          identifier: 'default',
          serverDescription: 'Default Offering',
          metadata: {},
          availablePackages: [
            {
              identifier: 'expenzez_premium_monthly',
              packageType: 'MONTHLY',
              product: {
                identifier: 'expenzez_premium_monthly',
                description: 'Monthly Premium Subscription with 14-day free trial',
                title: 'Premium Monthly',
                price: 4.99,
                priceString: '£4.99',
                currencyCode: 'GBP',
                introPrice: {
                  price: 0,
                  priceString: 'Free',
                  period: 'P14D',
                  cycles: 1,
                  periodUnit: 'DAY',
                  periodNumberOfUnits: 14
                },
                discounts: []
              },
              offeringIdentifier: 'default'
            },
            {
              identifier: 'expenzez_premium_annual',
              packageType: 'ANNUAL',
              product: {
                identifier: 'expenzez_premium_annual',
                description: 'Annual Premium Subscription with 14-day free trial',
                title: 'Premium Annual',
                price: 49.99,
                priceString: '£49.99',
                currencyCode: 'GBP',
                introPrice: {
                  price: 0,
                  priceString: 'Free',
                  period: 'P14D',
                  cycles: 1,
                  periodUnit: 'DAY',
                  periodNumberOfUnits: 14
                },
                discounts: []
              },
              offeringIdentifier: 'default'
            }
          ]
        } as any;
      }
      const offerings = await Purchases.getOfferings();
      return offerings.current;
    } catch (error) {
      console.error('❌ [RevenueCat] Failed to get current offering:', error);
      return null;
    }
  }

  static async purchasePackage(packageToPurchase: PurchasesPackage): Promise<{success: boolean, customerInfo?: CustomerInfo, error?: PurchasesError}> {
    try {
      if (DEVELOPMENT_MODE) {
        console.log('RevenueCat: Mock purchase successful in development mode');

        // Set mock trial state if purchasing trial package
        if (packageToPurchase.identifier === 'trial') {
          mockTrialActive = true;
          mockTrialExpirationDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days from now
          console.log('🧪 [RevenueCat] Mock trial activated until:', mockTrialExpirationDate);

          // Save trial to backend database for persistence
          try {
            const { api } = require('./config/apiClient');
            const trialData = {
              tier: 'premium',
              status: 'trialing',
              startDate: new Date().toISOString(),
              endDate: mockTrialExpirationDate.toISOString(),
              trialStartDate: new Date().toISOString(),
              trialEndDate: mockTrialExpirationDate.toISOString(),
              features: [
                'unlimited_transactions',
                'advanced_analytics',
                'unlimited_ai_chat',
                'unlimited_goals',
                'unlimited_budgets',
                'credit_score_monitoring',
                'bill_prediction',
                'smart_notifications',
                'biometric_auth',
                'csv_import',
                'data_export'
              ]
            };

            await api.post('/subscription', trialData);
            console.log('✅ [RevenueCat] Trial saved to backend database');

            // Force refresh secure validation to sync across devices
            try {
              const { SecureSubscriptionService } = require('./secureSubscriptionService');
              await SecureSubscriptionService.refreshSubscription();
              console.log('🔒 [RevenueCat] Secure validation refreshed after trial activation');
            } catch (secureError) {
              console.warn('🔒 [RevenueCat] Secure validation refresh failed:', secureError);
            }
          } catch (error) {
            console.warn('⚠️ [RevenueCat] Failed to save trial to backend:', error);
            // Continue anyway, trial will work locally
          }
        }

        // Return mock customerInfo for development mode
        const mockCustomerInfo = {
          originalAppUserId: 'mock-user-id',
          allPurchaseDates: {},
          allExpirationDates: {},
          entitlements: {
            active: {
              premium: {
                identifier: 'premium',
                isActive: true,
                willRenew: packageToPurchase.identifier !== 'trial', // Trial doesn't renew
                latestPurchaseDate: new Date().toISOString(),
                expirationDate: (mockTrialExpirationDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)).toISOString(),
                store: 'APP_STORE',
                productIdentifier: packageToPurchase.product.identifier
              }
            },
            all: {}
          }
        };
        return { success: true, customerInfo: mockCustomerInfo as any };
      }
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      console.log('✅ [RevenueCat] Purchase successful:', {
        hasCustomerInfo: !!customerInfo,
        entitlements: customerInfo?.entitlements.active
      });
      return { success: true, customerInfo };
    } catch (error: any) {
      console.error('❌ [RevenueCat] Purchase failed:', {
        message: error.message,
        code: error.code,
        userCancelled: error.userCancelled,
        underlyingErrorMessage: error.underlyingErrorMessage
      });

      // Enhanced error messaging
      let userFriendlyMessage = 'Purchase failed. Please try again.';

      if (error.userCancelled) {
        userFriendlyMessage = 'Purchase was cancelled.';
      } else if (error.code === '6' || error.message?.includes('ProductNotAvailableForPurchaseError')) {
        userFriendlyMessage = 'This product is not available for purchase. Please check your App Store Connect configuration.';
      } else if (error.code === '7' || error.message?.includes('InvalidAppleSubscriptionKeyError')) {
        userFriendlyMessage = 'Invalid subscription configuration. Please contact support.';
      } else if (error.code === '8' || error.message?.includes('ConfigurationError')) {
        userFriendlyMessage = 'App configuration error. Please ensure RevenueCat is properly set up.';
      } else if (error.message?.includes('network') || error.message?.includes('Network')) {
        userFriendlyMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message?.includes('SKErrorDomain')) {
        userFriendlyMessage = 'App Store connection error. Please try again in a few moments.';
      }

      return {
        success: false,
        error: error as PurchasesError,
        userFriendlyMessage
      };
    }
  }

  static async restorePurchases(): Promise<{success: boolean, customerInfo?: CustomerInfo, error?: any}> {
    try {
      if (DEVELOPMENT_MODE) {
        console.log('RevenueCat: Mock restore successful in development mode');
        return { success: true };
      }
      const customerInfo = await Purchases.restorePurchases();
      return { success: true, customerInfo };
    } catch (error) {
      console.error('Restore purchases failed:', error);
      return { success: false, error };
    }
  }

  static async getCustomerInfo(): Promise<CustomerInfo | null> {
    try {
      if (DEVELOPMENT_MODE) {
        console.log('RevenueCat: Returning mock customer info for development');
        return null;
      }
      return await Purchases.getCustomerInfo();
    } catch (error) {
      console.error('Failed to get customer info:', error);
      return null;
    }
  }

  static async isUserPremium(): Promise<boolean> {
    try {
      if (DEVELOPMENT_MODE) {
        console.log('RevenueCat: Checking premium status in development mode');

        // Get subscription status which already checks backend database
        const subscriptionStatus = await this.getSubscriptionStatus();
        return subscriptionStatus.isPremium;
      }
      const customerInfo = await this.getCustomerInfo();
      return customerInfo?.entitlements.active['premium'] !== undefined;
    } catch (error) {
      console.error('Failed to check premium status:', error);
      return false;
    }
  }

  static async getSubscriptionStatus(): Promise<{
    isPremium: boolean;
    isTrialActive: boolean;
    expirationDate?: Date;
    willRenew?: boolean;
  }> {
    try {
      if (DEVELOPMENT_MODE) {
        console.log('RevenueCat: Using secure subscription validation in development mode');

        // Use secure subscription service for server-validated status
        try {
          // Temporarily disabled until Lambda deployment completes
          // const { SecureSubscriptionService } = require('./secureSubscriptionService');
          // const secureStatus = await SecureSubscriptionService.validateSubscription();

          // Fallback to regular backend check for now
          const { api } = require('./config/apiClient');
          const response = await api.get('/subscription');
          const backendSubscription = response.data?.subscription || response.data;

          if (backendSubscription && backendSubscription.tier === 'premium' && backendSubscription.status === 'trialing') {
            const trialEndDate = new Date(backendSubscription.trialEndDate || backendSubscription.endDate);
            const now = new Date();

            if (trialEndDate > now) {
              console.log('🧪 [RevenueCat] Active trial found in backend database until:', trialEndDate);
              // Update local mock state to match backend
              mockTrialActive = true;
              mockTrialExpirationDate = trialEndDate;

              return {
                isPremium: true,
                isTrialActive: true,
                expirationDate: trialEndDate,
                willRenew: false
              };
            } else {
              console.log('🧪 [RevenueCat] Trial in backend database has expired at:', trialEndDate);
            }
          }

          console.log('🔒 [RevenueCat] No active subscription found in backend');
          return { isPremium: false, isTrialActive: false };
        } catch (error) {
          console.log('🔒 [RevenueCat] Backend check failed, using fallback:', error.message);

          // Fallback to local mock state
          const now = Date.now();
          const isTrialValid = mockTrialActive && mockTrialExpirationDate && mockTrialExpirationDate.getTime() > now;

          if (isTrialValid) {
            console.log('🧪 [RevenueCat] Fallback - mock trial is active until:', mockTrialExpirationDate);
            return {
              isPremium: true,
              isTrialActive: true,
              expirationDate: mockTrialExpirationDate,
              willRenew: false
            };
          } else if (mockTrialActive && mockTrialExpirationDate && mockTrialExpirationDate.getTime() <= now) {
            console.log('🧪 [RevenueCat] Fallback - mock trial has expired at:', mockTrialExpirationDate);
            mockTrialActive = false;
            mockTrialExpirationDate = null;
          }

          return { isPremium: false, isTrialActive: false };
        }
      }

      const customerInfo = await this.getCustomerInfo();

      if (!customerInfo) {
        return { isPremium: false, isTrialActive: false };
      }

      const premiumEntitlement = customerInfo.entitlements.active['premium'];

      if (premiumEntitlement) {
        return {
          isPremium: true,
          isTrialActive: premiumEntitlement.isActive && premiumEntitlement.isSandbox,
          expirationDate: new Date(premiumEntitlement.expirationDate || ''),
          willRenew: premiumEntitlement.willRenew
        };
      }

      return { isPremium: false, isTrialActive: false };
    } catch (error) {
      console.error('Failed to get subscription status:', error);
      return { isPremium: false, isTrialActive: false };
    }
  }

  static async logIn(userId: string): Promise<{success: boolean, customerInfo?: CustomerInfo, error?: any}> {
    try {
      const { customerInfo } = await Purchases.logIn(userId);
      return { success: true, customerInfo };
    } catch (error) {
      console.error('Failed to log in user:', error);
      return { success: false, error };
    }
  }

  static async logOut(): Promise<{success: boolean, error?: any}> {
    try {
      await Purchases.logOut();
      return { success: true };
    } catch (error) {
      console.error('Failed to log out user:', error);
      return { success: false, error };
    }
  }

  static async setAttributes(attributes: Record<string, string | null>): Promise<void> {
    try {
      await Purchases.setAttributes(attributes);
    } catch (error) {
      console.error('Failed to set attributes:', error);
    }
  }

  static async setEmail(email: string): Promise<void> {
    try {
      await Purchases.setEmail(email);
    } catch (error) {
      console.error('Failed to set email:', error);
    }
  }

  static onCustomerInfoUpdated(callback: (customerInfo: CustomerInfo) => void): void {
    Purchases.addCustomerInfoUpdateListener(callback);
  }

  static removeCustomerInfoUpdateListener(callback: (customerInfo: CustomerInfo) => void): void {
    Purchases.removeCustomerInfoUpdateListener(callback);
  }

  /**
   * Generate web purchase link for Apple/Google Pay support
   * This allows users to purchase via web with lower fees (2.9% vs 15-30%)
   */
  static async generateWebPurchaseLink(packageIdentifier: string, userId?: string): Promise<{success: boolean; url?: string; error?: string}> {
    try {
      if (DEVELOPMENT_MODE) {
        console.log('🧪 [RevenueCat] Mock web purchase link generated for:', packageIdentifier);
        return {
          success: true,
          url: `https://pay.rev.cat/demo-purchase?package=${packageIdentifier}&user=${userId || 'anonymous'}`
        };
      }

      // Note: In production, you would use RevenueCat's actual web purchase API
      // For now, we'll construct the expected URL format based on RevenueCat docs
      const baseUrl = 'https://pay.rev.cat';
      const params = new URLSearchParams();

      if (userId) params.append('user_id', userId);
      params.append('package', packageIdentifier);

      const webUrl = `${baseUrl}?${params.toString()}`;

      console.log('🌐 [RevenueCat] Web purchase link generated:', webUrl);
      return { success: true, url: webUrl };

    } catch (error: any) {
      console.error('❌ [RevenueCat] Failed to generate web purchase link:', error);
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }

  /**
   * Check if Apple Pay is available on device
   */
  static isApplePayAvailable(): boolean {
    return Platform.OS === 'ios';
  }

  /**
   * Check if Google Pay is available on device
   */
  static isGooglePayAvailable(): boolean {
    return Platform.OS === 'android';
  }

  /**
   * Get supported payment methods for current platform
   */
  static getSupportedPaymentMethods(): {
    nativePlatformPay: boolean;
    webPayments: boolean;
    platformName: string;
    nativePayName: string;
  } {
    const isIOS = Platform.OS === 'ios';

    return {
      nativePlatformPay: true, // StoreKit/Google Play always available
      webPayments: true, // Web payments available via RevenueCat
      platformName: isIOS ? 'iOS' : 'Android',
      nativePayName: isIOS ? 'Apple Pay' : 'Google Pay'
    };
  }

  /**
   * Enhanced purchase flow that provides payment method options
   */
  static async purchaseWithOptions(packageIdentifier: string, options?: {
    preferWeb?: boolean;
    userId?: string;
  }): Promise<{
    success: boolean;
    method: 'native' | 'web';
    customerInfo?: CustomerInfo;
    webUrl?: string;
    error?: string;
  }> {
    try {
      const { preferWeb = false, userId } = options || {};

      // If web is preferred and available, generate web purchase link
      if (preferWeb) {
        const webResult = await this.generateWebPurchaseLink(packageIdentifier, userId);
        if (webResult.success && webResult.url) {
          return {
            success: true,
            method: 'web',
            webUrl: webResult.url
          };
        }
      }

      // Fall back to native purchase
      const offerings = await this.getCurrentOffering();
      if (!offerings) {
        return { success: false, method: 'native', error: 'No offerings available' };
      }

      const packageToPurchase = offerings.availablePackages.find(pkg => pkg.identifier === packageIdentifier);
      if (!packageToPurchase) {
        return { success: false, method: 'native', error: 'Package not found' };
      }

      const purchaseResult = await this.purchasePackage(packageToPurchase);

      return {
        success: purchaseResult.success,
        method: 'native',
        customerInfo: purchaseResult.customerInfo,
        error: purchaseResult.error?.message
      };

    } catch (error: any) {
      return {
        success: false,
        method: 'native',
        error: error?.message || 'Unknown purchase error'
      };
    }
  }
}

export default RevenueCatService;