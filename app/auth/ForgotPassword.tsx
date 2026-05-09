import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
  Pressable,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useAlert } from "../../hooks/useAlert";
import { authAPI } from "../../services/api";
import { fontFamily } from "../../constants/theme";

// v1.5 redesign — back chip + lock-icon brand block, hairline username
// field, gradient submit button. Success state shows lime check tile and
// continue CTA.

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { showError, showSuccess } = useAlert();

  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [focused, setFocused] = useState(false);

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

      const email = response?.email || "your registered email";
      setUserEmail(email);
      setEmailSent(true);
      setResendCooldown(60);
      showSuccess(`Password reset code sent to ${email}!`);

      setTimeout(() => {
        router.push({
          pathname: "/auth/ResetPassword",
          params: { username: username.trim(), email: email },
        });
      }, 3000);
    } catch (error: any) {
      let errorMessage = "Failed to send reset code";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message && error.message !== "API request failed") {
        errorMessage = error.message;
      }

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
      let errorMessage = "Failed to resend code";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message && error.message !== "API request failed") {
        errorMessage = error.message;
      }

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
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Top glow */}
      <LinearGradient
        colors={
          isDark
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
              onPress={() => router.back()}
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
              style={[styles.iconBadge, { shadowColor: colors.primary[500] }]}
            >
              <Ionicons name="lock-closed" size={26} color="#fff" />
            </LinearGradient>
            <Text
              style={[
                styles.title,
                { color: colors.text.primary, fontFamily: fontFamily.semibold },
              ]}
            >
              Reset password
              <Text style={{ color: colors.primary[500] }}>.</Text>
            </Text>
            <Text
              style={[
                styles.subtitle,
                { color: colors.text.secondary, fontFamily: fontFamily.medium },
              ]}
            >
              Enter your username and we&apos;ll send you a{"\n"}reset code.
            </Text>
          </View>

          {/* Success */}
          {emailSent ? (
            <View style={styles.form}>
              <View
                style={[
                  styles.successCard,
                  {
                    backgroundColor: colors.card.background,
                    borderColor: colors.border.medium,
                  },
                ]}
              >
                <View
                  style={[
                    styles.successIconCircle,
                    { backgroundColor: colors.posBg },
                  ]}
                >
                  <Ionicons
                    name="checkmark"
                    size={26}
                    color={colors.lime[500]}
                  />
                </View>
                <Text
                  style={[
                    styles.successTitle,
                    {
                      color: colors.text.primary,
                      fontFamily: fontFamily.semibold,
                    },
                  ]}
                >
                  Code sent
                </Text>
                <Text
                  style={[
                    styles.successMessage,
                    {
                      color: colors.text.secondary,
                      fontFamily: fontFamily.medium,
                    },
                  ]}
                >
                  Reset code sent to {userEmail}
                </Text>
                <View
                  style={[
                    styles.instructionBox,
                    {
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.04)"
                        : "rgba(40,20,80,0.04)",
                      borderColor: colors.border.medium,
                    },
                  ]}
                >
                  <Ionicons
                    name="information-circle"
                    size={16}
                    color={colors.text.tertiary}
                  />
                  <Text
                    style={[
                      styles.instructionText,
                      {
                        color: colors.text.secondary,
                        fontFamily: fontFamily.medium,
                      },
                    ]}
                  >
                    Check your email for the 6-digit code, then create your new
                    password.
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={handleResend}
                disabled={resendCooldown > 0 || isLoading}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  {
                    borderColor: colors.primary[500],
                    opacity:
                      resendCooldown > 0 || isLoading || pressed ? 0.6 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.secondaryButtonText,
                    {
                      color: colors.primary[500],
                      fontFamily: fontFamily.semibold,
                    },
                  ]}
                >
                  {resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : isLoading
                      ? "Sending…"
                      : "Resend code"}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  router.push({
                    pathname: "/auth/ResetPassword",
                    params: {
                      username: username.trim(),
                      email: userEmail,
                    },
                  });
                }}
                style={({ pressed }) => [
                  styles.primaryButton,
                  { opacity: pressed ? 0.85 : 1 },
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
                  <Text style={styles.primaryButtonText}>Continue</Text>
                  <Ionicons name="arrow-forward" size={16} color="#fff" />
                </LinearGradient>
              </Pressable>
            </View>
          ) : (
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
                USERNAME
              </Text>
              <View
                style={[
                  styles.fieldWrap,
                  {
                    backgroundColor: colors.card.background,
                    borderColor: focused
                      ? colors.primary[500]
                      : colors.border.medium,
                  },
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={17}
                  color={focused ? colors.primary[500] : colors.text.tertiary}
                />
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Your username"
                  placeholderTextColor={colors.text.tertiary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  style={{
                    flex: 1,
                    color: colors.text.primary,
                    fontFamily: fontFamily.medium,
                    fontSize: 15,
                    paddingVertical: 0,
                  }}
                />
              </View>

              <Pressable
                onPress={handleSubmit}
                disabled={isLoading}
                style={({ pressed }) => [
                  styles.primaryButton,
                  { opacity: pressed || isLoading ? 0.85 : 1, marginTop: 18 },
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
                  <Text style={styles.primaryButtonText}>
                    {isLoading ? "Sending…" : "Send reset code"}
                  </Text>
                  {!isLoading && (
                    <Ionicons name="mail" size={16} color="#fff" />
                  )}
                </LinearGradient>
              </Pressable>

              <View style={styles.linksRow}>
                <Pressable onPress={() => router.push("/auth/ForgotUsername")}>
                  <Text
                    style={[
                      styles.linkText,
                      {
                        color: colors.primary[500],
                        fontFamily: fontFamily.semibold,
                      },
                    ]}
                  >
                    Forgot username?
                  </Text>
                </Pressable>
                <Text
                  style={{
                    color: colors.text.tertiary,
                    fontFamily: fontFamily.medium,
                  }}
                >
                  ·
                </Text>
                <Pressable onPress={() => router.push("/auth/login")}>
                  <Text
                    style={[
                      styles.linkText,
                      {
                        color: colors.primary[500],
                        fontFamily: fontFamily.semibold,
                      },
                    ]}
                  >
                    Sign in
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
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
    gap: 14,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
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
  },
  form: {
    paddingTop: 32,
  },
  inputLabel: {
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 8,
  },
  fieldWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
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
  secondaryButton: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },
  secondaryButtonText: {
    fontSize: 14,
  },
  linksRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 14,
    marginTop: 18,
  },
  linkText: { fontSize: 13 },
  successCard: {
    padding: 20,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
  },
  successIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: {
    fontSize: 20,
    letterSpacing: -0.4,
    marginTop: 6,
  },
  successMessage: {
    fontSize: 13.5,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  instructionBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
    marginTop: 8,
    width: "100%",
  },
  instructionText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 17,
  },
});
