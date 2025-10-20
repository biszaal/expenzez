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
  Dimensions,
  Animated,
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
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

const { width } = Dimensions.get("window");

export default function Login() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { login, loginWithApple } = useAuth();
  const { colors } = useTheme();
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
      showError(
        error.message || "Apple Sign In failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isNavigating) {
    return (
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.successContainer}>
          <View style={styles.successIconContainer}>
            <Ionicons name="shield-checkmark" size={60} color="white" />
          </View>
          <Typography variant="h2" style={styles.successTitle}>
            Success!
          </Typography>
          <Typography variant="body" style={styles.successSubtitle}>
            Loading your dashboard...
          </Typography>
        </View>
      </LinearGradient>
    );
  }

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
              <View style={styles.logoContainer}>
                <View style={styles.logoCircle}>
                  <Ionicons name="wallet" size={40} color="white" />
                </View>
              </View>
              <Typography variant="h1" style={styles.title}>
                Welcome Back
              </Typography>
              <Typography variant="body" style={styles.subtitle}>
                Sign in to continue to Expenzez
              </Typography>
            </View>

            {/* Glass Form Container */}
            <BlurView intensity={40} tint="light" style={styles.glassCard}>
              <View style={styles.formContent}>
                {/* Username Field */}
                <View style={styles.inputContainer}>
                  <Typography variant="body" style={styles.inputLabel}>
                    Username or Email
                  </Typography>
                  <TextField
                    placeholder="Enter your username or email"
                    value={identifier}
                    onChangeText={setIdentifier}
                    autoCapitalize="none"
                    editable={!isLoading}
                    style={styles.input}
                  />
                </View>

                {/* Password Field */}
                <View style={styles.inputContainer}>
                  <Typography variant="body" style={styles.inputLabel}>
                    Password
                  </Typography>
                  <TextField
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={true}
                    autoCapitalize="none"
                    editable={!isLoading}
                    style={styles.input}
                  />
                </View>

                {/* Remember Me & Forgot Password Row */}
                <View style={styles.optionsRow}>
                  <View style={styles.rememberMeWrapper}>
                    <RememberMeCheckbox
                      value={rememberMe}
                      onValueChange={setRememberMe}
                      label="Remember me"
                      lightText={true}
                    />
                  </View>
                  <TouchableOpacity
                    onPress={() => router.push("/auth/ForgotPassword")}
                    style={styles.forgotButton}
                  >
                    <Typography variant="body" style={styles.forgotText}>
                      Forgot Password?
                    </Typography>
                  </TouchableOpacity>
                </View>

                {/* Sign In Button */}
                <TouchableOpacity
                  style={styles.signInButton}
                  onPress={handleLogin}
                  disabled={isLoading}
                  activeOpacity={0.9}
                >
                  <BlurView intensity={30} tint="light" style={styles.buttonBlur}>
                    {isLoading ? (
                      <Typography variant="body" style={styles.buttonText}>
                        Signing in...
                      </Typography>
                    ) : (
                      <>
                        <Typography variant="body" style={styles.buttonText}>
                          Sign In
                        </Typography>
                        <Ionicons name="arrow-forward" size={20} color="white" />
                      </>
                    )}
                  </BlurView>
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Typography variant="caption" style={styles.dividerText}>
                    or
                  </Typography>
                  <View style={styles.dividerLine} />
                </View>

                {/* Apple Sign In */}
                <AppleSignInButton
                  onPress={handleAppleLogin}
                  type="sign-in"
                  disabled={isLoading}
                />

                {/* Register Link */}
                <TouchableOpacity
                  style={styles.registerLink}
                  onPress={() => router.push("/auth/Register")}
                >
                  <Typography variant="body" style={styles.registerText}>
                    New to Expenzez?{" "}
                    <Typography variant="body" style={styles.registerTextBold}>
                      Create Account
                    </Typography>
                  </Typography>
                </TouchableOpacity>
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
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.85)",
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
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 20,
    gap: 12,
  },
  rememberMeWrapper: {
    flex: 1,
    minWidth: 0,
  },
  forgotButton: {
    flexShrink: 0,
  },
  forgotText: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
  },
  signInButton: {
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
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  dividerText: {
    color: "rgba(255, 255, 255, 0.7)",
    marginHorizontal: 12,
    fontSize: 13,
  },
  registerLink: {
    alignItems: "center",
    marginTop: 12,
    paddingVertical: 8,
  },
  registerText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 15,
  },
  registerTextBold: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  successIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  successTitle: {
    color: "white",
    marginBottom: 10,
    fontSize: 32,
    fontWeight: "800",
  },
  successSubtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 16,
  },
});
