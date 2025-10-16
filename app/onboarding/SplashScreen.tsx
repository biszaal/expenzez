import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, borderRadius } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  delay: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, delay }) => {
  const { colors } = useTheme();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    const timer = setTimeout(() => {
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
    }, delay);

    return () => clearTimeout(timer);
  }, [fadeAnim, slideAnim, delay]);

  return (
    <Animated.View
      style={[
        styles.featureCard,
        {
          backgroundColor: colors.background.secondary,
          borderColor: colors.border.light,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: colors.primary[100] },
        ]}
      >
        <Ionicons name={icon as any} size={24} color={colors.primary[500]} />
      </View>
      <Typography
        variant="h3"
        style={[styles.featureTitle, { color: colors.text.primary }]}
        weight="semibold"
      >
        {title}
      </Typography>
      <Typography
        variant="body"
        style={[styles.featureDescription, { color: colors.text.secondary }]}
      >
        {description}
      </Typography>
    </Animated.View>
  );
};

export default function SplashScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  const features = [
    {
      icon: 'wallet-outline',
      title: 'Smart Expense Tracking',
      description: 'Automatically categorize and track your spending with AI-powered insights.',
    },
    {
      icon: 'trending-up-outline',
      title: 'Financial Analytics',
      description: 'Get detailed reports and trends to understand your spending patterns.',
    },
    {
      icon: 'shield-checkmark-outline',
      title: 'Secure & Private',
      description: 'Bank-level security with end-to-end encryption for your financial data.',
    },
    {
      icon: 'notifications-outline',
      title: 'Smart Alerts',
      description: 'Stay on top of your budget with intelligent spending notifications.',
    },
  ];

  useEffect(() => {
    // Initial animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-advance through features
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % features.length);
    }, 3000);

    // Navigate to login after showing all features
    const timer = setTimeout(() => {
      router.replace('/auth/Login');
    }, 15000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [router, fadeAnim, scaleAnim, features.length]);

  const handleGetStarted = () => {
    router.replace('/auth/Login');
  };

  const handleSkip = () => {
    router.replace('/auth/Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary[500]} />
      
      <LinearGradient
        colors={[colors.primary[500], colors.primary[600], colors.primary[700]]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.logoContainer}>
            <Ionicons name="wallet" size={48} color="white" />
          </View>
          <Typography
            variant="h1"
            style={styles.appTitle}
            weight="bold"
          >
            Expenzez
          </Typography>
          <Typography
            variant="h3"
            style={styles.appSubtitle}
            weight="medium"
          >
            Your Personal Finance Assistant
          </Typography>
        </Animated.View>

        {/* Features Section */}
        <View style={styles.featuresContainer}>
          <Typography
            variant="h2"
            style={styles.featuresTitle}
            weight="semibold"
          >
            Why Choose Expenzez?
          </Typography>

          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={index * 200}
              />
            ))}
          </View>
        </View>

        {/* Progress Indicators */}
        <View style={styles.progressContainer}>
          {features.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                {
                  backgroundColor: index === currentStep ? 'white' : 'rgba(255,255,255,0.3)',
                },
              ]}
            />
          ))}
        </View>

        {/* Action Buttons */}
        <Animated.View
          style={[
            styles.actionsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: scaleAnim }],
            },
          ]}
        >
          <View style={styles.buttonContainer}>
            <View
              style={[styles.primaryButton, { backgroundColor: 'white' }]}
              onTouchEnd={handleGetStarted}
            >
              <Typography
                variant="body"
                style={[styles.buttonText, { color: colors.primary[500] }]}
                weight="semibold"
              >
                Get Started
              </Typography>
            </View>
          </View>

          <View
            style={styles.skipButton}
            onTouchEnd={handleSkip}
          >
            <Typography
              variant="body"
              style={styles.skipText}
            >
              Skip Introduction
            </Typography>
          </View>
        </Animated.View>
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
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  appTitle: {
    fontSize: 36,
    color: 'white',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  appSubtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  featuresTitle: {
    fontSize: 24,
    color: 'white',
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  featuresGrid: {
    gap: spacing.md,
  },
  featureCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  featureTitle: {
    fontSize: 18,
    marginBottom: spacing.sm,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: spacing.lg,
    gap: spacing.sm,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  actionsContainer: {
    paddingBottom: spacing.lg,
  },
  buttonContainer: {
    marginBottom: spacing.md,
  },
  primaryButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    fontSize: 16,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  skipText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
});
