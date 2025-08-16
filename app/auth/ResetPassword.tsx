import React, { useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { TextField, Typography } from "../../components/ui";
import { useTheme } from "../../contexts/ThemeContext";
import { spacing, borderRadius, layout } from "../../constants/theme";
import { useAlert } from "../../hooks/useAlert";
import { authAPI } from "../../services/api";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const { showError, showSuccess } = useAlert();

  const [confirmationCode, setConfirmationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResendingCode, setIsResendingCode] = useState(false);

  const username = params.username as string;

  const handleSubmit = async () => {
    if (!confirmationCode.trim()) {
      showError("Please enter the confirmation code");
      return;
    }

    if (!newPassword.trim()) {
      showError("Please enter a new password");
      return;
    }

    if (newPassword.length < 8) {
      showError("Password must be at least 8 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      showError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      await authAPI.confirmForgotPassword({
        username,
        confirmationCode: confirmationCode.trim(),
        newPassword,
      });
      
      showSuccess("Password reset successfully!");
      
      // Navigate back to login
      router.replace("/auth/Login");
    } catch (error: any) {
      console.error("Reset password error:", error);
      showError(error.response?.data?.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsResendingCode(true);
    try {
      await authAPI.forgotPassword({ username });
      showSuccess("New reset code sent to your email!");
    } catch (error: any) {
      console.error("Resend code error:", error);
      showError(error.response?.data?.message || "Failed to resend code");
    } finally {
      setIsResendingCode(false);
    }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
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
              {/* Clean Header */}
              <View style={styles.header}>
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={[styles.backButton, { backgroundColor: colors.background.secondary }]}
                >
                  <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
                </TouchableOpacity>

                <View style={styles.headerContent}>
                  <View style={[styles.iconContainer, { backgroundColor: '#8B5CF6' }]}>
                    <Ionicons name="mail-outline" size={28} color="white" />
                  </View>
                  
                  <Typography variant="h1" style={[styles.title, { color: colors.text.primary }]} align="center">
                    Enter Reset Code
                  </Typography>
                  <Typography variant="body" style={[styles.subtitle, { color: colors.text.secondary }]} align="center">
                    Check your email for the 6-digit verification code
                  </Typography>
                </View>
              </View>

              {/* Clean Form */}
              <View>
                <View style={[styles.formContainer, { backgroundColor: colors.background.secondary }]}>
                  <View style={styles.formContent}>
                    <View style={[styles.usernameDisplay, { backgroundColor: colors.background.tertiary, borderColor: colors.border.medium }]}>
                      <View style={styles.usernameContent}>
                        <Typography variant="caption" style={[styles.usernameLabel, { color: colors.text.secondary }]}>
                          Resetting password for:
                        </Typography>
                        <Typography variant="body" style={[styles.usernameValue, { color: '#8B5CF6' }]} weight="semibold">
                          {username}
                        </Typography>
                      </View>
                    </View>

                    <View style={styles.inputContainer}>
                      <Typography variant="body" style={[styles.inputLabel, { color: colors.text.primary }]} weight="medium">
                        Verification Code
                      </Typography>
                      <TextField
                        placeholder="Enter 6-digit code"
                        value={confirmationCode}
                        onChangeText={setConfirmationCode}
                        keyboardType="number-pad"
                        style={[styles.input, { 
                          backgroundColor: colors.background.tertiary,
                          borderColor: colors.border.medium,
                          color: colors.text.primary
                        }]}
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Typography variant="body" style={[styles.inputLabel, { color: colors.text.primary }]} weight="medium">
                        New Password
                      </Typography>
                      <TextField
                        placeholder="Enter new password"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry={true}
                        style={[styles.input, { 
                          backgroundColor: colors.background.tertiary,
                          borderColor: colors.border.medium,
                          color: colors.text.primary
                        }]}
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Typography variant="body" style={[styles.inputLabel, { color: colors.text.primary }]} weight="medium">
                        Confirm Password
                      </Typography>
                      <TextField
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={true}
                        style={[styles.input, { 
                          backgroundColor: colors.background.tertiary,
                          borderColor: colors.border.medium,
                          color: colors.text.primary
                        }]}
                      />
                    </View>

                    <TouchableOpacity
                      style={styles.resendLink}
                      onPress={handleResendCode}
                      disabled={isResendingCode}
                    >
                      <Typography variant="body" style={{ color: '#8B5CF6' }}>
                        {isResendingCode ? "Sending..." : "Didn't receive code? Resend"}
                      </Typography>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.submitButton, 
                        { 
                          backgroundColor: '#8B5CF6',
                          opacity: isLoading ? 0.7 : 1 
                        }
                      ]}
                      onPress={handleSubmit}
                      disabled={isLoading}
                    >
                      <Typography variant="body" weight="semibold" style={{ color: 'white' }}>
                        {isLoading ? 'Resetting...' : 'Reset Password'}
                      </Typography>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.backToLoginLink}
                      onPress={() => router.push("/auth/Login")}
                    >
                      <Typography variant="body" style={{ color: colors.text.secondary }} align="center">
                        Remember your password?{" "}
                        <Typography variant="body" style={{ color: '#8B5CF6' }} weight="semibold">
                          Sign In
                        </Typography>
                      </Typography>
                    </TouchableOpacity>
                  </View>
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
    justifyContent: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.lg,
  },

  // Clean Header
  header: {
    marginBottom: spacing.lg,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: '85%',
  },

  // Clean Form
  formContainer: {
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  formContent: {
    padding: spacing.lg,
  },
  usernameDisplay: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  usernameContent: {
    alignItems: 'center',
  },
  usernameLabel: {
    marginBottom: spacing.xs,
    fontSize: 12,
  },
  usernameValue: {
    fontSize: 16,
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
  resendLink: {
    alignSelf: 'flex-end',
    marginBottom: spacing.md,
    paddingVertical: spacing.xs,
  },
  submitButton: {
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: layout.buttonHeight,
  },
  backToLoginLink: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingBottom: spacing.xl, // Extra padding at bottom
  },
});