import React from "react";
import { View } from "react-native";
import { Button, TextField, Card, Typography } from "../../components/ui";
import { useTheme } from "../../contexts/ThemeContext";
import { spacing } from "../../constants/theme";

export default function RegisterStep2({
  values,
  onChange,
  onNext,
  onBack,
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
        Personal Info
      </Typography>
      <TextField
        label="Full Name"
        placeholder="Your name"
        value={values.name}
        onChangeText={(v) => onChange("name", v)}
        autoCapitalize="words"
        required
      />
      <TextField
        label="Given Name (First Name)"
        placeholder="Your first name"
        value={values.givenName}
        onChangeText={(v) => onChange("givenName", v)}
        autoCapitalize="words"
        required
      />
      <TextField
        label="Family Name (Last Name)"
        placeholder="Your last name"
        value={values.familyName}
        onChangeText={(v) => onChange("familyName", v)}
        autoCapitalize="words"
        required
      />
      <TextField
        label="Gender"
        placeholder="e.g. male, female, other"
        value={values.gender}
        onChangeText={(v) => onChange("gender", v)}
        autoCapitalize="none"
        required
      />
      <TextField
        label="Date of Birth"
        placeholder="YYYY-MM-DD"
        value={values.dob}
        onChangeText={(v) => onChange("dob", v)}
        required
      />
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: spacing.lg,
        }}
      >
        <Button title="Back" onPress={onBack} variant="secondary" />
        <Button title="Next" onPress={onNext} />
      </View>
    </Card>
  );
}
