import { Ionicons } from "@expo/vector-icons";
import { Tabs, Redirect } from "expo-router";
import React from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../auth/AuthContext";
import { LoadingScreen } from "../../components/ui";

export default function TabLayout() {
  const { colors } = useTheme();
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
      screenOptions={{
        tabBarActiveTintColor: colors.primary.main,
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarStyle: {
          backgroundColor: colors.background.primary,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: 88,
          paddingBottom: 20,
          paddingTop: 12,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="spending"
        options={{
          title: "Spending",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pie-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="health"
        options={{
          title: "Health",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progress",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trophy-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
