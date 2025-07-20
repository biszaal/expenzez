import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import {
  testEC2Connection,
  testAuthEndpoints,
  testBankingEndpoints,
} from "../services/apiTest";
import { CURRENT_API_CONFIG } from "../config/api";

export default function TestEC2Screen() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const runTest = async (
    testName: string,
    testFunction: () => Promise<any>
  ) => {
    setLoading(true);
    try {
      const result = await testFunction();
      setResults((prev) => ({ ...prev, [testName]: result }));
      console.log(`${testName} result:`, result);
    } catch (error) {
      console.error(`${testName} error:`, error);
      setResults((prev) => ({
        ...prev,
        [testName]: { success: false, error: error.message },
      }));
    } finally {
      setLoading(false);
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    const allResults: any = {};

    // Test 1: EC2 Connection
    try {
      allResults.ec2Connection = await testEC2Connection();
    } catch (error: any) {
      allResults.ec2Connection = { success: false, error: error.message };
    }

    // Test 2: Auth Endpoints
    try {
      allResults.authEndpoints = await testAuthEndpoints();
    } catch (error: any) {
      allResults.authEndpoints = { success: false, error: error.message };
    }

    // Test 3: Banking Endpoints
    try {
      allResults.bankingEndpoints = await testBankingEndpoints();
    } catch (error: any) {
      allResults.bankingEndpoints = { success: false, error: error.message };
    }

    setResults(allResults);
    setLoading(false);
  };

  const getStatusColor = (success: boolean) =>
    success ? "#4CAF50" : "#F44336";

  return (
    <ScrollView style={{ flex: 1, padding: 20, backgroundColor: "#f5f5f5" }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
        EC2 Backend Connection Test
      </Text>

      <View
        style={{
          backgroundColor: "#fff",
          padding: 15,
          borderRadius: 8,
          marginBottom: 20,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10 }}>
          Current Configuration:
        </Text>
        <Text style={{ fontSize: 14, color: "#666" }}>
          Base URL: {CURRENT_API_CONFIG.baseURL}
        </Text>
        <Text style={{ fontSize: 14, color: "#666" }}>
          Timeout: {CURRENT_API_CONFIG.timeout}ms
        </Text>
      </View>

      <TouchableOpacity
        style={{
          backgroundColor: "#2196F3",
          padding: 15,
          borderRadius: 8,
          marginBottom: 20,
          alignItems: "center",
        }}
        onPress={runAllTests}
        disabled={loading}
      >
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>
          {loading ? "Running Tests..." : "Run All Tests"}
        </Text>
      </TouchableOpacity>

      {Object.keys(results).length > 0 && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 15 }}>
            Test Results:
          </Text>

          {Object.entries(results).map(([testName, result]: [string, any]) => (
            <View
              key={testName}
              style={{
                backgroundColor: "#fff",
                padding: 15,
                borderRadius: 8,
                marginBottom: 10,
                borderLeftWidth: 4,
                borderLeftColor: getStatusColor(result.success),
              }}
            >
              <Text
                style={{ fontSize: 16, fontWeight: "bold", marginBottom: 5 }}
              >
                {testName
                  .replace(/([A-Z])/g, " $1")
                  .replace(/^./, (str) => str.toUpperCase())}
              </Text>
              <Text
                style={{
                  color: getStatusColor(result.success),
                  fontWeight: "bold",
                }}
              >
                {result.success ? "✅ SUCCESS" : "❌ FAILED"}
              </Text>
              {result.error && (
                <Text style={{ color: "#F44336", marginTop: 5, fontSize: 12 }}>
                  Error: {result.error}
                </Text>
              )}
              {result.details && (
                <Text style={{ color: "#666", marginTop: 5, fontSize: 12 }}>
                  Details: {JSON.stringify(result.details)}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      <View
        style={{
          marginTop: 30,
          backgroundColor: "#fff",
          padding: 15,
          borderRadius: 8,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10 }}>
          Troubleshooting:
        </Text>
        <Text style={{ fontSize: 14, color: "#666", lineHeight: 20 }}>
          1. Make sure your EC2 security group allows port 3001{"\n"}
          2. Verify the backend is running on EC2{"\n"}
          3. Check if the IP address is correct{"\n"}
          4. Ensure your device can reach the EC2 instance
        </Text>
      </View>
    </ScrollView>
  );
}
