import React, { useState, useEffect, useRef } from "react";
import {
  View,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TextField, Typography } from "../../components/ui";
import { useTheme } from "../../contexts/ThemeContext";
import { spacing, shadows } from "../../constants/theme";
import { authAPI } from "../../services/api";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useAlert } from "../../hooks/useAlert";

export default function VerifyEmail() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { showError, showSuccess } = useAlert();

  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Get username and email from navigation params
  const username = (params.username as string) || "";
  const email = (params.email as string) || "";

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const logoRotation = useRef(new Animated.Value(0)).current;

  // Start animations on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Logo rotation animation
    Animated.loop(
      Animated.timing(logoRotation, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();
  }, [fadeAnim, slideAnim, scaleAnim, logoRotation]);

  const logoRotationInterpolate = logoRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const handleConfirm = async () => {
    if (!code.trim()) {
      showError("Please enter the verification code");
      return;
    }

    if (code.length !== 6) {
      showError("Verification code must be 6 digits");
      return;
    }

    // Validate that code contains only digits
    if (!/^\d{6}$/.test(code)) {
      showError("Verification code must contain only numbers");
      return;
    }

    setIsLoading(true);
    try {
      console.log("Attempting verification with:", {
        username,
        email,
        code: "***",
      });

      // Send only username and code as expected by the API
      const response = await authAPI.confirmSignUp({
        username: username || email,
        code: code.trim(),
      });

      console.log("Verification response:", response);
      showSuccess("Email verified successfully! You can now log in.");

      // Navigate to login after successful verification
      setTimeout(() => {
        router.replace("/auth/Login");
      }, 2000);
    } catch (err: any) {
      console.error("Email verification error:", {
        error: err,
        response: err.response?.data,
        status: err.response?.status,
        message: err.message,
      });

      let errorMessage = "Verification failed. Please try again.";

      // Parse error response
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }

      // Handle specific error cases
      if (
        errorMessage.toLowerCase().includes("expired") ||
        errorMessage.toLowerCase().includes("expir")
      ) {
        showError("Verification code has expired. Please request a new one.");
      } else if (
        errorMessage.toLowerCase().includes("invalid") ||
        errorMessage.toLowerCase().includes("incorrect") ||
        errorMessage.toLowerCase().includes("mismatch")
      ) {
        showError(
          "Invalid verification code. Please check the code and try again."
        );
      } else if (
        errorMessage.toLowerCase().includes("confirmed") ||
        errorMessage.toLowerCase().includes("already verified")
      ) {
        showError("Your account is already verified. You can log in now.");
        // Auto-redirect to login if already confirmed
        setTimeout(() => {
          router.replace("/auth/Login");
        }, 2000);
      } else if (errorMessage.toLowerCase().includes("not found")) {
        showError("User not found. Please check your email address.");
      } else if (
        errorMessage.toLowerCase().includes("limit") ||
        errorMessage.toLowerCase().includes("too many")
      ) {
        showError(
          "Too many verification attempts. Please wait a few minutes and try again."
        );
      } else {
        showError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    const identifier = email || username;
    if (!identifier) {
      showError("Email address is required to resend verification");
      return;
    }

    setIsResending(true);
    try {
      console.log("Resending verification with data:", { email, username });

      const response = await authAPI.resendVerification({
        username: username || email, // Backend expects 'username' field specifically
      });

      console.log("Resend response:", response);
      showSuccess(
        "Verification email sent! Please check your inbox and spam folder."
      );
    } catch (err: any) {
      console.error("Resend verification error:", {
        error: err,
        response: err.response?.data,
        status: err.response?.status,
        message: err.message,
      });

      let errorMessage = "Failed to resend verification email";

      // Parse error response
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }

      // Handle specific error cases
      if (
        errorMessage.toLowerCase().includes("confirmed") ||
        errorMessage.toLowerCase().includes("already verified")
      ) {
        showError("Your account is already verified. You can log in now.");
        setTimeout(() => {
          router.replace("/auth/Login");
        }, 2000);
      } else if (errorMessage.toLowerCase().includes("not found")) {
        showError("User not found. Please check your email address.");
      } else if (
        errorMessage.toLowerCase().includes("limit") ||
        errorMessage.toLowerCase().includes("too many")
      ) {
        showError(
          "Too many requests. Please wait 15 minutes before requesting another code."
        );
      } else {
        showError(errorMessage);
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <LinearGradient
        colors={["#667eea", "#764ba2", "#f093fb"]}
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
          <KeyboardAvoidingView
            style={styles.keyboardView}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View style={styles.content}>
              {/* Enhanced Header Section */}
              <Animated.View
                style={[
                  styles.header,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                {/* Back Button */}
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={styles.backButton}
                  accessibilityLabel="Go back"
                >
                  <LinearGradient
                    colors={["rgba(255,255,255,0.2)", "rgba(255,255,255,0.1)"]}
                    style={styles.backButtonGradient}
                  >
                    <Ionicons name="chevron-back" size={24} color="white" />
                  </LinearGradient>
                </TouchableOpacity>

                {/* Header Content */}
                <View style={styles.headerContent}>
                  <Animated.View
                    style={[
                      styles.iconContainer,
                      {
                        transform: [
                          { rotate: logoRotationInterpolate },
                          { scale: scaleAnim },
                        ],
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={["#4facfe", "#00f2fe"]}
                      style={styles.iconGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Ionicons name="mail-open" size={32} color="white" />
                    </LinearGradient>
                  </Animated.View>

                  <Typography
                    variant="h1"
                    style={StyleSheet.flatten([
                      styles.title,
                      { color: "white" },
                    ])}
                    align="center"
                  >
                    Verify Your Email
                  </Typography>
                  <Typography
                    variant="body"
                    style={StyleSheet.flatten([
                      styles.subtitle,
                      { color: "rgba(255,255,255,0.8)" },
                    ])}
                    align="center"
                  >
                    We&apos;ve sent a 6-digit code to {email}
                  </Typography>
                </View>
              </Animated.View>

              {/* Enhanced Form Container */}
              <Animated.View
                style={[
                  styles.formSection,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                <BlurView
                  intensity={20}
                  tint="light"
                  style={styles.formContainer}
                >
                  <View style={styles.formContent}>
                    <Typography
                      variant="h2"
                      style={StyleSheet.flatten([
                        styles.formTitle,
                        { color: colors.text.primary },
                      ])}
                      align="center"
                    >
                      Enter Verification Code
                    </Typography>

                    {/* User Info Display */}
                    {username && (
                      <BlurView
                        intensity={10}
                        tint="light"
                        style={styles.userInfoDisplay}
                      >
                        <View style={styles.userInfoContent}>
                          <Ionicons
                            name="person"
                            size={16}
                            color={colors.primary[500]}
                          />
                          <Typography
                            variant="caption"
                            style={styles.userInfoText}
                          >
                            Verifying account for:{" "}
                            <Typography variant="caption" weight="bold">
                              {username}
                            </Typography>
                          </Typography>
                        </View>
                      </BlurView>
                    )}

                    {/* Enhanced Code Input */}
                    <View style={styles.inputContainer}>
                      <View style={styles.inputWrapper}>
                        <Ionicons
                          name="keypad-outline"
                          size={20}
                          color={colors.text.secondary}
                          style={styles.inputIcon}
                        />
                        <TextField
                          placeholder="Enter 6-digit code"
                          value={code}
                          onChangeText={(text) => setCode(text.slice(0, 6))}
                          keyboardType="number-pad"
                          style={styles.enhancedInput}
                        />
                      </View>
                    </View>

                    {/* Enhanced Verify Button */}
                    <TouchableOpacity
                      style={StyleSheet.flatten([
                        styles.verifyButton,
                        { opacity: isLoading ? 0.7 : 1 },
                      ])}
                      onPress={handleConfirm}
                      disabled={isLoading}
                    >
                      <LinearGradient
                        colors={["#4facfe", "#00f2fe"]}
                        style={styles.verifyGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        {isLoading ? (
                          <Animated.View
                            style={[
                              styles.loadingContainer,
                              {
                                transform: [
                                  { rotate: logoRotationInterpolate },
                                ],
                              },
                            ]}
                          >
                            <Ionicons name="refresh" size={20} color="white" />
                          </Animated.View>
                        ) : (
                          <Typography
                            variant="body"
                            weight="bold"
                            style={{ color: "white" }}
                          >
                            Verify Email
                          </Typography>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>

                    {/* Resend Section */}
                    <View style={styles.resendSection}>
                      <Typography
                        variant="caption"
                        color="secondary"
                        align="center"
                      >
                        Didn&apos;t receive the code?
                      </Typography>
                      <TouchableOpacity
                        style={styles.resendButton}
                        onPress={handleResend}
                        disabled={isResending}
                      >
                        <Typography
                          variant="caption"
                          color="primary"
                          weight="semibold"
                        >
                          {isResending ? "Sending..." : "Resend Code"}
                        </Typography>
                      </TouchableOpacity>
                    </View>

                    {/* Back to Login Link */}
                    <TouchableOpacity
                      style={styles.backToLoginLink}
                      onPress={() => router.replace("/auth/Login")}
                    >
                      <Typography
                        variant="body"
                        color="secondary"
                        align="center"
                      >
                        Back to{" "}
                        <Typography
                          variant="body"
                          color="primary"
                          weight="bold"
                        >
                          Sign In
                        </Typography>
                      </Typography>
                    </TouchableOpacity>
                  </View>
                </BlurView>
              </Animated.View>

              {/* Help Text */}
              <Animated.View
                style={[
                  styles.helpSection,
                  {
                    opacity: fadeAnim,
                  },
                ]}
              >
                <BlurView
                  intensity={10}
                  tint="light"
                  style={styles.helpContainer}
                >
                  <View style={styles.helpContent}>
                    <Ionicons
                      name="information-circle-outline"
                      size={16}
                      color="rgba(255,255,255,0.8)"
                    />
                    <Typography variant="caption" style={styles.helpText}>
                      Please check your email inbox and spam folder for the
                      verification code
                    </Typography>
                  </View>
                </BlurView>
              </Animated.View>
            </View>
          </KeyboardAvoidingView>
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
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatingElement: {
    position: "absolute",
    borderRadius: 100,
    opacity: 0.1,
  },
  element1: {
    width: 100,
    height: 100,
    backgroundColor: "white",
    top: "20%",
    right: "15%",
  },
  element2: {
    width: 60,
    height: 60,
    backgroundColor: "rgba(255,255,255,0.5)",
    bottom: "25%",
    left: "10%",
  },

  // Layout
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },

  // Header
  header: {
    marginBottom: spacing.xl,
    position: "relative",
  },
  backButton: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 1,
  },
  backButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.md,
  },
  headerContent: {
    alignItems: "center",
    paddingTop: spacing.lg,
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: spacing.md,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    maxWidth: "90%",
  },

  // Form
  formSection: {
    marginBottom: spacing.lg,
  },
  formContainer: {
    borderRadius: 24,
    overflow: "hidden",
    ...shadows.xl,
  },
  formContent: {
    padding: spacing.xl,
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: spacing.lg,
  },

  // User info display
  userInfoDisplay: {
    borderRadius: 12,
    marginBottom: spacing.lg,
    overflow: "hidden",
  },
  userInfoContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    gap: spacing.sm,
  },
  userInfoText: {
    color: "#6b7280",
    flex: 1,
  },

  // Enhanced inputs
  inputContainer: {
    marginBottom: spacing.lg,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(248,250,252,0.8)",
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    minHeight: 56,
    borderWidth: 1,
    borderColor: "rgba(226,232,240,0.5)",
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  enhancedInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    backgroundColor: "transparent",
    borderWidth: 0,
    paddingVertical: 0,
    textAlign: "center",
    letterSpacing: 4,
  },

  // Verify button
  verifyButton: {
    borderRadius: 16,
    marginBottom: spacing.lg,
    overflow: "hidden",
    ...shadows.md,
  },
  verifyGradient: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
  },

  // Resend section
  resendSection: {
    alignItems: "center",
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  resendButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },

  // Links
  backToLoginLink: {
    alignSelf: "center",
    paddingVertical: spacing.sm,
  },

  // Help section
  helpSection: {
    marginTop: spacing.md,
  },
  helpContainer: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  helpContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.sm,
  },
  helpText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
});
