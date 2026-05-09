import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  Pressable,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path, Text as SvgText } from "react-native-svg";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { jwtDecode } from "jwt-decode";
import * as SecureStore from "expo-secure-store";
import { useAlert } from "../../hooks/useAlert";
import {
  AppleSignInButton,
  useAppleSignIn,
} from "../../components/auth/AppleSignInButton";
import { GoogleSignInButton } from "../../components/auth/GoogleSignInButton";
import { analyticsService } from "../../services/analytics";
import { fontFamily } from "../../constants/theme";

// v1.5 redesign — wordmark + tagline header, hairline inputs,
// gradient primary button, segmented social row.

const BrandLogo: React.FC<{ size?: number; primary: string; primaryDim: string }> = ({
  size = 64,
  primary,
  primaryDim,
}) => {
  return (
    <LinearGradient
      colors={[primary, primaryDim]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: primary,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
        elevation: 10,
      }}
    >
      <Svg width={size * 0.55} height={size * 0.55} viewBox="0 0 32 32">
        <Path
          d="M5 24 L13 14 L18 18 L27 8"
          stroke="#fff"
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M22 8 L27 8 L27 13"
          stroke="#fff"
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <SvgText x="6" y="14" fontSize="10" fontWeight="800" fill="#fff">
          £
        </SvgText>
      </Svg>
    </LinearGradient>
  );
};

interface AuthFieldProps {
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  value: string;
  placeholder: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  editable?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  colors: any;
}

