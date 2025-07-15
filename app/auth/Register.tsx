// Updated Register screen using reusable components and global theme
import {
  AntDesign,
  FontAwesome,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useAuth } from "./AuthContext";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  View,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, TextField, Card, Typography } from "../../components/ui";
import { useTheme } from "../../contexts/ThemeContext";
import { spacing, borderRadius, shadows } from "../../constants/theme";

export default function Register() {
  const router = useRouter();
  const { register } = useAuth();
  const { colors } = useTheme();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !phone || !dob || !address) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const result = await register(name, email, password);
      if (result.success) {
        Alert.alert("Success", "Account created successfully!");
        router.replace("/CompleteProfile");
      } else {
        Alert.alert("Registration Failed", result.error || "Try again.");
      }
    } catch (err) {
      Alert.alert("Error", "Something went wrong. Try again later.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background.secondary },
      ]}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Header Section */}
            <View style={styles.header}>
              <View
                style={[
                  styles.logoContainer,
                  { backgroundColor: colors.primary[500] },
                ]}
              >
                <FontAwesome5 name="user-plus" size={28} color="white" />
              </View>
              <Typography variant="h1" color="primary" align="center">
                Join Expenzez
              </Typography>
              <Typography variant="body" color="secondary" align="center">
                Create your account and start managing finances
              </Typography>
            </View>

            {/* Register Form Card */}
            <Card variant="elevated" padding="large">
              <Typography
                variant="h2"
                color="primary"
                align="center"
                style={styles.formTitle}
              >
                Create Account
              </Typography>

              {/* Form Fields */}
              <TextField
                label="Full Name"
                placeholder="Your name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                required
              />

              <TextField
                label="Email"
                placeholder="you@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                required
              />

              <TextField
                label="Password"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                required
              />

              <TextField
                label="Phone Number"
                placeholder="+44 1234 567890"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                required
              />

              <TextField
                label="Date of Birth"
                placeholder="YYYY-MM-DD"
                value={dob}
                onChangeText={setDob}
                required
              />

              <TextField
                label="Address"
                placeholder="123 Baker Street, London"
                value={address}
                onChangeText={setAddress}
                autoCapitalize="words"
                required
              />

              {/* Login Link */}
              <TouchableOpacity
                style={styles.loginLink}
                onPress={() => router.push("/auth/Login")}
              >
                <Typography variant="body" color="secondary" align="center">
                  Already have an account?{" "}
                  <Typography variant="body" color="primary" weight="bold">
                    Sign in
                  </Typography>
                </Typography>
              </TouchableOpacity>

              {/* Register Button */}
              <Button
                title="Create Account"
                onPress={handleRegister}
                variant="primary"
                size="large"
                loading={isLoading}
                fullWidth
                style={styles.registerButton}
              />

              {/* Divider */}
              <View
                style={[styles.divider, { borderColor: colors.border.light }]}
              >
                <View
                  style={[
                    styles.dividerLine,
                    { backgroundColor: colors.border.light },
                  ]}
                />
                <Typography
                  variant="caption"
                  color="tertiary"
                  weight="semibold"
                  style={styles.dividerText}
                >
                  or
                </Typography>
                <View
                  style={[
                    styles.dividerLine,
                    { backgroundColor: colors.border.light },
                  ]}
                />
              </View>

              {/* Social Register Buttons */}
              <View style={styles.socialButtons}>
                <TouchableOpacity
                  style={[
                    styles.socialButton,
                    {
                      backgroundColor: colors.background.primary,
                      borderColor: colors.border.light,
                    },
                  ]}
                  onPress={() => Alert.alert("Google Register")}
                >
                  <AntDesign name="google" size={20} color="#EA4335" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.socialButton,
                    {
                      backgroundColor: colors.background.primary,
                      borderColor: colors.border.light,
                    },
                  ]}
                  onPress={() => Alert.alert("Facebook Register")}
                >
                  <FontAwesome name="facebook" size={20} color="#4267B2" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.socialButton,
                    {
                      backgroundColor: colors.background.primary,
                      borderColor: colors.border.light,
                    },
                  ]}
                  onPress={() => Alert.alert("Apple Register")}
                >
                  <FontAwesome5 name="apple" size={20} color="#111" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.socialButton,
                    {
                      backgroundColor: colors.background.primary,
                      borderColor: colors.border.light,
                    },
                  ]}
                  onPress={() => Alert.alert("X Register")}
                >
                  <MaterialCommunityIcons
                    name="alpha-x-circle"
                    size={20}
                    color="#111"
                  />
                </TouchableOpacity>
              </View>
            </Card>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    ...shadows.md,
  },
  formTitle: {
    marginBottom: spacing.lg,
  },
  loginLink: {
    alignSelf: "center",
    marginBottom: spacing.lg,
  },
  registerButton: {
    marginBottom: spacing.lg,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    borderRadius: 1,
  },
  dividerText: {
    marginHorizontal: spacing.md,
  },
  socialButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  socialButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    marginHorizontal: 4,
    ...shadows.sm,
  },
});
