import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, StatusBar } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import { useTheme } from "../contexts/ThemeContext";
import { fontFamily } from "../constants/theme";

// v1.5 redesign — branded launch screen with primary radial glow,
// gradient brand mark, and animated dots.
export default function SplashScreen() {
  const { colors, isDark } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const dotAnims = useRef([
    new Animated.Value(0.3),
    new Animated.Value(0.3),
    new Animated.Value(0.3),
  ]).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    const loops = dotAnims.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 180),
          Animated.timing(dot, {
            toValue: 1,
            duration: 560,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 560,
            useNativeDriver: true,
          }),
        ])
      )
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, []);

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background.primary }]}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Ambient primary glow */}
      <LinearGradient
        colors={
          isDark
            ? ["rgba(157,91,255,0.45)", "rgba(157,91,255,0)"]
            : ["rgba(123,63,228,0.20)", "rgba(123,63,228,0)"]
        }
        style={[StyleSheet.absoluteFillObject]}
        start={{ x: 0.5, y: 0.3 }}
        end={{ x: 0.5, y: 0.85 }}
        pointerEvents="none"
      />

      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <LinearGradient
          colors={[colors.primary[500], colors.primary[600]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.brandMark,
            {
              shadowColor: colors.primary[500],
            },
          ]}
        >
          <Svg width={56} height={56} viewBox="0 0 32 32">
            <Path
              d="M5 24 L13 14 L18 18 L27 8"
              stroke="#fff"
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M22 8 L27 8 L27 13"
              stroke="#fff"
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </LinearGradient>

        <Text
          style={[
            styles.appName,
            { color: colors.text.primary, fontFamily: fontFamily.semibold },
          ]}
        >
          expenzez
          <Text style={{ color: colors.lime[500] }}>.</Text>
        </Text>
        <Text
          style={[
            styles.tagline,
            { color: colors.text.secondary, fontFamily: fontFamily.semibold },
          ]}
        >
          SMART · MONEY · DAILY
        </Text>
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {dotAnims.map((dot, i) => (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: colors.text.primary,
                  opacity: dot,
                  transform: [
                    {
                      scale: dot.interpolate({
                        inputRange: [0.3, 1],
                        outputRange: [1, 1.3],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
        </View>
        <Text
          style={[
            styles.versionText,
            { color: colors.text.tertiary, fontFamily: fontFamily.medium },
          ]}
        >
          v1.5 · Made in London
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 22,
    paddingHorizontal: 22,
  },
  brandMark: {
    width: 104,
    height: 104,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.5,
    shadowRadius: 48,
    elevation: 18,
  },
  appName: {
    fontSize: 32,
    letterSpacing: -0.8,
    textAlign: "center",
  },
  tagline: {
    fontSize: 12.5,
    letterSpacing: 2.4,
    textAlign: "center",
    marginTop: 6,
  },
  footer: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  dots: {
    flexDirection: "row",
    gap: 5,
    marginBottom: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  versionText: {
    fontSize: 11,
    letterSpacing: 1.2,
  },
});
