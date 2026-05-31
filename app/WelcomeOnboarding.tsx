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
  Image,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");
// Leaves room for the top bar (back/close) and the bottom CTA block.
const CARD_HEIGHT = height * 0.64;

export default function WelcomeOnboarding() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Single scroll animation value
  const scrollX = useRef(new Animated.Value(0)).current;

  // Each slide ships a light + dark illustration; we pick by theme at render.
  const onboardingData = [
    {
      id: "1",
      title: "Welcome to Expenzez",
      description:
        "Your intelligent money companion — clarity over your spending, all in one place.",
      light: require("../assets/images/onboarding/light/welcome-light.png"),
      dark: require("../assets/images/onboarding/dark/welcome-dark.png"),
    },
    {
      id: "2",
      title: "See your whole journey",
      description:
        "Bring every account and statement together and watch your money story take shape.",
      light: require("../assets/images/onboarding/light/journey-light.png"),
      dark: require("../assets/images/onboarding/dark/journey-dark.png"),
    },
    {
      id: "3",
      title: "Smart analytics",
      description:
        "AI-powered insights that reveal your spending patterns at a glance.",
      light: require("../assets/images/onboarding/light/analytics-light.png"),
      dark: require("../assets/images/onboarding/dark/analytics-dark.png"),
    },
    {
      id: "4",
      title: "Private by design",
      description:
        "Bank-level encryption keeps your data safe — no bank login ever required.",
      light: require("../assets/images/onboarding/light/security-light.png"),
      dark: require("../assets/images/onboarding/dark/security-dark.png"),
    },
    {
      id: "5",
      title: "Stay in control",
      description:
        "Budgets and timely notifications keep you on track, right at your fingertips.",
      light: require("../assets/images/onboarding/light/notifications-light.png"),
      dark: require("../assets/images/onboarding/dark/notifications-dark.png"),
    },
  ];

  const accent = colors.primary.main;

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

      router.push("/auth/login");
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

    router.push("/auth/login");
  };

  const scrollViewRef = useRef<ScrollView>(null);

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const onMomentumScrollEnd = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  const handleBack = () => {
    if (currentIndex === 0) return;
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    scrollViewRef.current?.scrollTo({
      x: (currentIndex - 1) * width,
      animated: true,
    });
  };

  const isLast = currentIndex === onboardingData.length - 1;

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <SafeAreaView style={styles.safeArea}>
        {/* Top bar — back (left) + close (right) */}
        <View style={styles.topBar}>
          {currentIndex > 0 ? (
            <TouchableOpacity
              onPress={handleBack}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={[
                styles.navBtn,
                {
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.medium,
                },
              ]}
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={22} color={colors.text.primary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.navSpacer} />
          )}

          <TouchableOpacity
            onPress={handleSkip}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[
              styles.navBtn,
              {
                backgroundColor: colors.background.secondary,
                borderColor: colors.border.medium,
              },
            ]}
            accessibilityLabel="Skip onboarding"
          >
            <Ionicons name="close" size={22} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

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
                    opacity,
                  },
                ]}
              >
                {/* Simple Card — transparent so the illustration floats on the themed bg */}
                <View style={styles.card}>
                  {/* Illustration Container */}
                  <View style={styles.illustrationContainer}>
                    <Image
                      source={isDark ? item.dark : item.light}
                      style={styles.illustration}
                      resizeMode="contain"
                    />
                  </View>

                  {/* Content */}
                  <View style={styles.contentContainer}>
                    <Text style={[styles.title, { color: colors.text.primary }]}>
                      {item.title}
                    </Text>
                    <Text
                      style={[styles.description, { color: colors.text.secondary }]}
                    >
                      {item.description}
                    </Text>
                  </View>
                </View>
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
                      backgroundColor: accent,
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* Primary CTA — full width */}
          <TouchableOpacity
            style={[styles.actionButton, { shadowColor: accent }]}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <View style={[styles.buttonContent, { backgroundColor: accent }]}>
              <Text style={styles.buttonText}>
                {isLast ? "Get Started" : "Continue"}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    height: 56,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  navSpacer: {
    width: 40,
    height: 40,
  },
  cardContainer: {
    width,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  card: {
    width: "100%",
    height: CARD_HEIGHT,
    borderRadius: 20,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
  },
  illustration: {
    width: 300,
    height: 300,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 15,
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
  },
  actionButton: {
    borderRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 20,
    elevation: 8,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    borderRadius: 16,
    gap: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
