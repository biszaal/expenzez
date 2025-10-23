import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  View,
  StyleSheet,
  StatusBar,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../auth/AuthContext";
import { TextField, Typography } from "../../components/ui";
import { useTheme } from "../../contexts/ThemeContext";
import { jwtDecode } from "jwt-decode";
import * as SecureStore from "expo-secure-store";
import { useAlert } from "../../hooks/useAlert";
import {
  AppleSignInButton,
  useAppleSignIn,
} from "../../components/auth/AppleSignInButton";
import { RememberMeCheckbox } from "../../components/RememberMeCheckbox";

export default function Login() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { login, loginWithApple } = useAuth();
  const { colors, isDark } = useTheme();
  const { showError, showSuccess } = useAlert();
  const { handleAppleSignIn } = useAppleSignIn();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [messageShown, setMessageShown] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Handle incoming parameters from registration redirect
  useEffect(() => {
    if (params.email) {
      setIdentifier(params.email as string);
    } else if (params.phone) {
      setIdentifier(params.phone as string);
    }

    if (params.message && !messageShown) {
      showSuccess(params.message as string);
      setMessageShown(true);
    }
  }, [params, messageShown]);

  const handleLogin = async () => {
    if (!identifier || !password) {
      showError("Please fill in all fields");
      return;
    }
    setIsLoading(true);
    try {
      const result = await login(identifier.trim(), password, rememberMe);
      if (result.success) {
        const idToken = await SecureStore.getItemAsync("idToken", {
          keychainService: "expenzez-tokens",
        });
        if (idToken) {
          jwtDecode(idToken);
        }
        setIsNavigating(true);
        router.replace("/(tabs)");
        return;
      } else {
        if (result.needsEmailVerification) {
          router.replace({
            pathname: "/auth/EmailVerification",
            params: {
              email:
                result.email || (identifier.includes("@") ? identifier : ""),
              username:
                result.username ||
                (!identifier.includes("@") ? identifier : ""),
              password: password, // Pass password for auto-login after verification
              message: "Please verify your email to complete login.",
            },
          });
          return;
        }

        if (
          result.error &&
          (result.error.toLowerCase().includes("not confirmed") ||
            result.error.toLowerCase().includes("not verified") ||
            result.error.toLowerCase().includes("verify"))
        ) {
          router.replace({
            pathname: "/auth/EmailVerification",
            params: {
              email: identifier.includes("@") ? identifier : "",
              username: !identifier.includes("@") ? identifier : "",
              password: password, // Pass password for auto-login after verification
              message: "Please verify your email to complete login.",
            },
          });
          return;
        }

        showError(result.error || "Login failed. Please try again.");
      }
    } catch (error: any) {
      if (
        error.statusCode === 403 ||
        error.response?.status === 403 ||
        error.isEmailNotVerified ||
        error.response?.data?.error === "UserNotConfirmedException"
      ) {
        router.replace({
          pathname: "/auth/EmailVerification",
          params: {
            email: identifier.includes("@") ? identifier : "",
            username: !identifier.includes("@") ? identifier : "",
            password: password, // Pass password for auto-login after verification
            message: "Please verify your email to complete login.",
          },
        });
        return;
      }

      if (
        error?.message?.includes("Network Error") ||
        error?.message?.includes("timeout")
      ) {
        showError(
          "Unable to connect to server. Please check your internet connection."
        );
      } else {
        let userErrorMessage = "Login failed. Please try again.";

        if (error.response?.data?.message) {
          userErrorMessage = error.response.data.message;
        } else if (error.message && error.message !== "API request failed") {
          userErrorMessage = error.message;
        } else if (error.response?.data?.error) {
          userErrorMessage = error.response.data.error;
        }

        if (
          userErrorMessage.toLowerCase().includes("incorrect") ||
          userErrorMessage.toLowerCase().includes("password")
        ) {
          userErrorMessage =
            "Incorrect username or password. Please try again.";
        }

        showError(userErrorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    try {
      setIsLoading(true);
      const { tokenManager } = await import("../../services/tokenManager");
      await tokenManager.clearAllTokens();

      const credential = await handleAppleSignIn();

      if (!credential) {
        return;
      }

      if (credential) {
        const result = await loginWithApple(
          credential.identityToken,
          credential.authorizationCode,
          credential.user,
          credential.email,
          credential.fullName,
          rememberMe
        );

        if (result.success) {
          if (result.needsProfileCompletion) {
            router.replace({
              pathname: "/auth/AppleProfileCompletion",
              params: {
                user: JSON.stringify(result.user),
              },
            });
          } else {
            setIsNavigating(true);
            router.replace("/(tabs)");
            return;
          }
        } else {
          showError(result.error || "Apple Sign In failed. Please try again.");
        }
      }
    } catch (error: any) {
      if (error.code === "ERR_REQUEST_CANCELED") {
        return;
      }
      showError(error.message || "Apple Sign In failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isNavigating) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <View style={styles.successContainer}>
          <View style={[styles.successIconContainer, { backgroundColor: colors.primary[500] }]}>
            <Ionicons name="shield-checkmark" size={60} color="white" />
          </View>
          <Typography variant="h2" style={[styles.successTitle, { color: colors.text.primary }]}>
            Success!
          </Typography>
          <Typography variant="body" style={[styles.successSubtitle, { color: colors.text.secondary }]}>
            Loading your dashboard...
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

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
            <View style={[styles.iconCircle, { backgroundColor: colors.primary[500] + "15" }]}>
              <Ionicons name="lock-closed" size={48} color={colors.primary[500]} />
            </View>
          </View>

          {/* Form Content */}
          <View style={styles.formContent}>
            {/* Username Field */}
            <View style={styles.inputContainer}>
              <Typography variant="body" style={[styles.inputLabel, { color: colors.text.primary }]}>
                Username or Email
              </Typography>
              <TextField
                placeholder="Enter your username or email"
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
                editable={!isLoading}
                placeholderTextColor={colors.text.tertiary}
              />
            </View>

            {/* Password Field */}
            <View style={styles.inputContainer}>
              <Typography variant="body" style={[styles.inputLabel, { color: colors.text.primary }]}>
                Password
              </Typography>
              <TextField
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={true}
                autoCapitalize="none"
                editable={!isLoading}
                placeholderTextColor={colors.text.tertiary}
              />
            </View>

            {/* Remember Me & Forgot Password Row */}
            <View style={styles.optionsRow}>
              <View style={styles.rememberMeWrapper}>
                <RememberMeCheckbox
                  value={rememberMe}
                  onValueChange={setRememberMe}
                  label="Remember me"
                  lightText={false}
                />
              </View>
              <TouchableOpacity
                onPress={() => router.push("/auth/ForgotPassword")}
              >
                <Typography variant="body" style={[styles.forgotText, { color: colors.primary[500] }]}>
                  Forgot Password?
                </Typography>
              </TouchableOpacity>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.signInButton, { backgroundColor: colors.primary[500] }]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <Typography variant="body" style={styles.buttonText}>
                  Signing in...
                </Typography>
              ) : (
                <>
                  <Typography variant="body" style={styles.buttonText}>
                    Sign In
                  </Typography>
                  <Ionicons name="arrow-forward" size={18} color="white" />
                </>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border.light }]} />
              <Typography variant="caption" style={[styles.dividerText, { color: colors.text.tertiary }]}>
                or
              </Typography>
              <View style={[styles.dividerLine, { backgroundColor: colors.border.light }]} />
            </View>

            {/* Apple Sign In */}
            <AppleSignInButton
              onPress={handleAppleLogin}
              type="sign-in"
              disabled={isLoading}
            />

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <Typography variant="body" style={[styles.registerText, { color: colors.text.secondary }]}>
                New to Expenzez?{" "}
              </Typography>
              <TouchableOpacity onPress={() => router.push("/auth/Register")}>
                <Typography variant="body" style={[styles.registerTextBold, { color: colors.primary[500] }]}>
                  Create Account
                </Typography>
              </TouchableOpacity>
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
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  appLogo: {
    width: 110,
    height: 110,
    marginBottom: 16,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 0,
    letterSpacing: -0.5,
  },
  formContent: {
    paddingHorizontal: 0,
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
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    gap: 12,
  },
  rememberMeWrapper: {
    flex: 1,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: "600",
  },
  signInButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    paddingVertical: 14,
    marginBottom: 16,
    gap: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
  },
  registerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  registerText: {
    fontSize: 14,
  },
  registerTextBold: {
    fontSize: 14,
    fontWeight: "700",
  },
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  successIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  successTitle: {
    marginBottom: 10,
    fontSize: 32,
    fontWeight: "800",
  },
  successSubtitle: {
    fontSize: 16,
  },
});
