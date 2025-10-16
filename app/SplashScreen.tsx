import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
  SafeAreaView,
  Dimensions,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../contexts/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const { width, height } = Dimensions.get("window");

export default function SplashScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Simple fade in animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Check login status and onboarding status, then navigate accordingly
    const checkAndNavigate = async () => {
      try {
        // Check if user is logged in
        const storedLogin = await AsyncStorage.getItem("isLoggedIn");
        const accessToken = await SecureStore.getItemAsync("accessToken", {
          keychainService: "expenzez-tokens",
        });
        const isLoggedIn =
          storedLogin === "true" && accessToken && accessToken !== "null";

        if (isLoggedIn) {
          // 🟢 LOGGED IN USER → Go to main app
          console.log("🎯 [SplashScreen] LOGGED_IN_USER → Main App");
          router.replace("/(tabs)");
          return;
        }

        // User is not logged in, check onboarding status
        const onboardingCompleted = await AsyncStorage.getItem(
          "onboarding_completed"
        );
        const hasCompletedOnboarding = onboardingCompleted === "true";

        if (hasCompletedOnboarding) {
          // 🟡 RETURNING USER → Go to login
          console.log("🎯 [SplashScreen] RETURNING_USER → Login");
          router.replace("/auth/Login");
        } else {
          // 🔴 NEW USER → Show onboarding
          console.log("🎯 [SplashScreen] NEW_USER → Onboarding");
          router.replace("/WelcomeOnboarding");
        }
      } catch (error) {
        console.error("❌ [SplashScreen] Error checking status:", error);
        // Default to onboarding for new users if there's an error
        console.log("🎯 [SplashScreen] ERROR_FALLBACK → Onboarding");
        router.replace("/WelcomeOnboarding");
      }
    };

    // Auto navigate after 2 seconds
    const timer = setTimeout(checkAndNavigate, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.primary[500] }]}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.primary[500]}
      />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoBackground}>
            <Image
              source={require("../assets/images/transparent-logo.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* App Name */}
        <Text style={styles.appName}>Expenzez</Text>
        <Text style={styles.tagline}>Personal Finance Assistant</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    marginBottom: 30,
  },
  logoBackground: {
    width: 180,
    height: 180,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  logoImage: {
    width: 120,
    height: 120,
    opacity: 1,
  },
  appName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
});
