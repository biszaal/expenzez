import React, { useState, useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Button, TextField, Typography } from "../../components/ui";
import { useTheme } from "../../contexts/ThemeContext";
import { spacing, borderRadius } from "../../constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { authAPI } from "../../services/api";

export default function RegisterStep1({
  values,
  onChange,
  onNext,
}: any) {
  const { colors } = useTheme();
  const [usernameStatus, setUsernameStatus] = useState<{
    checking: boolean;
    exists?: boolean;
    error?: string;
  }>({ checking: false });
  
  // Debounced username check
  useEffect(() => {
    if (!values.username || values.username.length < 3) {
      setUsernameStatus({ checking: false });
      return;
    }

    const timeoutId = setTimeout(async () => {
      setUsernameStatus({ checking: true });
      try {
        const result = await authAPI.checkUsernameExists(values.username);
        setUsernameStatus({
          checking: false,
          exists: result.exists,
          error: result.error
        });
      } catch (error) {
        setUsernameStatus({
          checking: false,
          exists: false,
          error: "Unable to verify username availability"
        });
      }
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [values.username]);
  
  const handleNext = () => {
    // Validate required fields
    if (!values.givenName.trim() || !values.familyName.trim() || !values.username.trim()) {
      return;
    }

    // Check if username exists
    if (usernameStatus.exists) {
      return;
    }
    
    onNext();
  };

  return (
    <View style={styles.container}>
      {/* Clean Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={StyleSheet.flatten([styles.progressStep, styles.activeStep, { backgroundColor: '#8B5CF6' }])}>
          <Typography variant="caption" style={styles.activeStepText}>1</Typography>
        </View>
        <View style={StyleSheet.flatten([styles.progressLine, { backgroundColor: colors.border.medium }])} />
        <View style={StyleSheet.flatten([styles.progressStep, { backgroundColor: colors.background.tertiary }])}>
          <Typography variant="caption" style={StyleSheet.flatten([styles.stepText, { color: colors.text.tertiary }])}>2</Typography>
        </View>
        <View style={StyleSheet.flatten([styles.progressLine, { backgroundColor: colors.border.medium }])} />
        <View style={StyleSheet.flatten([styles.progressStep, { backgroundColor: colors.background.tertiary }])}>
          <Typography variant="caption" style={StyleSheet.flatten([styles.stepText, { color: colors.text.tertiary }])}>3</Typography>
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
          Personal Details
        </Typography>
        <Typography variant="body" style={StyleSheet.flatten([styles.subtitle, { color: colors.text.secondary }])}>
          Tell us your name and choose a username
        </Typography>
      </View>

      {/* Clean Form Fields */}
      <View style={styles.formFields}>
        <View style={styles.inputContainer}>
          <Typography variant="body" style={StyleSheet.flatten([styles.inputLabel, { color: colors.text.primary }])} weight="medium">
            First Name
          </Typography>
          <TextField
            placeholder="Enter your first name"
            value={values.givenName}
            onChangeText={(v) => onChange("givenName", v)}
            autoCapitalize="words"
            style={StyleSheet.flatten([styles.input, {
              backgroundColor: colors.background.tertiary,
              borderColor: colors.border.medium,
              color: colors.text.primary
            }])}
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Typography variant="body" style={StyleSheet.flatten([styles.inputLabel, { color: colors.text.primary }])} weight="medium">
            Last Name
          </Typography>
          <TextField
            placeholder="Enter your last name"
            value={values.familyName}
            onChangeText={(v) => onChange("familyName", v)}
            autoCapitalize="words"
            style={StyleSheet.flatten([styles.input, {
              backgroundColor: colors.background.tertiary,
              borderColor: colors.border.medium,
              color: colors.text.primary
            }])}
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Typography variant="body" style={StyleSheet.flatten([styles.inputLabel, { color: colors.text.primary }])} weight="medium">
            Username
          </Typography>
          <TextField
            placeholder="Choose a unique username"
            value={values.username}
            onChangeText={(v) => onChange("username", v)}
            autoCapitalize="none"
            autoCorrect={false}
            style={StyleSheet.flatten([styles.input, {
              backgroundColor: colors.background.tertiary,
              borderColor: colors.border.medium,
              color: colors.text.primary
            }])}
          />
          
          {/* Clean Username Status */}
          {values.username && values.username.length >= 3 && (
            <View style={styles.statusContainer}>
              {usernameStatus.checking ? (
                <>
                  <ActivityIndicator size="small" color="#8B5CF6" />
                  <Typography variant="caption" style={StyleSheet.flatten([styles.statusText, { color: colors.text.secondary }])}>
                    Checking availability...
                  </Typography>
                </>
              ) : usernameStatus.exists === true ? (
                <>
                  <Ionicons name="close-circle" size={16} color={colors.error[500]} />
                  <Typography variant="caption" style={StyleSheet.flatten([styles.statusText, { color: colors.error[600] }])}>
                    Username taken. Choose another.
                  </Typography>
                </>
              ) : usernameStatus.exists === false ? (
                <>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success[500]} />
                  <Typography variant="caption" style={StyleSheet.flatten([styles.statusText, { color: colors.success[600] }])}>
                    Username available!
                  </Typography>
                </>
              ) : usernameStatus.error ? (
                <>
                  <Ionicons name="warning" size={16} color={colors.warning[500]} />
                  <Typography variant="caption" style={StyleSheet.flatten([styles.statusText, { color: colors.warning[600] }])}>
                    {usernameStatus.error}
                  </Typography>
                </>
              ) : null}
            </View>
          )}
        </View>
      </View>

      <Button 
        title="Continue" 
        onPress={handleNext} 
        style={StyleSheet.flatten([styles.continueButton, { backgroundColor: '#8B5CF6' }])}
        disabled={
          !values.givenName.trim() || 
          !values.familyName.trim() || 
          !values.username.trim() || 
          usernameStatus.checking ||
          usernameStatus.exists === true
        }
      />
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
    paddingHorizontal: spacing.md,
  },
  progressStep: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingHorizontal: spacing.md,
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
    paddingHorizontal: spacing.md,
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
  continueButton: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 2,
    minHeight: 44,
  },
});
