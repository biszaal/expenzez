/**
 * RevenueCat Context
 * Manages subscription state and purchase flow across the app
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { api } from "../services/config/apiClient";
import { ENV_CONFIG } from "../config/environment";

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
  syncSubscription: (userId: string) => Promise<boolean>;
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
  syncSubscription: async () => false,
});

export const RevenueCatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // 🔓 FORCE DEV MODE: Check multiple ways to detect development
  // 1. __DEV__ flag (React Native development mode)
  // 2. ENV_CONFIG.isDevelopment (from environment.ts)
  // 3. API URL check (dev API endpoint = dev mode)
  const isDevMode = __DEV__ ||
                    ENV_CONFIG.isDevelopment ||
                    ENV_CONFIG.apiBaseURL.includes('noat6k04ik'); // Dev API Gateway

  console.log("[RevenueCat] ========================================");
  console.log("[RevenueCat] 🔧 DEV MODE DETECTION");
  console.log("[RevenueCat] 🔧 __DEV__ FLAG:", __DEV__);
  console.log("[RevenueCat] 🔧 ENV_CONFIG.isDevelopment:", ENV_CONFIG.isDevelopment);
  console.log("[RevenueCat] 🔧 API URL:", ENV_CONFIG.apiBaseURL);
  console.log("[RevenueCat] 🔧 FINAL isDevMode:", isDevMode);
  console.log("[RevenueCat] ========================================");

  const [isPro, setIsPro] = useState(isDevMode);
  const [isLoading, setIsLoading] = useState(!isDevMode);
  const [customerInfo, setCustomerInfo] = useState<any | null>(null);
  const [offerings, setOfferings] = useState<any | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(isDevMode);
  const [isInTrialPeriod, setIsInTrialPeriod] = useState(false);
  const [subscriptionExpiryDate, setSubscriptionExpiryDate] =
    useState<Date | null>(null);
  const [activeProductIdentifier, setActiveProductIdentifier] = useState<
    string | null
  >(null);

  // Check if we're in dev mode (memoized to prevent recalculation)
  const isDevModeRef = React.useRef(
    __DEV__ ||
    ENV_CONFIG.isDevelopment ||
    ENV_CONFIG.apiBaseURL.includes('noat6k04ik')
  );

  // Log isPro changes for debugging
  useEffect(() => {
    console.log("[RevenueCat] ========================================");
    console.log("[RevenueCat] 🔍 PREMIUM STATUS CHECK");
    console.log("[RevenueCat] 🔍 __DEV__ flag:", __DEV__);
    console.log("[RevenueCat] 🔍 isDevMode (from ref):", isDevModeRef.current);
    console.log("[RevenueCat] 🔍 isPro state:", isPro);
    console.log("[RevenueCat] 🔍 isLoading:", isLoading);
    console.log("[RevenueCat] 🔍 hasActiveSubscription:", hasActiveSubscription);
    console.log("[RevenueCat] ========================================");

    // CRITICAL FIX: REMOVED DANGEROUS DEV MODE GUARD
    // This was forcing isPro = true even for expired subscriptions
    // Dev mode testing should be done with actual test subscriptions, not backdoors
    // if (isDevModeRef.current && !isPro) {
    //   console.log("[RevenueCat] 🚨 DEV MODE: isPro was false, forcing back to true");
    //   setIsPro(true);
    //   setHasActiveSubscription(true);
    // }
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
      console.log("[RevenueCat] __DEV__ flag:", __DEV__);
      console.log("[RevenueCat] ENV_CONFIG:", JSON.stringify(ENV_CONFIG));

      // 🔓 DEV MODE: Bypass premium checks in development
      // Check multiple ways to detect dev mode for maximum reliability
      const isDevMode = __DEV__ ||
                        ENV_CONFIG.isDevelopment ||
                        ENV_CONFIG.apiBaseURL.includes('noat6k04ik'); // Dev API = Dev mode

      if (isDevMode) {
        console.log("[RevenueCat] ========================================");
        console.log("[RevenueCat] 🔓 DEVELOPMENT MODE ACTIVATED");
        console.log("[RevenueCat] ✅ All premium features unlocked");
        console.log("[RevenueCat] ✅ Setting isPro = true");
        console.log("[RevenueCat] ✅ Setting hasActiveSubscription = true");
        console.log("[RevenueCat] ✅ Setting isLoading = false");
        console.log("[RevenueCat] ========================================");
        setIsPro(true);
        setHasActiveSubscription(true);
        setIsLoading(false);
        return;
      }

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
      // NOTE: In RevenueCat SDK v9+, configure() is SYNCHRONOUS (no Promise)
      console.log("[RevenueCat] 🔧 Configuring SDK with API key...");
      console.log("[RevenueCat] API Key present:", Platform.OS === "ios" ? !!REVENUECAT_IOS_KEY : !!REVENUECAT_ANDROID_KEY);
      console.log("[RevenueCat] API Key (first 10 chars):", Platform.OS === "ios" ? REVENUECAT_IOS_KEY?.substring(0, 10) : REVENUECAT_ANDROID_KEY?.substring(0, 10));

      try {
        // v9 SDK: configure is synchronous, not async
        Purchases.configure({
          apiKey: Platform.OS === "ios" ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY
        });
        console.log("[RevenueCat] ✅ SDK configured successfully");
      } catch (configError: any) {
        console.error("[RevenueCat] ❌ Configuration failed:", configError);
        console.error("[RevenueCat] Error message:", configError?.message);
        throw configError;
      }

      // Set log level for debugging (use DEBUG for development, ERROR for production)
      const logLevel = __DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR;
      Purchases.setLogLevel(logLevel);
      console.log("[RevenueCat] 📊 Log level set to:", __DEV__ ? "DEBUG" : "ERROR");

      // Set user ID if available (try to login from AsyncStorage)
      console.log("[RevenueCat] 🔍 Checking for existing user in AsyncStorage...");
      try {
        const userId = await AsyncStorage.getItem("user");
        console.log("[RevenueCat] AsyncStorage user:", !!userId);

        if (userId) {
          const user = JSON.parse(userId);
          console.log("[RevenueCat] Parsed user object:", {
            hasUserId: !!user?.userId,
            hasId: !!user?.id,
            hasUsername: !!user?.username,
            hasSub: !!user?.sub
          });

          // Validate user ID is a non-empty string
          const appUserId = user?.userId || user?.id || user?.username;

          if (appUserId && typeof appUserId === "string" && appUserId.trim().length > 0) {
            console.log("[RevenueCat] 👤 Attempting login from AsyncStorage with user ID:", appUserId);
            const { customerInfo, created } = await Purchases.logIn(appUserId.trim());
            console.log("[RevenueCat] ✅ Login from AsyncStorage successful!");
            console.log("[RevenueCat] Customer ID:", customerInfo.originalAppUserId);
            console.log("[RevenueCat] Created new customer:", created);
          } else {
            console.warn("[RevenueCat] ⚠️ User ID not available or invalid:", {
              hasUserId: !!user?.userId,
              hasId: !!user?.id,
              hasUsername: !!user?.username,
              type: typeof appUserId,
              value: appUserId
            });
          }
        } else {
          console.log("[RevenueCat] No user found in AsyncStorage - will remain anonymous until login");
        }
      } catch (loginError: any) {
        // Log error but don't fail initialization - user can log in later
        console.error("[RevenueCat] ❌ Failed to log in user from AsyncStorage:", loginError);
        console.error("[RevenueCat] Error message:", loginError?.message);
        console.error("[RevenueCat] Error stack:", loginError?.stack);
        console.warn("[RevenueCat] User purchases will be tracked anonymously until explicit login");
      }

      // Get initial customer info
      await updateCustomerInfo();

      // Listen for purchase updates and sync with backend
      Purchases.addCustomerInfoUpdateListener((info) => {
        console.log("[RevenueCat] Customer info updated - syncing with backend");
        processCustomerInfo(info).catch(console.error);
      });

      // Fetch available offerings
      await getOfferings();

      // CRITICAL: Sync with backend immediately to validate subscription expiration
      // This ensures expired trials/subscriptions are caught on app launch
      console.log("[RevenueCat] 🔄 Syncing with backend to validate subscription status...");
      await syncPremiumStatusFromBackend();

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
    // GUARD: Never update customer info in dev mode - keep premium access
    if (isDevModeRef.current) {
      console.log("[RevenueCat] 🔓 DEV MODE: Skipping updateCustomerInfo, keeping premium access");
      return;
    }

    try {
      if (!Purchases) {
        // Fallback to backend if SDK not available
        await syncPremiumStatusFromBackend();
        return;
      }
      const info = await Purchases.getCustomerInfo();
      await processCustomerInfo(info);
    } catch (error) {
      console.error("[RevenueCat] Error updating customer info, falling back to backend");
      // Fallback to backend on error
      await syncPremiumStatusFromBackend();
    }
  };

  /**
   * Sync subscription status directly from RevenueCat API
   * This is the most authoritative source of truth
   */
  const syncFromRevenueCat = async (userId: string) => {
    try {
      console.log("[RevenueCat] 🔄 Syncing subscription from RevenueCat API...");
      const response = await api.post("/subscription/sync", { userId });

      if (response.data?.success) {
        const { isPremium, tier, expiresAt } = response.data;
        console.log("[RevenueCat] ✅ Synced from RevenueCat API:", {
          isPremium,
          tier,
          expiresAt,
        });

        setIsPro(isPremium);
        setHasActiveSubscription(isPremium);

        // Set expiry date if available
        if (expiresAt) {
          setSubscriptionExpiryDate(new Date(expiresAt));
          console.log("[RevenueCat] 📅 Subscription expires at:", new Date(expiresAt));
        } else {
          setSubscriptionExpiryDate(null);
        }

        return true;
      }
    } catch (error: any) {
      console.error("[RevenueCat] ❌ Failed to sync from RevenueCat API:", error);
      // Don't throw - will fallback to profile endpoint
    }
    return false;
  };

  /**
   * Sync premium status from backend DynamoDB
   * This ensures subscription status persists across logout/login
   */
  const syncPremiumStatusFromBackend = async () => {
    // GUARD: Never sync from backend in dev mode - keep premium access
    if (isDevModeRef.current) {
      console.log("[RevenueCat] 🔓 DEV MODE: Skipping backend sync, keeping premium access");
      return;
    }

    try {
      console.log("[RevenueCat] 🔄 Syncing premium status from backend...");
      const response = await api.get("/profile");
      const profile = response.data?.profile ?? response.data;

      if (profile && profile.isPremium !== undefined) {
        console.log("[RevenueCat] ✅ Backend isPremium:", profile.isPremium);
        setIsPro(profile.isPremium);
        setHasActiveSubscription(profile.isPremium);

        console.log("[RevenueCat] 📊 Subscription details from backend:", {
          isPremium: profile.isPremium,
          subscriptionStatus: profile.subscriptionStatus,
          subscriptionTier: profile.subscriptionTier,
        });
      } else {
        console.log("[RevenueCat] ⚠️ No isPremium field in backend profile");
      }
    } catch (error: any) {
      console.error("[RevenueCat] ❌ Failed to sync from backend:", error);
      // Don't throw - allow RevenueCat SDK to be source of truth if backend fails
    }
  };

  const processCustomerInfo = async (info: any) => {
    // GUARD: Never process customer info in dev mode - keep premium access
    if (isDevModeRef.current) {
      console.log("[RevenueCat] 🔓 DEV MODE: Skipping processCustomerInfo, keeping premium access");
      return;
    }

    setCustomerInfo(info);

    // Handle undefined/null customerInfo (happens during logout)
    if (!info || !info.entitlements || !info.entitlements.active) {
      console.log("[RevenueCat] ⚠️ No customer info or entitlements (logged out state)");

      // Sync with backend to get persistent subscription status
      await syncPremiumStatusFromBackend();

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

    // CRITICAL FIX: Validate expiration date before granting premium access
    let hasPremium = premiumEntitlement !== undefined;
    let isExpired = false;

    if (hasPremium && premiumEntitlement.expirationDate) {
      const expiryDate = new Date(premiumEntitlement.expirationDate);
      const now = new Date();
      isExpired = expiryDate < now;

      if (isExpired) {
        console.log("[RevenueCat] 🚨 SUBSCRIPTION EXPIRED!", {
          expiryDate: expiryDate.toISOString(),
          now: now.toISOString(),
          daysSinceExpiry: Math.floor((now.getTime() - expiryDate.getTime()) / (1000 * 60 * 60 * 24))
        });
        hasPremium = false; // Override - subscription is expired
      }
    }

    console.log("[RevenueCat] Has premium entitlement:", hasPremium);
    console.log("[RevenueCat] Is expired:", isExpired);
    console.log("[RevenueCat] Premium entitlement object:", premiumEntitlement);

    // Delay backend sync to give webhook time to process (webhook processes first)
    // This ensures DynamoDB has the latest data before we read it
    setTimeout(async () => {
      try {
        console.log("[RevenueCat] 🔄 Syncing with backend after webhook processing delay...");
        await syncPremiumStatusFromBackend();
      } catch (error) {
        console.error("[RevenueCat] ❌ Failed to sync with backend after delay:", error);
      }
    }, 3000); // 3 second delay to allow webhook to process

    // Set subscription state from RevenueCat SDK immediately
    // CRITICAL: Only set to true if not expired
    setHasActiveSubscription(hasPremium && !isExpired);

    if (hasPremium && !isExpired) {
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
      console.log("[RevenueCat] ❌ User does NOT have premium access", { expired: isExpired });
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
   * ALWAYS syncs subscription status from RevenueCat API first (most authoritative)
   */
  const loginUser = async (userId: string) => {
    // GUARD: In dev mode, just log and keep premium access
    if (isDevModeRef.current) {
      console.log("[RevenueCat] 🔓 DEV MODE: Skipping loginUser, keeping premium access");
      console.log("[RevenueCat] 👤 User ID:", userId);
      return;
    }

    try {
      if (!userId) {
        console.error("[RevenueCat] ❌ Cannot login: userId is empty");
        return;
      }

      console.log("[RevenueCat] 👤 Logging in user:", userId);

      // PRIORITY 1: Sync directly from RevenueCat API (most authoritative source)
      const apiSyncSuccess = await syncFromRevenueCat(userId);

      // PRIORITY 2: Fallback to backend DynamoDB if API sync fails
      if (!apiSyncSuccess) {
        console.log("[RevenueCat] ⚠️ API sync failed, falling back to backend DynamoDB");
        await syncPremiumStatusFromBackend();
      }

      // Only try RevenueCat SDK login if SDK is available
      if (!Purchases) {
        console.warn("[RevenueCat] ⚠️ RevenueCat SDK not initialized - using synced subscription status");
        return;
      }

      console.log("[RevenueCat] Purchases SDK status:", !!Purchases);

      // Login to RevenueCat with user ID
      const { customerInfo: info } = await Purchases.logIn(userId);

      console.log("[RevenueCat] ✅ User logged in successfully");
      console.log("[RevenueCat] Customer ID:", info.originalAppUserId);

      // Update subscription status for this user
      await processCustomerInfo(info);

      // Refresh offerings for this user
      await getOfferings();
    } catch (error: any) {
      console.error("[RevenueCat] ❌ Login failed:", error);
      console.error("[RevenueCat] Error message:", error?.message);
      console.error("[RevenueCat] Error stack:", error?.stack);

      // Final fallback: sync from backend even if RevenueCat fails
      await syncPremiumStatusFromBackend();
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
    syncSubscription: syncFromRevenueCat,
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
