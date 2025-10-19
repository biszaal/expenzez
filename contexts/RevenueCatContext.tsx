/**
 * RevenueCat Context
 * Manages subscription state and purchase flow across the app
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

// RevenueCat module variables - will be set during initialization
let Purchases: any = null;
let CustomerInfo: any = null;
let PurchasesPackage: any = null;
let PurchasesOfferings: any = null;
let LOG_LEVEL: any = null;

// RevenueCat API Keys from environment
const REVENUECAT_IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || "";
const REVENUECAT_ANDROID_KEY =
  process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || "";

interface RevenueCatContextType {
  isPro: boolean;
  isLoading: boolean;
  customerInfo: any | null;
  offerings: any | null;
  purchasePackage: (pkg: any) => Promise<{ success: boolean; error?: string }>;
  restorePurchases: () => Promise<{ success: boolean; error?: string }>;
  getOfferings: () => Promise<void>;
  hasActiveSubscription: boolean;
  isInTrialPeriod: boolean;
  subscriptionExpiryDate: Date | null;
  activeProductIdentifier: string | null;
}

const RevenueCatContext = createContext<RevenueCatContextType>({
  isPro: false,
  isLoading: true,
  customerInfo: null,
  offerings: null,
  purchasePackage: async () => ({ success: false }),
  restorePurchases: async () => ({ success: false }),
  getOfferings: async () => {},
  hasActiveSubscription: false,
  isInTrialPeriod: false,
  subscriptionExpiryDate: null,
  activeProductIdentifier: null,
});

export const RevenueCatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isInTrialPeriod, setIsInTrialPeriod] = useState(false);
  const [subscriptionExpiryDate, setSubscriptionExpiryDate] =
    useState<Date | null>(null);
  const [activeProductIdentifier, setActiveProductIdentifier] = useState<
    string | null
  >(null);

  // Initialize RevenueCat SDK
  useEffect(() => {
    initializeRevenueCat();
  }, []);

  const initializeRevenueCat = async () => {
    try {
      console.log("[RevenueCat] Initializing SDK...");

      // Check if we're in Expo Go
      const isExpoGo =
        !Constants.appOwnership || Constants.appOwnership === "expo";


      if (isExpoGo) {
        setIsLoading(false);
        setIsPro(false);
        return;
      }

      // Try to import RevenueCat for development builds
      if (!Purchases) {
        try {
          const revenueCatModule = require("react-native-purchases");
          Purchases = revenueCatModule.default;
          CustomerInfo = revenueCatModule.CustomerInfo;
          PurchasesPackage = revenueCatModule.PurchasesPackage;
          PurchasesOfferings = revenueCatModule.PurchasesOfferings;
          LOG_LEVEL = revenueCatModule.LOG_LEVEL;
        } catch (importError) {
          setIsLoading(false);
          setIsPro(false);
          return;
        }
      }

      // Check if API keys are configured
      const apiKey =
        Platform.OS === "ios" ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;

      if (!apiKey) {
        setIsLoading(false);
        setIsPro(false);
        return;
      }

      // Configure SDK
      if (Platform.OS === "ios") {
        await Purchases.configure({ apiKey: REVENUECAT_IOS_KEY });
      } else if (Platform.OS === "android") {
        await Purchases.configure({ apiKey: REVENUECAT_ANDROID_KEY });
      }

      // Set log level for production
      Purchases.setLogLevel(LOG_LEVEL.ERROR);

      // Set user ID if available
      const userId = await AsyncStorage.getItem("user");
      if (userId) {
        const user = JSON.parse(userId);
        await Purchases.logIn(user.userId);
        console.log("[RevenueCat] Logged in user:", user.userId);
      }

      // Get initial customer info
      await updateCustomerInfo();

      // Listen for purchase updates
      Purchases.addCustomerInfoUpdateListener((info) => {
        console.log("[RevenueCat] Customer info updated");
        processCustomerInfo(info);
      });

      // Fetch available offerings
      await getOfferings();

      setIsLoading(false);
      console.log("[RevenueCat] Initialization complete");
    } catch (error: any) {
      console.error("[RevenueCat] Initialization error:", error);

      // Provide helpful error messages
      if (error.message?.includes("Invalid API key")) {
        console.error(
          "[RevenueCat] ❌ Invalid API key. Please check your RevenueCat API keys."
        );
        console.error(
          "[RevenueCat] See SUBSCRIPTION_SETUP_GUIDE.md for instructions."
        );
      }

      setIsLoading(false);
      // Fallback to free tier if SDK fails
      setIsPro(false);
    }
  };

  const updateCustomerInfo = async () => {
    try {
      if (!Purchases) {
        setIsPro(false);
        return;
      }
      const info = await Purchases.getCustomerInfo();
      processCustomerInfo(info);
    } catch (error) {
      setIsPro(false);
    }
  };

  const processCustomerInfo = (info: any) => {
    setCustomerInfo(info);

    // Check if user has active "premium" entitlement
    const hasPremium = info.entitlements.active["premium"] !== undefined;
    setIsPro(hasPremium);
    setHasActiveSubscription(hasPremium);

    if (hasPremium) {
      const premiumEntitlement = info.entitlements.active["premium"];

      // Check if in trial period
      const inTrial =
        premiumEntitlement.willRenew &&
        premiumEntitlement.periodType === "trial";
      setIsInTrialPeriod(inTrial);

      // Get expiry date
      const expiryDateString = premiumEntitlement.expirationDate;
      setSubscriptionExpiryDate(
        expiryDateString ? new Date(expiryDateString) : null
      );

      // Get active product identifier
      setActiveProductIdentifier(premiumEntitlement.productIdentifier);

      console.log("[RevenueCat] User has premium access", {
        inTrial,
        expiryDate: expiryDateString,
        productId: premiumEntitlement.productIdentifier,
      });
    } else {
      setIsInTrialPeriod(false);
      setSubscriptionExpiryDate(null);
      setActiveProductIdentifier(null);
    }
  };

  const getOfferings = async () => {
    try {
      if (!Purchases) {
        return;
      }
      
      const offerings = await Purchases.getOfferings();
      setOfferings(offerings);
    } catch (error) {
      // Silent error handling for production
    }
  };

  const purchasePackage = async (
    pkg: any
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!Purchases) {
        return { success: false, error: "RevenueCat not available" };
      }

      setIsLoading(true);

      const { customerInfo: info } = await Purchases.purchasePackage(pkg);

      processCustomerInfo(info);
      setIsLoading(false);

      return { success: true };
    } catch (error: any) {
      setIsLoading(false);

      // Handle user cancellation
      if (error.userCancelled) {
        return { success: false, error: "Purchase cancelled" };
      }
      return {
        success: false,
        error: error.message || "Purchase failed. Please try again.",
      };
    }
  };

  const restorePurchases = async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      if (!Purchases) {
        return { success: false, error: "RevenueCat not available" };
      }

      setIsLoading(true);

      const info = await Purchases.restorePurchases();

      processCustomerInfo(info);
      setIsLoading(false);

      const hasPremium = info.entitlements.active["premium"] !== undefined;

      if (hasPremium) {
        return { success: true };
      } else {
        return { success: false, error: "No purchases found" };
      }
    } catch (error: any) {
      setIsLoading(false);
      return {
        success: false,
        error: error.message || "Failed to restore purchases",
      };
    }
  };

  const value: RevenueCatContextType = {
    isPro,
    isLoading,
    customerInfo,
    offerings,
    purchasePackage,
    restorePurchases,
    getOfferings,
    hasActiveSubscription,
    isInTrialPeriod,
    subscriptionExpiryDate,
    activeProductIdentifier,
  };

  return (
    <RevenueCatContext.Provider value={value}>
      {children}
    </RevenueCatContext.Provider>
  );
};

export const useRevenueCat = () => {
  const context = useContext(RevenueCatContext);
  if (!context) {
    throw new Error("useRevenueCat must be used within a RevenueCatProvider");
  }
  return context;
};
