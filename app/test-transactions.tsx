import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { bankingAPI } from "../services/api";
import { COLORS } from "../constants/Colors";
import { SPACING } from "../constants/theme";

export default function TestTransactions() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const testTransactions = async () => {
    try {
      setLoading(true);
      console.log("Testing transactions...");

      const result = await bankingAPI.testTransactions();
      console.log("Test result:", result);
      setResults(result);

      Alert.alert("Success", `Found ${result.totalTransactions} transactions`);
    } catch (error) {
      console.error("Test failed:", error);
      Alert.alert("Error", "Failed to test transactions");
    } finally {
      setLoading(false);
    }
  };

  const testAccounts = async () => {
    try {
      setLoading(true);
      console.log("Testing accounts...");

      const result = await bankingAPI.getAccounts();
      console.log("Accounts result:", result);

      Alert.alert("Success", `Found ${result.accounts?.length || 0} accounts`);
    } catch (error) {
      console.error("Accounts test failed:", error);
      Alert.alert("Error", "Failed to test accounts");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.background.primary }}>
      <View style={{ padding: SPACING.lg }}>
        <Text
          style={{ fontSize: 24, fontWeight: "bold", marginBottom: SPACING.lg }}
        >
          Transaction Debug
        </Text>

        <TouchableOpacity
          style={{
            backgroundColor: COLORS.primary.main,
            padding: SPACING.md,
            borderRadius: SPACING.md,
            marginBottom: SPACING.md,
          }}
          onPress={testTransactions}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={{ color: "white", textAlign: "center" }}>
              Test Transactions
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: COLORS.primary.main,
            padding: SPACING.md,
            borderRadius: SPACING.md,
            marginBottom: SPACING.md,
          }}
          onPress={testAccounts}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={{ color: "white", textAlign: "center" }}>
              Test Accounts
            </Text>
          )}
        </TouchableOpacity>

        {results && (
          <View style={{ marginTop: SPACING.lg }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                marginBottom: SPACING.md,
              }}
            >
              Test Results:
            </Text>
            <Text style={{ fontSize: 14, marginBottom: SPACING.sm }}>
              Total Transactions: {results.totalTransactions}
            </Text>
            {results.transactions && results.transactions.length > 0 && (
              <Text style={{ fontSize: 14 }}>
                Sample Transaction:{" "}
                {JSON.stringify(results.transactions[0], null, 2)}
              </Text>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
