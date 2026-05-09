import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useAlert } from "../../hooks/useAlert";
import { authAPI } from "../../services/api";
import { useAuth } from "./AuthContext";
import { fontFamily } from "../../constants/theme";

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

  // Auto-send verification code when coming from login or when autoResend is true
  useEffect(() => {
    if (email && (!password || params.autoResend === "true")) {
      console.log(
        "📧 [EmailVerification] Auto-sending verification code",
        { email, hasPassword: !!password, autoResend: params.autoResend }
      );
      // Use setTimeout to ensure component is fully mounted
      setTimeout(() => {
        handleResendCode();
      }, 500);
    }
  }, [email, password, params.autoResend]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
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
                pathname: "/auth/login",
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
              pathname: "/auth/login",
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
            pathname: "/auth/login",
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
              pathname: "/auth/login",
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

  const themedIsDark = colors.background.primary === "#0A0712";
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
    >
      <StatusBar barStyle={themedIsDark ? "light-content" : "dark-content"} />

      <LinearGradient
        colors={
          themedIsDark
            ? ["rgba(157,91,255,0.18)", "rgba(157,91,255,0)"]
            : ["rgba(123,63,228,0.10)", "rgba(123,63,228,0)"]
        }
        style={[StyleSheet.absoluteFillObject, { height: 280 }]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        pointerEvents="none"
      />

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
            <Pressable
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace("/auth/login");
                }
              }}
              style={[
                styles.backChip,
                {
                  backgroundColor: colors.card.background,
                  borderColor: colors.border.medium,
                },
              ]}
            >
              <Ionicons
                name="chevron-back"
                size={18}
                color={colors.text.secondary}
              />
            </Pressable>
          </View>

          {/* Title block */}
          <View style={styles.titleBlock}>
            <LinearGradient
              colors={[colors.primary[500], colors.primary[600]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.iconBadge,
                { shadowColor: colors.primary[500] },
              ]}
            >
              <Ionicons name="mail-open" size={26} color="#fff" />
            </LinearGradient>
            <Text
              style={[
                styles.title,
                { color: colors.text.primary, fontFamily: fontFamily.semibold },
              ]}
            >
              Verify your email
              <Text style={{ color: colors.primary[500] }}>.</Text>
            </Text>
            <Text
              style={[
                styles.subtitle,
                {
                  color: colors.text.secondary,
                  fontFamily: fontFamily.medium,
                },
              ]}
            >
              {params.email
                ? "We've sent a 6-digit verification code to"
                : "Enter the 6-digit verification code sent to your email"}
            </Text>
            <Text
              style={[
                styles.email,
                {
                  color: colors.primary[500],
                  fontFamily: fontFamily.semibold,
                },
              ]}
            >
              {params.email ||
                email ||
                (params.username
                  ? `${params.username}@example.com`
                  : "your registered email")}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text
              style={[
                styles.inputLabel,
                {
                  color: colors.text.tertiary,
                  fontFamily: fontFamily.semibold,
                },
              ]}
            >
              VERIFICATION CODE
            </Text>
            <View
              style={[
                styles.codeWrap,
                {
                  backgroundColor: colors.card.background,
                  borderColor: colors.border.medium,
                },
              ]}
            >
              <TextInput
                value={verificationCode}
                onChangeText={(text) =>
                  setVerificationCode(text.replace(/[^0-9]/g, "").slice(0, 6))
                }
                placeholder="000000"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="numeric"
                maxLength={6}
                style={{
                  flex: 1,
                  color: colors.text.primary,
                  fontFamily: fontFamily.monoMedium,
                  fontSize: 28,
                  letterSpacing: 8,
                  textAlign: "center",
                  paddingVertical: 0,
                }}
              />
            </View>

            <Pressable
              onPress={handleVerification}
              disabled={isVerifying || verificationCode.length !== 6}
              style={({ pressed }) => [
                styles.primaryButton,
                {
                  marginTop: 18,
                  opacity:
                    isVerifying ||
                    verificationCode.length !== 6 ||
                    pressed
                      ? 0.85
                      : 1,
                },
              ]}
            >
              <LinearGradient
                colors={[colors.primary[500], colors.primary[600]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.primaryButtonGradient,
                  { shadowColor: colors.primary[500] },
                ]}
              >
                {isVerifying ? (
                  <>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.primaryButtonText}>Verifying…</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>Verify email</Text>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#fff"
                    />
                  </>
                )}
              </LinearGradient>
            </Pressable>

            <View style={styles.resendRow}>
              <Text
                style={[
                  styles.resendText,
                  {
                    color: colors.text.secondary,
                    fontFamily: fontFamily.medium,
                  },
                ]}
              >
                Didn&apos;t receive the code?{" "}
              </Text>
              <Pressable
                onPress={handleResendCode}
                disabled={isResending || resendTimer > 0}
              >
                {isResending ? (
                  <ActivityIndicator
                    size="small"
                    color={colors.primary[500]}
                  />
                ) : (
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.primary[500],
                      fontFamily: fontFamily.semibold,
                      opacity: resendTimer > 0 ? 0.5 : 1,
                    }}
                  >
                    {resendTimer > 0
                      ? `Resend in ${resendTimer}s`
                      : "Resend code"}
                  </Text>
                )}
              </Pressable>
            </View>

            <View
              style={[
                styles.helpContainer,
                {
                  backgroundColor: themedIsDark
                    ? "rgba(157,91,255,0.10)"
                    : "rgba(123,63,228,0.06)",
                  borderColor: colors.border.medium,
                },
              ]}
            >
              <Ionicons
                name="information-circle"
                size={16}
                color={colors.primary[500]}
              />
              <Text
                style={[
                  styles.helpText,
                  {
                    color: colors.text.secondary,
                    fontFamily: fontFamily.medium,
                  },
                ]}
              >
                Check your spam folder if you don&apos;t see the email. The code
                expires in 24 hours.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 6,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  backChip: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  titleBlock: {
    alignItems: "center",
    paddingTop: 32,
    gap: 8,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 8,
  },
  title: {
    fontSize: 26,
    letterSpacing: -0.6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  email: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
  },
  form: {
    paddingTop: 32,
  },
  inputLabel: {
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 8,
  },
  codeWrap: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  primaryButton: {
    borderRadius: 18,
    overflow: "hidden",
  },
  primaryButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 17,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 8,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: fontFamily.semibold,
    letterSpacing: 0.2,
  },
  resendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    paddingTop: 18,
  },
  resendText: { fontSize: 13 },
  helpContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
    marginTop: 18,
  },
  helpText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 17,
  },
});
