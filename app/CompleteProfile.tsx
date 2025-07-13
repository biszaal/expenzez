import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";

// Use env or fallback
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:5000";

// Regex helpers
const isEmailValid = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isUkPhone = (phone: string) =>
  /^(\+44\s?7\d{3}|\(?07\d{3}\)?)\s?\d{3}\s?\d{3}$/.test(phone);

const isPasswordStrong = (password: string) => password.length >= 6;

export default function CompleteProfileScreen() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [dob, setDob] = useState(""); // formatted live
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const formatDob = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    let formatted = cleaned;

    if (cleaned.length >= 5) {
      formatted = `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}`;
    }
    if (cleaned.length >= 7) {
      formatted = `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`;
    }

    setDob(formatted);
  };

  const getToken = async (): Promise<string | null> => {
    return await SecureStore.getItemAsync("idToken");
  };

  const handleSubmit = async () => {
    // Field validation
    if (
      !fullName ||
      !address ||
      !dob ||
      !phone ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      return Alert.alert("All fields are required");
    }

    if (!isEmailValid(email)) {
      return Alert.alert("Please enter a valid email address");
    }

    if (!isUkPhone(phone)) {
      return Alert.alert("Please enter a valid UK phone number");
    }

    if (!isPasswordStrong(password)) {
      return Alert.alert("Password should be at least 6 characters");
    }

    if (password !== confirmPassword) {
      return Alert.alert("Passwords do not match");
    }

    try {
      const token = await getToken();
      if (!token) {
        return Alert.alert("Error", "Authentication token not found");
      }

      const res = await fetch(`${API_BASE_URL}/user/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fullName, address, dob, phone, email }),
      });

      let data = {};
      try {
        data = await res.json();
      } catch (jsonErr) {
        // Ignore JSON parse error
      }

      if (res.ok) {
        Alert.alert("Profile completed!");
        router.replace("../(tabs)/home");
      } else {
        Alert.alert(
          "Error",
          (data as { error?: string })["error"] || "Something went wrong"
        );
      }
    } catch (err) {
      console.error("Submit error:", err);
      Alert.alert("Network error");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Complete Your Profile</Text>

      <TextInput
        placeholder="Full Name"
        value={fullName}
        onChangeText={setFullName}
        style={styles.input}
      />

      <TextInput
        placeholder="Address"
        value={address}
        onChangeText={setAddress}
        style={styles.input}
      />

      <TextInput
        placeholder="Date of Birth (YYYY-MM-DD)"
        value={dob}
        onChangeText={formatDob}
        keyboardType="number-pad"
        style={styles.input}
        maxLength={10}
      />

      <TextInput
        placeholder="Phone Number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        style={styles.input}
      />

      <TextInput
        placeholder="Email Address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        style={styles.input}
        autoCapitalize="none"
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <TextInput
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        style={styles.input}
      />

      <TouchableOpacity onPress={handleSubmit} style={styles.button}>
        <Text style={styles.buttonText}>Submit</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#F6F8FA",
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 24,
    textAlign: "center",
    color: "#7C3AED",
  },
  input: {
    borderWidth: 1.3,
    borderColor: "#E9D5FF",
    padding: 14,
    marginBottom: 16,
    borderRadius: 10,
    fontSize: 16,
    backgroundColor: "#FFF",
    color: "#333",
  },
  button: {
    backgroundColor: "#7C3AED",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});
