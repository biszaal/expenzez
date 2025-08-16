import React, { useState, useEffect } from "react";
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
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { TextField, Typography } from "../../components/ui";
import { useTheme } from "../../contexts/ThemeContext";
import { spacing, borderRadius, layout } from "../../constants/theme";
import { useAlert } from "../../hooks/useAlert";
import { authAPI } from "../../services/api";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { showError, showSuccess } = useAlert();

  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [userEmail, setUserEmail] = useState(""); // Store email for success message
  const [resendCooldown, setResendCooldown] = useState(0);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSubmit = async () => {
    if (!username.trim()) {
      showError("Please enter your username");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authAPI.forgotPassword({ username: username.trim() });
      
      // Extract email from response if available
      const email = response?.email || "your registered email";
      setUserEmail(email);
      
      setEmailSent(true);
      setResendCooldown(60); // 60 second cooldown for resend
      showSuccess(`Password reset code sent to ${email}!`);
      
      // Auto-navigate after showing success message
      setTimeout(() => {
        router.push({
          pathname: "/auth/ResetPassword",
          params: { username: username.trim(), email: email }
        });
      }, 3000); // Reduced to 3 seconds for better UX
      
    } catch (error: any) {
      console.error("Forgot password error:", error);
      showError(error.response?.data?.message || "Failed to send reset code");
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
      console.error("Resend error:", error);
      showError("Failed to resend code");
    } finally {
      setIsLoading(false);
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
              {/* Clean Header Section */}
              <View style={styles.header}>
                {/* Back Button */}
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={[styles.backButton, { backgroundColor: colors.background.secondary }]}
                  accessibilityLabel="Go back"
                >
                  <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
                </TouchableOpacity>

                {/* Header Content */}
                <View style={styles.headerContent}>
                  <View style={[styles.iconContainer, { backgroundColor: '#8B5CF6' }]}>
                    <Ionicons name="lock-closed-outline" size={28} color="white" />
                  </View>
                  
                  <Typography
                    variant="h1"
                    style={[styles.title, { color: colors.text.primary }]}
                    align="center"
                  >
                    Reset Password
                  </Typography>
                  <Typography
                    variant="body"
                    style={[styles.subtitle, { color: colors.text.secondary }]}
                    align="center"
                  >
                    Enter your username and we'll send you a reset code
                  </Typography>
                </View>
              </View>

              {/* Clean Form Container */}
              <View style={styles.formSection}>
                <View style={[styles.formContainer, { backgroundColor: colors.background.secondary }]}>
                  <View style={styles.formContent}>
                    {/* Success State */}
                    {emailSent && (
                      <View style={styles.successContainer}>
                        <View style={[styles.successIcon, { backgroundColor: colors.success[500] }]}>
                          <Ionicons name="checkmark" size={28} color="white" />
                        </View>
                        
                        <Typography
                          variant="h2"
                          style={[styles.successTitle, { color: colors.text.primary }]}
                          align="center"
                        >
                          Code Sent
                        </Typography>
                        
                        <Typography
                          variant="body"
                          style={[styles.successMessage, { color: colors.text.secondary }]}
                          align="center"
                        >
                          Reset code sent to {userEmail}
                        </Typography>

                        <View style={[styles.instructionBox, { backgroundColor: colors.background.tertiary, borderColor: colors.border.light }]}>
                          <Typography variant="caption" style={[styles.instructionText, { color: colors.text.secondary }]}>
                            Check your email for the 6-digit code, then create your new password.
                          </Typography>
                        </View>

                        {/* Resend Button */}
                        <TouchableOpacity
                          style={[
                            styles.resendButton,
                            { 
                              backgroundColor: resendCooldown > 0 ? colors.gray[300] : '#8B5CF6',
                              opacity: resendCooldown > 0 ? 0.6 : 1
                            }
                          ]}
                          onPress={handleResend}
                          disabled={resendCooldown > 0 || isLoading}
                        >
                          <Typography variant="body" style={[styles.resendText, { color: 'white' }]}>
                            {resendCooldown > 0 
                              ? `Resend in ${resendCooldown}s`
                              : isLoading 
                              ? "Sending..."
                              : "Resend Code"
                            }
                          </Typography>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.continueButton, { backgroundColor: '#8B5CF6' }]}
                          onPress={() => {
                            router.push({
                              pathname: "/auth/ResetPassword",
                              params: { username: username.trim(), email: userEmail }
                            });
                          }}
                        >
                          <Typography variant="body" style={{ color: 'white' }} weight="semibold">
                            Continue
                          </Typography>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Form State */}
                    {!emailSent && (
                      <>
                        {/* Clean Username Input */}
                        <View style={styles.inputContainer}>
                          <Typography variant="body" style={[styles.inputLabel, { color: colors.text.primary }]} weight="medium">
                            Username
                          </Typography>
                          <TextField
                            placeholder="Enter your username"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                            autoCorrect={false}
                            style={[styles.input, { 
                              backgroundColor: colors.background.tertiary,
                              borderColor: colors.border.medium,
                              color: colors.text.primary
                            }]}
                          />
                        </View>

                        {/* Clean Submit Button */}
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
                          <Typography
                            variant="body"
                            weight="semibold"
                            style={{ color: 'white' }}
                          >
                            {isLoading ? 'Sending...' : 'Send Reset Code'}
                          </Typography>
                        </TouchableOpacity>

                        {/* Additional Links */}
                        <View style={styles.linksContainer}>
                          <TouchableOpacity
                            style={styles.linkButton}
                            onPress={() => router.push("/auth/ForgotUsername")}
                          >
                            <Typography variant="body" style={{ color: '#8B5CF6' }}>
                              Forgot username?
                            </Typography>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.linkButton}
                            onPress={() => router.push("/auth/Login")}
                          >
                            <Typography variant="body" style={{ color: colors.text.secondary }}>
                              Back to{" "}
                              <Typography variant="body" style={{ color: '#8B5CF6' }} weight="semibold">
                                Sign In
                              </Typography>
                            </Typography>
                          </TouchableOpacity>
                        </View>
                      </>
                    )}
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
  formSection: {
    marginBottom: spacing.lg,
  },
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

  // Clean Input
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

  // Clean Button
  submitButton: {
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: layout.buttonHeight,
  },

  // Links
  linksContainer: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.xl, // Extra padding at bottom
  },
  linkButton: {
    paddingVertical: spacing.sm,
  },

  // Success State
  successContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  successMessage: {
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
    maxWidth: '90%',
  },
  instructionBox: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 18,
    textAlign: 'center',
  },
  resendButton: {
    alignSelf: 'stretch',
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendText: {
    fontSize: 14,
    fontWeight: '600',
  },
  continueButton: {
    alignSelf: 'stretch',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: layout.buttonHeight,
  },
});