import { Stack, useSegments } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState, useCallback } from "react";
import {
  AppState,
  Text,
  View,
  StatusBar,
  Modal,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import * as Linking from "expo-linking";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";
import { SecurityProvider, useSecurity } from "../contexts/SecurityContext";
import { NotificationProvider } from "../contexts/NotificationContext";
import { NetworkProvider } from "../contexts/NetworkContext";
import { RevenueCatProvider } from "../contexts/RevenueCatContext";
import { SubscriptionProvider } from "../contexts/SubscriptionContext";
import BiometricSecurityLock from "../components/BiometricSecurityLock";
import SplashScreen from "./SplashScreen";
import PinInput from "../components/PinInput";
import { SafeAreaView } from "react-native-safe-area-context";

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
    hasServerPin,
    unlockApp,
    validateAndSyncPin,
    isInitialized: securityInitialized,
  } = useSecurity();
  const { isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [onboardingStatusChecked, setOnboardingStatusChecked] = useState(false);
  const segments = useSegments();

  // PIN sync modal state
  const [showPinSyncModal, setShowPinSyncModal] = useState(false);
  const [syncPinInput, setSyncPinInput] = useState("");
  const [isSyncingPin, setIsSyncingPin] = useState(false);

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

    // Add a timeout to prevent slow AsyncStorage operations
    const timeout = setTimeout(() => {
      console.log(
        "⏰ [Layout] Onboarding check timeout - defaulting to not completed"
      );
      setHasCompletedOnboarding(false);
      setOnboardingStatusChecked(true);
    }, 1000); // 1 second timeout for AsyncStorage

    checkOnboardingStatus().finally(() => {
      clearTimeout(timeout);
    });
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
  }, [loading, onboardingStatusChecked, isLoading]);

  // Add immediate loading completion for faster navigation
  useEffect(() => {
    const quickTimeout = setTimeout(() => {
      if (onboardingStatusChecked) {
        console.log(
          "🚀 [Layout] Quick navigation - completing loading immediately"
        );
        setIsLoading(false);
      }
    }, 500); // Very quick timeout for immediate navigation

    return () => clearTimeout(quickTimeout);
  }, [onboardingStatusChecked]);

  // Add a timeout to prevent getting stuck on splash screen
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log(
        "🎯 [Layout] Loading timeout - forcing navigation after 1 second"
      );
      setIsLoading(false);
    }, 1000); // 1 second timeout for faster navigation

    return () => clearTimeout(timeout);
  }, []);

  // Add an even more aggressive timeout to prevent getting stuck
  useEffect(() => {
    const aggressiveTimeout = setTimeout(() => {
      console.log(
        "🚨 [Layout] AGGRESSIVE TIMEOUT - Force completing all loading states"
      );
      setIsLoading(false);
      setOnboardingStatusChecked(true);
    }, 2000); // 2 second aggressive timeout

    return () => clearTimeout(aggressiveTimeout);
  }, []);

  // Show PIN sync modal when user has server PIN but not local PIN
  // Instead of showing a separate modal, we'll use the normal PIN lock screen
  useEffect(() => {
    if (
      isLoggedIn &&
      isSecurityEnabled &&
      needsPinSetup &&
      hasServerPin &&
      !showPinSyncModal
    ) {
      console.log(
        "🔐 [Layout] User has server PIN but no local PIN - will use normal PIN lock screen for sync"
      );
      // Don't show the modal, let the normal PIN lock screen handle it
      // setShowPinSyncModal(true);
    }
  }, [
    isLoggedIn,
    isSecurityEnabled,
    needsPinSetup,
    hasServerPin,
    showPinSyncModal,
  ]);

  // Handle PIN sync submission
  const handlePinSync = useCallback(async () => {
    if (syncPinInput.length !== 5) {
      console.log("🔐 [Layout] PIN length not 5, skipping sync");
      return;
    }

    console.log("🔐 [Layout] Starting PIN sync process...");
    setIsSyncingPin(true);

    try {
      const success = await validateAndSyncPin(syncPinInput);
      console.log("🔐 [Layout] PIN sync result:", success);

      if (success) {
        console.log("✅ [Layout] PIN sync successful, closing modal");

        // Immediately close modal and clear state
        setShowPinSyncModal(false);
        setSyncPinInput("");
        setIsSyncingPin(false);

        // Show success message after a brief delay
        setTimeout(() => {
          Alert.alert(
            "PIN Synced Successfully",
            "Your PIN has been synced to this device. You can now use it to unlock the app.",
            [{ text: "OK" }]
          );
        }, 100);
      } else {
        console.log("❌ [Layout] PIN sync failed, clearing input");
        setSyncPinInput("");
        setIsSyncingPin(false);

        Alert.alert(
          "Incorrect PIN",
          "The PIN you entered is incorrect. Please try again.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("❌ [Layout] Error syncing PIN:", error);
      setSyncPinInput("");
      setIsSyncingPin(false);

      Alert.alert(
        "Sync Failed",
        "Failed to sync your PIN. Please try again or contact support.",
        [{ text: "OK" }]
      );
    }
  }, [syncPinInput, validateAndSyncPin]);

  // Auto-submit when PIN is complete
  useEffect(() => {
    if (syncPinInput.length === 5 && !isSyncingPin) {
      console.log("🔐 [Layout] PIN complete, auto-submitting in 200ms");
      const timeout = setTimeout(() => {
        handlePinSync();
      }, 200);
      return () => clearTimeout(timeout);
    }
  }, [syncPinInput, isSyncingPin, handlePinSync]);

  // Add a timeout to prevent the modal from getting stuck
  useEffect(() => {
    if (showPinSyncModal) {
      const timeout = setTimeout(() => {
        console.log("🔐 [Layout] PIN sync modal timeout - closing modal");
        setShowPinSyncModal(false);
        setSyncPinInput("");
        setIsSyncingPin(false);
      }, 30000); // 30 second timeout

      return () => clearTimeout(timeout);
    }
  }, [showPinSyncModal]);

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

  // Simplified loading condition - only show splash if actually loading
  if (isLoading) {
    console.log(
      `🔄 [Layout] Showing beautiful splash screen: isLoading=${isLoading}`
    );
    return <SplashScreen />;
  }

  // CRITICAL: Wait for security context to initialize before checking lock state
  if (!securityInitialized) {
    console.log("⏳ [Layout] Waiting for security context to initialize...");
    return <SplashScreen />;
  }

  // PIN is now optional - no mandatory setup screen needed

  // Check if current route is the security settings page or related security pages
  const currentRoute = segments.join("/");
  const isOnSecurityPage = currentRoute.includes("security");

  // ========================================
  // PROPER NAVIGATION LOGIC
  // ========================================

  // Step 1: Determine if user is logged in
  const shouldTreatAsLoggedIn = isLoggedIn || hasValidSession;

  // Show security lock if app is locked, but NOT if user is trying to access security settings
  console.log("🔐 [Layout] Security check:", {
    isLoggedIn,
    isLocked,
    isSecurityEnabled,
    securityInitialized,
    currentRoute,
    isOnSecurityPage,
    shouldTreatAsLoggedIn,
    hasValidSession,
  });

  // Show security lock if app is locked - this takes priority over everything
  // BUT only if user is actually logged in and not on security pages
  if (shouldTreatAsLoggedIn && isLocked && !isOnSecurityPage) {
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
      initialRoute = "WelcomeOnboarding"; // Start with onboarding
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

      {/* PIN Sync Modal - DISABLED - Using normal PIN lock screen instead */}
      <Modal
        visible={false}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => {
          // Can't dismiss this modal - user must enter PIN
        }}
      >
        <SafeAreaView
          style={[
            pinSyncStyles.container,
            { backgroundColor: isDark ? "#1F2937" : "#FFFFFF" },
          ]}
        >
          <View style={pinSyncStyles.content}>
            <Text
              style={[
                pinSyncStyles.title,
                { color: isDark ? "#FFFFFF" : "#1F2937" },
              ]}
            >
              Welcome Back!
            </Text>
            <Text
              style={[
                pinSyncStyles.subtitle,
                { color: isDark ? "#D1D5DB" : "#6B7280" },
              ]}
            >
              You have App Lock enabled on your account. Please enter your
              5-digit PIN to sync it to this device.
            </Text>

            <View style={pinSyncStyles.pinContainer}>
              <PinInput
                pin={syncPinInput}
                onPinChange={setSyncPinInput}
                isLoading={isSyncingPin}
                maxLength={5}
                showBiometric={false}
              />
            </View>

            {isSyncingPin && (
              <View style={pinSyncStyles.loadingContainer}>
                <ActivityIndicator
                  size="small"
                  color={isDark ? "#8B5CF6" : "#6F76C8"}
                />
                <Text
                  style={[
                    pinSyncStyles.loadingText,
                    { color: isDark ? "#8B5CF6" : "#6F76C8" },
                  ]}
                >
                  Verifying PIN...
                </Text>
              </View>
            )}

            <Text
              style={[
                pinSyncStyles.hint,
                { color: isDark ? "#9CA3AF" : "#9CA3AF" },
              ]}
            >
              Enter the PIN you created on another device
            </Text>
          </View>
        </SafeAreaView>
      </Modal>

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
        <Stack.Screen name="subscription/plans" />
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

const pinSyncStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 16,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 48,
    paddingHorizontal: 16,
  },
  pinContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 24,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  loadingText: {
    fontSize: 14,
    color: "#6F76C8",
    marginLeft: 8,
    fontWeight: "500",
  },
  hint: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 24,
  },
});
