import {
  AntDesign,
  FontAwesome,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Brand palette
const PURPLE = "#7C3AED";
const PURPLE_LIGHT = "#E9D5FF";
const GREY = "#A1A1AA";
const GREY_DARK = "#52525B";
const GREY_LIGHT = "#F6F8FA";
const WHITE = "#FFF";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Dummy handler
  const handleLogin = () => {
    Alert.alert("Login", "Email: " + email + "\nPassword: " + password);
    // Implement login logic here
  };

  const handleSocialLogin = (provider: string) => {
    Alert.alert("Social Login", `Login with ${provider}`);
    // Implement provider login here
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: GREY_LIGHT }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.container}>
          {/* Logo/Brand */}
          <View style={styles.brandRow}>
            <View style={styles.logoCircle}>
              <FontAwesome5 name="user-shield" size={28} color={PURPLE} />
            </View>
            <Text style={styles.brandTitle}>Welcome to expenzez</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.title}>Sign In</Text>

            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="you@email.com"
                placeholderTextColor={GREY}
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                placeholder="Password"
                placeholderTextColor={GREY}
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity
              style={{ alignSelf: "flex-end", marginBottom: 7 }}
              onPress={() => router.push("/auth/Register")}
            >
              <Text style={styles.registerLink}>
                Don&apos;t have an account?{" "}
                <Text style={{ color: PURPLE }}>Register</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginBtn}
              activeOpacity={0.85}
              onPress={handleLogin}
            >
              <Text style={styles.loginBtnText}>Sign In</Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.divider} />
            </View>

            {/* Social Logins */}
            <View style={styles.socialRow}>
              <TouchableOpacity
                style={[styles.socialBtn, { marginRight: 7 }]}
                activeOpacity={0.85}
                onPress={() => handleSocialLogin("Google")}
              >
                <AntDesign name="google" size={22} color="#EA4335" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.socialBtn, { marginRight: 7 }]}
                activeOpacity={0.85}
                onPress={() => handleSocialLogin("Facebook")}
              >
                <FontAwesome name="facebook" size={22} color="#4267B2" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.socialBtn, { marginRight: 7 }]}
                activeOpacity={0.85}
                onPress={() => handleSocialLogin("Apple")}
              >
                <FontAwesome5 name="apple" size={22} color="#111" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.socialBtn}
                activeOpacity={0.85}
                onPress={() => handleSocialLogin("X")}
              >
                <MaterialCommunityIcons
                  name="alpha-x-circle"
                  size={22}
                  color="#111"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: GREY_LIGHT,
  },
  brandRow: {
    alignItems: "center",
    marginBottom: 25,
  },
  logoCircle: {
    backgroundColor: PURPLE_LIGHT,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowColor: PURPLE,
    shadowOpacity: 0.09,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  brandTitle: {
    fontSize: 23,
    fontWeight: "900",
    color: PURPLE,
    letterSpacing: 0.2,
  },
  formCard: {
    backgroundColor: WHITE,
    padding: 22,
    borderRadius: 22,
    shadowColor: PURPLE,
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 7,
    elevation: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: GREY_DARK,
    marginBottom: 20,
    textAlign: "center",
    letterSpacing: 0.1,
  },
  inputWrap: {
    marginBottom: 13,
  },
  inputLabel: {
    color: GREY_DARK,
    fontWeight: "700",
    marginBottom: 4,
  },
  input: {
    backgroundColor: GREY_LIGHT,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.3,
    borderColor: PURPLE_LIGHT,
    color: GREY_DARK,
    fontSize: 16,
    fontWeight: "600",
  },
  registerLink: {
    color: GREY_DARK,
    fontWeight: "600",
    fontSize: 15,
    letterSpacing: 0.1,
  },
  loginBtn: {
    backgroundColor: PURPLE,
    paddingVertical: 14,
    borderRadius: 11,
    marginTop: 7,
    marginBottom: 10,
    elevation: 1,
    shadowColor: PURPLE,
    shadowOpacity: 0.06,
    shadowRadius: 4,
    alignItems: "center",
  },
  loginBtnText: {
    color: WHITE,
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 0.1,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 17,
  },
  divider: {
    flex: 1,
    height: 1.1,
    backgroundColor: PURPLE_LIGHT,
    borderRadius: 2,
  },
  dividerText: {
    marginHorizontal: 12,
    color: GREY,
    fontWeight: "700",
    fontSize: 14,
  },
  socialRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 2,
  },
  socialBtn: {
    flex: 1,
    alignItems: "center",
    backgroundColor: WHITE,
    paddingVertical: 13,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: PURPLE_LIGHT,
    marginHorizontal: 0,
    elevation: 1,
    shadowColor: GREY,
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
});
