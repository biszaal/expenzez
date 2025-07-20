import React from "react";
import { View } from "react-native";
import { Button, Card, Typography } from "../../components/ui";
import { useTheme } from "../../contexts/ThemeContext";
import { spacing } from "../../constants/theme";

export default function RegisterStep4({
  values,
  onBack,
  onSubmit,
  isLoading,
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
        Review & Submit
      </Typography>
      <Typography
        variant="body"
        color="secondary"
        align="center"
        style={{ marginBottom: spacing.lg }}
      >
        Please review your information before submitting.
      </Typography>
      <View style={{ marginBottom: spacing.md }}>
        {Object.entries(values).map(([key, value]) => (
          <Typography key={key} variant="body" color="primary">
            <Typography variant="caption" color="secondary">
              {key}:
            </Typography>{" "}
            {value}
          </Typography>
        ))}
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Button title="Back" onPress={onBack} variant="secondary" />
        <Button
          title={isLoading ? "Submitting..." : "Submit"}
          onPress={onSubmit}
          disabled={isLoading}
        />
      </View>
    </Card>
  );
}
