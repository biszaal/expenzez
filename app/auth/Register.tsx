// Clean and Professional Register Screen with Glass Morphism Design
import React, { useState, useRef, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  KeyboardAvoidingView,
  Platform,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "./AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { spacing, borderRadius, layout } from "../../constants/theme";
import RegisterStep1 from "./RegisterStep1";
import RegisterStep2 from "./RegisterStep2";
import RegisterStep3 from "./RegisterStep3";
import RegisterStep4 from "./RegisterStep4";
import RegisterStep5 from "./RegisterStep5";
import { Typography } from "../../components/ui";
import { useAlert } from "../../hooks/useAlert";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

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
  phone_number: "",
  address: "",
  address1: "",
  address2: "",
  city: "",
  state: "",
  postcode: "",
  country: "",
};

export default function Register() {
  const router = useRouter();
  const { register } = useAuth();
  const { colors } = useTheme();
  const [step, setStep] = useState(1);
  const [values, setValues] = useState(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [registrationError, setRegistrationError] = useState("");
  const [passwordError] = useState("");
  const { showError, showSuccess } = useAlert();
  const scrollViewRef = useRef<ScrollView>(null);

  // Scroll to top when step changes
  useEffect(() => {
    scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });
  }, [step]);

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    // Password validation is now handled in step 3
    setStep((s) => s + 1);
  };
  const handleBack = () => setStep((s) => s - 1);

  const handleSubmit = async (overrideValues?: {
    phone_number?: string;
    name?: string;
  }) => {
    // Merge override values with current state
    const submitValues = {
      ...values,
      ...overrideValues,
    };

    // Prevent email as username
    if (submitValues.username.includes("@")) {
      showError(
        "Username cannot be an email address. Please choose a unique username."
      );
      return;
    }

    // CRITICAL: Ensure birthdate is EXACTLY 10 characters in YYYY-MM-DD format for AWS Cognito
    if (submitValues.dob) {
      console.log("🔍 [Register] Original birthdate received:", {
        value: submitValues.dob,
        length: submitValues.dob.length,
        type: typeof submitValues.dob,
      });

      // Remove any timestamp portion if present (T00:00:00.000Z)
      const dateOnly = submitValues.dob.split("T")[0];

      // Validate format is YYYY-MM-DD (10 characters exactly)
      if (dateOnly.length !== 10 || !/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
        console.error("❌ [Register] Invalid birthdate format:", {
          original: submitValues.dob,
          dateOnly,
          length: dateOnly.length,
        });
        showError(
          "Invalid date format. Please select your date of birth again."
        );
        return;
      }

      // Update with date-only format
      submitValues.dob = dateOnly;
      console.log("✅ [Register] Birthdate validated and formatted:", {
        value: submitValues.dob,
        length: submitValues.dob.length,
      });
    }

    // DEBUG: Log all values before submission
    console.log("🔍 [Register] ALL VALUES:", submitValues);
    console.log("🔍 [Register] Phone number specifically:", {
      phone_number: submitValues.phone_number,
      type: typeof submitValues.phone_number,
      length: submitValues.phone_number?.length,
      isEmpty: !submitValues.phone_number,
    });

    // Phone validation is handled in RegisterStep5 component
    // If we reach here, the phone should already be in E.164 format

    console.log("Registration data being submitted:", {
      username: submitValues.username,
      email: submitValues.email,
      phone_number: submitValues.phone_number,
      phone_raw: submitValues.phone_number, // Show raw phone value for debugging
      phone_length: submitValues.phone_number?.length || 0,
      name: submitValues.name,
      given_name: submitValues.givenName,
      family_name: submitValues.familyName,
      hasPassword: !!submitValues.password,
      passwordLength: submitValues.password?.length,
      birthdate: submitValues.dob,
      birthdate_length: submitValues.dob?.length || 0,
      address: submitValues.address,
      gender: submitValues.gender,
    });
    const isValidPassword = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(
      submitValues.password
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
        username: submitValues.username,
        name: submitValues.name,
        given_name: submitValues.givenName,
        family_name: submitValues.familyName,
        email: submitValues.email,
        password: submitValues.password,
        phone_number: submitValues.phone_number,
        birthdate: submitValues.dob,
        address: submitValues.address,
        gender: submitValues.gender,
      });
      if (result.success) {
        showSuccess("Registration successful! Please verify your email.");
        router.replace({
          pathname: "/auth/EmailVerification",
          params: {
            email: submitValues.email,
            password: submitValues.password, // Pass password for auto-login after verification
          },
        });
        return;
      } else {
        // Check for password policy error
        if (result.error && result.error.toLowerCase().includes("password")) {
          setRegistrationError(
            "Password does not meet requirements. It must have uppercase, lowercase, number, and symbol."
          );
        } else {
          setRegistrationError(
            result.error || "Registration failed. Try again."
          );
        }
      }
    } catch (err: any) {
      // Debug logging to understand the error structure
      console.log("Registration error details:", {
        status: err.response?.status,
        error: err.response?.data?.error,
        message: err.response?.data?.message,
        fullData: err.response?.data,
      });

      let errorMsg = err.message || "Something went wrong. Try again later.";

      // Enhanced error handling for different types of user existence errors
      if (err.response?.data?.error === "UsernameExistsException") {
        errorMsg =
          "This username is already taken. Please choose a different username.";
      } else if (
        err.response?.data?.error === "EmailExistsException" ||
        (err.response?.status === 409 &&
          err.response?.data?.message?.toLowerCase().includes("email"))
      ) {
        // Show error instead of redirecting - keep user data intact
        errorMsg =
          "An account with this email already exists. If this is your account, please go to login page.";
      } else if (
        err.response?.data?.error === "PhoneNumberExistsException" ||
        (err.response?.status === 409 &&
          err.response?.data?.message?.toLowerCase().includes("phone"))
      ) {
        // Show error instead of redirecting - keep user data intact
        errorMsg =
          "An account with this phone number already exists. If this is your account, please go to login page.";
      } else if (err.response?.data?.message?.includes("User already exists")) {
        // Show error instead of redirecting - keep user data intact
        errorMsg =
          "An account with these details already exists. If this is your account, please go to login page.";
      } else if (
        err.response?.data?.error === "InvalidPasswordException" ||
        err.response?.data?.message?.toLowerCase().includes("password")
      ) {
        errorMsg =
          "Password does not meet requirements. It must have uppercase, lowercase, number, and symbol.";
      } else if (
        err.response?.data?.message?.toLowerCase().includes("username")
      ) {
        errorMsg =
          "Username is not available. Please choose a different username.";
      } else if (err.response?.data?.message?.toLowerCase().includes("email")) {
        // Show error instead of redirecting - keep user data intact
        errorMsg =
          "This email address is already registered. If this is your account, please go to login page.";
      } else if (err.response?.data?.message?.toLowerCase().includes("phone")) {
        // Show error instead of redirecting - keep user data intact
        errorMsg =
          "This phone number is already registered. If this is your account, please go to login page.";
      } else if (err.response?.status === 400) {
        // Handle 400 errors with specific messages
        console.log("Handling 400 error:", err.response?.data);
        if (err.response?.data?.error === "InvalidPhoneNumberException") {
          errorMsg =
            "Phone number format is invalid. Please use format: +447911123456";
        } else if (err.response?.data?.error === "InvalidPasswordException") {
          errorMsg =
            "Password does not meet requirements. It must have uppercase, lowercase, number, and symbol.";
        } else if (err.response?.data?.error === "InvalidParameterException") {
          if (err.response?.data?.details?.toLowerCase().includes("phone")) {
            errorMsg =
              "Phone number format is invalid. Please use format: +447911123456";
          } else if (
            err.response?.data?.message?.toLowerCase().includes("required")
          ) {
            errorMsg =
              "Missing required information. Please fill in all required fields.";
          } else {
            errorMsg =
              "Invalid registration parameters. Please check your input.";
          }
        } else if (
          err.response?.data?.message?.toLowerCase().includes("phone")
        ) {
          errorMsg = "Phone number format is invalid. Please check the format.";
        } else if (
          err.response?.data?.message?.toLowerCase().includes("password")
        ) {
          errorMsg =
            "Password does not meet requirements. It must have uppercase, lowercase, number, and symbol.";
        } else {
          errorMsg =
            err.response?.data?.message ||
            "Registration failed. Please check your details.";
        }
      } else if (err.response?.status === 409) {
        // Handle any 409 error as a duplicate user scenario - show error instead of redirecting
        console.log("Handling 409 error as duplicate user");
        errorMsg =
          "An account with these details already exists. If this is your account, please go to login page.";
      }

      setRegistrationError(errorMsg);
      console.error("Registration error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Gradient Background */}
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Header Section */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.replace("/auth/Login")}
            style={styles.backButton}
            accessibilityLabel="Back to Login"
          >
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Typography variant="h2" style={styles.welcomeTitle} align="center">
              Create Account
            </Typography>
            <Typography variant="body" style={styles.welcomeSubtitle} align="center">
              Step {step} of 5
            </Typography>
          </View>
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Glass Form Container */}
            <BlurView intensity={40} tint="light" style={styles.glassCard}>
              <View style={styles.formContent}>
                {registrationError ? (
                  <View style={styles.errorContainer}>
                    <Ionicons name="warning" size={20} color="white" />
                    <Typography variant="body" style={styles.errorText}>
                      {registrationError}
                    </Typography>
                  </View>
                ) : null}

                  {step === 1 && (
                    <RegisterStep1
                      values={values}
                      onChange={handleChange}
                      onNext={handleNext}
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
                      passwordError={passwordError}
                    />
                  )}
                  {step === 4 && (
                    <RegisterStep4
                      values={values}
                      onChange={handleChange}
                      onNext={handleNext}
                      onBack={handleBack}
                    />
                  )}
                  {step === 5 && (
                    <RegisterStep5
                      values={values}
                      onChange={handleChange}
                      onBack={handleBack}
                      onSubmit={handleSubmit}
                      isLoading={isLoading}
                    />
                  )}

                {/* Clean Login Link */}
                <TouchableOpacity
                  onPress={() => router.replace("/auth/Login")}
                  style={styles.loginLink}
                >
                  <Typography
                    variant="body"
                    style={{ color: "white" }}
                    align="center"
                  >
                    Already have an account?{" "}
                    <Typography
                      variant="body"
                      style={{ color: "white", fontWeight: "700" }}
                      weight="semibold"
                    >
                      Sign In
                    </Typography>
                  </Typography>
                </TouchableOpacity>
              </View>
            </BlurView>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },

  // Compact Header
  header: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: layout.screenPadding,
    top: spacing.sm,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerContent: {
    alignItems: "center",
    paddingTop: spacing.sm,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: spacing.xs,
    color: "white",
  },
  welcomeSubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 18,
    color: "rgba(255, 255, 255, 0.8)",
  },

  // Content and keyboard handling
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.sm,
  },

  // Glass Form Container
  glassCard: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  formContent: {
    padding: spacing.lg,
  },

  // Error handling
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.4)",
    marginBottom: spacing.lg,
  },
  errorText: {
    marginLeft: spacing.sm,
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
    color: "white",
  },

  // Login link
  loginLink: {
    alignSelf: "center",
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingBottom: spacing.md,
  },
});
