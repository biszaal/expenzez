import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useAuth } from "./auth/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function TestLogoutScreen() {
  const { isLoggedIn, user, logout, clearAllData } = useAuth();

  const checkStoredData = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const data: any = {};

      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        data[key] = value;
      }

      console.log("Stored data:", data);

      // Create a more readable summary
      const summary = {
        totalKeys: keys.length,
        keys: keys,
        hasLoginData: !!data.isLoggedIn,
        hasTokens: !!(data.accessToken && data.idToken),
        hasUser: !!data.user,
        tokenValues: {
          accessToken: data.accessToken
            ? `${data.accessToken.substring(0, 20)}...`
            : "null",
          idToken: data.idToken
            ? `${data.idToken.substring(0, 20)}...`
            : "null",
        },
      };

      Alert.alert("Stored Data Summary", JSON.stringify(summary, null, 2));
    } catch (error) {
      console.error("Error checking stored data:", error);
      Alert.alert("Error", "Failed to check stored data");
    }
  };

  const handleLogout = async () => {
    try {
      console.log("=== MANUAL LOGOUT STARTED ===");
      await logout();
      console.log("=== MANUAL LOGOUT COMPLETED ===");
      Alert.alert("Success", "Logout completed");
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Error", "Logout failed");
    }
  };

  const handleClearAllData = async () => {
    try {
      await clearAllData();
      Alert.alert("Success", "All data cleared");
    } catch (error) {
      console.error("Clear data error:", error);
      Alert.alert("Error", "Failed to clear data");
    }
  };

  return (
    <ScrollView style={{ flex: 1, padding: 20, backgroundColor: "#f5f5f5" }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
        Logout Test Screen
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
          Current State:
        </Text>
        <Text style={{ fontSize: 14, color: "#666" }}>
          Is Logged In: {isLoggedIn ? "Yes" : "No"}
        </Text>
        <Text style={{ fontSize: 14, color: "#666" }}>
          User: {user ? JSON.stringify(user, null, 2) : "None"}
        </Text>
      </View>

      <TouchableOpacity
        style={{
          backgroundColor: "#2196F3",
          padding: 15,
          borderRadius: 8,
          marginBottom: 10,
          alignItems: "center",
        }}
        onPress={checkStoredData}
      >
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>
          Check Stored Data
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          backgroundColor: "#FF9800",
          padding: 15,
          borderRadius: 8,
          marginBottom: 10,
          alignItems: "center",
        }}
        onPress={handleLogout}
      >
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>
          Logout
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          backgroundColor: "#F44336",
          padding: 15,
          borderRadius: 8,
          marginBottom: 10,
          alignItems: "center",
        }}
        onPress={handleClearAllData}
      >
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>
          Clear All Data
        </Text>
      </TouchableOpacity>

      <View
        style={{
          marginTop: 30,
          backgroundColor: "#fff",
          padding: 15,
          borderRadius: 8,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10 }}>
          Instructions:
        </Text>
        <Text style={{ fontSize: 14, color: "#666", lineHeight: 20 }}>
          1. Check stored data to see what's currently saved{"\n"}
          2. Try logout to see if it clears data properly{"\n"}
          3. If logout doesn't work, use "Clear All Data"{"\n"}
          4. Refresh the app to test auto-login behavior
        </Text>
      </View>
    </ScrollView>
  );
}
