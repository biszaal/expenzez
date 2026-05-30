import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, StatusBar, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../contexts/ThemeContext";
import { fontFamily } from "../constants/theme";

// v1.6 redesign — branded launch screen with cobalt radial glow,
// the Expenzez Spark mark, and animated dots.
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

      {/* Ambient cobalt glow */}
      <LinearGradient
        colors={
          isDark
            ? ["rgba(78,124,255,0.45)", "rgba(78,124,255,0)"]
            : ["rgba(37,71,240,0.20)", "rgba(37,71,240,0)"]
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
        <Image
          source={require("../assets/images/icon.png")}
          style={[styles.brandMark, { shadowColor: colors.primary[500] }]}
          resizeMode="contain"
        />

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
