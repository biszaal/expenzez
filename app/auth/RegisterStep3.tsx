import React from "react";
import { View } from "react-native";
import { Button, TextField, Card, Typography } from "../../components/ui";
import { useTheme } from "../../contexts/ThemeContext";
import { spacing } from "../../constants/theme";

export default function RegisterStep3({
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
        Contact Info
      </Typography>
      <TextField
        label="Phone Number"
        placeholder="+44 1234 567890"
        value={values.phone}
        onChangeText={(v) => onChange("phone", v)}
        keyboardType="phone-pad"
        required
      />
      <TextField
        label="Address"
        placeholder="123 Baker Street, London"
        value={values.address}
        onChangeText={(v) => onChange("address", v)}
        autoCapitalize="words"
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
