import React, { useState, useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Button, TextField, Typography } from "../../components/ui";
import { useTheme } from "../../contexts/ThemeContext";
import { spacing, borderRadius } from "../../constants/theme";
import { Ionicons } from "@expo/vector-icons";

export default function RegisterStep3({
  values,
  onChange,
  onNext,
  onBack,
  passwordError,
}: any) {
  const { colors } = useTheme();
  const [localPasswordError, setLocalPasswordError] = useState("");
  const [emailStatus, setEmailStatus] = useState<{
    checking: boolean;
    exists?: boolean;
    error?: string;
  }>({ checking: false });

  // Email format validation only (existence checked server-side)
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!values.email) {
      setEmailStatus({ checking: false });
      return;
    }

    if (!emailRegex.test(values.email)) {
      setEmailStatus({ 
        checking: false, 
        exists: false,
        error: "Please enter a valid email address"
      });
      return;
    }

    // Valid email format - show success
    setEmailStatus({
      checking: false,
      exists: false, // We assume available - server will validate during registration
      error: undefined
    });
  }, [values.email]);

  const handleNext = () => {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(values.email)) {
      setLocalPasswordError("Please enter a valid email address");
      return;
    }

    // Validate password match
    if (values.password !== values.confirmPassword) {
      setLocalPasswordError("Passwords do not match");
      return;
    }

    // Validate password strength
    if (values.password.length < 8) {
      setLocalPasswordError("Password must be at least 8 characters long");
      return;
    }

    const hasUpperCase = /[A-Z]/.test(values.password);
    const hasLowerCase = /[a-z]/.test(values.password);
    const hasNumbers = /\d/.test(values.password);
    const hasSymbols = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(values.password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSymbols) {
      setLocalPasswordError("Password must contain uppercase, lowercase, number, and symbol");
      return;
    }

    setLocalPasswordError("");
    onNext();
  };

  const currentError = passwordError || localPasswordError;

  return (
    <View style={styles.container}>
      {/* Clean Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={StyleSheet.flatten([styles.progressStep, styles.completedStep, { backgroundColor: colors.background.tertiary, borderColor: '#8B5CF6' }])}>
          <Ionicons name="checkmark" size={16} color="#8B5CF6" />
        </View>
        <View style={StyleSheet.flatten([styles.progressLine, { backgroundColor: '#8B5CF6' }])} />
        <View style={StyleSheet.flatten([styles.progressStep, styles.completedStep, { backgroundColor: colors.background.tertiary, borderColor: '#8B5CF6' }])}>
          <Ionicons name="checkmark" size={16} color="#8B5CF6" />
        </View>
        <View style={StyleSheet.flatten([styles.progressLine, { backgroundColor: '#8B5CF6' }])} />
        <View style={StyleSheet.flatten([styles.progressStep, styles.activeStep, { backgroundColor: '#8B5CF6' }])}>
          <Typography variant="caption" style={styles.activeStepText}>3</Typography>
        </View>
        <View style={StyleSheet.flatten([styles.progressLine, { backgroundColor: colors.border.medium }])} />
        <View style={StyleSheet.flatten([styles.progressStep, { backgroundColor: colors.background.tertiary }])}>
          <Typography variant="caption" style={StyleSheet.flatten([styles.stepText, { color: colors.text.tertiary }])}>4</Typography>
        </View>
        <View style={StyleSheet.flatten([styles.progressLine, { backgroundColor: colors.border.medium }])} />
        <View style={StyleSheet.flatten([styles.progressStep, { backgroundColor: colors.background.tertiary }])}>
          <Typography variant="caption" style={StyleSheet.flatten([styles.stepText, { color: colors.text.tertiary }])}>5</Typography>
        </View>
      </View>

      {/* Clean Header */}
      <View style={styles.header}>
        <Typography variant="h2" style={StyleSheet.flatten([styles.title, { color: colors.text.primary }])}>
          Account Security
        </Typography>
        <Typography variant="body" style={StyleSheet.flatten([styles.subtitle, { color: colors.text.secondary }])}>
          Set up your login credentials
        </Typography>
      </View>

      {/* Clean Form Fields */}
      <View style={styles.formFields}>
        {/* Email Field */}
        <View style={styles.inputContainer}>
          <Typography variant="body" style={StyleSheet.flatten([styles.inputLabel, { color: colors.text.primary }])} weight="medium">
            Email Address
          </Typography>
          <TextField
            placeholder="Enter your email address"
            value={values.email}
            onChangeText={(v) => {
              onChange("email", v);
              setLocalPasswordError("");
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="emailAddress"
            style={StyleSheet.flatten([styles.input, {
              backgroundColor: colors.background.tertiary,
              borderColor: colors.border.medium,
              color: colors.text.primary
            }])}
          />
          
          {/* Clean Email Status */}
          {values.email && (
            <View style={styles.statusContainer}>
              {emailStatus.error ? (
                <>
                  <Ionicons name="close-circle" size={16} color={colors.error[500]} />
                  <Typography variant="caption" style={StyleSheet.flatten([styles.statusText, { color: colors.error[600] }])}>
                    {emailStatus.error}
                  </Typography>
                </>
              ) : values.email.includes('@') && !emailStatus.error ? (
                <>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success[500]} />
                  <Typography variant="caption" style={StyleSheet.flatten([styles.statusText, { color: colors.success[600] }])}>
                    Valid email format
                  </Typography>
                </>
              ) : null}
            </View>
          )}
        </View>

        {/* Password Field */}
        <View style={styles.inputContainer}>
          <Typography variant="body" style={StyleSheet.flatten([styles.inputLabel, { color: colors.text.primary }])} weight="medium">
            Password
          </Typography>
          <TextField
            placeholder="Create a strong password"
            value={values.password}
            onChangeText={(v) => {
              onChange("password", v);
              setLocalPasswordError("");
            }}
            secureTextEntry={true}
            autoCapitalize="none"
            textContentType="newPassword"
            passwordRules="minlength: 8; required: lower; required: upper; required: digit; required: special;"
            style={StyleSheet.flatten([styles.input, {
              backgroundColor: colors.background.tertiary,
              borderColor: colors.border.medium,
              color: colors.text.primary
            }])}
          />
        </View>

        {/* Confirm Password Field */}
        <View style={styles.inputContainer}>
          <Typography variant="body" style={StyleSheet.flatten([styles.inputLabel, { color: colors.text.primary }])} weight="medium">
            Confirm Password
          </Typography>
          <TextField
            placeholder="Re-enter your password"
            value={values.confirmPassword}
            onChangeText={(v) => {
              onChange("confirmPassword", v);
              setLocalPasswordError("");
            }}
            secureTextEntry={true}
            autoCapitalize="none"
            textContentType="newPassword"
            style={StyleSheet.flatten([styles.input, {
              backgroundColor: colors.background.tertiary,
              borderColor: colors.border.medium,
              color: colors.text.primary
            }])}
          />
        </View>

        {/* Clean Password Requirements */}
        <View style={StyleSheet.flatten([styles.requirementsContainer, { 
          backgroundColor: colors.background.tertiary, 
          borderColor: colors.border.light
        }])}>
          <Typography variant="caption" style={StyleSheet.flatten([styles.requirementsTitle, { color: colors.text.secondary }])}>
            Password requirements:
          </Typography>
          
          <View style={styles.requirementItem}>
            <Ionicons 
              name={values.password.length >= 8 ? "checkmark-circle" : "ellipse-outline"} 
              size={16} 
              color={values.password.length >= 8 ? colors.success[500] : colors.text.tertiary} 
            />
            <Typography variant="caption" style={StyleSheet.flatten([styles.requirementText, { color: colors.text.tertiary }])}>
              At least 8 characters
            </Typography>
          </View>
          
          <View style={styles.requirementItem}>
            <Ionicons 
              name={/[A-Z]/.test(values.password) ? "checkmark-circle" : "ellipse-outline"} 
              size={16} 
              color={/[A-Z]/.test(values.password) ? colors.success[500] : colors.text.tertiary} 
            />
            <Typography variant="caption" style={StyleSheet.flatten([styles.requirementText, { color: colors.text.tertiary }])}>
              One uppercase letter
            </Typography>
          </View>
          
          <View style={styles.requirementItem}>
            <Ionicons 
              name={/[a-z]/.test(values.password) ? "checkmark-circle" : "ellipse-outline"} 
              size={16} 
              color={/[a-z]/.test(values.password) ? colors.success[500] : colors.text.tertiary} 
            />
            <Typography variant="caption" style={StyleSheet.flatten([styles.requirementText, { color: colors.text.tertiary }])}>
              One lowercase letter
            </Typography>
          </View>
          
          <View style={styles.requirementItem}>
            <Ionicons 
              name={/\d/.test(values.password) ? "checkmark-circle" : "ellipse-outline"} 
              size={16} 
              color={/\d/.test(values.password) ? colors.success[500] : colors.text.tertiary} 
            />
            <Typography variant="caption" style={StyleSheet.flatten([styles.requirementText, { color: colors.text.tertiary }])}>
              One number
            </Typography>
          </View>
          
          <View style={styles.requirementItem}>
            <Ionicons 
              name={/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(values.password) ? "checkmark-circle" : "ellipse-outline"} 
              size={16} 
              color={/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(values.password) ? colors.success[500] : colors.text.tertiary} 
            />
            <Typography variant="caption" style={StyleSheet.flatten([styles.requirementText, { color: colors.text.tertiary }])}>
              One special character
            </Typography>
          </View>
        </View>

        {/* Error Message */}
        {currentError ? (
          <View style={StyleSheet.flatten([styles.errorContainer, { 
            backgroundColor: colors.error[50], 
            borderColor: colors.error[200]
          }])}>
            <Ionicons name="warning" size={20} color={colors.error[500]} />
            <Typography variant="body" style={StyleSheet.flatten([styles.errorText, { color: colors.error[700] }])}>
              {currentError}
            </Typography>
          </View>
        ) : null}
      </View>

      {/* Navigation Buttons */}
      <View style={styles.buttonContainer}>
        <Button 
          title="Back" 
          onPress={onBack} 
          style={StyleSheet.flatten([styles.backButton, { backgroundColor: colors.background.tertiary, borderColor: colors.border.medium }])}
          textStyle={{ color: colors.text.primary }}
        />
        <Button 
          title="Continue" 
          onPress={handleNext}
          style={StyleSheet.flatten([styles.continueButton, { backgroundColor: '#8B5CF6' }])}
          disabled={
            !values.email || 
            !values.password || 
            !values.confirmPassword ||
            !!emailStatus.error
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: spacing.md,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  progressStep: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedStep: {
    borderWidth: 2,
  },
  activeStep: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  progressLine: {
    width: 24,
    height: 2,
    marginHorizontal: 4,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeStepText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  formFields: {
    paddingHorizontal: spacing.lg,
    flex: 1,
  },
  inputContainer: {
    marginBottom: spacing.lg,
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
    minHeight: 44,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  statusText: {
    marginLeft: spacing.xs,
    fontSize: 12,
    lineHeight: 16,
  },
  requirementsContainer: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  requirementsTitle: {
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  requirementText: {
    marginLeft: spacing.xs,
    fontSize: 12,
    lineHeight: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  errorText: {
    marginLeft: spacing.sm,
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  backButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 2,
    minHeight: 44,
  },
  continueButton: {
    flex: 1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 2,
    minHeight: 44,
  },
});