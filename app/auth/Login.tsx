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
  Alert,
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

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const { colors } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        router.replace("/(tabs)");
      } else {
        Alert.alert(
          "Login Failed",
          result.error || "Please check your credentials."
        );
      }
    } catch (err) {
      Alert.alert("Login Failed", "Please check your credentials.");
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

            {/* Email Input */}
            <TextField
              label="Email"
              placeholder="you@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
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

            {/* Test Login Button */}
            <TouchableOpacity
              style={[
                styles.testLoginButton,
                {
                  backgroundColor: colors.secondary[100],
                  borderColor: colors.secondary[300],
                },
              ]}
              onPress={async () => {
                setEmail("test@example.com");
                setPassword("password123");
                // Auto-login after setting values
                setTimeout(() => {
                  handleLogin();
                }, 100);
              }}
            >
              <Typography variant="body" color="secondary" align="center">
                Quick Test Login
              </Typography>
            </TouchableOpacity>

            {/* Social Login Buttons */}
            <View style={styles.socialButtons}>
              <TouchableOpacity
                style={[
                  styles.socialButton,
                  {
                    backgroundColor: colors.background.primary,
                    borderColor: colors.border.light,
                  },
                ]}
                onPress={() => Alert.alert("Google Login")}
              >
                <AntDesign name="google" size={20} color="#EA4335" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.socialButton,
                  {
                    backgroundColor: colors.background.primary,
                    borderColor: colors.border.light,
                  },
                ]}
                onPress={() => Alert.alert("Facebook Login")}
              >
                <FontAwesome name="facebook" size={20} color="#4267B2" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.socialButton,
                  {
                    backgroundColor: colors.background.primary,
                    borderColor: colors.border.light,
                  },
                ]}
                onPress={() => Alert.alert("Apple Login")}
              >
                <FontAwesome5 name="apple" size={20} color="#111" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.socialButton,
                  {
                    backgroundColor: colors.background.primary,
                    borderColor: colors.border.light,
                  },
                ]}
                onPress={() => Alert.alert("X Login")}
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
