import { Stack } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import { SecurityProvider, useSecurity } from "../contexts/SecurityContext";
import { NotificationProvider } from "../contexts/NotificationContext";
import { NetworkProvider } from "../contexts/NetworkContext";
import SecurityLock from "../components/SecurityLock";
import { AppLoadingScreen } from "../components/ui/AppLoadingScreen";

function RootLayoutNav() {
  const auth = useAuth();
  const isLoggedIn = auth?.isLoggedIn ?? false;
  const loading = auth?.loading ?? true;
  const { isLocked, unlockApp } = useSecurity();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wait for auth state to be loaded
    console.log(`🔄 [Layout] Loading state changed: auth.loading=${loading}, isLoading=${isLoading}`);
    if (!loading) {
      console.log('✅ [Layout] Auth loading complete, setting isLoading to false');
      setIsLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    // Ensure in-app browser closes and returns to app after OAuth redirect
    try {
      WebBrowser.maybeCompleteAuthSession();
    } catch (error) {
      console.log("[WebBrowser] Session completion error:", error);
    }
  }, []);

  // Periodic cache maintenance when app becomes active
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        // Clear corrupted cache when app becomes active (every time user opens app)
        setTimeout(() => {
          if (auth?.clearCorruptedCache) {
            console.log('🔄 [Layout] App became active, clearing corrupted cache');
            auth.clearCorruptedCache();
          }
        }, 1000); // Small delay to avoid interfering with app startup
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [auth]);

  if (isLoading || loading) {
    console.log(`🔄 [Layout] Showing loading screen: isLoading=${isLoading}, loading=${loading}`);
    return <AppLoadingScreen message="Setting up your account..." />;
  }

  // Show security lock if app is locked
  if (isLoggedIn && isLocked) {
    return <SecurityLock isVisible={true} onUnlock={unlockApp} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="auth/Login" />
      <Stack.Screen name="auth/Register" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="profile/index" />
      <Stack.Screen name="profile/personal" />
      <Stack.Screen name="security/index" />
      <Stack.Screen name="notifications/index" />
      <Stack.Screen name="payment/index" />
      <Stack.Screen name="help/index" />
      <Stack.Screen name="terms/index" />
      <Stack.Screen name="banks/index" />
      <Stack.Screen name="banks/callback" />
      <Stack.Screen name="banks/select" />
      <Stack.Screen name="credit-score/index" />
      <Stack.Screen name="target/index" />
      <Stack.Screen name="transactions/index" />
      <Stack.Screen name="settings/index" />
      <Stack.Screen name="CompleteProfile" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <NetworkProvider>
        <AuthProvider>
          <SecurityProvider>
            <NotificationProvider>
              <RootLayoutNav />
            </NotificationProvider>
          </SecurityProvider>
        </AuthProvider>
      </NetworkProvider>
    </ThemeProvider>
  );
}
