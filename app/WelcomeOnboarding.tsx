import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Dimensions,
  Animated,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");
const CARD_HEIGHT = height * 0.7;

export default function WelcomeOnboarding() {
  const router = useRouter();
  const { colors } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Single scroll animation value
  const scrollX = useRef(new Animated.Value(0)).current;

  const onboardingData = [
    {
      id: "1",
      title: "Welcome to\nExpenzez",
      description:
        "Your intelligent financial companion for smarter money management",
      icon: "wallet-outline",
      gradient: ["#667eea", "#764ba2"],
      accentColor: "#667eea",
    },
    {
      id: "2",
      title: "Smart\nAnalytics",
      description: "AI-powered insights to understand your spending patterns",
      icon: "analytics-outline",
      gradient: ["#f093fb", "#f5576c"],
      accentColor: "#f5576c",
    },
    {
      id: "3",
      title: "Bank-Level\nSecurity",
      description:
        "Enterprise-grade encryption keeps your data safe and private",
      icon: "shield-checkmark-outline",
      gradient: ["#4facfe", "#00f2fe"],
      accentColor: "#4facfe",
    },
    {
      id: "4",
      title: "Stay in\nControl",
      description:
        "Real-time notifications and budget tracking at your fingertips",
      icon: "notifications-outline",
      gradient: ["#43e97b", "#38f9d7"],
      accentColor: "#43e97b",
    },
  ];

  const handleNext = async () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (currentIndex < onboardingData.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: (currentIndex + 1) * width,
        animated: true,
      });
    } else {
      // User completed onboarding - set the flag
      try {
        await AsyncStorage.setItem("onboarding_completed", "true");
        console.log("✅ [Onboarding] Onboarding completed flag set");
      } catch (error) {
        console.error(
          "❌ [Onboarding] Failed to set onboarding_completed flag:",
          error
        );
      }

      router.push("/auth/Login");
    }
  };

  const handleSkip = async () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // User skipped onboarding - set the flag so they don't see it again
    try {
      await AsyncStorage.setItem("onboarding_completed", "true");
      console.log("✅ [Onboarding] Onboarding skipped - flag set");
    } catch (error) {
      console.error(
        "❌ [Onboarding] Failed to set onboarding_completed flag:",
        error
      );
    }

    router.push("/auth/Login");
  };

  const scrollViewRef = useRef<Animated.ScrollView>(null);

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const onMomentumScrollEnd = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Background Gradient */}
      <LinearGradient
        colors={onboardingData[currentIndex].gradient}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Animated Scrollable Cards */}
        <Animated.ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          onMomentumScrollEnd={onMomentumScrollEnd}
          scrollEventThrottle={16}
          decelerationRate="fast"
          bounces={false}
        >
          {onboardingData.map((item, index) => {
            const inputRange = [
              (index - 1) * width,
              index * width,
              (index + 1) * width,
            ];

            const scale = scrollX.interpolate({
              inputRange,
              outputRange: [0.8, 1, 0.8],
              extrapolate: "clamp",
            });

            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: "clamp",
            });

            const translateY = scrollX.interpolate({
              inputRange,
              outputRange: [50, 0, 50],
              extrapolate: "clamp",
            });

            return (
              <Animated.View
                key={item.id}
                style={[
                  styles.cardContainer,
                  {
                    transform: [{ scale }, { translateY }],
                    opacity,
                  },
                ]}
              >
                {/* Glass Card */}
                <BlurView intensity={40} tint="light" style={styles.glassCard}>
                  {/* Icon Container */}
                  <View style={styles.iconContainer}>
                    <View
                      style={[
                        styles.iconCircle,
                        { backgroundColor: item.accentColor + "20" },
                      ]}
                    >
                      <Ionicons
                        name={item.icon as any}
                        size={80}
                        color="white"
                      />
                    </View>
                  </View>

                  {/* Content */}
                  <View style={styles.contentContainer}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.description}>{item.description}</Text>
                  </View>
                </BlurView>
              </Animated.View>
            );
          })}
        </Animated.ScrollView>

        {/* Bottom Section */}
        <View style={styles.bottomContainer}>
          {/* Page Indicators */}
          <View style={styles.pagination}>
            {onboardingData.map((_, index) => {
              const inputRange = [
                (index - 1) * width,
                index * width,
                (index + 1) * width,
              ];

              const dotWidth = scrollX.interpolate({
                inputRange,
                outputRange: [8, 24, 8],
                extrapolate: "clamp",
              });

              const opacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.3, 1, 0.3],
                extrapolate: "clamp",
              });

              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.dot,
                    {
                      width: dotWidth,
                      opacity,
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            {currentIndex < onboardingData.length - 1 && (
              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkip}
                activeOpacity={0.7}
              >
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.actionButton,
                currentIndex === onboardingData.length - 1 &&
                  styles.actionButtonFull,
              ]}
              onPress={handleNext}
              activeOpacity={0.9}
            >
              <BlurView intensity={30} tint="light" style={styles.buttonBlur}>
                <Text style={styles.buttonText}>
                  {currentIndex === onboardingData.length - 1
                    ? "Get Started"
                    : "Continue"}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </BlurView>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#667eea",
  },
  safeArea: {
    flex: 1,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  skipButton: {
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  skipText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 17,
    fontWeight: "600",
  },
  cardContainer: {
    width,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  glassCard: {
    width: "100%",
    height: CARD_HEIGHT,
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 10,
  },
  iconContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: "800",
    color: "white",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    lineHeight: 24,
    fontWeight: "400",
    maxWidth: "85%",
  },
  bottomContainer: {
    paddingHorizontal: 30,
    paddingBottom: Platform.OS === "ios" ? 40 : 30,
    gap: 24,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "white",
  },
  actionButton: {
    flex: 1,
    borderRadius: 25,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  actionButtonFull: {
    flex: 0,
    alignSelf: "stretch",
  },
  buttonBlur: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 32,
    gap: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
