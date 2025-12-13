import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Gradient Background */}
      <LinearGradient
        colors={["#1a1a2e", "#16213e", "#0f3460", "#533483"]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require("../assets/images/icon.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.appName}>Expenzez</Text>
        <Text style={styles.tagline}>Personal Finance Assistant</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  logoContainer: {
    marginBottom: 40,
  },
  logoImage: {
    width: 180,
    height: 180,
    borderRadius: 36,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
  appName: {
    fontSize: 36,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 12,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 18,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
