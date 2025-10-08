import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import Purchases, { CustomerInfo, PurchasesPackage, LOG_LEVEL, PurchasesOffering } from 'react-native-purchases';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

interface RevenueCatContextType {
  customerInfo: CustomerInfo | null;
  offerings: PurchasesOffering | null;
  loading: boolean;
  isPro: boolean;
  purchasePackage: (packageToPurchase: PurchasesPackage) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
}

const RevenueCatContext = createContext<RevenueCatContextType | undefined>(undefined);

interface RevenueCatProviderProps {
  children: ReactNode;
}

export const RevenueCatProvider: React.FC<RevenueCatProviderProps> = ({ children }) => {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initRevenueCat = async () => {
      try {
        // Detect if running in Expo Go
        const isExpoGo = Constants.appOwnership === 'expo';

        // Skip RevenueCat in Expo Go to prevent initialization errors
        if (isExpoGo) {
          console.log('🧪 [RevenueCat] Running in Expo Go - skipping initialization');
          setLoading(false);
          return;
        }

        // Use production iOS API key for all builds
        const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || 'appl_yfPFpbhaPCTmblZKDJMHMyRKhKH';

        // Skip initialization if using placeholder keys
        if (apiKey.includes('YOUR_') || apiKey.includes('appl_YOUR')) {
          console.warn('RevenueCat: Skipping initialization - no valid API key provided');
          setLoading(false);
          return;
        }

        // Configure RevenueCat (use INFO level for production)
        Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO);

        // Initialize with your API key
        await Purchases.configure({
          apiKey: apiKey,
        });

        console.log('✅ [RevenueCat] Initialized successfully');

        // Get customer info
        const info = await Purchases.getCustomerInfo();
        setCustomerInfo(info);

        // Get offerings
        const offerings = await Purchases.getOfferings();
        setOfferings(offerings.current);

        setLoading(false);
      } catch (error: any) {
        // Don't let RevenueCat errors block the app
        console.warn('⚠️ [RevenueCat] Initialization failed, continuing without RevenueCat:', error.message);
        setLoading(false);
      }
    };

    initRevenueCat();
  }, []);

  const purchasePackage = async (packageToPurchase: PurchasesPackage): Promise<boolean> => {
    try {
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      setCustomerInfo(customerInfo);
      return customerInfo.entitlements.active['premium'] !== undefined;
    } catch (error: any) {
      console.warn('[RevenueCat] Purchase error:', error.message);
      if (error.userCancelled) {
        console.log('[RevenueCat] User cancelled purchase');
      }
      return false;
    }
  };

  const restorePurchases = async (): Promise<boolean> => {
    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
      return info.entitlements.active['premium'] !== undefined;
    } catch (error: any) {
      console.warn('[RevenueCat] Restore error:', error.message);
      return false;
    }
  };

  const isPro = customerInfo?.entitlements.active['premium'] !== undefined;

  const value: RevenueCatContextType = {
    customerInfo,
    offerings,
    loading,
    isPro,
    purchasePackage,
    restorePurchases,
  };

  return (
    <RevenueCatContext.Provider value={value}>
      {children}
    </RevenueCatContext.Provider>
  );
};

export const useRevenueCat = (): RevenueCatContextType => {
  const context = useContext(RevenueCatContext);
  if (context === undefined) {
    throw new Error('useRevenueCat must be used within a RevenueCatProvider');
  }
  return context;
};

export { Purchases };