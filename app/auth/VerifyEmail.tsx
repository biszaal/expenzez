import React, { useState } from "react";
import { View, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, TextField, Card, Typography } from "../../components/ui";
import { useTheme } from "../../contexts/ThemeContext";
import { spacing } from "../../constants/theme";
import { authAPI } from "../../services/api";
import { useRouter } from "expo-router";

export default function VerifyEmail() {
  const { colors } = useTheme();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    setIsLoading(true);
    setError("");
    setMessage("");
    try {
      const result = await authAPI.confirmSignUp({ username, code });
      setMessage("Email verified! You can now log in.");
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    setError("");
    setMessage("");
    try {
      await authAPI.resendVerification({ email });
      setMessage("Verification email resent. Please check your inbox.");
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Resend failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.secondary }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={{ flex: 1, justifyContent: "center", padding: spacing.lg }}>
          <Card variant="elevated" padding="large">
            <Typography variant="h2" color="primary" align="center" style={{ marginBottom: spacing.md }}>
              Verify Your Email
            </Typography>
            <Typography variant="body" color="secondary" align="center" style={{ marginBottom: spacing.lg }}>
              Enter the verification code sent to your email after registration.
            </Typography>
            <TextField
              label="Username"
              placeholder="Your username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              required
            />
            <TextField
              label="Verification Code"
              placeholder="Enter code"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              required
            />
            <Button
              title={isLoading ? "Verifying..." : "Verify Email"}
              onPress={handleConfirm}
              disabled={isLoading}
              variant="primary"
              style={{ marginTop: spacing.md }}
            />
            <View style={{ height: spacing.lg }} />
            <TextField
              label="Email"
              placeholder="Your email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
            <Button
              title={isLoading ? "Resending..." : "Resend Verification Email"}
              onPress={handleResend}
              disabled={isLoading || !email}
              variant="secondary"
              style={{ marginTop: spacing.sm }}
            />
            {message ? (
              <Typography variant="body" color="primary" align="center" style={{ marginTop: spacing.md }}>
                {message}
              </Typography>
            ) : null}
            {error ? (
              <Typography variant="body" color="error" align="center" style={{ marginTop: spacing.md }}>
                {error}
              </Typography>
            ) : null}
            <Button
              title="Go to Login"
              onPress={() => router.replace("/auth/Login")}
              variant="outline"
              style={{ marginTop: spacing.lg }}
            />
          </Card>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
} 