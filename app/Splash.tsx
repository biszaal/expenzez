import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { 
  Text, 
  View, 
  StyleSheet, 
  Animated, 
  StatusBar 
} from "react-native";
import { useAuth } from "./auth/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { spacing, shadows } from "../constants/theme";


export default function Splash() {
  const router = useRouter();
  const { isLoggedIn, loading } = useAuth();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const logoRotation = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const taglineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animations
    Animated.sequence([
      // First: Logo appears and scales up
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      // Then: App name slides up
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      // Finally: Tagline fades in
      Animated.timing(taglineAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Logo rotation animation
    Animated.loop(
      Animated.timing(logoRotation, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      })
    ).start();
  }, [fadeAnim, scaleAnim, slideUpAnim, taglineAnim, logoRotation]);

  useEffect(() => {
    if (!loading) {
      const timeout = setTimeout(() => {
        if (isLoggedIn) {
          router.replace("/(tabs)");
        } else {
          router.replace("/auth/Login");
        }
      }, 2500); // Increased timeout to let animations complete
      return () => clearTimeout(timeout);
    }
  }, [isLoggedIn, loading, router]);

  const logoRotationInterpolate = logoRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

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
          <Animated.View
            style={[
              styles.floatingElement,
              styles.element3,
              {
                transform: [
                  { rotate: logoRotationInterpolate },
                  { scale: scaleAnim },
                ],
              },
            ]}
          />
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Enhanced Logo Section */}
          <Animated.View
            style={[
              styles.logoSection,
              {
                opacity: fadeAnim,
                transform: [
                  { scale: scaleAnim },
                  { rotate: logoRotationInterpolate },
                ],
              },
            ]}
          >
            <BlurView intensity={20} tint="light" style={styles.logoContainer}>
              <LinearGradient
                colors={['#4facfe', '#00f2fe']}
                style={styles.logoGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="wallet" size={60} color="white" />
              </LinearGradient>
            </BlurView>
          </Animated.View>

          {/* App Name */}
          <Animated.View
            style={[
              styles.textSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideUpAnim }],
              },
            ]}
          >
            <Text style={styles.appName}>Expenzez</Text>
            <Animated.View
              style={[
                styles.taglineContainer,
                {
                  opacity: taglineAnim,
                },
              ]}
            >
              <Text style={styles.tagline}>Connect. Track. Prosper.</Text>
              <View style={styles.loadingDots}>
                <Animated.View style={[styles.dot, styles.dot1]} />
                <Animated.View style={[styles.dot, styles.dot2]} />
                <Animated.View style={[styles.dot, styles.dot3]} />
              </View>
            </Animated.View>
          </Animated.View>

          {/* Feature highlights for new users */}
          <Animated.View
            style={[
              styles.featureHighlights,
              {
                opacity: taglineAnim,
              },
            ]}
          >
            <BlurView intensity={15} tint="light" style={styles.featureCard}>
              <View style={styles.featureRow}>
                <View style={styles.featureItem}>
                  <Ionicons name="bank" size={20} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.featureText}>Banking</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="analytics" size={20} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.featureText}>Analytics</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="brain" size={20} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.featureText}>AI Insights</Text>
                </View>
              </View>
            </BlurView>
          </Animated.View>
        </View>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    width: 100,
    height: 100,
    backgroundColor: 'white',
    top: '20%',
    right: '15%',
  },
  element2: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.5)',
    top: '70%',
    left: '10%',
  },
  element3: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    bottom: '25%',
    right: '25%',
  },

  // Main content
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },

  // Logo section
  logoSection: {
    marginBottom: spacing.xl * 2,
  },
  logoContainer: {
    borderRadius: 30,
    overflow: 'hidden',
    ...shadows.xl,
  },
  logoGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.xl,
  },

  // Text section
  textSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  appName: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 2,
    marginBottom: spacing.lg,
  },
  taglineContainer: {
    alignItems: 'center',
  },
  tagline: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: spacing.lg,
    letterSpacing: 1,
    fontWeight: '500',
  },

  // Loading animation
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  dot1: {
    backgroundColor: '#4facfe',
  },
  dot2: {
    backgroundColor: '#00f2fe',
  },
  dot3: {
    backgroundColor: 'rgba(255,255,255,0.8)',
  },

  // Feature highlights
  featureHighlights: {
    position: 'absolute',
    bottom: spacing.xl * 3,
    width: '100%',
  },
  featureCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  featureItem: {
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
