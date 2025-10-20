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
      {/* Glass Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.activeStep}>
          <Typography variant="caption" style={styles.activeStepText}>1</Typography>
        </View>
        <View style={styles.progressLine} />
        <View style={styles.inactiveStep}>
          <Typography variant="caption" style={styles.stepText}>2</Typography>
        </View>
        <View style={styles.progressLine} />
        <View style={styles.inactiveStep}>
          <Typography variant="caption" style={styles.stepText}>3</Typography>
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
          Personal Details
        </Typography>
        <Typography variant="body" style={styles.subtitle}>
          Tell us your name and choose a username
        </Typography>
      </View>

      {/* Glass Form Fields */}
      <View style={styles.formFields}>
        <View style={styles.inputContainer}>
          <Typography variant="body" style={styles.inputLabel} weight="medium">
            First Name
          </Typography>
          <TextField
            placeholder="Enter your first name"
            value={values.givenName}
            onChangeText={(v) => onChange("givenName", v)}
            autoCapitalize="words"
            style={styles.input}
          />
        </View>

        <View style={styles.inputContainer}>
          <Typography variant="body" style={styles.inputLabel} weight="medium">
            Last Name
          </Typography>
          <TextField
            placeholder="Enter your last name"
            value={values.familyName}
            onChangeText={(v) => onChange("familyName", v)}
            autoCapitalize="words"
            style={styles.input}
          />
        </View>

        <View style={styles.inputContainer}>
          <Typography variant="body" style={styles.inputLabel} weight="medium">
            Username
          </Typography>
          <TextField
            placeholder="Choose a unique username"
            value={values.username}
            onChangeText={(v) => onChange("username", v)}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
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
  activeStep: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  inactiveStep: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressLine: {
    width: 24,
    height: 2,
    marginHorizontal: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  stepText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  activeStepText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
    color: 'white',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  formFields: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    color: 'white',
    marginBottom: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: 'white',
    minHeight: 48,
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
    color: 'white',
  },
  continueButton: {
    marginTop: spacing.lg,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    paddingVertical: 16,
    minHeight: 54,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
});
