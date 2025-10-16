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
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
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
          {/* Logo with Curved Edges */}
          <View style={styles.logoContainer}>
            <Image
              source={require("../assets/images/icon.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
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
    paddingHorizontal: 20,
  },
  logoContainer: {
    marginBottom: 40,
  },
  glassBackground: {
    width: 200,
    height: 200,
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  glassInner: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoImage: {
    width: 120,
    height: 120,
    opacity: 1,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  appName: {
    fontSize: 36,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 12,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 18,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
