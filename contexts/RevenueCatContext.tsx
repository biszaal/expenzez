import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import Purchases, { CustomerInfo, PurchasesPackage, LOG_LEVEL, PurchasesOffering } from 'react-native-purchases';

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

        // Get customer info
        const info = await Purchases.getCustomerInfo();
        setCustomerInfo(info);

        // Get offerings
        const offerings = await Purchases.getOfferings();
        setOfferings(offerings.current);

        setLoading(false);
      } catch (error) {
        console.error('Error initializing RevenueCat:', error);
        setLoading(false);
      }
    };

    initRevenueCat();
  }, []);

  const purchasePackage = async (packageToPurchase: PurchasesPackage): Promise<boolean> => {
    try {
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      setCustomerInfo(customerInfo);
      return customerInfo.entitlements.active['pro'] !== undefined;
    } catch (error: any) {
      console.error('Error purchasing package:', error);
      if (error.userCancelled) {
        console.log('User cancelled purchase');
      }
      return false;
    }
  };

  const restorePurchases = async (): Promise<boolean> => {
    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
      return info.entitlements.active['pro'] !== undefined;
    } catch (error) {
      console.error('Error restoring purchases:', error);
      return false;
    }
  };

  const isPro = customerInfo?.entitlements.active['pro'] !== undefined;

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