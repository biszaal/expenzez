// Professional onboarding screen for new users
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { Typography } from "../components/ui";
import { spacing, shadows } from "../constants/theme";

const { width: screenWidth } = Dimensions.get('window');

interface OnboardingStep {
  id: number;
  icon: string;
  title: string;
  description: string;
  color: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 1,
    icon: "bank",
    title: "Connect Your Banks",
    description: "Securely link your UK bank accounts with industry-leading encryption and OAuth2 authentication.",
    color: "#4facfe",
  },
  {
    id: 2,
    icon: "analytics",
    title: "Track Your Spending",
    description: "Get real-time insights into your spending patterns with automatic transaction categorization.",
    color: "#667eea",
  },
  {
    id: 3,
    icon: "brain",
    title: "AI-Powered Insights",
    description: "Receive personalized financial advice and spending recommendations from our intelligent assistant.",
    color: "#764ba2",
  },
  {
    id: 4,
    icon: "card",
    title: "Monitor Credit Score",
    description: "Keep track of your credit score changes and get tips to improve your financial health.",
    color: "#f093fb",
  },
];

export default function Onboarding() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const logoRotation = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Logo rotation animation
    Animated.loop(
      Animated.timing(logoRotation, {
        toValue: 1,
        duration: 15000,
        useNativeDriver: true,
      })
    ).start();

    // Progress animation
    Animated.timing(progressAnim, {
      toValue: (currentStep + 1) / onboardingSteps.length,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentStep, fadeAnim, slideAnim, scaleAnim, logoRotation, progressAnim]);

  const logoRotationInterpolate = logoRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleGetStarted();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGetStarted = () => {
    router.replace("/(tabs)");
  };

  const handleSkip = () => {
    router.replace("/(tabs)");
  };

  const currentStepData = onboardingSteps[currentStep];

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Animated background elements */}
        <View style={styles.backgroundElements}>
          <Animated.View
            style={[
              styles.floatingElement,
              styles.element1,
              {
                transform: [
                  { rotate: logoRotationInterpolate },
                  { scale: scaleAnim },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.floatingElement,
              styles.element2,
              {
                transform: [
                  { rotate: logoRotationInterpolate },
                  { scale: scaleAnim },
                ],
              },
            ]}
          />
        </View>

        <SafeAreaView style={styles.safeArea}>
          {/* Header with Skip Button */}
          <Animated.View
            style={[
              styles.header,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Typography variant="body" style={{ color: 'rgba(255,255,255,0.8)' }}>
                Skip
              </Typography>
            </TouchableOpacity>
          </Animated.View>

          {/* Progress Indicator */}
          <Animated.View
            style={[
              styles.progressContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, screenWidth - 64],
                    }),
                  },
                ]}
              />
            </View>
            <Typography variant="caption" style={styles.progressText}>
              {currentStep + 1} of {onboardingSteps.length}
            </Typography>
          </Animated.View>

          {/* Main Content */}
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Feature Icon */}
            <Animated.View
              style={[
                styles.iconContainer,
                {
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <BlurView intensity={20} tint="light" style={styles.iconBlur}>
                <LinearGradient
                  colors={[currentStepData.color, '#4facfe']}
                  style={styles.iconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name={currentStepData.icon as any} size={60} color="white" />
                </LinearGradient>
              </BlurView>
            </Animated.View>

            {/* Text Content */}
            <BlurView intensity={15} tint="light" style={styles.textContainer}>
              <View style={styles.textContent}>
                <Typography
                  variant="h1"
                  style={styles.title}
                  align="center"
                >
                  {currentStepData.title}
                </Typography>
                <Typography
                  variant="body"
                  style={styles.description}
                  align="center"
                >
                  {currentStepData.description}
                </Typography>
              </View>
            </BlurView>
          </Animated.View>

          {/* Navigation Buttons */}
          <Animated.View
            style={[
              styles.navigation,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.navigationContent}>
              {/* Previous Button */}
              <TouchableOpacity
                onPress={handlePrevious}
                style={[
                  styles.navButton,
                  styles.previousButton,
                  { opacity: currentStep === 0 ? 0.3 : 1 },
                ]}
                disabled={currentStep === 0}
              >
                <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>

              {/* Step Indicators */}
              <View style={styles.stepIndicators}>
                {onboardingSteps.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.stepDot,
                      {
                        backgroundColor: index === currentStep 
                          ? 'white' 
                          : 'rgba(255,255,255,0.3)',
                        transform: [{ scale: index === currentStep ? 1.2 : 1 }],
                      },
                    ]}
                  />
                ))}
              </View>

              {/* Next/Get Started Button */}
              <TouchableOpacity
                onPress={handleNext}
                style={[styles.navButton, styles.nextButton]}
              >
                <LinearGradient
                  colors={['#4facfe', '#00f2fe']}
                  style={styles.nextButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {currentStep === onboardingSteps.length - 1 ? (
                    <Typography variant="body" weight="bold" style={{ color: 'white' }}>
                      Get Started
                    </Typography>
                  ) : (
                    <Ionicons name="chevron-forward" size={20} color="white" />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },

  // Background animations
  backgroundElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatingElement: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.1,
  },
  element1: {
    width: 120,
    height: 120,
    backgroundColor: 'white',
    top: '10%',
    right: '10%',
  },
  element2: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.5)',
    bottom: '15%',
    left: '5%',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  skipButton: {
    padding: spacing.sm,
  },

  // Progress
  progressContainer: {
    paddingHorizontal: spacing.lg * 2,
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  progressBar: {
    height: 4,
    width: screenWidth - 64,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 2,
  },
  progressText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },

  // Content
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },

  // Icon
  iconContainer: {
    marginBottom: spacing.xl * 2,
  },
  iconBlur: {
    borderRadius: 40,
    overflow: 'hidden',
  },
  iconGradient: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.xl,
  },

  // Text
  textContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 350,
  },
  textContent: {
    padding: spacing.xl,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: spacing.lg,
    color: '#1f2937',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#6b7280',
  },

  // Navigation
  navigation: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  navigationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previousButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  nextButton: {
    overflow: 'hidden',
  },
  nextButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    ...shadows.md,
  },

  // Step indicators
  stepIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});