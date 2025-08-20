import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity , Linking } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { DEEP_LINK_URLS } from "../../constants/config";

export default function BankCallbackWeb() {
  const params = useLocalSearchParams();
  const { ref, status, error, requisition_id } = params;

  useEffect(() => {
    // Try to open the app with the callback data
    const callbackData = {
      ref: ref as string,
      status: status as string,
      error: error as string,
      requisition_id: requisition_id as string,
    };

    const appUrl = `${DEEP_LINK_URLS.BANK_CALLBACK}?${new URLSearchParams(callbackData).toString()}`;

    // Try to open the app
    Linking.openURL(appUrl).catch(() => {
      console.log("Could not open app, showing manual instructions");
    });
  }, [ref, status, error, requisition_id]);

  const openAppManually = () => {
    const callbackData = {
      ref: ref as string,
      status: status as string,
      error: error as string,
      requisition_id: requisition_id as string,
    };

    const appUrl = `${DEEP_LINK_URLS.BANK_CALLBACK}?${new URLSearchParams(callbackData).toString()}`;
    Linking.openURL(appUrl);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bank Connection Complete!</Text>
      <Text style={styles.message}>
        Your bank account has been successfully connected. You should be
        redirected to the app automatically.
      </Text>

      <TouchableOpacity style={styles.button} onPress={openAppManually}>
        <Text style={styles.buttonText}>Open App</Text>
      </TouchableOpacity>

      <Text style={styles.instructions}>
        If you&apos;re not redirected automatically, tap the button above to
        open the app.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  instructions: {
    fontSize: 14,
    textAlign: "center",
    color: "#666",
  },
});
