import React from "react";
import { View } from "react-native";
import { Button, TextField, Card, Typography } from "../../components/ui";
import { useTheme } from "../../contexts/ThemeContext";
import { spacing } from "../../constants/theme";

export default function RegisterStep1({
  values,
  onChange,
  onNext,
  passwordError,
}: any) {
  const { colors } = useTheme();
  return (
    <Card variant="elevated" padding="large">
      <Typography
        variant="h2"
        color="primary"
        align="center"
        style={{ marginBottom: spacing.md }}
      >
        Create Account
      </Typography>
      <TextField
        label="Username"
        placeholder="Choose a username"
        value={values.username}
        onChangeText={(v) => onChange("username", v)}
        autoCapitalize="none"
        required
      />
      <TextField
        label="Email"
        placeholder="you@email.com"
        value={values.email}
        onChangeText={(v) => onChange("email", v)}
        keyboardType="email-address"
        autoCapitalize="none"
        required
      />
      <TextField
        label="Password"
        placeholder="••••••••"
        value={values.password}
        onChangeText={(v) => onChange("password", v)}
        secureTextEntry
        autoCapitalize="none"
        required
      />
      <TextField
        label="Confirm Password"
        placeholder="••••••••"
        value={values.confirmPassword}
        onChangeText={(v) => onChange("confirmPassword", v)}
        secureTextEntry
        autoCapitalize="none"
        required
      />
      {passwordError ? (
        <Typography
          variant="body"
          color="error"
          align="center"
          style={{ marginTop: spacing.sm }}
        >
          {passwordError}
        </Typography>
      ) : null}
      <Button title="Next" onPress={onNext} style={{ marginTop: spacing.lg }} />
    </Card>
  );
}
