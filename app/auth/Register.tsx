// Clean and Professional Register Screen
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

  const handleSubmit = async (overrideValues?: { phone_number?: string; name?: string }) => {
    // Merge override values with current state
    const submitValues = {
      ...values,
      ...overrideValues
    };

    // Prevent email as username
    if (submitValues.username.includes("@")) {
      showError(
        "Username cannot be an email address. Please choose a unique username."
      );
      return;
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

    // Convert birthdate from YYYY-MM-DD to MM/DD/YYYY format for AWS Cognito
    let formattedBirthdate = submitValues.dob;
    if (submitValues.dob && submitValues.dob.includes('-')) {
      const [year, month, day] = submitValues.dob.split('-');
      formattedBirthdate = `${month}/${day}/${year}`;
    }

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
      birthdate_original: submitValues.dob,
      birthdate_formatted: formattedBirthdate,
      address: submitValues.address,
      gender: submitValues.gender
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
        birthdate: formattedBirthdate,
        address: submitValues.address,
        gender: submitValues.gender,
      });
      if (result.success) {
        showSuccess("Registration successful! Please verify your email.");
        router.replace({
          pathname: "/auth/EmailVerification",
          params: {
            email: submitValues.email,
            password: submitValues.password // Pass password for auto-login after verification
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
        fullData: err.response?.data
      });
      
      let errorMsg = err.message || "Something went wrong. Try again later.";

      // Enhanced error handling for different types of user existence errors
      if (err.response?.data?.error === "UsernameExistsException") {
        errorMsg = "This username is already taken. Please choose a different username.";
      } else if (err.response?.data?.error === "EmailExistsException" ||
                 (err.response?.status === 409 && err.response?.data?.message?.toLowerCase().includes("email"))) {
        // Show error instead of redirecting - keep user data intact
        errorMsg = "An account with this email already exists. If this is your account, please go to login page.";
      } else if (err.response?.data?.error === "PhoneNumberExistsException" ||
                 (err.response?.status === 409 && err.response?.data?.message?.toLowerCase().includes("phone"))) {
        // Show error instead of redirecting - keep user data intact
        errorMsg = "An account with this phone number already exists. If this is your account, please go to login page.";
      } else if (err.response?.data?.message?.includes("User already exists")) {
        // Show error instead of redirecting - keep user data intact
        errorMsg = "An account with these details already exists. If this is your account, please go to login page.";
      } else if (
        err.response?.data?.error === "InvalidPasswordException" ||
        err.response?.data?.message?.toLowerCase().includes("password")
      ) {
        errorMsg = "Password does not meet requirements. It must have uppercase, lowercase, number, and symbol.";
      } else if (err.response?.data?.message?.toLowerCase().includes("username")) {
        errorMsg = "Username is not available. Please choose a different username.";
      } else if (err.response?.data?.message?.toLowerCase().includes("email")) {
        // Show error instead of redirecting - keep user data intact
        errorMsg = "This email address is already registered. If this is your account, please go to login page.";
      } else if (err.response?.data?.message?.toLowerCase().includes("phone")) {
        // Show error instead of redirecting - keep user data intact
        errorMsg = "This phone number is already registered. If this is your account, please go to login page.";
      } else if (err.response?.status === 400) {
        // Handle 400 errors with specific messages
        console.log("Handling 400 error:", err.response?.data);
        if (err.response?.data?.error === "InvalidPhoneNumberException") {
          errorMsg = "Phone number format is invalid. Please use format: +447911123456";
        } else if (err.response?.data?.error === "InvalidPasswordException") {
          errorMsg = "Password does not meet requirements. It must have uppercase, lowercase, number, and symbol.";
        } else if (err.response?.data?.error === "InvalidParameterException") {
          if (err.response?.data?.details?.toLowerCase().includes("phone")) {
            errorMsg = "Phone number format is invalid. Please use format: +447911123456";
          } else if (err.response?.data?.message?.toLowerCase().includes("required")) {
            errorMsg = "Missing required information. Please fill in all required fields.";
          } else {
            errorMsg = "Invalid registration parameters. Please check your input.";
          }
        } else if (err.response?.data?.message?.toLowerCase().includes("phone")) {
          errorMsg = "Phone number format is invalid. Please check the format.";
        } else if (err.response?.data?.message?.toLowerCase().includes("password")) {
          errorMsg = "Password does not meet requirements. It must have uppercase, lowercase, number, and symbol.";
        } else {
          errorMsg = err.response?.data?.message || "Registration failed. Please check your details.";
        }
      } else if (err.response?.status === 409) {
        // Handle any 409 error as a duplicate user scenario - show error instead of redirecting
        console.log("Handling 409 error as duplicate user");
        errorMsg = "An account with these details already exists. If this is your account, please go to login page.";
      }

      setRegistrationError(errorMsg);
      console.error("Registration error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />
      <View style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background.primary }])}>

        <SafeAreaView style={styles.safeArea}>
          {/* Clean Header Section */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.replace("/auth/Login")}
              style={StyleSheet.flatten([styles.backButton, { backgroundColor: colors.background.secondary }])}
              accessibilityLabel="Back to Login"
            >
              <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            
            <View style={styles.headerContent}>
              <View style={StyleSheet.flatten([styles.logoContainer, { backgroundColor: '#8B5CF6' }])}>
                <Ionicons name="person-add-outline" size={28} color="white" />
              </View>
              
              <Typography
                variant="h1"
                style={StyleSheet.flatten([styles.welcomeTitle, { color: colors.text.primary }])}
                align="center"
              >
                Create Account
              </Typography>
              <Typography
                variant="body"
                style={StyleSheet.flatten([styles.welcomeSubtitle, { color: colors.text.secondary }])}
                align="center"
              >
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
              {/* Clean Form Container */}
              <View style={StyleSheet.flatten([styles.formContainer, { backgroundColor: colors.background.secondary }])}>
                <View style={styles.formContent}>
                  {registrationError ? (
                    <View style={StyleSheet.flatten([styles.errorContainer, { backgroundColor: colors.error[50], borderColor: colors.error[200] }])}>
                      <Ionicons name="warning" size={20} color={colors.error[500]} />
                      <Typography variant="body" style={StyleSheet.flatten([styles.errorText, { color: colors.error[700] }])}>
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
                    <Typography variant="body" style={{ color: colors.text.secondary }} align="center">
                      Already have an account?{" "}
                      <Typography variant="body" style={{ color: '#8B5CF6' }} weight="semibold">
                        Sign In
                      </Typography>
                    </Typography>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },

  // Clean Header
  header: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: layout.screenPadding,
    top: spacing.md,
    zIndex: 1,
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  welcomeSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
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
    paddingHorizontal: 0,
    paddingVertical: spacing.lg,
  },

  // Clean Form
  formContainer: {
    borderRadius: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    marginBottom: 0,
  },
  formContent: {
    padding: 0,
  },

  // Error handling
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  errorText: {
    marginLeft: spacing.sm,
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
  },

  // Login link
  loginLink: {
    alignSelf: 'center',
    marginTop: spacing.md,
    marginHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    paddingBottom: spacing.xl, // Extra padding at bottom
  },
});
