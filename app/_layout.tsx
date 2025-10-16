import { Stack } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import { AppState, Text, View, StatusBar } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import * as Linking from "expo-linking";
import { useSegments, useRouter } from "expo-router";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";
import { SecurityProvider, useSecurity } from "../contexts/SecurityContext";
import { NotificationProvider } from "../contexts/NotificationContext";
import { NetworkProvider } from "../contexts/NetworkContext";
import { RevenueCatProvider } from "../contexts/RevenueCatContext";
import { SubscriptionProvider } from "../contexts/SubscriptionContext";
import BiometricSecurityLock from "../components/BiometricSecurityLock";
import { AppLoadingScreen } from "../components/ui/AppLoadingScreen";
import PinSetupScreen from "./auth/PinSetup";

// Global error handlers to catch crashes
if (typeof global !== "undefined" && (global as any).ErrorUtils) {
  (global as any).ErrorUtils.setGlobalHandler?.(
    (error: Error, isFatal: boolean) => {
      console.error("🚨 [GLOBAL ERROR]", {
        isFatal,
        error: error.message,
        stack: error.stack,
      });
    }
  );
}

// Catch unhandled promise rejections
process.on?.("unhandledRejection", (reason: any, promise: Promise<any>) => {
  console.error("🚨 [UNHANDLED PROMISE REJECTION]", reason);
});

// Catch uncaught exceptions
process.on?.("uncaughtException", (error: Error) => {
  console.error("🚨 [UNCAUGHT EXCEPTION]", error.message, error.stack);
});