const AuthField: React.FC<AuthFieldProps> = ({
  label,
  iconName,
  value,
  placeholder,
  onChangeText,
  secureTextEntry,
  editable = true,
  autoCapitalize = "none",
  colors,
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: 12 }}>
      <Text
        style={{
          fontSize: 11,
          color: colors.text.tertiary,
          letterSpacing: 1,
          fontFamily: fontFamily.semibold,
          marginBottom: 8,
        }}
      >
        {label}
      </Text>
      <View
        style={[
          styles.fieldWrap,
          {
            backgroundColor: colors.card.background,
            borderColor: focused ? colors.primary[500] : colors.border.medium,
          },
        ]}
      >
        <Ionicons
          name={iconName}
          size={17}
          color={focused ? colors.primary[500] : colors.text.tertiary}
        />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.text.tertiary}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            color: colors.text.primary,
            fontFamily: secureTextEntry && value ? fontFamily.mono : fontFamily.medium,
            fontSize: 15,
            letterSpacing: secureTextEntry && value ? 4 : 0,
            paddingVertical: 0,
          }}
        />
      </View>
    </View>
  );
};

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

  const handleUnverifiedAccount = async (
    userIdentifier: string,
    userPassword: string
  ) => {
    router.replace({
      pathname: "/auth/EmailVerification",
      params: {
        email: userIdentifier.includes("@") ? userIdentifier : "",
        username: !userIdentifier.includes("@") ? userIdentifier : "",
        password: userPassword,
        message:
          "Your account is not verified. Please check your email for the verification code.",
        autoResend: "true",
      },
    });
  };

  const handleLogin = async () => {
    if (!identifier || !password) {
      showError("Please fill in all fields");
      return;
    }
    setIsLoading(true);
    try {
      const result = await login(identifier.trim(), password, rememberMe);
      if (result.success) {
        analyticsService.logLogin("email");
        const idToken = await SecureStore.getItemAsync("idToken", {
          keychainService: "expenzez-tokens",
        });
        if (idToken) jwtDecode(idToken);
        setIsNavigating(true);
        router.replace("/(tabs)");
        return;
      } else {
        if (result.needsEmailVerification) {
          await handleUnverifiedAccount(identifier.trim(), password);
          return;
        }

        if (
          result.error &&
          (result.error.toLowerCase().includes("not confirmed") ||
            result.error.toLowerCase().includes("not verified") ||
            result.error.toLowerCase().includes("verify"))
        ) {
          await handleUnverifiedAccount(identifier.trim(), password);
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
        await handleUnverifiedAccount(identifier.trim(), password);
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
          error.response?.status === 400 &&
          (userErrorMessage.toLowerCase().includes("incorrect") ||
            userErrorMessage.toLowerCase().includes("password") ||
            userErrorMessage.toLowerCase().includes("not authorized"))
        ) {
          await handleUnverifiedAccount(identifier.trim(), password);
          return;
        } else if (
          userErrorMessage.toLowerCase().includes("incorrect") ||
          userErrorMessage.toLowerCase().includes("password")
        ) {
          userErrorMessage = "Incorrect username or password. Please try again.";
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
      if (!credential) return;

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
            pathname: "/auth/AppleProfileFlow",
            params: { user: JSON.stringify(result.user) },
          });
        } else {
          setIsNavigating(true);
          router.replace("/(tabs)");
          return;
        }
      } else {
        showError(result.error || "Apple Sign In failed. Please try again.");
      }
    } catch (error: any) {
      if (error.code === "ERR_REQUEST_CANCELED") return;
      showError(error.message || "Apple Sign In failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async (idToken: string, user: any) => {
    try {
      setIsLoading(true);
      const { api } = await import("../../services/config/apiClient");
      const response = await api.post("/auth/google-login", { idToken, user });

      if (response.data && response.data.tokens) {
        const { tokenManager } = await import("../../services/tokenManager");
        await tokenManager.storeTokens({
          idToken: response.data.tokens.idToken,
          accessToken: response.data.tokens.accessToken,
          refreshToken: response.data.tokens.refreshToken,
        });
        setIsNavigating(true);
        router.replace("/(tabs)");
        return;
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error: any) {
      let errorMessage = "Google Sign In failed. Please try again.";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isNavigating) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background.primary }]}
      >
        <View style={styles.successContainer}>
          <BrandLogo size={80} primary={colors.primary[500]} primaryDim={colors.primary[600]} />
          <Text
            style={[
              styles.successTitle,
              { color: colors.text.primary, fontFamily: fontFamily.semibold },
            ]}
          >
            Welcome back
          </Text>
          <Text
            style={[
              styles.successSubtitle,
              { color: colors.text.secondary, fontFamily: fontFamily.medium },
            ]}
          >
            Loading your dashboard…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Top glow */}
      <LinearGradient
        colors={
          isDark
            ? ["rgba(157,91,255,0.28)", "rgba(157,91,255,0)"]
            : ["rgba(123,63,228,0.16)", "rgba(123,63,228,0)"]
        }
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.45 }}
        pointerEvents="none"
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <BrandLogo size={68} primary={colors.primary[500]} primaryDim={colors.primary[600]} />
          <Text
            style={[
              styles.title,
              { color: colors.text.primary, fontFamily: fontFamily.semibold },
            ]}
          >
            Welcome back
            <Text style={{ color: colors.primary[500] }}>.</Text>
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: colors.text.secondary, fontFamily: fontFamily.medium },
            ]}
          >
            Sign in to continue managing{"\n"}your money smartly.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <AuthField
            label="USERNAME OR EMAIL"
            iconName="person-outline"
            value={identifier}
            placeholder="you@expenzez.com"
            onChangeText={setIdentifier}
            editable={!isLoading}
            colors={colors}
          />

          <AuthField
            label="PASSWORD"
            iconName="lock-closed-outline"
            value={password}
            placeholder="Your password"
            onChangeText={setPassword}
            secureTextEntry
            editable={!isLoading}
            colors={colors}
          />

          {/* Remember + forgot */}
          <View style={styles.optionsRow}>
            <Pressable
              onPress={() => setRememberMe(!rememberMe)}
              style={styles.rememberRow}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: rememberMe
                      ? colors.primary[500]
                      : "transparent",
                    borderColor: rememberMe
                      ? colors.primary[500]
                      : colors.border.medium,
                  },
                ]}
              >
                {rememberMe && (
                  <Ionicons name="checkmark" size={12} color="#fff" />
                )}
              </View>
              <Text
                style={[
                  styles.rememberText,
                  { color: colors.text.secondary, fontFamily: fontFamily.medium },
                ]}
              >
                Remember me
              </Text>
            </Pressable>
            <Pressable onPress={() => router.push("/auth/ForgotPassword")}>
              <Text
                style={[
                  styles.forgotText,
                  { color: colors.primary[500], fontFamily: fontFamily.semibold },
                ]}
              >
                Forgot?
              </Text>
            </Pressable>
          </View>

          {/* Primary button */}
          <Pressable
            onPress={handleLogin}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.primaryButton,
              { opacity: pressed || isLoading ? 0.85 : 1 },
            ]}
          >
            <LinearGradient
              colors={[colors.primary[500], colors.primary[600]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.primaryButtonGradient,
                {
                  shadowColor: colors.primary[500],
                },
              ]}
            >
              <Text style={styles.primaryButtonText}>
                {isLoading ? "Signing in…" : "Sign in"}
              </Text>
              {!isLoading && (
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              )}
            </LinearGradient>
          </Pressable>

          {/* Divider */}
          <View style={styles.divider}>
            <View
              style={[styles.dividerLine, { backgroundColor: colors.border.medium }]}
            />
            <Text
              style={[
                styles.dividerText,
                { color: colors.text.tertiary, fontFamily: fontFamily.semibold },
              ]}
            >
              OR CONTINUE WITH
            </Text>
            <View
              style={[styles.dividerLine, { backgroundColor: colors.border.medium }]}
            />
          </View>

          {/* Apple / Google */}
          <AppleSignInButton
            onPress={handleAppleLogin}
            type="sign-in"
            disabled={isLoading}
          />
          <GoogleSignInButton
            onPress={handleGoogleLogin}
            type="sign-in"
            disabled={isLoading}
          />

          {/* Register link */}
          <View style={styles.registerContainer}>
            <Text
              style={[
                styles.registerText,
                { color: colors.text.secondary, fontFamily: fontFamily.medium },
              ]}
            >
              New to Expenzez?{" "}
            </Text>
            <Pressable onPress={() => router.push("/auth/Register")}>
              <Text
                style={[
                  styles.registerTextBold,
                  { color: colors.primary[500], fontFamily: fontFamily.semibold },
                ]}
              >
                Create account
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 32,
    paddingBottom: 32,
  },
  header: { alignItems: "center", marginBottom: 32 },
  title: {
    fontSize: 28,
    letterSpacing: -0.6,
    marginTop: 22,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 6,
    textAlign: "center",
    lineHeight: 20,
  },
  form: { gap: 0 },
  fieldWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 14,
  },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  rememberText: { fontSize: 13 },
  forgotText: { fontSize: 13 },
  primaryButton: {
    borderRadius: 18,
    overflow: "hidden",
    marginTop: 6,
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
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 18,
  },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
  dividerText: { fontSize: 11, letterSpacing: 1 },
  registerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },
  registerText: { fontSize: 14 },
  registerTextBold: { fontSize: 14 },
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 22,
    gap: 16,
  },
  successTitle: {
    fontSize: 28,
    letterSpacing: -0.6,
    marginTop: 8,
  },
  successSubtitle: { fontSize: 14 },
});
