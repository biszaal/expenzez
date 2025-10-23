import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { TextField, Typography } from "../../components/ui";
import { useTheme } from "../../contexts/ThemeContext";
import { spacing, borderRadius, layout } from "../../constants/theme";
import { useAlert } from "../../hooks/useAlert";
import { authAPI } from "../../services/api";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { showError, showSuccess } = useAlert();

  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [userEmail, setUserEmail] = useState(""); // Store email for success message
  const [resendCooldown, setResendCooldown] = useState(0);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSubmit = async () => {
    if (!username.trim()) {
      showError("Please enter your username");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authAPI.forgotPassword({
        username: username.trim(),
      });

      // Extract email from response if available
      const email = response?.email || "your registered email";
      setUserEmail(email);

      setEmailSent(true);
      setResendCooldown(60); // 60 second cooldown for resend
      showSuccess(`Password reset code sent to ${email}!`);

      // Auto-navigate after showing success message
      setTimeout(() => {
        router.push({
          pathname: "/auth/ResetPassword",
          params: { username: username.trim(), email: email },
        });
      }, 3000); // Reduced to 3 seconds for better UX
    } catch (error: any) {
      console.error("Forgot password error:", error);

      // Extract specific error message
      let errorMessage = "Failed to send reset code";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message && error.message !== "API request failed") {
        errorMessage = error.message;
      }

      // Handle specific scenarios
      if (
        errorMessage.toLowerCase().includes("user not found") ||
        errorMessage.toLowerCase().includes("username")
      ) {
        errorMessage =
          "Username not found. Please check your username and try again.";
      } else if (
        errorMessage.toLowerCase().includes("limit") ||
        errorMessage.toLowerCase().includes("many")
      ) {
        errorMessage =
          "Too many password reset requests. Please wait before trying again.";
      }

      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setIsLoading(true);
    try {
      await authAPI.forgotPassword({ username: username.trim() });
      setResendCooldown(60);
      showSuccess("Reset code sent again!");
    } catch (error: any) {
      console.error("Resend error:", error);

      // Extract specific error message
      let errorMessage = "Failed to resend code";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message && error.message !== "API request failed") {
        errorMessage = error.message;
      }

      // Handle specific scenarios for resend
      if (
        errorMessage.toLowerCase().includes("limit") ||
        errorMessage.toLowerCase().includes("many")
      ) {
        errorMessage =
          "Too many requests. Please wait before requesting another code.";
      }

      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Gradient Background */}
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <BlurView
                  intensity={30}
                  tint="light"
                  style={styles.backButtonBlur}
                >
                  <Ionicons name="chevron-back" size={24} color="white" />
                </BlurView>
              </TouchableOpacity>

              <View style={styles.headerContent}>
                <View style={styles.logoContainer}>
                  <View style={styles.logoCircle}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={40}
                      color="white"
                    />
                  </View>
                </View>

                <Typography variant="h1" style={styles.title}>
                  Reset Password
                </Typography>
                <Typography variant="body" style={styles.subtitle}>
                  Enter your username and we'll send you a reset code
                </Typography>
              </View>
            </View>

            {/* Glass Form Container */}
            <BlurView intensity={40} tint="light" style={styles.glassCard}>
              <View style={styles.formContent}>
                {/* Success State */}
                {emailSent && (
                  <View style={styles.successContainer}>
                    <View style={styles.successIconCircle}>
                      <Ionicons name="checkmark" size={40} color="white" />
                    </View>

                    <Typography variant="h2" style={styles.successTitle}>
                      Code Sent
                    </Typography>

                    <Typography variant="body" style={styles.successMessage}>
                      Reset code sent to {userEmail}
                    </Typography>

                    <View style={styles.instructionBox}>
                      <Ionicons
                        name="information-circle"
                        size={20}
                        color="rgba(255, 255, 255, 0.8)"
                      />
                      <Typography
                        variant="caption"
                        style={styles.instructionText}
                      >
                        Check your email for the 6-digit code, then create your
                        new password.
                      </Typography>
                    </View>

                    {/* Resend Button */}
                    <TouchableOpacity
                      style={[
                        styles.resendCodeButton,
                        { opacity: resendCooldown > 0 || isLoading ? 0.6 : 1 },
                      ]}
                      onPress={handleResend}
                      disabled={resendCooldown > 0 || isLoading}
                      activeOpacity={0.9}
                    >
                      <BlurView
                        intensity={30}
                        tint="light"
                        style={styles.buttonBlur}
                      >
                        <Typography variant="body" style={styles.buttonText}>
                          {resendCooldown > 0
                            ? `Resend in ${resendCooldown}s`
                            : isLoading
                              ? "Sending..."
                              : "Resend Code"}
                        </Typography>
                      </BlurView>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.continueButton}
                      onPress={() => {
                        router.push({
                          pathname: "/auth/ResetPassword",
                          params: {
                            username: username.trim(),
                            email: userEmail,
                          },
                        });
                      }}
                      activeOpacity={0.9}
                    >
                      <BlurView
                        intensity={30}
                        tint="light"
                        style={styles.buttonBlur}
                      >
                        <Typography
                          variant="body"
                          style={styles.buttonText}
                          weight="semibold"
                        >
                          Continue
                        </Typography>
                        <Ionicons
                          name="arrow-forward"
                          size={20}
                          color="white"
                        />
                      </BlurView>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Form State */}
                {!emailSent && (
                  <>
                    {/* Username Input */}
                    <View style={styles.inputContainer}>
                      <Typography
                        variant="body"
                        style={styles.inputLabel}
                        weight="medium"
                      >
                        Username
                      </Typography>
                      <TextField
                        placeholder="Enter your username"
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                        autoCorrect={false}
                        style={styles.input}
                      />
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                      style={[
                        styles.submitButton,
                        { opacity: isLoading ? 0.7 : 1 },
                      ]}
                      onPress={handleSubmit}
                      disabled={isLoading}
                      activeOpacity={0.9}
                    >
                      <BlurView
                        intensity={30}
                        tint="light"
                        style={styles.buttonBlur}
                      >
                        <Typography
                          variant="body"
                          weight="semibold"
                          style={styles.buttonText}
                        >
                          {isLoading ? "Sending..." : "Send Reset Code"}
                        </Typography>
                        <Ionicons name="mail" size={20} color="white" />
                      </BlurView>
                    </TouchableOpacity>

                    {/* Additional Links */}
                    <View style={styles.linksContainer}>
                      <TouchableOpacity
                        style={styles.linkButton}
                        onPress={() => router.push("/auth/ForgotUsername")}
                      >
                        <Typography variant="body" style={styles.linkText}>
                          Forgot username?
                        </Typography>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.linkButton}
                        onPress={() => router.push("/auth/Login")}
                      >
                        <Typography
                          variant="body"
                          style={styles.linkTextSecondary}
                        >
                          Back to{" "}
                          <Typography
                            variant="body"
                            style={styles.linkText}
                            weight="semibold"
                          >
                            Sign In
                          </Typography>
                        </Typography>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </BlurView>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingVertical: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
    position: "relative",
  },
  backButton: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 1,
    borderRadius: 20,
    overflow: "hidden",
  },
  backButtonBlur: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerContent: {
    alignItems: "center",
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "white",
    marginBottom: 6,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.85)",
    textAlign: "center",
    lineHeight: 22,
    maxWidth: "85%",
  },
  glassCard: {
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 10,
  },
  formContent: {
    padding: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    color: "white",
    marginBottom: 6,
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "white",
    minHeight: 48,
  },
  submitButton: {
    borderRadius: 25,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 16,
  },
  buttonBlur: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  linksContainer: {
    alignItems: "center",
    gap: 12,
  },
  linkButton: {
    paddingVertical: 8,
  },
  linkText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  linkTextSecondary: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 15,
  },
  successContainer: {
    alignItems: "center",
    paddingVertical: 8,
  },
  successIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(34, 197, 94, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "white",
    marginBottom: 8,
    textAlign: "center",
  },
  successMessage: {
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
    maxWidth: "90%",
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 15,
  },
  instructionBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderColor: "rgba(255, 255, 255, 0.2)",
    marginBottom: 16,
  },
  instructionText: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: "left",
    flex: 1,
    color: "rgba(255, 255, 255, 0.85)",
  },
  resendCodeButton: {
    alignSelf: "stretch",
    marginBottom: 12,
    borderRadius: 25,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  continueButton: {
    alignSelf: "stretch",
    borderRadius: 25,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
});