// Simple Error Boundary Component
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("🚨 [ErrorBoundary] CRITICAL ERROR CAUGHT:", error);
    console.error("🚨 [ErrorBoundary] Error stack:", error.stack);
    console.error(
      "🚨 [ErrorBoundary] Component stack:",
      errorInfo.componentStack
    );
    console.error("🚨 [ErrorBoundary] Error name:", error.name);
    console.error("🚨 [ErrorBoundary] Error message:", error.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <Text style={{ fontSize: 18, marginBottom: 10 }}>
            Something went wrong
          </Text>
          <Text style={{ textAlign: "center" }}>Please restart the app</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

function RootLayoutNav() {
  const auth = useAuth();
  const isLoggedIn = auth?.isLoggedIn ?? false;
  const loading = auth?.loading ?? true;
  const {
    isLocked,
    isSecurityEnabled,
    needsPinSetup,
    unlockApp,
    isInitialized: securityInitialized,
  } = useSecurity();
  const { isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [onboardingStatusChecked, setOnboardingStatusChecked] = useState(false);
  const segments = useSegments();

  // Quick session check on app startup
  useEffect(() => {
    const quickSessionCheck = async () => {
      try {
        const storedLogin = await AsyncStorage.getItem("isLoggedIn");
        const accessToken = await SecureStore.getItemAsync("accessToken", {
          keychainService: "expenzez-tokens",
        });

        if (storedLogin === "true" && accessToken && accessToken !== "null") {
          console.log("🔄 [Layout] Found valid session during startup", {
            storedLogin: storedLogin === "true",
            hasToken: !!accessToken,
          });
          setHasValidSession(true);
        }
      } catch (error) {
        console.log("❌ [Layout] Error checking session:", error);
      }
    };

    quickSessionCheck();
  }, []);

  // Check onboarding completion status
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const onboardingCompleted = await AsyncStorage.getItem(
          "onboarding_completed"
        );
        const completed = onboardingCompleted === "true";
        console.log("🎯 [Layout] Onboarding status check:", { completed });
        setHasCompletedOnboarding(completed);
        setOnboardingStatusChecked(true);
      } catch (error) {
        console.log("❌ [Layout] Error checking onboarding status:", error);
        setHasCompletedOnboarding(false);
        setOnboardingStatusChecked(true);
      }
    };

    checkOnboardingStatus();
  }, []);

  useEffect(() => {
    // Wait for both auth state and onboarding status to be loaded
    console.log(
      `🔄 [Layout] Loading state changed: auth.loading=${loading}, isLoading=${isLoading}, onboardingStatusChecked=${onboardingStatusChecked}`
    );
    if (!loading && onboardingStatusChecked) {
      console.log(
        "✅ [Layout] Auth and onboarding status loading complete, setting isLoading to false"
      );
      setIsLoading(false);
    }
  }, [loading, onboardingStatusChecked]);

  // PIN setup is now optional - no mandatory setup required
  useEffect(() => {
    setShowPinSetup(false);
  }, []);

  useEffect(() => {
    // Ensure in-app browser closes and returns to app after OAuth redirect
    try {
      WebBrowser.maybeCompleteAuthSession();
    } catch (error) {
      console.log("[WebBrowser] Session completion error:", error);
    }

    // Clear any stale navigation state that might cause routing issues
    const clearStaleNavigationState = async () => {
      try {
        // Get the initial URL and check if it's a banking callback
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          console.log(
            "[Layout] Detected initial URL on app startup:",
            initialUrl
          );
          // If it's a stale banking callback URL, we'll ignore it
          if (
            initialUrl.includes("banking/callback") ||
            initialUrl.includes("banks/callback") ||
            initialUrl.includes("nordigen") ||
            initialUrl.includes("gocardless") ||
            initialUrl.includes("truelayer") ||
            initialUrl.includes("plaid")
          ) {
            console.log("[Layout] Ignoring stale banking callback URL");
          }
        }

        // Clear all Expo Router persistent states
        await AsyncStorage.removeItem("expo-router-last-route");
        await AsyncStorage.removeItem("expo-router-state");
        await AsyncStorage.removeItem("expo-router-navigation-state");
        await AsyncStorage.removeItem("pendingNavigation");

        // Clear any cached navigation state
        await AsyncStorage.removeItem("navigationState");
        await AsyncStorage.removeItem("lastRoute");
        await AsyncStorage.removeItem("activeCallback");

        // Remove all banking-related keys
        const keys = await AsyncStorage.getAllKeys();
        const bankingKeys = keys.filter(
          (key) =>
            key.startsWith("requisition_") ||
            key.includes("banking") ||
            key.includes("nordigen") ||
            key.includes("gocardless") ||
            key.includes("truelayer") ||
            key.includes("plaid") ||
            key.includes("bankingCallbackState") ||
            key.includes("ref=expenzez_")
        );

        if (bankingKeys.length > 0) {
          console.log("[Layout] Clearing banking references:", bankingKeys);
          await AsyncStorage.multiRemove(bankingKeys);
        }

        console.log("[Layout] Cleared stale navigation state");
      } catch (error) {
        console.error("[Layout] Error clearing stale navigation state:", error);
      }
    };
    clearStaleNavigationState();
  }, []);

  // Periodic cache maintenance when app becomes active
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === "active") {
        // Clear corrupted cache when app becomes active (every time user opens app)
        setTimeout(() => {
          if (auth?.clearCorruptedCache) {
            console.log(
              "🔄 [Layout] App became active, clearing corrupted cache"
            );
            auth.clearCorruptedCache();
          }
        }, 1000); // Small delay to avoid interfering with app startup
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => subscription?.remove();
  }, [auth]);

  if (isLoading || loading || !securityInitialized) {
    console.log(
      `🔄 [Layout] Showing loading screen: isLoading=${isLoading}, loading=${loading}, securityInitialized=${securityInitialized}`
    );
    const message = !securityInitialized
      ? "Initializing security..."
      : "Setting up your account...";
    return (
      <>
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor="transparent"
          translucent={true}
        />
        <AppLoadingScreen message={message} />
      </>
    );
  }

  // PIN is now optional - no mandatory setup screen needed

  // Check if current route is the security settings page or related security pages
  const currentRoute = segments.join("/");
  const isOnSecurityPage = currentRoute.includes("security");

  // Show security lock if app is locked, but NOT if user is trying to access security settings
  console.log("🔐 [Layout] Security check:", {
    isLoggedIn,
    isLocked,
    isSecurityEnabled,
    currentRoute,
    isOnSecurityPage,
  });

  // Show security lock if app is locked - this takes priority over everything
  if (isLoggedIn && isLocked && !isOnSecurityPage) {
    console.log("🔐 [Layout] App is LOCKED - showing PIN screen ONLY");
    return (
      <>
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor="transparent"
          translucent={true}
        />
        <View style={{ flex: 1 }}>
          <BiometricSecurityLock
            isVisible={true}
            onUnlock={async () => unlockApp()}
          />
        </View>
      </>
    );
  }

  // ========================================
  // PROPER NAVIGATION LOGIC
  // ========================================

  // Step 1: Determine if user is logged in
  const shouldTreatAsLoggedIn = isLoggedIn || hasValidSession;

  // Step 2: Determine user type and appropriate route
  let initialRoute;
  let userType;

         if (shouldTreatAsLoggedIn) {
           // 🟢 LOGGED IN USER
           userType = "LOGGED_IN";
           initialRoute = "(tabs)"; // Go directly to main app
         } else if (onboardingStatusChecked) {
           if (hasCompletedOnboarding) {
             // 🟡 RETURNING USER (not logged in, but has seen onboarding)
             userType = "RETURNING_USER";
             initialRoute = "auth/Login"; // Go directly to login
           } else {
             // 🔴 NEW USER (never used the app)
             userType = "NEW_USER";
             initialRoute = "SplashScreen"; // Start with beautiful splash screen
           }
         } else {
           // 🟠 LOADING STATE (still checking user status)
           userType = "LOADING";
           initialRoute = "SplashScreen"; // Show beautiful splash while determining status
         }

  console.log("🎯 [Layout] Navigation Decision:", {
    userType,
    isLoggedIn,
    hasValidSession,
    hasCompletedOnboarding,
    onboardingStatusChecked,
    initialRoute,
    decision: {
      "User Type": userType,
      Route: initialRoute,
      Reason:
        userType === "LOGGED_IN"
          ? "User is logged in"
          : userType === "RETURNING_USER"
            ? "User has completed onboarding before"
            : userType === "NEW_USER"
              ? "User has never seen onboarding"
              : "Still loading user status",
    },
  });

  return (
    <>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent={true}
      />
             <Stack
               screenOptions={{ headerShown: false }}
               initialRouteName={initialRoute}
             >
               <Stack.Screen name="SplashScreen" options={{ headerShown: false }} />
               <Stack.Screen name="WelcomeOnboarding" />
        <Stack.Screen name="auth/Login" />
        <Stack.Screen name="auth/Register" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="profile/index" />
        <Stack.Screen name="profile/personal" />
        <Stack.Screen name="security/index" />
        <Stack.Screen name="security/create-pin" />
        <Stack.Screen name="notifications/index" />
        <Stack.Screen name="payment/index" />
        <Stack.Screen name="help/index" />
        <Stack.Screen name="terms/index" />
        <Stack.Screen name="credit-score/index" />
        <Stack.Screen name="target/index" />
        <Stack.Screen name="transactions/index" />
        <Stack.Screen name="add-transaction" />
        <Stack.Screen name="import-csv" />
        <Stack.Screen name="settings/index" />
        <Stack.Screen name="CompleteProfile" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <NetworkProvider>
          <RevenueCatProvider>
            <SubscriptionProvider>
              <AuthProvider>
                <SecurityProvider>
                  <NotificationProvider>
                    <RootLayoutNav />
                  </NotificationProvider>
                </SecurityProvider>
              </AuthProvider>
            </SubscriptionProvider>
          </RevenueCatProvider>
        </NetworkProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
