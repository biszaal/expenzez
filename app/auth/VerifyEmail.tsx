import React, { useState, useEffect, useRef } from "react";
import {
  View,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StatusBar,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TextField, Typography } from "../../components/ui";
import { useTheme } from "../../contexts/ThemeContext";
import { authAPI } from "../../services/api";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAlert } from "../../hooks/useAlert";

const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export default function VerifyEmail() {
  const { colors, isDark } = useTheme();
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
              {/* Header Section */}
              <View style={styles.header}>
                {/* Back Button */}
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={styles.backButton}
                  accessibilityLabel="Go back"
                >
                  <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
                </TouchableOpacity>

                {/* Header Content */}
                <View style={styles.headerContent}>
                  <View style={[styles.iconContainer, { backgroundColor: colors.primary[500] + '15' }]}>
                    <Ionicons name="mail-open" size={32} color={colors.primary[500]} />
                  </View>

                  <Typography
                    variant="h1"
                    style={[styles.title, { color: colors.text.primary }]}
                    align="center"
                  >
                    Verify Your Email
                  </Typography>
                  <Typography
                    variant="body"
                    style={[styles.subtitle, { color: colors.text.secondary }]}
                    align="center"
                  >
                    We&apos;ve sent a 6-digit code to {email}
                  </Typography>
                </View>
              </View>

              {/* Form Container */}
              <View style={[styles.formSection, { backgroundColor: colors.background.secondary }]}>
                <View style={styles.formContent}>
                    <Typography
                      variant="h2"
                      style={[styles.formTitle, { color: colors.text.primary }]}
                      align="center"
                    >
                      Enter Verification Code
                    </Typography>

                    {/* User Info Display */}
                    {username && (
                      <View style={[styles.userInfoDisplay, { backgroundColor: colors.primary[500] + '15', borderColor: colors.primary[500] + '30' }]}>
                        <View style={styles.userInfoContent}>
                          <Ionicons
                            name="person"
                            size={16}
                            color={colors.primary[500]}
                          />
                          <Typography
                            variant="caption"
                            style={[styles.userInfoText, { color: colors.text.primary }]}
                          >
                            Verifying account for:{" "}
                            <Typography variant="caption" weight="bold">
                              {username}
                            </Typography>
                          </Typography>
                        </View>
                      </View>
                    )}

                    {/* Code Input */}
                    <View style={styles.inputContainer}>
                      <View style={[styles.inputWrapper, { backgroundColor: colors.background.primary, borderColor: colors.border.light }]}>
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
                          style={[styles.enhancedInput, { color: colors.text.primary }]}
                          placeholderTextColor={colors.text.tertiary}
                        />
                      </View>
                    </View>

                    {/* Verify Button */}
                    <TouchableOpacity
                      style={[
                        styles.verifyButton,
                        { backgroundColor: colors.primary[500], opacity: isLoading ? 0.7 : 1 },
                      ]}
                      onPress={handleConfirm}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Ionicons name="refresh" size={20} color="white" />
                      ) : (
                        <Typography
                          variant="body"
                          weight="bold"
                          style={{ color: "white" }}
                        >
                          Verify Email
                        </Typography>
                      )}
                    </TouchableOpacity>

                    {/* Resend Section */}
                    <View style={styles.resendSection}>
                      <Typography
                        variant="caption"
                        style={{ color: colors.text.secondary }}
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
                          style={{ color: colors.primary[500] }}
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
                        style={{ color: colors.text.secondary }}
                        align="center"
                      >
                        Back to{" "}
                        <Typography
                          variant="body"
                          style={{ color: colors.primary[500] }}
                          weight="bold"
                        >
                          Sign In
                        </Typography>
                      </Typography>
                    </TouchableOpacity>
                </View>
              </View>

              {/* Help Text */}
              <View style={[styles.helpSection, { backgroundColor: colors.primary[500] + '10', borderColor: colors.primary[500] + '20', borderWidth: 1, borderRadius: 10, padding: spacing.md, marginTop: spacing.md }]}>
                <View style={styles.helpContent}>
                  <Ionicons
                    name="information-circle-outline"
                    size={16}
                    color={colors.primary[500]}
                  />
                  <Typography variant="caption" style={[styles.helpText, { color: colors.text.secondary }]}>
                    Please check your email inbox and spam folder for the verification code
                  </Typography>
                </View>
              </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Layout
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: "100%",
    justifyContent: "center",
  },

  // Header
  header: {
    marginBottom: spacing.xl,
    position: "relative",
    paddingTop: spacing.lg,
  },
  backButton: {
    padding: 8,
    marginBottom: spacing.lg,
    alignSelf: "flex-start",
  },
  headerContent: {
    alignItems: "center",
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },

  // Form
  formSection: {
    marginBottom: spacing.lg,
    borderRadius: 12,
    padding: spacing.lg,
  },
  formContent: {
    paddingBottom: spacing.lg,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: spacing.lg,
    textAlign: "center",
  },

  // User info display
  userInfoDisplay: {
    borderRadius: 10,
    marginBottom: spacing.lg,
    borderWidth: 1,
  },
  userInfoContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.sm,
  },
  userInfoText: {
    flex: 1,
    fontSize: 13,
  },

  // Inputs
  inputContainer: {
    marginBottom: spacing.lg,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    borderWidth: 1,
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
    borderRadius: 10,
    marginBottom: spacing.lg,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
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
    borderRadius: 10,
  },
  helpContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  helpText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
});
