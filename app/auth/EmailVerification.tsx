import React, { useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button, TextField, Typography } from "../../components/ui";
import { useTheme } from "../../contexts/ThemeContext";
import { useAlert } from "../../hooks/useAlert";
import { authAPI } from "../../services/api";
import { useAuth } from "./AuthContext";

const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export default function EmailVerification() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const { showError, showSuccess } = useAlert();

  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { autoLoginAfterVerification } = useAuth();

  useEffect(() => {
    if (params.email) {
      setEmail(params.email as string);
    }
    if (params.username) {
      setUsername(params.username as string);
    }
    if (params.password) {
      setPassword(params.password as string);
    }
  }, [params]);

  // Auto-send verification code when coming from login (no password means not from registration)
  useEffect(() => {
    if (email && !password) {
      console.log(
        "📧 [EmailVerification] Auto-sending verification code for login flow",
        { email, password, params }
      );
      // Use setTimeout to ensure component is fully mounted
      setTimeout(() => {
        handleResendCode();
      }, 500);
    }
  }, [email, password]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleVerification = async () => {
    if (!verificationCode.trim()) {
      showError("Please enter the verification code");
      return;
    }

    if (verificationCode.length !== 6) {
      showError("Verification code must be 6 digits");
      return;
    }

    setIsVerifying(true);
    try {
      const result = await authAPI.confirmSignUp({
        username: username || email, // Use username if available, fallback to email
        code: verificationCode,
      });

      // If no error thrown, verification was successful
      if (password) {
        // Auto-login after verification (from registration flow)
        showSuccess("Email verified! Logging you in...");
        try {
          const autoLoginResult = await autoLoginAfterVerification(
            username || email, // Use username if available, fallback to email
            password
          );
          if (autoLoginResult.success) {
            showSuccess("Welcome! You're now logged in.");
            setTimeout(() => {
              router.replace("/(tabs)"); // Navigate to main app
            }, 1500);
          } else {
            showError("Auto-login failed. Please log in manually.");
            setTimeout(() => {
              router.replace({
                pathname: "/auth/Login",
                params: {
                  email: email,
                  message: "Email verified! Please log in to continue.",
                },
              });
            }, 2000);
          }
        } catch (autoLoginError) {
          console.error("Auto-login error:", autoLoginError);
          showError("Auto-login failed. Please log in manually.");
          setTimeout(() => {
            router.replace({
              pathname: "/auth/Login",
              params: {
                email: email,
                message: "Email verified! Please log in to continue.",
              },
            });
          }, 2000);
        }
      } else {
        // No password (came from login flow) - redirect back to login
        showSuccess("Email verified! You can now log in.");
        setTimeout(() => {
          router.replace({
            pathname: "/auth/Login",
            params: {
              email: email,
              message:
                "Email verified successfully! Please enter your password.",
            },
          });
        }, 1500);
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      let errorMsg = "Verification failed. Please try again.";

      if (error.response?.data?.message) {
        if (error.response.data.message.includes("Invalid verification code")) {
          errorMsg = "Invalid verification code. Please check and try again.";
        } else if (error.response.data.message.includes("expired")) {
          errorMsg = "Verification code has expired. Please request a new one.";
        } else if (error.response.data.message.includes("already confirmed")) {
          if (password) {
            // Auto-login if email already verified (from registration)
            showSuccess("Email already verified! Logging you in...");
            try {
              const autoLoginResult = await autoLoginAfterVerification(
                email,
                password
              );
              if (autoLoginResult.success) {
                showSuccess("Welcome! You're now logged in.");
                setTimeout(() => {
                  router.replace("/(tabs)"); // Navigate to main app
                }, 1500);
                return;
              }
            } catch (autoLoginError) {
              console.error("Auto-login error:", autoLoginError);
            }
          }
          // Email already verified - redirect back to login immediately
          showSuccess("Email already verified! You can log in now.");
          setTimeout(() => {
            router.replace({
              pathname: "/auth/Login",
              params: {
                email: email,
                message: "Email already verified! Please enter your password.",
              },
            });
          }, 1500);
          return;
        }
      }

      showError(errorMsg);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0) {
      console.log("⏰ [EmailVerification] Resend timer active, skipping");
      return;
    }

    console.log("📧 [EmailVerification] Starting resend process", {
      email,
      username,
      password,
      params,
      resendTimer,
    });

    setIsResending(true);
    try {
      // Backend expects 'username' field specifically
      const requestData = {
        username: username || email, // Use username if available, fallback to email
      };

      console.log(
        "📧 [EmailVerification] Resending verification with data:",
        requestData
      );
      const result = await authAPI.resendVerification(requestData);

      // If no error thrown, resend was successful
      showSuccess("Verification code sent! Check your email.");
      setResendTimer(60); // 60 second cooldown
    } catch (error: any) {
      console.error("Resend error:", error);
      showError("Failed to resend code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background.primary }]}>
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
                <Image
                source={require("../../assets/images/transparent-logo.png")}
                style={styles.appLogo}
                resizeMode="contain"
              />

                <Typography variant="h1" style={[styles.title, { color: colors.text.primary }]}>
                  Verify Your Email
                </Typography>

                <Typography variant="body" style={[styles.subtitle, { color: colors.text.secondary }]}>
                  {params.email
                    ? "We've sent a 6-digit verification code to:"
                    : "Enter the 6-digit verification code sent to your email:"}
                </Typography>

                <Typography
                  variant="body"
                  style={[styles.email, { color: colors.primary[500] }]}
                  weight="semibold"
                >
                  {params.email ||
                    email ||
                    (params.username
                      ? `${params.username}@example.com`
                      : "your registered email")}
                </Typography>
              </View>
            </View>

            {/* Form Container */}
            <View style={[styles.glassCard, { backgroundColor: colors.background.secondary }]}>
              <View style={styles.formContent}>
                {/* Verification Code Input */}
                <View style={styles.inputContainer}>
                  <Typography variant="body" style={[styles.inputLabel, { color: colors.text.primary }]}>
                    Verification Code
                  </Typography>
                  <TextField
                    placeholder="000000"
                    value={verificationCode}
                    onChangeText={(text) =>
                      setVerificationCode(
                        text.replace(/[^0-9]/g, "").slice(0, 6)
                      )
                    }
                    keyboardType="numeric"
                    style={[styles.input, { backgroundColor: colors.background.primary, borderColor: colors.border.light, color: colors.text.primary }]}
                    placeholderTextColor={colors.text.tertiary}
                  />
                </View>

                {/* Verify Button */}
                <TouchableOpacity
                  style={[styles.verifyButton, { backgroundColor: colors.primary[500] }]}
                  onPress={handleVerification}
                  disabled={isVerifying || verificationCode.length !== 6}
                  activeOpacity={0.9}
                >
                  <View style={styles.buttonBlur}>
                    {isVerifying ? (
                      <>
                        <ActivityIndicator size="small" color="white" />
                        <Typography variant="body" style={styles.buttonText}>
                          Verifying...
                        </Typography>
                      </>
                    ) : (
                      <>
                        <Typography variant="body" style={styles.buttonText}>
                          Verify Email
                        </Typography>
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color="white"
                        />
                      </>
                    )}
                  </View>
                </TouchableOpacity>

                {/* Resend Code */}
                <View style={styles.resendContainer}>
                  <Typography variant="body" style={[styles.resendText, { color: colors.text.secondary }]}>
                    Didn't receive the code?
                  </Typography>

                  <TouchableOpacity
                    onPress={handleResendCode}
                    disabled={isResending || resendTimer > 0}
                    style={styles.resendButton}
                  >
                    {isResending ? (
                      <ActivityIndicator size="small" color={colors.primary[500]} />
                    ) : (
                      <Typography
                        variant="body"
                        style={[
                          styles.resendButtonText,
                          { color: colors.primary[500], opacity: resendTimer > 0 ? 0.5 : 1 },
                        ]}
                        weight="medium"
                      >
                        {resendTimer > 0
                          ? `Resend in ${resendTimer}s`
                          : "Resend Code"}
                      </Typography>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Help Text */}
                <View style={[styles.helpContainer, { backgroundColor: colors.primary[500] + '10', borderColor: colors.primary[500] + '20' }]}>
                  <Ionicons
                    name="information-circle"
                    size={20}
                    color={colors.primary[500]}
                  />
                  <Typography variant="caption" style={[styles.helpText, { color: colors.text.secondary }]}>
                    Check your spam folder if you don't see the email. The code
                    expires in 24 hours.
                  </Typography>
                </View>
              </View>
            </View>
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
    marginBottom: 6,
  },
  email: {
    fontSize: 15,
    color: "white",
    textAlign: "center",
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
    marginBottom: 20,
  },
  inputLabel: {
    color: "white",
    marginBottom: 6,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 24,
    color: "#1f2937",
    minHeight: 48,
  },
  verifyButton: {
    borderRadius: 25,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 20,
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
  resendContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  resendText: {
    fontSize: 14,
    marginBottom: 8,
  },
  resendButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  helpContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  helpText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
});
