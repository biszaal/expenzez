import React, { useState, useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Button, TextField, Typography } from "../../components/ui";
import { useTheme } from "../../contexts/ThemeContext";
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
    <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      {/* Header */}
      <View style={styles.header}>
        <Typography variant="h2" style={[styles.title, { color: colors.text.primary }]}>
          Personal Details
        </Typography>
        <Typography variant="body" style={[styles.subtitle, { color: colors.text.secondary }]}>
          Tell us your name and choose a username
        </Typography>
      </View>

      {/* Form Fields */}
      <View style={styles.formFields}>
        <View style={styles.inputContainer}>
          <Typography variant="body" style={[styles.inputLabel, { color: colors.text.primary }]} weight="medium">
            First Name
          </Typography>
          <TextField
            placeholder="Enter your first name"
            value={values.givenName}
            onChangeText={(v) => onChange("givenName", v)}
            autoCapitalize="words"
            placeholderTextColor={colors.text.tertiary}
          />
        </View>

        <View style={styles.inputContainer}>
          <Typography variant="body" style={[styles.inputLabel, { color: colors.text.primary }]} weight="medium">
            Last Name
          </Typography>
          <TextField
            placeholder="Enter your last name"
            value={values.familyName}
            onChangeText={(v) => onChange("familyName", v)}
            autoCapitalize="words"
            placeholderTextColor={colors.text.tertiary}
          />
        </View>

        <View style={styles.inputContainer}>
          <Typography variant="body" style={[styles.inputLabel, { color: colors.text.primary }]} weight="medium">
            Username
          </Typography>
          <TextField
            placeholder="Choose a unique username"
            value={values.username}
            onChangeText={(v) => onChange("username", v)}
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor={colors.text.tertiary}
          />

          {/* Username Status */}
          {values.username && values.username.length >= 3 && (
            <View style={styles.statusContainer}>
              {usernameStatus.checking ? (
                <>
                  <ActivityIndicator size="small" color={colors.primary[500]} />
                  <Typography variant="caption" style={[styles.statusText, { color: colors.text.secondary }]}>
                    Checking availability...
                  </Typography>
                </>
              ) : usernameStatus.exists === true ? (
                <>
                  <Ionicons name="close-circle" size={16} color={colors.error[500]} />
                  <Typography variant="caption" style={[styles.statusText, { color: colors.error[500] }]}>
                    Username taken. Choose another.
                  </Typography>
                </>
              ) : usernameStatus.exists === false ? (
                <>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success[500]} />
                  <Typography variant="caption" style={[styles.statusText, { color: colors.success[500] }]}>
                    Username available!
                  </Typography>
                </>
              ) : usernameStatus.error ? (
                <>
                  <Ionicons name="warning" size={16} color={colors.warning[500]} />
                  <Typography variant="caption" style={[styles.statusText, { color: colors.warning[500] }]}>
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
        style={[styles.continueButton, { backgroundColor: colors.primary[500] }]}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
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
    gap: 8,
  },
  statusText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  continueButton: {
    marginTop: 16,
    borderRadius: 10,
    paddingVertical: 14,
    minHeight: 48,
  },
});
