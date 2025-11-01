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
  refreshCustomerInfo: () => Promise<void>;
  hasActiveSubscription: boolean;
  isInTrialPeriod: boolean;
  subscriptionExpiryDate: Date | null;
  activeProductIdentifier: string | null;
  loginUser: (userId: string) => Promise<void>;
  logoutUser: () => Promise<void>;
}

const RevenueCatContext = createContext<RevenueCatContextType>({
  isPro: false,
  isLoading: true,
  customerInfo: null,
  offerings: null,
  purchasePackage: async () => ({ success: false }),
  restorePurchases: async () => ({ success: false }),
  getOfferings: async () => {},
  refreshCustomerInfo: async () => {},
  hasActiveSubscription: false,
  isInTrialPeriod: false,
  subscriptionExpiryDate: null,
  activeProductIdentifier: null,
  loginUser: async () => {},
  logoutUser: async () => {},
});

export const RevenueCatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState<any | null>(null);
  const [offerings, setOfferings] = useState<any | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isInTrialPeriod, setIsInTrialPeriod] = useState(false);
  const [subscriptionExpiryDate, setSubscriptionExpiryDate] =
    useState<Date | null>(null);
  const [activeProductIdentifier, setActiveProductIdentifier] = useState<
    string | null
  >(null);

  // Log isPro changes for debugging
  useEffect(() => {
    console.log("[RevenueCat] isPro changed to:", isPro);
  }, [isPro]);

  // Initialize RevenueCat SDK
  useEffect(() => {
    initializeRevenueCat();
  }, []);

  const initializeRevenueCat = async () => {
    try {
      console.log("[RevenueCat] 🚀 Initializing SDK...");
      console.log("[RevenueCat] Platform:", Platform.OS);
      console.log("[RevenueCat] App ownership:", Constants.appOwnership);
      console.log("[RevenueCat] Execution environment:", Constants.executionEnvironment);

      // Check if we're in Expo Go (which doesn't support native modules)
      const isExpoGo = Constants.appOwnership === "expo" && Constants.executionEnvironment === "storeClient";
      
      if (isExpoGo) {
        console.warn("[RevenueCat] ⚠️ Running in Expo Go - native modules are not available");
        console.warn("[RevenueCat] RevenueCat requires a development build:");
        console.warn("[RevenueCat]   1. Create a development build: npx expo run:ios or npx expo run:android");
        console.warn("[RevenueCat]   2. Or use EAS Build: eas build --profile development --platform ios");
        setIsLoading(false);
        setIsPro(false);
        return;
      }

      // Import RevenueCat SDK
      if (!Purchases) {
        try {
          // Try ES6 import first (works better with Expo and native modules)
          // Use dynamic import for better error handling
          const revenueCatModule = await import("react-native-purchases");
          
          // Handle different export formats
          // ES6 default export: export default Purchases
          // Named exports: export { CustomerInfo, LOG_LEVEL, ... }
          if (revenueCatModule) {
            // Get the default export (ES6 module)
            Purchases = revenueCatModule.default;
            
            // Get named exports
            CustomerInfo = revenueCatModule.CustomerInfo;
            PurchasesPackage = revenueCatModule.PurchasesPackage;
            PurchasesOfferings = revenueCatModule.PurchasesOfferings;
            LOG_LEVEL = revenueCatModule.LOG_LEVEL;
            
            // If default doesn't exist, try direct access (CommonJS fallback)
            if (!Purchases && revenueCatModule) {
              Purchases = revenueCatModule;
            }
            
            // Verify Purchases is actually available and has required methods
            if (!Purchases || typeof Purchases.configure !== 'function') {
              throw new Error("Purchases module not properly exported or missing configure method");
            }
            
            console.log("[RevenueCat] ✅ SDK module loaded successfully");
            console.log("[RevenueCat] Module structure:", {
              hasDefault: !!revenueCatModule.default,
              hasConfigure: typeof Purchases?.configure === 'function',
              hasCustomerInfo: !!CustomerInfo,
              hasPackage: !!PurchasesPackage,
            });
          } else {
            throw new Error("RevenueCat module is null or undefined");
          }
        } catch (importError: any) {
          const errorMessage = importError?.message || String(importError);
          const isNativeModuleError = 
            errorMessage.includes("NativeEventEmitter") ||
            errorMessage.includes("invariant") ||
            errorMessage.includes("native module") ||
            errorMessage.includes("RNPurchases");

          console.error("[RevenueCat] ❌ Failed to import SDK:", importError);
          console.error("[RevenueCat] Error message:", errorMessage);
          
          if (isNativeModuleError) {
            console.error("[RevenueCat] ⚠️ Native module not linked - this requires a rebuild");
            console.error("[RevenueCat] The native module bridge is not available.");
            console.error("[RevenueCat] This can happen if:");
            console.error("[RevenueCat]   1. You're using Expo Go (not supported)");
            console.error("[RevenueCat]   2. The app hasn't been rebuilt after installing the module");
            console.error("[RevenueCat] ");
            console.error("[RevenueCat] Solution:");
            console.error("[RevenueCat]   1. Create a development build:");
            console.error("[RevenueCat]      cd expenzez-frontend");
            console.error("[RevenueCat]      npx expo run:ios        # for iOS");
            console.error("[RevenueCat]      npx expo run:android    # for Android");
            console.error("[RevenueCat] ");
            console.error("[RevenueCat]   2. Or use EAS Build:");
            console.error("[RevenueCat]      eas build --profile development --platform ios");
            console.error("[RevenueCat] ");
            console.error("[RevenueCat] Note: RevenueCat will be disabled until the native module is linked.");
          } else {
            console.error("[RevenueCat] Error details:", {
              message: importError?.message,
              stack: importError?.stack,
              code: importError?.code,
            });
            console.error("[RevenueCat] Make sure react-native-purchases is installed");
            console.error("[RevenueCat] Run: npx expo install react-native-purchases");
          }
          
          setIsLoading(false);
          setIsPro(false);
          return;
        }
      }

      // Get API key for current platform
      const apiKey =
        Platform.OS === "ios" ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;

      console.log("[RevenueCat] iOS key present:", !!REVENUECAT_IOS_KEY);
      console.log("[RevenueCat] Android key present:", !!REVENUECAT_ANDROID_KEY);
      console.log("[RevenueCat] Selected API key present:", !!apiKey);

      if (!apiKey) {
        console.error("[RevenueCat] ❌ No API key found for platform:", Platform.OS);
        console.error("[RevenueCat] Please set EXPO_PUBLIC_REVENUECAT_IOS_API_KEY or EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY");
        console.error("[RevenueCat] For Expo Go: Create .env.local with your API keys");
        console.error("[RevenueCat] For Production: Set EAS secrets with: eas secret:create");
        setIsLoading(false);
        setIsPro(false);
        return;
      }

      // Configure SDK with API key
      console.log("[RevenueCat] 🔧 Configuring SDK with API key...");
      if (Platform.OS === "ios") {
        await Purchases.configure({ apiKey: REVENUECAT_IOS_KEY });
      } else if (Platform.OS === "android") {
        await Purchases.configure({ apiKey: REVENUECAT_ANDROID_KEY });
      }
      console.log("[RevenueCat] ✅ SDK configured successfully");

      // Set log level for debugging (use DEBUG for development, ERROR for production)
      const logLevel = __DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR;
      Purchases.setLogLevel(logLevel);
      console.log("[RevenueCat] 📊 Log level set to:", __DEV__ ? "DEBUG" : "ERROR");

      // Set user ID if available
      try {
        const userId = await AsyncStorage.getItem("user");
        if (userId) {
          const user = JSON.parse(userId);
          // Validate user ID is a non-empty string
          const appUserId = user?.userId || user?.id || user?.username;
          
          if (appUserId && typeof appUserId === "string" && appUserId.trim().length > 0) {
            await Purchases.logIn(appUserId.trim());
            console.log("[RevenueCat] ✅ Logged in user:", appUserId);
          } else {
            console.warn("[RevenueCat] ⚠️ User ID not available or invalid:", {
              hasUserId: !!user?.userId,
              hasId: !!user?.id,
              hasUsername: !!user?.username,
              type: typeof appUserId,
            });
          }
        }
      } catch (loginError: any) {
        // Log error but don't fail initialization - user can log in later
        console.warn("[RevenueCat] ⚠️ Failed to log in user:", loginError?.message);
        console.warn("[RevenueCat] User purchases will be tracked anonymously until login");
      }

      // Get initial customer info
      await updateCustomerInfo();

      // Listen for purchase updates
      Purchases.addCustomerInfoUpdateListener((info) => {
        console.log("[RevenueCat] Customer info updated");
        processCustomerInfo(info).catch(console.error);
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
      await processCustomerInfo(info);
    } catch (error) {
      setIsPro(false);
    }
  };

  const processCustomerInfo = async (info: any) => {
    setCustomerInfo(info);

    // Handle undefined/null customerInfo (happens during logout)
    if (!info || !info.entitlements || !info.entitlements.active) {
      console.log("[RevenueCat] ⚠️ No customer info or entitlements (logged out state)");
      setIsPro(false);
      setHasActiveSubscription(false);
      setIsInTrialPeriod(false);
      setSubscriptionExpiryDate(null);
      setActiveProductIdentifier(null);
      return;
    }

    // Log all active entitlements for debugging
    console.log("[RevenueCat] Active entitlements:", Object.keys(info.entitlements.active));
    console.log("[RevenueCat] All entitlements:", info.entitlements);

    // Check if user has active "premium" or "Premium" entitlement (case-insensitive check)
    const premiumEntitlement =
      info.entitlements.active["premium"] ||
      info.entitlements.active["Premium"];

    const hasPremium = premiumEntitlement !== undefined;

    console.log("[RevenueCat] Has premium entitlement:", hasPremium);
    console.log("[RevenueCat] Premium entitlement object:", premiumEntitlement);

    setIsPro(hasPremium);
    setHasActiveSubscription(hasPremium);

    if (hasPremium) {
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

      console.log("[RevenueCat] ✅ User has premium access", {
        inTrial,
        expiryDate: expiryDateString,
        productId: premiumEntitlement.productIdentifier,
        willRenew: premiumEntitlement.willRenew,
        periodType: premiumEntitlement.periodType,
      });
    } else {
      console.log("[RevenueCat] ❌ User does NOT have premium access");
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
        return { success: false, error: "Subscriptions are not available. Please rebuild the app with a development build." };
      }

      console.log("[RevenueCat] 🛒 Starting purchase for package:", pkg.identifier);
      setIsLoading(true);

      const { customerInfo: info } = await Purchases.purchasePackage(pkg);

      console.log("[RevenueCat] 💳 Purchase completed, processing customer info...");
      await processCustomerInfo(info);

      console.log("[RevenueCat] ✅ Purchase successful, isPro should now be:", info.entitlements.active["Premium"] !== undefined || info.entitlements.active["premium"] !== undefined);
      setIsLoading(false);

      return { success: true };
    } catch (error: any) {
      setIsLoading(false);

      // Handle user cancellation - this is not an error, just return gracefully
      if (error.userCancelled || error.code === "PURCHASE_CANCELLED") {
        console.log("[RevenueCat] ℹ️ Purchase cancelled by user");
        return { success: false, error: "Purchase cancelled" };
      }

      // Extract error details
      const errorMessage = error.message || "";
      const errorCode = error.code || "";
      const underlyingError = error.underlyingErrorMessage || "";

      // Check for specific error types and provide user-friendly messages
      
      // Authentication errors (Apple ID/StoreKit issues)
      if (
        errorMessage.includes("Authentication") ||
        errorMessage.includes("authentication failed") ||
        errorMessage.includes("password reuse") ||
        underlyingError.includes("Authentication Failed") ||
        underlyingError.includes("password reuse")
      ) {
        const userFriendlyError = 
          "There was an issue with your Apple ID authentication. " +
          "Please check your Apple ID settings in Settings > [Your Name] > Media & Purchases, " +
          "then try again.";
        console.warn("[RevenueCat] ⚠️ Authentication error:", errorMessage);
        return { success: false, error: userFriendlyError };
      }

      // Product unavailable
      if (
        errorMessage.includes("product") && 
        (errorMessage.includes("not available") || errorMessage.includes("unavailable"))
      ) {
        const userFriendlyError = "This subscription is currently unavailable. Please try again later.";
        console.warn("[RevenueCat] ⚠️ Product unavailable:", errorMessage);
        return { success: false, error: userFriendlyError };
      }

      // Network errors
      if (
        errorMessage.includes("network") ||
        errorMessage.includes("connection") ||
        errorCode === "NETWORK_ERROR"
      ) {
        const userFriendlyError = "Unable to connect. Please check your internet connection and try again.";
        console.warn("[RevenueCat] ⚠️ Network error:", errorMessage);
        return { success: false, error: userFriendlyError };
      }

      // Payment/purchase errors
      if (
        errorMessage.includes("payment") ||
        errorMessage.includes("Purchase") ||
        errorCode === "PURCHASE_ERROR" ||
        errorCode === "PAYMENT_PENDING"
      ) {
        const userFriendlyError = "There was an issue processing your payment. Please try again or contact support if the problem persists.";
        console.warn("[RevenueCat] ⚠️ Payment error:", errorMessage);
        return { success: false, error: userFriendlyError };
      }

      // StoreKit specific errors
      if (
        errorMessage.includes("StoreKit") ||
        underlyingError.includes("StoreKit") ||
        errorMessage.includes("ASDErrorDomain")
      ) {
        const userFriendlyError = 
          "There was an issue with the App Store. " +
          "Please try again in a moment. If the problem continues, " +
          "please contact support.";
        console.warn("[RevenueCat] ⚠️ StoreKit error:", errorMessage);
        return { success: false, error: userFriendlyError };
      }

      // Generic error with improved message
      const userFriendlyError = 
        errorMessage && errorMessage.length < 100 
          ? errorMessage 
          : "Unable to complete purchase. Please try again or contact support if the problem persists.";
      
      console.error("[RevenueCat] ❌ Purchase failed:", {
        message: errorMessage,
        code: errorCode,
        underlying: underlyingError,
      });

      return { success: false, error: userFriendlyError };
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

      await processCustomerInfo(info);
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

  /**
   * Login user to RevenueCat
   * Links subscriptions to this specific user ID
   */
  const loginUser = async (userId: string) => {
    try {
      if (!Purchases || !userId) {
        console.log("[RevenueCat] Cannot login: Purchases not initialized or userId empty");
        return;
      }

      console.log("[RevenueCat] 👤 Logging in user:", userId);

      // Login to RevenueCat with user ID
      const { customerInfo: info } = await Purchases.logIn(userId);

      console.log("[RevenueCat] ✅ User logged in successfully");

      // Update subscription status for this user
      await processCustomerInfo(info);

      // Refresh offerings for this user
      await getOfferings();
    } catch (error: any) {
      console.error("[RevenueCat] ❌ Login failed:", error);
      // Don't throw - allow app to continue even if RevenueCat login fails
    }
  };

  /**
   * Logout user from RevenueCat
   * Clears subscription data and resets to anonymous user
   */
  const logoutUser = async () => {
    try {
      if (!Purchases) {
        console.log("[RevenueCat] Cannot logout: Purchases not initialized");
        return;
      }

      console.log("[RevenueCat] 👋 Logging out user");

      // Logout from RevenueCat
      const { customerInfo: info } = await Purchases.logOut();

      console.log("[RevenueCat] ✅ User logged out successfully");

      // Reset to anonymous user state
      await processCustomerInfo(info);

      // Clear offerings
      setOfferings(null);
    } catch (error: any) {
      console.error("[RevenueCat] ❌ Logout failed:", error);

      // Force reset subscription state even if logout fails
      setIsPro(false);
      setHasActiveSubscription(false);
      setIsInTrialPeriod(false);
      setSubscriptionExpiryDate(null);
      setActiveProductIdentifier(null);
      setCustomerInfo(null);
      setOfferings(null);
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
    refreshCustomerInfo: updateCustomerInfo,
    hasActiveSubscription,
    isInTrialPeriod,
    subscriptionExpiryDate,
    activeProductIdentifier,
    loginUser,
    logoutUser,
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
