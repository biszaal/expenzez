import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { healthCheck, authAPI } from "../services/api";

export default function TestApiScreen() {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    setResults((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const testHealthCheck = async () => {
    setLoading(true);
    try {
      const response = await healthCheck();
      addResult(`✅ Health check successful: ${JSON.stringify(response)}`);
    } catch (error: any) {
      addResult(`❌ Health check failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testRegister = async () => {
    setLoading(true);
    try {
      const response = await authAPI.register({
        name: "Test User",
        email: `test${Date.now()}@example.com`,
        password: "password123",
      });
      addResult(`✅ Registration successful: ${response.message}`);
    } catch (error: any) {
      addResult(
        `❌ Registration failed: ${error.response?.data?.message || error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    setLoading(true);
    try {
      const response = await authAPI.login({
        email: "test@example.com",
        password: "password123",
      });
      addResult(`✅ Login successful: ${response.message}`);
    } catch (error: any) {
      addResult(
        `❌ Login failed: ${error.response?.data?.message || error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>API Test</Text>
        <Text style={styles.subtitle}>Test backend connectivity</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={testHealthCheck}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Health Check</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={testRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Registration</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={testLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={clearResults}
        >
          <Text style={styles.buttonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Test Results:</Text>
        {results.map((result, index) => (
          <Text key={index} style={styles.resultText}>
            {result}
          </Text>
        ))}
        {results.length === 0 && (
          <Text style={styles.noResults}>No tests run yet</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 20,
    backgroundColor: "#3B82F6",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  buttonContainer: {
    padding: 20,
    gap: 10,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#10B981",
  },
  secondaryButton: {
    backgroundColor: "#3B82F6",
  },
  clearButton: {
    backgroundColor: "#6B7280",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  resultsContainer: {
    flex: 1,
    padding: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#1F2937",
  },
  resultText: {
    fontSize: 14,
    marginBottom: 5,
    color: "#374151",
    fontFamily: "monospace",
  },
  noResults: {
    fontSize: 14,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
});
