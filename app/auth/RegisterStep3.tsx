import React, { useState, useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Button, TextField, Typography } from "../../components/ui";
import { useTheme } from "../../contexts/ThemeContext";
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
    <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      {/* Glass Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.completedStep}>
          <Ionicons name="checkmark" size={16} color="white" />
        </View>
        <View style={styles.completedLine} />
        <View style={styles.completedStep}>
          <Ionicons name="checkmark" size={16} color="white" />
        </View>
        <View style={styles.completedLine} />
        <View style={styles.activeStep}>
          <Typography variant="caption" style={styles.activeStepText}>3</Typography>
        </View>
        <View style={styles.progressLine} />
        <View style={styles.inactiveStep}>
          <Typography variant="caption" style={styles.stepText}>4</Typography>
        </View>
        <View style={styles.progressLine} />
        <View style={styles.inactiveStep}>
          <Typography variant="caption" style={styles.stepText}>5</Typography>
        </View>
      </View>

      {/* Glass Header */}
      <View style={styles.header}>
        <Typography variant="h2" style={styles.title}>
          Account Security
        </Typography>
        <Typography variant="body" style={styles.subtitle}>
          Set up your login credentials
        </Typography>
      </View>

      {/* Glass Form Fields */}
      <View style={styles.formFields}>
        {/* Email Field */}
        <View style={styles.inputContainer}>
          <Typography variant="body" style={styles.inputLabel} weight="medium">
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
            style={styles.input}
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
          <Typography variant="body" style={styles.inputLabel} weight="medium">
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
            style={styles.input}
          />
        </View>

        {/* Confirm Password Field */}
        <View style={styles.inputContainer}>
          <Typography variant="body" style={styles.inputLabel} weight="medium">
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
            style={styles.input}
          />
        </View>

        {/* Glass Password Requirements */}
        <View style={styles.requirementsContainer}>
          <Typography variant="caption" style={styles.requirementsTitle}>
            Password requirements:
          </Typography>

          <View style={styles.requirementItem}>
            <Ionicons
              name={values.password.length >= 8 ? "checkmark-circle" : "ellipse-outline"}
              size={16}
              color={values.password.length >= 8 ? "#10b981" : "rgba(255, 255, 255, 0.4)"}
            />
            <Typography variant="caption" style={styles.requirementText}>
              At least 8 characters
            </Typography>
          </View>

          <View style={styles.requirementItem}>
            <Ionicons
              name={/[A-Z]/.test(values.password) ? "checkmark-circle" : "ellipse-outline"}
              size={16}
              color={/[A-Z]/.test(values.password) ? "#10b981" : "rgba(255, 255, 255, 0.4)"}
            />
            <Typography variant="caption" style={styles.requirementText}>
              One uppercase letter
            </Typography>
          </View>

          <View style={styles.requirementItem}>
            <Ionicons
              name={/[a-z]/.test(values.password) ? "checkmark-circle" : "ellipse-outline"}
              size={16}
              color={/[a-z]/.test(values.password) ? "#10b981" : "rgba(255, 255, 255, 0.4)"}
            />
            <Typography variant="caption" style={styles.requirementText}>
              One lowercase letter
            </Typography>
          </View>

          <View style={styles.requirementItem}>
            <Ionicons
              name={/\d/.test(values.password) ? "checkmark-circle" : "ellipse-outline"}
              size={16}
              color={/\d/.test(values.password) ? "#10b981" : "rgba(255, 255, 255, 0.4)"}
            />
            <Typography variant="caption" style={styles.requirementText}>
              One number
            </Typography>
          </View>

          <View style={styles.requirementItem}>
            <Ionicons
              name={/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(values.password) ? "checkmark-circle" : "ellipse-outline"}
              size={16}
              color={/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(values.password) ? "#10b981" : "rgba(255, 255, 255, 0.4)"}
            />
            <Typography variant="caption" style={styles.requirementText}>
              One special character
            </Typography>
          </View>
        </View>

        {/* Error Message */}
        {currentError ? (
          <View style={styles.errorContainer}>
            <Ionicons name="warning" size={20} color="#ef4444" />
            <Typography variant="body" style={styles.errorText}>
              {currentError}
            </Typography>
          </View>
        ) : null}
      </View>

      {/* Glass Navigation Buttons */}
      <View style={styles.buttonContainer}>
        <Button
          title="Back"
          onPress={onBack}
          style={styles.backButton}
          textStyle={{ color: "white" }}
        />
        <Button
          title="Continue"
          onPress={handleNext}
          style={styles.continueButton}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  completedStep: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  activeStep: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  inactiveStep: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  completedLine: {
    width: 24,
    height: 2,
    marginHorizontal: 4,
    backgroundColor: 'transparent',
  },
  progressLine: {
    width: 24,
    height: 2,
    marginHorizontal: 4,
    backgroundColor: 'transparent',
  },
  stepText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'transparent',
  },
  activeStepText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'transparent',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  formFields: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    marginBottom: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 48,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    lineHeight: 16,
  },
  requirementsContainer: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  requirementsTitle: {
    fontSize: 12,
    marginBottom: 8,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  requirementText: {
    fontSize: 12,
    lineHeight: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  backButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 14,
    minHeight: 48,
  },
  continueButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 14,
    minHeight: 48,
  },
});