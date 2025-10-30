import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Animated,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Typography from "./Typography";
import { useTheme } from "../../contexts/ThemeContext";
import { spacing } from "../../constants/theme";

interface LoadingScreenProps {
  message?: string;
  variant?: 'default' | 'login';
}

export default function LoadingScreen({ message = "Loading...", variant = 'default' }: LoadingScreenProps) {
  const { colors } = useTheme();

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const dotsAnim1 = useRef(new Animated.Value(0)).current;
  const dotsAnim2 = useRef(new Animated.Value(0)).current;
  const dotsAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation for logo
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    // Rotation animation
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );

    // Dots animation
    const dotsAnimation = Animated.loop(
      Animated.stagger(200, [
        Animated.sequence([
          Animated.timing(dotsAnim1, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dotsAnim1, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(dotsAnim2, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dotsAnim2, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(dotsAnim3, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dotsAnim3, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    pulseAnimation.start();
    rotateAnimation.start();
    dotsAnimation.start();

    return () => {
      pulseAnimation.stop();
      rotateAnimation.stop();
      dotsAnimation.stop();
    };
  }, []);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={variant === 'login' 
          ? ['#4F46E5', '#7C3AED', '#EC4899'] 
          : [colors.primary.main[400], colors.primary.main[600], colors.primary.main[800]]}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Background decoration */}
        <View style={styles.decoration}>
          <Animated.View
            style={[
              styles.decorCircle,
              styles.decorCircle1,
              {
                transform: [{ rotate: rotateInterpolate }, { scale: 0.5 }],
                opacity: 0.1,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.decorCircle,
              styles.decorCircle2,
              {
                transform: [
                  { rotate: rotateInterpolate },
                  { scale: 0.7 },
                  { translateX: 50 },
                ],
                opacity: 0.05,
              },
            ]}
          />
        </View>

        <View style={styles.content}>
          {/* Logo with animations */}
          <View style={styles.logoSection}>
            <Animated.View
              style={[
                styles.logoContainer,
                {
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
                style={styles.logoBackground}
              >
                <Ionicons 
                  name={variant === 'login' ? "shield-checkmark" : "wallet"} 
                  size={48} 
                  color={colors.primary.main} 
                />
              </LinearGradient>

              {/* Loading ring */}
              <Animated.View
                style={[
                  styles.loadingRing,
                  {
                    transform: [{ rotate: rotateInterpolate }],
                  },
                ]}
              >
                <View style={styles.ringSegment} />
                <View style={[styles.ringSegment, styles.ringSegment2]} />
                <View style={[styles.ringSegment, styles.ringSegment3]} />
                <View style={[styles.ringSegment, styles.ringSegment4]} />
              </Animated.View>
            </Animated.View>

            <View style={styles.textContainer}>
              <Typography
                variant="h2"
                weight="bold"
                style={styles.title}
                align="center"
              >
                {variant === 'login' ? 'Welcome to Expenzez' : 'Expenzez'}
              </Typography>

              <View style={styles.messageContainer}>
                <Typography
                  variant="body"
                  style={styles.message}
                  align="center"
                >
                  {message}
                </Typography>
                
                {variant === 'login' && (
                  <Typography
                    variant="body"
                    style={StyleSheet.flatten([styles.message, { fontSize: 14, marginTop: spacing.xs, opacity: 0.8 }])}
                    align="center"
                  >
                    Securing your connection...
                  </Typography>
                )}

                {/* Animated dots */}
                <View style={styles.dotsContainer}>
                  <Animated.View
                    style={[
                      styles.dot,
                      {
                        opacity: dotsAnim1,
                        transform: [{ scale: dotsAnim1 }],
                      },
                    ]}
                  />
                  <Animated.View
                    style={[
                      styles.dot,
                      {
                        opacity: dotsAnim2,
                        transform: [{ scale: dotsAnim2 }],
                      },
                    ]}
                  />
                  <Animated.View
                    style={[
                      styles.dot,
                      {
                        opacity: dotsAnim3,
                        transform: [{ scale: dotsAnim3 }],
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Progress indicator */}
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    transform: [{ scaleX: pulseAnim }],
                  },
                ]}
              />
            </View>
          </View>
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
  decoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  decorCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  decorCircle1: {
    top: '10%',
    right: '10%',
  },
  decorCircle2: {
    bottom: '20%',
    left: '5%',
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: spacing.lg,
  },
  logoBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    top: -10,
    left: -10,
  },
  ringSegment: {
    position: 'absolute',
    width: 4,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 2,
    top: 0,
    left: '50%',
    marginLeft: -2,
    transformOrigin: '50% 60px',
  },
  ringSegment2: {
    transform: [{ rotate: '90deg' }],
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  ringSegment3: {
    transform: [{ rotate: '180deg' }],
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  ringSegment4: {
    transform: [{ rotate: '270deg' }],
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    color: 'white',
    marginBottom: spacing.md,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  messageContainer: {
    alignItems: 'center',
  },
  message: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: spacing.sm,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  progressSection: {
    width: '80%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 2,
  },
});