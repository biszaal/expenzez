// Updated Login screen using reusable components and global theme
import {
  AntDesign,
  FontAwesome,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../auth/AuthContext";
import { Button, TextField, Card, Typography } from "../../components/ui";
import { useTheme } from "../../contexts/ThemeContext";
import { spacing, borderRadius, shadows } from "../../constants/theme";
import { jwtDecode } from "jwt-decode";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAlert } from "../../hooks/useAlert";

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const { colors } = useTheme();
  const { showError, showSuccess } = useAlert();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  // loginError state removed, use alert instead

  const handleLogin = async () => {
    if (!identifier || !password) {
      showError("Please fill in all fields");
      return;
    }
    setIsLoading(true);
    try {
      const result = await login(identifier, password);
      console.log("[LoginScreen] login() result:", result);
      if (result.success) {
        // Optionally, auto-redirect to main app
        const idToken = await AsyncStorage.getItem("idToken");
        if (idToken) {
          const decoded: any = jwtDecode(idToken);
          setUserInfo(decoded);
        }
        showSuccess("Login successful!");
        router.replace("/(tabs)");
      } else {
        // Only show error if not success
        showError(result.error || "Login failed. Please try again.");
      }
    } catch (error: any) {
      console.log("[LoginScreen] login() threw error:", error);
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
      showError("Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background.secondary },
      ]}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.content}>
          {/* Header Section */}
          <View style={styles.header}>
            <View
              style={[
                styles.logoContainer,
                { backgroundColor: colors.primary[500] },
              ]}
            >
              <FontAwesome5 name="sign-in-alt" size={28} color="white" />
            </View>
            <Typography variant="h1" color="primary" align="center">
              Welcome Back
            </Typography>
            <Typography variant="body" color="secondary" align="center">
              Sign in to continue your financial journey
            </Typography>
          </View>

          {/* Optionally, show user info after login, but now auto-redirects */}

          {/* Login Form Card */}
          <Card variant="elevated" padding="large">
            <Typography
              variant="h2"
              color="primary"
              align="center"
              style={styles.formTitle}
            >
              Sign In
            </Typography>

            {/* Identifier Input */}
            <TextField
              label="Email or Username"
              placeholder="you@email.com or yourusername"
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              required
            />

            {/* Password Input */}
            <TextField
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              required
            />

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotPassword}>
              <Typography variant="caption" color="primary" weight="semibold">
                Forgot password?
              </Typography>
            </TouchableOpacity>

            {/* Login Button */}
            <Button
              title="Sign In"
              onPress={handleLogin}
              variant="primary"
              size="large"
              loading={isLoading}
              fullWidth
              style={styles.loginButton}
              disabled={isLoading}
            />

            {/* Register Link */}
            <TouchableOpacity
              style={styles.registerLink}
              onPress={() => router.push("/auth/Register")}
            >
              <Typography variant="body" color="secondary" align="center">
                New to Expenzez?{" "}
                <Typography variant="body" color="primary" weight="bold">
                  Create account
                </Typography>
              </Typography>
            </TouchableOpacity>

            {/* Divider */}
            <View
              style={[styles.divider, { borderColor: colors.border.light }]}
            >
              <View
                style={[
                  styles.dividerLine,
                  { backgroundColor: colors.border.light },
                ]}
              />
              <Typography
                variant="caption"
                color="tertiary"
                weight="semibold"
                style={styles.dividerText}
              >
                or
              </Typography>
              <View
                style={[
                  styles.dividerLine,
                  { backgroundColor: colors.border.light },
                ]}
              />
            </View>

            {/* Social Login Buttons */}
            <View style={styles.socialButtons}>
              {/* Social login buttons (not implemented) */}
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => showError("Google Login not implemented yet")}
              >
                <AntDesign name="google" size={20} color="#EA4335" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => showError("Facebook Login not implemented yet")}
              >
                <FontAwesome name="facebook" size={20} color="#4267B2" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => showError("Apple Login not implemented yet")}
              >
                <FontAwesome5 name="apple" size={20} color="#111" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => showError("X Login not implemented yet")}
              >
                <MaterialCommunityIcons
                  name="alpha-x-circle"
                  size={20}
                  color="#111"
                />
              </TouchableOpacity>
            </View>
          </Card>
        </View>
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
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    ...shadows.md,
  },
  formTitle: {
    marginBottom: spacing.lg,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: spacing.lg,
  },
  loginButton: {
    marginBottom: spacing.lg,
  },
  registerLink: {
    alignSelf: "center",
    marginBottom: spacing.lg,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    borderRadius: 1,
  },
  dividerText: {
    marginHorizontal: spacing.md,
  },
  socialButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  testLoginButton: {
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  socialButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    marginHorizontal: 4,
    ...shadows.sm,
  },
});
