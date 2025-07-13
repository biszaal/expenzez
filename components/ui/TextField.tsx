import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  colors,
  typography,
  spacing,
  borderRadius,
} from "../../constants/theme";

interface TextFieldProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?:
    | "default"
    | "email-address"
    | "numeric"
    | "phone-pad"
    | "number-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoCorrect?: boolean;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
}

export default function TextField({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "none",
  autoCorrect = false,
  error,
  disabled = false,
  required = false,
  style,
  inputStyle,
  labelStyle,
}: TextFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const containerStyle = [styles.container, style];

  const inputContainerStyle = [
    styles.inputContainer,
    isFocused && styles.inputContainerFocused,
    error && styles.inputContainerError,
    disabled && styles.inputContainerDisabled,
  ];

  const inputStyleArray = [styles.input, inputStyle];

  const labelStyleArray = [
    styles.label,
    required && styles.labelRequired,
    labelStyle,
  ];

  return (
    <View style={containerStyle}>
      {label && (
        <Text style={labelStyleArray}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}

      <View style={inputContainerStyle}>
        <TextInput
          style={inputStyleArray}
          placeholder={placeholder}
          placeholderTextColor={colors.text.tertiary}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          editable={!disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        {secureTextEntry && (
          <Ionicons
            name={showPassword ? "eye-off" : "eye"}
            size={20}
            color={colors.text.tertiary}
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          />
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },

  label: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },

  labelRequired: {
    color: colors.error[500],
  },

  required: {
    color: colors.error[500],
  },

  inputContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border.light,
    flexDirection: "row",
    alignItems: "center",
  },

  inputContainerFocused: {
    borderColor: colors.primary[500],
    backgroundColor: colors.background.primary,
  },

  inputContainerError: {
    borderColor: colors.error[500],
  },

  inputContainerDisabled: {
    backgroundColor: colors.gray[100],
    opacity: 0.6,
  },

  input: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.medium,
    color: colors.text.primary,
  },

  eyeIcon: {
    paddingHorizontal: spacing.md,
  },

  errorText: {
    fontSize: typography.fontSizes.sm,
    color: colors.error[500],
    marginTop: spacing.xs,
  },
});
