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
import { typography, spacing, borderRadius } from "../../constants/theme";
import { useTheme } from "../../contexts/ThemeContext";

interface TextFieldProps {
  label?: string;
  placeholder?: string;
  placeholderTextColor?: string;
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
  editable?: boolean;
  required?: boolean;
  style?: ViewStyle | ViewStyle[];
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  // iOS-specific password autofill props
  textContentType?:
    | "none"
    | "URL"
    | "addressCity"
    | "addressCityAndState"
    | "addressState"
    | "countryName"
    | "creditCardNumber"
    | "emailAddress"
    | "familyName"
    | "fullStreetAddress"
    | "givenName"
    | "jobTitle"
    | "location"
    | "middleName"
    | "name"
    | "namePrefix"
    | "nameSuffix"
    | "nickname"
    | "organizationName"
    | "postalCode"
    | "streetAddressLine1"
    | "streetAddressLine2"
    | "sublocality"
    | "telephoneNumber"
    | "username"
    | "password"
    | "newPassword";
  passwordRules?: string;
  autoComplete?:
    | "off"
    | "username"
    | "password"
    | "email"
    | "name"
    | "tel"
    | "street-address"
    | "postal-code"
    | "cc-number"
    | "cc-csc"
    | "cc-exp"
    | "cc-exp-month"
    | "cc-exp-year"
    | "new-password"
    | "current-password"
    | "one-time-code";
}

export default function TextField({
  label,
  placeholder,
  placeholderTextColor,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "none",
  autoCorrect = false,
  error,
  disabled = false,
  editable = true,
  required = false,
  style,
  inputStyle,
  labelStyle,
  textContentType,
  passwordRules,
  autoComplete,
}: TextFieldProps) {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const containerStyle = [styles.container, style];

  const getInputContainerStyle = () => {
    const baseStyle = {
      backgroundColor: colors.background.secondary,
      borderRadius: borderRadius.lg,
      borderWidth: 2,
      borderColor: colors.border.light,
      flexDirection: "row" as const,
      alignItems: "center" as const,
    };

    if (isFocused) {
      return {
        ...baseStyle,
        borderColor: colors.primary.main,
        backgroundColor: colors.background.primary,
      };
    }

    if (error) {
      return {
        ...baseStyle,
        borderColor: colors.error.main,
      };
    }

    if (disabled) {
      return {
        ...baseStyle,
        backgroundColor: colors.gray[100],
        opacity: 0.6,
      };
    }

    return baseStyle;
  };

  const getLabelStyle = () => {
    return {
      fontSize: typography.fontSizes.sm,
      fontWeight: typography.fontWeights.semibold,
      color: colors.text.primary,
      marginBottom: spacing.sm,
    };
  };

  const getInputStyle = () => {
    return {
      flex: 1,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      fontSize: typography.fontSizes.base,
      fontWeight: typography.fontWeights.medium,
      color: colors.text.primary,
    };
  };

  const getErrorStyle = () => {
    return {
      fontSize: typography.fontSizes.sm,
      color: colors.error.main,
      marginTop: spacing.xs,
    };
  };

  const inputContainerStyle = [getInputContainerStyle()];
  const inputStyleArray = [getInputStyle(), inputStyle] as any;
  const labelStyleArray = [getLabelStyle(), labelStyle] as any;

  return (
    <View style={containerStyle}>
      {label && (
        <Text style={labelStyleArray}>
          {label}
          {required && <Text style={{ color: colors.error.main }}> *</Text>}
        </Text>
      )}

      <View style={inputContainerStyle}>
        <TextInput
          style={inputStyleArray}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor || colors.text.muted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          editable={editable && !disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          textContentType={textContentType}
          passwordRules={passwordRules}
          autoComplete={autoComplete}
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

      {error && <Text style={getErrorStyle()}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },

  eyeIcon: {
    paddingHorizontal: spacing.md,
  },
});
