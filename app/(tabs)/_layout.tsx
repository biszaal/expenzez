import { Tabs, Redirect } from "expo-router";
import React from "react";
import { useAuth } from "../auth/AuthContext";
import { LoadingScreen } from "../../components/ui";
import { FloatingTabBar } from "../../components/navigation/FloatingTabBar";

export default function TabLayout() {
  const { isLoggedIn, loading } = useAuth();

  // Show loading screen while checking authentication
  if (loading) {
    return <LoadingScreen message="Setting up your dashboard..." />;
  }

  // Redirect to login if not authenticated
  if (!isLoggedIn) {
    return <Redirect href="/auth/login" />;
  }

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="spending" options={{ title: "Spending" }} />
      <Tabs.Screen name="progress" options={{ title: "Goals" }} />
      <Tabs.Screen name="account" options={{ title: "Account" }} />
      {/* Health screen kept routable but hidden from the floating bar.
          The bar only renders the four tabs above; deep-link or button
          navigation can still reach /health. */}
      <Tabs.Screen
        name="health"
        options={{ title: "Health", href: null }}
      />
    </Tabs>
  );
}
