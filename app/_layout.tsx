import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import { SecurityProvider, useSecurity } from "../contexts/SecurityContext";
import SecurityLock from "../components/SecurityLock";

function RootLayoutNav() {
  const { isLoggedIn, loading } = useAuth();
  const { isLocked, unlockApp } = useSecurity();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wait for auth state to be loaded
    if (!loading) {
      setIsLoading(false);
    }
  }, [loading]);

  if (isLoading || loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  // Show security lock if app is locked
  if (isLoggedIn && isLocked) {
    return <SecurityLock isVisible={true} onUnlock={unlockApp} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {!isLoggedIn ? (
        <>
          <Stack.Screen name="auth/Login" />
          <Stack.Screen name="auth/Register" />
        </>
      ) : (
        <>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="profile/personal" />
          <Stack.Screen name="security" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="payment" />
          <Stack.Screen name="help" />
          <Stack.Screen name="terms" />
          <Stack.Screen name="banks" />
          <Stack.Screen name="banks/connect" />
          <Stack.Screen name="banks/select" />
          <Stack.Screen name="credit-score" />
          <Stack.Screen name="target" />
          <Stack.Screen name="transactions" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="CompleteProfile" />
          <Stack.Screen name="test-api" />
        </>
      )}
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SecurityProvider>
          <RootLayoutNav />
        </SecurityProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
