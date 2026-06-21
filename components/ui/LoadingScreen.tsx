import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Typography from "./Typography";
import { useTheme } from "../../contexts/ThemeContext";
import { spacing } from "../../constants/theme";

interface LoadingScreenProps {
  message?: string;
  variant?: "default" | "login";
}

/**
 * LoadingScreen — the brief full-screen loader shown while the app resolves auth
 * before the tabs mount. Restyled to match the rest of the app: the light (or
 * dark) theme surface, the brand-blue app tile and Geist type — instead of the
 * old full-bleed blue gradient, which felt like a different product.
 */
export default function LoadingScreen({
  message = "Loading...",
  variant = "default",
}: LoadingScreenProps) {
  const { colors, isDark } = useTheme();
  const accent = colors.primary.main;

  // Gentle logo breathe + a staggered three-dot pulse. Native-driven so it stays
  // smooth even while the JS thread is busy doing the auth/data work behind it.
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );

    const mkDot = (v: Animated.Value) =>
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 380, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0.3, duration: 380, useNativeDriver: true }),
      ]);

    const dots = Animated.loop(
      Animated.stagger(160, [mkDot(dot1), mkDot(dot2), mkDot(dot3)])
    );

    pulse.start();
    dots.start();
    return () => {
      pulse.stop();
      dots.stop();
    };
  }, []);

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background.primary }]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />

      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <View
          style={[styles.logoTile, { backgroundColor: accent, shadowColor: accent }]}
        >
          <Ionicons
            name={variant === "login" ? "shield-checkmark" : "wallet"}
            size={42}
            color="#FFFFFF"
          />
        </View>
      </Animated.View>

      <Typography
        variant="h2"
        weight="bold"
        align="center"
        style={StyleSheet.flatten([styles.title, { color: colors.text.primary }])}
      >
        {variant === "login" ? "Welcome to Expenzez" : "Expenzez"}
      </Typography>

      <Typography
        variant="body"
        align="center"
        style={StyleSheet.flatten([styles.message, { color: colors.text.secondary }])}
      >
        {message}
      </Typography>

      <View style={styles.dotsContainer}>
        {[dot1, dot2, dot3].map((a, i) => (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: accent, opacity: a, transform: [{ scale: a }] },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  logoTile: {
    width: 88,
    height: 88,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 8,
  },
  title: {
    fontSize: 26,
    marginTop: spacing.xl,
  },
  message: {
    fontSize: 15,
    marginTop: spacing.xs,
  },
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.lg,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
});
