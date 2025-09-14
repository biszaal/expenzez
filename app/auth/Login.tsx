// Clean and Professional Login Screen
import {
  Ionicons,
} from "@expo/vector-icons";
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
import { TextField, Typography, LoadingScreen } from "../../components/ui";
import { useTheme } from "../../contexts/ThemeContext";
import { spacing, borderRadius, layout } from "../../constants/theme";
import { jwtDecode } from "jwt-decode";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAlert } from "../../hooks/useAlert";
import { AppleSignInButton, useAppleSignIn } from "../../components/auth/AppleSignInButton";
import { RememberMeCheckbox } from "../../components/RememberMeCheckbox";

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
      const result = await login(identifier, password, rememberMe);
      if (result.success) {
        // Optionally, auto-redirect to main app
        const idToken = await AsyncStorage.getItem("idToken");
        if (idToken) {
          jwtDecode(idToken);
        }
        setIsNavigating(true);
        
        // Immediate navigation without delay
        router.replace("/(tabs)");
        return; // Return early to prevent finally block from executing
      } else {
        // Debug: Log the result error for debugging
        console.log("Login failed with error:", result.error);

        // Check if it's an email verification error before showing generic error
        if (
          result.error &&
          (result.error.toLowerCase().includes("not confirmed") ||
            result.error.toLowerCase().includes("not verified") ||
            result.error.toLowerCase().includes("verify") ||
            result.error.toLowerCase().includes("email address not verified"))
        ) {
          console.log(
            "Detected email verification error, redirecting to EmailVerification page"
          );
          // Immediately redirect to email verification
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

        // Only show error if not email verification issue
        showError(result.error || "Login failed. Please try again.");
      }
    } catch (error: any) {
      console.error("Login error details:", error);

      // Check for email verification error first - redirect immediately
      if (
        error.response?.status === 403 ||
        error.response?.data?.error === "UserNotConfirmedException" ||
        error.response?.data?.message
          ?.toLowerCase()
          .includes("not confirmed") ||
        error.response?.data?.message?.toLowerCase().includes("not verified") ||
        error.response?.data?.message?.toLowerCase().includes("verify")
      ) {
        // Immediately redirect to email verification without showing error
        router.replace({
          pathname: "/auth/EmailVerification",
          params: {
            email: identifier.includes("@") ? identifier : "",
            message: "Please verify your email to complete login.",
          },
        });
        return;
      }

      // Detect network/server error
      if (
        error?.message?.includes("Network Error") ||
        error?.message?.includes("timeout") ||
        error?.toString().includes("Network Error") ||
        error?.toString().includes("timeout")
      ) {
        showError(
          "Unable to connect to server. Please check your internet connection or try again later."
        );
      } else {
        // Check for other specific errors
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Login failed. Please try again.";
        showError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    try {
      setIsLoading(true);
      const credential = await handleAppleSignIn();
      
      if (!credential) {
        // User canceled the sign-in process - do not show error, just return silently
        return;
      }
      
      if (credential) {
        // Use the loginWithApple method from AuthContext
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
            // Redirect to profile completion screen
            router.replace({
              pathname: "/auth/AppleProfileCompletion",
              params: {
                user: JSON.stringify(result.user),
              },
            });
          } else {
            setIsNavigating(true);
            
            // Immediate navigation without delay
            router.replace("/(tabs)");
            return; // Return early to prevent finally block from executing
          }
        } else {
          showError(result.error || "Apple Sign In failed. Please try again.");
        }
      }
    } catch (error: any) {
      console.error('🍎 [Login] Apple Sign In error:', error);
      
      // Handle different types of Apple Sign In errors
      if (error.code === 'ERR_REQUEST_CANCELED') {
        // User canceled - do not show error message
        console.log('🍎 [Login] User canceled Apple Sign In');
        return;
      } else if (error.code === 'ERR_INVALID_RESPONSE') {
        showError('Apple Sign In encountered an issue. Please try again.');
      } else if (error.message?.includes('not available') || error.message?.includes('development build')) {
        showError('Apple Sign In requires a development build. Please use "npx expo run:ios" or regular login for now.');
      } else if (error.message?.includes('Dev Build Required')) {
        showError('Apple Sign In is not supported in Expo Go. Please use regular login or create a development build.');
      } else if (error.message?.includes('network')) {
        showError('Network error during Apple Sign In. Please check your connection.');
      } else {
        // Generic fallback error
        const errorMsg = error.message || 'Apple Sign In failed. Please try again or use regular login.';
        showError(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };
  // Show full-screen loading during login process or navigation
  if (isLoading || isNavigating) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#6366F1",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 100,
            height: 100,
            backgroundColor: "white",
            borderRadius: 50,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <Ionicons name="shield-checkmark" size={60} color="#6366F1" />
        </View>
        <Typography
          variant="h2"
          style={{ color: "white", marginBottom: 10, textAlign: "center" }}
        >
          {isNavigating ? "Success!" : "Signing you in..."}
        </Typography>
        <Typography
          variant="body"
          style={{ color: "rgba(255,255,255,0.8)", textAlign: "center" }}
        >
          {isNavigating ? "Loading your dashboard..." : "Securing your connection..."}
        </Typography>
      </View>
    );
  }

  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.background.primary}
      />
      <View
        style={StyleSheet.flatten([
          styles.container,
          {
            backgroundColor: isLoading ? "#FF0000" : colors.background.primary,
          },
        ])}
      >
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
              {/* Clean Header Section */}
              <View style={styles.header}>
                <View
                  style={StyleSheet.flatten([
                    styles.logoContainer,
                    { backgroundColor: colors.primary[500] },
                  ])}
                >
                  <Ionicons name="wallet-outline" size={32} color="white" />
                </View>

                <Typography
                  variant="h1"
                  style={StyleSheet.flatten([
                    styles.welcomeTitle,
                    { color: colors.text.primary },
                  ])}
                  align="center"
                >
                  {isLoading ? "LOADING TEST ACTIVE!" : "Welcome Back"}
                </Typography>
                <Typography
                  variant="body"
                  style={StyleSheet.flatten([
                    styles.welcomeSubtitle,
                    { color: colors.text.secondary },
                  ])}
                  align="center"
                >
                  Sign in to your account
                </Typography>
              </View>

              {/* Clean Login Form */}
              <View
                style={StyleSheet.flatten([
                  styles.formContainer,
                  { backgroundColor: colors.background.secondary },
                ])}
              >
                <View style={styles.formContent}>
                  {/* Clean Input Fields */}
                  <View style={styles.inputContainer}>
                    <Typography
                      variant="body"
                      style={StyleSheet.flatten([
                        styles.inputLabel,
                        { color: colors.text.primary },
                      ])}
                      weight="medium"
                    >
                      Username
                    </Typography>
                    <TextField
                      placeholder="Enter your username"
                      value={identifier}
                      onChangeText={setIdentifier}
                      autoCapitalize="none"
                      style={StyleSheet.flatten([
                        styles.input,
                        {
                          backgroundColor: colors.background.tertiary,
                          borderColor: colors.border.medium,
                          color: colors.text.primary,
                        },
                      ])}
                    />
                    {/* Show helpful message when redirected from registration */}
                    {(params.email || params.phone) && (
                      <View
                        style={StyleSheet.flatten([
                          styles.redirectInfo,
                          {
                            backgroundColor: colors.success[50],
                            borderColor: colors.success[200],
                          },
                        ])}
                      >
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color={colors.success[500]}
                        />
                        <Typography
                          variant="caption"
                          style={StyleSheet.flatten([
                            styles.redirectText,
                            { color: colors.success[700] },
                          ])}
                        >
                          We found your account! Please enter your password to
                          continue.
                        </Typography>
                      </View>
                    )}
                  </View>

                  <View style={styles.inputContainer}>
                    <Typography
                      variant="body"
                      style={StyleSheet.flatten([
                        styles.inputLabel,
                        { color: colors.text.primary },
                      ])}
                      weight="medium"
                    >
                      Password
                    </Typography>
                    <TextField
                      placeholder="Enter your password"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={true}
                      autoCapitalize="none"
                      style={StyleSheet.flatten([
                        styles.input,
                        {
                          backgroundColor: colors.background.tertiary,
                          borderColor: colors.border.medium,
                          color: colors.text.primary,
                        },
                      ])}
                    />
                  </View>

                  {/* Remember Me Checkbox */}
                  <View style={styles.checkboxContainer}>
                    <RememberMeCheckbox
                      value={rememberMe}
                      onValueChange={setRememberMe}
                      label="Remember me on this device"
                    />
                  </View>

                  {/* Forgot Password */}
                  <TouchableOpacity
                    style={styles.forgotPassword}
                    onPress={() => router.push("/auth/ForgotPassword")}
                  >
                    <Typography
                      variant="body"
                      style={{ color: colors.primary[500] }}
                    >
                      Forgot password?
                    </Typography>
                  </TouchableOpacity>

                  {/* Enhanced Login Button */}
                  <View
                    style={StyleSheet.flatten([
                      styles.loginButton,
                      {
                        backgroundColor: colors.primary[500],
                      },
                    ])}
                  >
                    <TouchableOpacity
                      style={styles.loginButtonInner}
                      onPress={handleLogin}
                      disabled={isLoading}
                    >
                      <Typography
                        variant="body"
                        weight="semibold"
                        style={{ color: "white" }}
                      >
                        Sign In
                      </Typography>
                    </TouchableOpacity>
                  </View>

                  {/* Apple Sign In */}
                  <AppleSignInButton 
                    onPress={handleAppleLogin} 
                    type="sign-in"
                    disabled={isLoading}
                  />

                  {/* Or Divider */}
                  <View style={styles.dividerContainer}>
                    <View style={[styles.dividerLine, { backgroundColor: colors.border.medium }]} />
                    <Typography
                      variant="caption"
                      style={[styles.dividerText, { color: colors.text.secondary }]}
                    >
                      or
                    </Typography>
                    <View style={[styles.dividerLine, { backgroundColor: colors.border.medium }]} />
                  </View>

                  {/* Register Link */}
                  <TouchableOpacity
                    style={styles.registerLink}
                    onPress={() => router.push("/auth/Register")}
                  >
                    <Typography
                      variant="body"
                      style={{ color: colors.text.secondary }}
                      align="center"
                    >
                      New to Expenzez?{" "}
                      <Typography
                        variant="body"
                        style={{ color: colors.primary[500] }}
                        weight="semibold"
                      >
                        Create Account
                      </Typography>
                    </Typography>
                  </TouchableOpacity>

                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.lg,
  },

  // Clean Header
  header: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: spacing.sm,
  },
  welcomeSubtitle: {
    fontSize: 16,
    textAlign: "center",
    maxWidth: "80%",
    lineHeight: 22,
  },

  // Clean Form
  formContainer: {
    borderRadius: borderRadius.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  formContent: {
    padding: spacing.lg,
  },

  // Clean Inputs
  inputContainer: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    marginBottom: spacing.xs,
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 16,
    minHeight: layout.inputHeight,
  },

  // Remember Me Checkbox
  checkboxContainer: {
    marginBottom: spacing.sm,
    paddingVertical: spacing.xs,
  },

  // Clean Buttons
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: spacing.md,
    paddingVertical: spacing.xs,
  },
  loginButton: {
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    minHeight: layout.buttonHeight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  loginButtonInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm + 2,
  },
  registerLink: {
    alignSelf: "center",
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
  },

  // Divider Styles
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    fontSize: 12,
  },

  // Redirect Info Styles
  redirectInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  redirectText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
});
