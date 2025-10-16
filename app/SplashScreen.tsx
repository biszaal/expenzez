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
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

const { width, height } = Dimensions.get("window");

export default function SplashScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const dot1Anim = useRef(new Animated.Value(0.3)).current;
  const dot2Anim = useRef(new Animated.Value(0.3)).current;
  const dot3Anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Fade in animation
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

    // Loading dots animation
    const createDotAnimation = (dotAnim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dotAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dotAnim, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const dot1Animation = createDotAnimation(dot1Anim, 0);
    const dot2Animation = createDotAnimation(dot2Anim, 200);
    const dot3Animation = createDotAnimation(dot3Anim, 400);

    Animated.parallel([dot1Animation, dot2Animation, dot3Animation]).start();

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
    <LinearGradient
      colors={["#667eea", "#764ba2"]}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />

      <SafeAreaView style={styles.safeArea}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Glass Card */}
          <BlurView intensity={40} tint="light" style={styles.glassCard}>
            {/* Logo Container */}
            <View style={styles.logoContainer}>
              <View style={styles.logoBackground}>
                <Image
                  source={require("../assets/images/icon.png")}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* App Name */}
            <Text style={styles.appName}>Welcome to Expenzez</Text>
            <Text style={styles.tagline}>Your intelligent financial companion for smarter money management</Text>
            
            {/* Loading Indicator */}
            <View style={styles.loadingContainer}>
              <View style={styles.loadingDots}>
                <Animated.View 
                  style={[
                    styles.dot, 
                    { 
                      opacity: dot1Anim,
                      transform: [{ scale: dot1Anim }]
                    }
                  ]} 
                />
                <Animated.View 
                  style={[
                    styles.dot, 
                    { 
                      opacity: dot2Anim,
                      transform: [{ scale: dot2Anim }]
                    }
                  ]} 
                />
                <Animated.View 
                  style={[
                    styles.dot, 
                    { 
                      opacity: dot3Anim,
                      transform: [{ scale: dot3Anim }]
                    }
                  ]} 
                />
              </View>
            </View>
          </BlurView>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  glassCard: {
    width: "90%",
    maxWidth: 400,
    borderRadius: 24,
    padding: 40,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  logoContainer: {
    marginBottom: 30,
  },
  logoBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.5)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  logoImage: {
    width: 60,
    height: 60,
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 36,
  },
  tagline: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
  },
  loadingContainer: {
    marginTop: 20,
  },
  loadingDots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.6)",
    marginHorizontal: 4,
  },
  dot1: {
    // Will be animated
  },
  dot2: {
    // Will be animated
  },
  dot3: {
    // Will be animated
  },
});
