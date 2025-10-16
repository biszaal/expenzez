import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Typography } from "../../components/ui";
import { useTheme } from "../../contexts/ThemeContext";
import { spacing, borderRadius } from "../../constants/theme";

const { width, height } = Dimensions.get("window");

interface OnboardingStepProps {
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  illustration: string;
  color: string;
  isActive: boolean;
  onNext: () => void;
  onSkip: () => void;
  isLast: boolean;
}

const OnboardingStep: React.FC<OnboardingStepProps> = ({
  icon,
  title,
  subtitle,
  description,
  illustration,
  color,
  isActive,
  onNext,
  onSkip,
  isLast,
}) => {
  const { colors } = useTheme();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    if (isActive) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isActive, fadeAnim, slideAnim]);

  return (
    <Animated.View
      style={[
        styles.stepContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* Illustration */}
      <View style={styles.illustrationContainer}>
        <View
          style={[styles.illustrationBackground, { backgroundColor: color }]}
        >
          <Ionicons name={illustration as any} size={120} color="white" />
        </View>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon as any} size={32} color={color} />
        </View>

        <Typography
          variant="h1"
          style={[styles.title, { color: colors.text.primary }]}
          weight="bold"
        >
          {title}
        </Typography>

        <Typography
          variant="h3"
          style={[styles.subtitle, { color: colors.text.secondary }]}
          weight="medium"
        >
          {subtitle}
        </Typography>

        <Typography
          variant="body"
          style={[styles.description, { color: colors.text.secondary }]}
        >
          {description}
        </Typography>
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: color }]}
          onPress={onNext}
        >
          <Typography
            variant="body"
            style={styles.buttonText}
            weight="semibold"
          >
            {isLast ? "Get Started" : "Next"}
          </Typography>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>

        {!isLast && (
          <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
            <Typography
              variant="body"
              style={[styles.skipText, { color: colors.text.secondary }]}
            >
              Skip
            </Typography>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const steps = [
    {
      icon: "wallet-outline",
      title: "Welcome to Expenzez",
      subtitle: "Your Personal Finance Assistant",
      description:
        "Take control of your finances with intelligent expense tracking, budgeting tools, and financial insights designed to help you achieve your money goals.",
      illustration: "wallet",
      color: colors.primary[500],
    },
    {
      icon: "analytics-outline",
      title: "Smart Analytics",
      subtitle: "Understand Your Spending",
      description:
        "Get detailed insights into your spending patterns with AI-powered categorization, trend analysis, and personalized recommendations to optimize your finances.",
      illustration: "trending-up",
      color: colors.success[500],
    },
    {
      icon: "shield-checkmark-outline",
      title: "Bank-Level Security",
      subtitle: "Your Data is Protected",
      description:
        "Rest assured with enterprise-grade security, end-to-end encryption, and biometric authentication. Your financial data is safe and private.",
      illustration: "shield-checkmark",
      color: colors.warning[500],
    },
    {
      icon: "notifications-outline",
      title: "Smart Notifications",
      subtitle: "Stay on Track",
      description:
        "Receive intelligent alerts for unusual spending, budget limits, bill reminders, and financial opportunities to help you make better money decisions.",
      illustration: "notifications",
      color: colors.info[500],
    },
    {
      icon: "rocket-outline",
      title: "Ready to Begin?",
      subtitle: "Start Your Financial Journey",
      description:
        "Join thousands of users who have transformed their financial lives with Expenzez. Let's build better money habits together.",
      illustration: "rocket",
      color: colors.primary[600],
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      scrollViewRef.current?.scrollTo({
        x: nextStep * width,
        animated: true,
      });
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = () => {
    handleGetStarted();
  };

  const handleGetStarted = () => {
    router.replace("/auth/Login");
  };

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const step = Math.round(contentOffsetX / width);
    if (step !== currentStep && step >= 0 && step < steps.length) {
      setCurrentStep(step);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.primary[500]}
      />

      <LinearGradient
        colors={[colors.primary[500], colors.primary[600], colors.primary[700]]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          {steps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                {
                  backgroundColor:
                    index === currentStep ? "white" : "rgba(255,255,255,0.3)",
                  width: index === currentStep ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        {/* Steps Container */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.scrollView}
        >
          {steps.map((step, index) => (
            <OnboardingStep
              key={index}
              icon={step.icon}
              title={step.title}
              subtitle={step.subtitle}
              description={step.description}
              illustration={step.illustration}
              color={step.color}
              isActive={index === currentStep}
              onNext={handleNext}
              onSkip={handleSkip}
              isLast={index === steps.length - 1}
            />
          ))}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  progressDot: {
    height: 8,
    borderRadius: 4,
  },
  scrollView: {
    flex: 1,
  },
  stepContainer: {
    width,
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  illustrationBackground: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  contentContainer: {
    alignItems: "center",
    paddingVertical: spacing.lg,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: spacing.md,
    opacity: 0.9,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    maxWidth: "90%",
  },
  actionsContainer: {
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.xl,
    gap: spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
  },
  skipButton: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  skipText: {
    fontSize: 14,
    opacity: 0.8,
  },
});
