import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button, TextField, Typography } from "../../components/ui";
import { useTheme } from "../../contexts/ThemeContext";
import { useAlert } from "../../hooks/useAlert";
import { spacing, borderRadius } from "../../constants/theme";
import { authAPI } from "../../services/api";
import { useAuth } from "./AuthContext";

export default function EmailVerification() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const { showError, showSuccess } = useAlert();

  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { autoLoginAfterVerification } = useAuth();

  useEffect(() => {
    if (params.email) {
      setEmail(params.email as string);
    } else if (params.username) {
      // If we have username but no email, we'll use the username for verification
      // AWS Cognito allows using username in confirmation
      setEmail(params.username as string);
    }
    if (params.password) {
      setPassword(params.password as string);
    }
  }, [params]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleVerification = async () => {
    if (!verificationCode.trim()) {
      showError("Please enter the verification code");
      return;
    }

    if (verificationCode.length !== 6) {
      showError("Verification code must be 6 digits");
      return;
    }

    setIsVerifying(true);
    try {
      const result = await authAPI.confirmSignUp({
        username: email,
        code: verificationCode,
      });

      // If no error thrown, verification was successful
      if (password) {
        // Auto-login after verification (from registration flow)
        showSuccess("Email verified! Logging you in...");
        try {
          const autoLoginResult = await autoLoginAfterVerification(email, password);
          if (autoLoginResult.success) {
            showSuccess("Welcome! You're now logged in.");
            setTimeout(() => {
              router.replace("/(tabs)"); // Navigate to main app
            }, 1500);
          } else {
            showError("Auto-login failed. Please log in manually.");
            setTimeout(() => {
              router.replace({
                pathname: "/auth/Login",
                params: { 
                  email: email, 
                  message: "Email verified! Please log in to continue." 
                }
              });
            }, 2000);
          }
        } catch (autoLoginError) {
          console.error("Auto-login error:", autoLoginError);
          showError("Auto-login failed. Please log in manually.");
          setTimeout(() => {
            router.replace({
              pathname: "/auth/Login",
              params: { 
                email: email, 
                message: "Email verified! Please log in to continue." 
              }
            });
          }, 2000);
        }
      } else {
        // No password (came from login flow) - redirect back to login
        showSuccess("Email verified! You can now log in.");
        setTimeout(() => {
          router.replace({
            pathname: "/auth/Login",
            params: { 
              email: email, 
              message: "Email verified successfully! Please enter your password." 
            }
          });
        }, 1500);
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      let errorMsg = "Verification failed. Please try again.";
      
      if (error.response?.data?.message) {
        if (error.response.data.message.includes("Invalid verification code")) {
          errorMsg = "Invalid verification code. Please check and try again.";
        } else if (error.response.data.message.includes("expired")) {
          errorMsg = "Verification code has expired. Please request a new one.";
        } else if (error.response.data.message.includes("already confirmed")) {
          if (password) {
            // Auto-login if email already verified (from registration)
            showSuccess("Email already verified! Logging you in...");
            try {
              const autoLoginResult = await autoLoginAfterVerification(email, password);
              if (autoLoginResult.success) {
                showSuccess("Welcome! You're now logged in.");
                setTimeout(() => {
                  router.replace("/(tabs)"); // Navigate to main app
                }, 1500);
                return;
              }
            } catch (autoLoginError) {
              console.error("Auto-login error:", autoLoginError);
            }
          }
          // Email already verified - redirect back to login immediately
          showSuccess("Email already verified! You can log in now.");
          setTimeout(() => {
            router.replace({
              pathname: "/auth/Login",
              params: { 
                email: email, 
                message: "Email already verified! Please enter your password." 
              }
            });
          }, 1500);
          return;
        }
      }
      
      showError(errorMsg);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0) return;

    setIsResending(true);
    try {
      // Send both email and username to backend, let it decide which to use
      const requestData: { email?: string; username?: string } = {};
      
      if (params.email) {
        requestData.email = params.email as string;
      } else if (params.username) {
        requestData.username = params.username as string;
      } else {
        // Fallback to the email state (which might contain username)
        if (email && email.includes('@')) {
          requestData.email = email;
        } else {
          requestData.username = email;
        }
      }
      
      console.log("Resending verification with data:", requestData);
      const result = await authAPI.resendVerification(requestData);
      
      // If no error thrown, resend was successful
      showSuccess("Verification code sent! Check your email.");
      setResendTimer(60); // 60 second cooldown
    } catch (error: any) {
      console.error("Resend error:", error);
      showError("Failed to resend code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <SafeAreaView style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background.primary }])}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={StyleSheet.flatten([styles.backButton, { backgroundColor: colors.background.secondary }])}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.primary[500]} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <View style={StyleSheet.flatten([styles.iconContainer, { backgroundColor: colors.primary[100] }])}>
            <Ionicons name="mail-outline" size={48} color={colors.primary[500]} />
          </View>
          
          <Typography variant="h2" style={StyleSheet.flatten([styles.title, { color: colors.text.primary }])}>
            Verify Your Email
          </Typography>
          
          <Typography variant="body" style={StyleSheet.flatten([styles.subtitle, { color: colors.text.secondary }])}>
            {params.email ? 
              "We've sent a 6-digit verification code to:" : 
              "Enter the 6-digit verification code sent to your email:"
            }
          </Typography>
          
          <Typography variant="body" style={StyleSheet.flatten([styles.email, { color: colors.primary[500] }])} weight="semibold">
            {params.email || (params.username ? "your registered email" : email)}
          </Typography>
        </View>
      </View>

      {/* Verification Form */}
      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Typography variant="body" style={StyleSheet.flatten([styles.inputLabel, { color: colors.text.primary }])} weight="medium">
            Verification Code
          </Typography>
          <TextField
            placeholder="Enter 6-digit code"
            value={verificationCode}
            onChangeText={(text) => setVerificationCode(text.replace(/[^0-9]/g, '').slice(0, 6))}
            keyboardType="numeric"
            style={StyleSheet.flatten([styles.input, {
              backgroundColor: colors.background.tertiary,
              borderColor: colors.border.medium,
            }])}
            inputStyle={{
              color: colors.text.primary,
              textAlign: 'center',
              fontSize: 24,
              letterSpacing: 8,
            }}
          />
        </View>

        {/* Verify Button */}
        <Button
          title={isVerifying ? "Verifying..." : "Verify Email"}
          onPress={handleVerification}
          style={StyleSheet.flatten([styles.verifyButton, { backgroundColor: colors.primary[500] }])}
          disabled={isVerifying || verificationCode.length !== 6}
        />

        {/* Resend Code */}
        <View style={styles.resendContainer}>
          <Typography variant="body" style={StyleSheet.flatten([styles.resendText, { color: colors.text.secondary }])}>
            Didn't receive the code?
          </Typography>
          
          <TouchableOpacity
            onPress={handleResendCode}
            disabled={isResending || resendTimer > 0}
            style={styles.resendButton}
          >
            {isResending ? (
              <ActivityIndicator size="small" color={colors.primary[500]} />
            ) : (
              <Typography 
                variant="body" 
                style={StyleSheet.flatten([
                  styles.resendButtonText, 
                  { 
                    color: resendTimer > 0 ? colors.text.tertiary : colors.primary[500] 
                  }
                ])} 
                weight="medium"
              >
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
              </Typography>
            )}
          </TouchableOpacity>
        </View>

        {/* Help Text */}
        <View style={StyleSheet.flatten([styles.helpContainer, { backgroundColor: colors.background.tertiary, borderColor: colors.border.light }])}>
          <Ionicons name="information-circle" size={20} color={colors.text.secondary} />
          <Typography variant="caption" style={StyleSheet.flatten([styles.helpText, { color: colors.text.secondary }])}>
            Check your spam folder if you don't see the email. The code expires in 24 hours.
          </Typography>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  headerContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  email: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  inputContainer: {
    marginBottom: spacing.xl,
  },
  inputLabel: {
    marginBottom: spacing.sm,
    fontSize: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    fontSize: 24,
    minHeight: 60,
  },
  verifyButton: {
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.xl,
    minHeight: 50,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  resendText: {
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  resendButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  resendButtonText: {
    fontSize: 14,
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  helpText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
});