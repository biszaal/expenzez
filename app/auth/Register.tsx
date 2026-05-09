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
  Text,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useAuth } from "./AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import RegisterStep1 from "./RegisterStep1";
import RegisterStep2 from "./RegisterStep2";
import RegisterStep3 from "./RegisterStep3";
import RegisterStep4 from "./RegisterStep4";
import RegisterStep5 from "./RegisterStep5";
import { useAlert } from "../../hooks/useAlert";
import { Ionicons } from "@expo/vector-icons";
import { fontFamily } from "../../constants/theme";

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
  const { colors, isDark } = useTheme();
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

    // Convert birthdate from YYYY-MM-DD to MM/DD/YYYY format for backend
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

      // Convert from YYYY-MM-DD to MM/DD/YYYY format
      const [year, month, day] = dateOnly.split("-");
      const formattedDate = `${month}/${day}/${year}`;

      submitValues.dob = formattedDate;
      console.log("✅ [Register] Birthdate converted to MM/DD/YYYY:", {
        original: dateOnly,
        converted: submitValues.dob,
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
            username: submitValues.username, // Pass username for verification
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
        } else if (err.response?.data?.error === "INVALID_INPUT") {
          // Show the actual validation error details from backend
          const details = err.response?.data?.details || "";
          if (details.toLowerCase().includes("phone")) {
            errorMsg = "Phone number format is invalid. Please use format: +447911123456";
          } else if (details.toLowerCase().includes("birthdate")) {
            errorMsg = "Date of birth format is invalid. Please select your date again.";
          } else if (details.toLowerCase().includes("password")) {
            errorMsg = "Password must have uppercase, lowercase, number, and symbol.";
          } else if (details.toLowerCase().includes("email")) {
            errorMsg = "Email format is invalid. Please check your email address.";
          } else if (details.toLowerCase().includes("username")) {
            errorMsg = "Username must be 3-30 alphanumeric characters only.";
          } else {
            errorMsg = details || "Registration failed. Please check your details.";
          }
          console.log("INVALID_INPUT error details:", details);
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
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Top glow */}
      <LinearGradient
        colors={
          isDark
            ? ["rgba(157,91,255,0.18)", "rgba(157,91,255,0)"]
            : ["rgba(123,63,228,0.10)", "rgba(123,63,228,0)"]
        }
        style={[StyleSheet.absoluteFillObject, { height: 280 }]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        pointerEvents="none"
      />

      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace("/auth/login")}
          style={[
            styles.backButton,
            {
              backgroundColor: colors.card.background,
              borderColor: colors.border.medium,
            },
          ]}
          accessibilityLabel="Back to Login"
        >
          <Ionicons name="chevron-back" size={18} color={colors.text.secondary} />
        </TouchableOpacity>

        <View
          style={[
            styles.stepBadge,
            {
              backgroundColor: colors.card.background,
              borderColor: colors.border.medium,
            },
          ]}
        >
          <Text
            style={{
              fontSize: 11,
              fontFamily: fontFamily.semibold,
              color: colors.text.secondary,
              letterSpacing: 0.6,
            }}
          >
            STEP {step} / 5
          </Text>
        </View>
      </View>

      {/* Title block */}
      <View style={styles.titleBlock}>
        <Text
          style={{
            fontSize: 28,
            letterSpacing: -0.6,
            color: colors.text.primary,
            fontFamily: fontFamily.semibold,
          }}
        >
          Create your{"\n"}Expenzez account
          <Text style={{ color: colors.primary[500] }}>.</Text>
        </Text>
        <Text
          style={{
            fontSize: 14,
            marginTop: 8,
            color: colors.text.secondary,
            fontFamily: fontFamily.medium,
            lineHeight: 20,
          }}
        >
          Set up in 60 seconds. Free forever, premium when you want.
        </Text>
      </View>

      {/* Progress dots */}
      <View style={styles.progressDots}>
        {[1, 2, 3, 4, 5].map((s) => (
          <View
            key={s}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 4,
              backgroundColor:
                s <= step
                  ? colors.primary[500]
                  : isDark
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(40,20,80,0.08)",
            }}
          />
        ))}
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
          <View style={styles.formContent}>
            {registrationError ? (
              <View
                style={[
                  styles.errorContainer,
                  {
                    backgroundColor: colors.negBg,
                    borderColor: colors.rose[500],
                  },
                ]}
              >
                <Ionicons name="warning" size={18} color={colors.rose[500]} />
                <Text
                  style={[
                    styles.errorText,
                    { color: colors.rose[500], fontFamily: fontFamily.medium },
                  ]}
                >
                  {registrationError}
                </Text>
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

            {/* Login Link */}
            <View style={styles.loginLinkContainer}>
              <Text
                style={[
                  styles.loginLinkText,
                  { color: colors.text.secondary, fontFamily: fontFamily.medium },
                ]}
              >
                Already have an account?{" "}
              </Text>
              <TouchableOpacity onPress={() => router.replace("/auth/login")}>
                <Text
                  style={[
                    styles.loginLinkBold,
                    { color: colors.primary[500], fontFamily: fontFamily.semibold },
                  ]}
                >
                  Sign in
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingTop: 6,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  stepBadge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  titleBlock: {
    paddingHorizontal: 22,
    paddingTop: 24,
  },
  progressDots: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 22,
    paddingTop: 18,
  },
  keyboardView: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 28,
  },
  formContent: { paddingHorizontal: 0 },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  loginLinkContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    paddingVertical: 8,
  },
  loginLinkText: { fontSize: 14 },
  loginLinkBold: { fontSize: 14 },
});
