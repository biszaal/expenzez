import Purchases, {
  PurchasesOffering,
  PurchasesPackage,
  CustomerInfo,
  PurchasesError,
  LOG_LEVEL
} from 'react-native-purchases';
import { Platform } from 'react-native';

const REVENUECAT_API_KEY = {
  ios: 'appl_YOUR_IOS_API_KEY', // Replace with actual iOS API key from RevenueCat dashboard
  android: 'goog_YOUR_ANDROID_API_KEY' // Replace with actual Android API key from RevenueCat dashboard
};

// Development mode flag
const DEVELOPMENT_MODE = __DEV__ || !REVENUECAT_API_KEY.ios.startsWith('appl_') || !REVENUECAT_API_KEY.android.startsWith('goog_');

export class RevenueCatService {
  private static initialized = false;

  static async initialize(userId?: string): Promise<void> {
    if (this.initialized) return;

    try {
      if (DEVELOPMENT_MODE) {
        console.log('RevenueCat: Running in development mode, using mock initialization');
        this.initialized = true;
        return;
      }

      const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY.ios : REVENUECAT_API_KEY.android;

      await Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      await Purchases.configure({ apiKey });

      if (userId) {
        await Purchases.logIn(userId);
      }

      this.initialized = true;
      console.log('RevenueCat initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
      // In development, don't throw error to allow app to continue
      if (DEVELOPMENT_MODE) {
        console.log('RevenueCat: Continuing in development mode despite error');
        this.initialized = true;
      } else {
        throw error;
      }
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
        console.log('RevenueCat: Returning mock current offering for development');
        return null;
      }
      const offerings = await Purchases.getOfferings();
      return offerings.current;
    } catch (error) {
      console.error('Failed to get current offering:', error);
      return null;
    }
  }

  static async purchasePackage(packageToPurchase: PurchasesPackage): Promise<{success: boolean, customerInfo?: CustomerInfo, error?: PurchasesError}> {
    try {
      if (DEVELOPMENT_MODE) {
        console.log('RevenueCat: Mock purchase successful in development mode');
        return { success: true };
      }
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      return { success: true, customerInfo };
    } catch (error) {
      console.error('Purchase failed:', error);
      return { success: false, error: error as PurchasesError };
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
        console.log('RevenueCat: Returning mock premium status (false) for development');
        return false;
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
        console.log('RevenueCat: Returning mock subscription status for development');
        return { isPremium: false, isTrialActive: false };
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
}

export default RevenueCatService;