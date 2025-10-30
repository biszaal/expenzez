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
import { useAlert } from "../../hooks/useAlert";
import { authAPI } from "../../services/api";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
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
    return undefined;
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
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
              <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
            </TouchableOpacity>

            <View style={styles.headerContent}>
              <View style={[styles.logoContainer, { backgroundColor: colors.primary.main + "15" }]}>
                <Ionicons
                  name="lock-closed-outline"
                  size={40}
                  color={colors.primary.main}
                />
              </View>

              <Typography variant="h1" style={[styles.title, { color: colors.text.primary }]}>
                Reset Password
              </Typography>
              <Typography variant="body" style={[styles.subtitle, { color: colors.text.secondary }]}>
                Enter your username and we'll send you a reset code
              </Typography>
            </View>
          </View>

          {/* Form Container */}
          <View style={[styles.formCard, { backgroundColor: colors.background.secondary }]}>
            {/* Success State */}
            {emailSent && (
              <View style={styles.successContainer}>
                <View style={[styles.successIconCircle, { backgroundColor: colors.success.main + "20", borderColor: colors.border.light }]}>
                  <Ionicons name="checkmark" size={40} color={colors.success.main} />
                </View>

                <Typography variant="h2" style={[styles.successTitle, { color: colors.text.primary }]}>
                  Code Sent
                </Typography>

                <Typography variant="body" style={[styles.successMessage, { color: colors.text.secondary }]}>
                  Reset code sent to {userEmail}
                </Typography>

                <View style={[styles.instructionBox, { backgroundColor: colors.background.primary, borderColor: colors.border.light }]}>
                  <Ionicons
                    name="information-circle"
                    size={20}
                    color={colors.text.secondary}
                  />
                  <Typography
                    variant="caption"
                    style={[styles.instructionText, { color: colors.text.secondary }]}
                  >
                    Check your email for the 6-digit code, then create your new password.
                  </Typography>
                </View>

                {/* Resend Button */}
                <TouchableOpacity
                  style={[
                    styles.resendCodeButton,
                    { borderColor: colors.primary.main, opacity: resendCooldown > 0 || isLoading ? 0.6 : 1 },
                  ]}
                  onPress={handleResend}
                  disabled={resendCooldown > 0 || isLoading}
                  activeOpacity={0.8}
                >
                  <Typography variant="body" style={[styles.resendButtonText, { color: colors.primary.main }]}>
                    {resendCooldown > 0
                      ? `Resend in ${resendCooldown}s`
                      : isLoading
                        ? "Sending..."
                        : "Resend Code"}
                  </Typography>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.continueButton, { backgroundColor: colors.primary.main }]}
                  onPress={() => {
                    router.push({
                      pathname: "/auth/ResetPassword",
                      params: {
                        username: username.trim(),
                        email: userEmail,
                      },
                    });
                  }}
                  activeOpacity={0.8}
                >
                  <Typography variant="body" style={styles.buttonText} weight="semibold">
                    Continue
                  </Typography>
                  <Ionicons name="arrow-forward" size={18} color="white" />
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
                    style={[styles.inputLabel, { color: colors.text.primary }]}
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
                    editable={!isLoading}
                    placeholderTextColor={colors.text.tertiary}
                  />
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    { backgroundColor: colors.primary.main, opacity: isLoading ? 0.7 : 1 },
                  ]}
                  onPress={handleSubmit}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <Typography
                    variant="body"
                    weight="semibold"
                    style={styles.buttonText}
                  >
                    {isLoading ? "Sending..." : "Send Reset Code"}
                  </Typography>
                  <Ionicons name="mail" size={18} color="white" />
                </TouchableOpacity>

                {/* Additional Links */}
                <View style={styles.linksContainer}>
                  <TouchableOpacity
                    style={styles.linkButton}
                    onPress={() => router.push("/auth/ForgotUsername")}
                  >
                    <Typography variant="body" style={[styles.linkText, { color: colors.primary.main }]}>
                      Forgot username?
                    </Typography>
                  </TouchableOpacity>

                  <View style={styles.linkSeparator} />

                  <TouchableOpacity
                    style={styles.linkButton}
                    onPress={() => router.push("/auth/Login")}
                  >
                    <Typography variant="body" style={[styles.linkTextSecondary, { color: colors.text.secondary }]}>
                      Back to{" "}
                      <Typography
                        variant="body"
                        style={[styles.linkText, { color: colors.primary.main }]}
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
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
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  backButton: {
    alignSelf: "flex-start",
    padding: 8,
    marginLeft: -8,
    marginBottom: 16,
  },
  headerContent: {
    alignItems: "center",
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 6,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: "90%",
  },
  formCard: {
    borderRadius: 12,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 48,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    paddingVertical: 14,
    marginBottom: 16,
    gap: 8,
  },
  resendCodeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    paddingVertical: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  resendButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    paddingVertical: 14,
    gap: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  linksContainer: {
    alignItems: "center",
    gap: 16,
    marginTop: 16,
  },
  linkButton: {
    paddingVertical: 8,
  },
  linkSeparator: {
    height: 1,
    width: 40,
  },
  linkText: {
    fontSize: 14,
    fontWeight: "600",
  },
  linkTextSecondary: {
    fontSize: 14,
  },
  successContainer: {
    alignItems: "center",
    paddingVertical: 8,
  },
  successIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  successMessage: {
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
    maxWidth: "90%",
    fontSize: 15,
  },
  instructionBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
    marginBottom: 16,
  },
  instructionText: {
    fontSize: 13,
    lineHeight: 16,
    textAlign: "left",
    flex: 1,
  },
});
