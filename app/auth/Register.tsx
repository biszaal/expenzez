// Updated Register screen using reusable components and global theme
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  KeyboardAvoidingView,
  Platform,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "./AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { spacing } from "../../constants/theme";
import RegisterStep1 from "./RegisterStep1";
import RegisterStep2 from "./RegisterStep2";
import RegisterStep3 from "./RegisterStep3";
import RegisterStep4 from "./RegisterStep4";
import { Typography } from "../../components/ui";
import { useAlert } from "../../hooks/useAlert";
import { Ionicons } from "@expo/vector-icons";

const initialState = {
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  name: "",
  givenName: "",
  familyName: "",
  gender: "",
  dob: "",
  phone: "",
  address: "",
};

export default function Register() {
  const router = useRouter();
  const { register } = useAuth();
  const { colors } = useTheme();
  const [step, setStep] = useState(1);
  const [values, setValues] = useState(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [registrationError, setRegistrationError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const { showError, showSuccess } = useAlert();

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    if (step === 1) {
      if (values.password !== values.confirmPassword) {
        setPasswordError("Passwords do not match");
        return;
      } else {
        setPasswordError("");
      }
    }
    setStep((s) => s + 1);
  };
  const handleBack = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    // Validate phone and password here as before
    const isValidPhone = /^\+[1-9]\d{1,14}$/.test(values.phone);
    if (!isValidPhone) {
      showError("Phone number must be in E.164 format, e.g. +447911123456");
      return;
    }
    const isValidPassword = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(
      values.password
    );
    if (!isValidPassword) {
      showError(
        "Password must include at least one symbol character (e.g., !@#$%^&*)"
      );
      return;
    }
    setIsLoading(true);
    setRegistrationError("");
    try {
      const result = await register({
        username: values.username,
        name: values.name,
        given_name: values.givenName,
        family_name: values.familyName,
        email: values.email,
        password: values.password,
        phone_number: values.phone,
        birthdate: values.dob,
        address: values.address,
        gender: values.gender,
      });
      if (result.success) {
        showSuccess("Registration successful! Please verify your email.");
        router.replace({
          pathname: "/auth/VerifyEmail",
          params: { username: values.username, email: values.email },
        });
        return;
      } else {
        setRegistrationError(result.error || "Registration failed. Try again.");
      }
    } catch (err: any) {
      let errorMsg = err.message || "Something went wrong. Try again later.";
      if (
        err.response?.data?.error === "UsernameExistsException" ||
        err.response?.data?.message?.includes("User already exists")
      ) {
        errorMsg =
          "An account with this username or email already exists. Please log in or verify your email if you haven't done so.";
      }
      setRegistrationError(errorMsg);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background.secondary }}
    >
      {/* Top Back Button */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: spacing.md,
        }}
      >
        <TouchableOpacity
          onPress={() => router.replace("/auth/Login")}
          style={{ padding: 4, marginRight: 8 }}
          accessibilityLabel="Back to Login"
        >
          <Ionicons name="chevron-back" size={28} color={colors.primary[500]} />
        </TouchableOpacity>
        <Typography variant="h2" color="primary">
          Register
        </Typography>
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            padding: spacing.lg,
          }}
        >
          <View style={{ flex: 1, justifyContent: "center" }}>
            {registrationError ? (
              <View style={{ marginBottom: spacing.lg }}>
                <Typography variant="body" color="danger" align="center">
                  {registrationError}
                </Typography>
              </View>
            ) : null}
            {step === 1 && (
              <RegisterStep1
                values={values}
                onChange={handleChange}
                onNext={handleNext}
                passwordError={passwordError}
              />
            )}
            {step === 2 && (
              <RegisterStep2
                values={values}
                onChange={handleChange}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            {step === 3 && (
              <RegisterStep3
                values={values}
                onChange={handleChange}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            {step === 4 && (
              <RegisterStep4
                values={values}
                onBack={handleBack}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                disabled={isLoading}
              />
            )}
            {/* Go to Login Button */}
            <TouchableOpacity
              onPress={() => router.replace("/auth/Login")}
              style={{ marginTop: spacing.lg, alignSelf: "center" }}
            >
              <Typography variant="body" color="primary" weight="bold">
                Already have an account? Go to Login
              </Typography>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
