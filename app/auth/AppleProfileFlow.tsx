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
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";
import RegisterStep1 from "./RegisterStep1";
import RegisterStep2 from "./RegisterStep2";
import RegisterStep4 from "./RegisterStep4";
import RegisterStep5 from "./RegisterStep5";
import { Typography } from "../../components/ui";
import { useAlert } from "../../hooks/useAlert";
import { Ionicons } from "@expo/vector-icons";
import { profileAPI } from "../../services/api/profileAPI";

// Initial state for Apple profile completion (subset of full registration)
const initialState = {
  // From Apple (pre-filled, may be empty)
  name: "",
  givenName: "",
  familyName: "",
  email: "",

  // To collect from user
  username: "",
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

export default function AppleProfileFlow() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors, isDark } = useTheme();
  const [step, setStep] = useState(1);
  const [values, setValues] = useState(() => {
    // Pre-fill with Apple user data if available
    const appleUser = params.user ? JSON.parse(params.user as string) : null;
    return {
      ...initialState,
      name: appleUser?.name || "",
      givenName: appleUser?.given_name || appleUser?.givenName || "",
      familyName: appleUser?.family_name || appleUser?.familyName || "",
      email: appleUser?.email || "",
    };
  });
  const [isLoading, setIsLoading] = useState(false);
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

    // Validate birthdate format (YYYY-MM-DD)
    if (submitValues.dob) {
      const dateOnly = submitValues.dob.split("T")[0];

      if (dateOnly.length !== 10 || !/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
        showError("Invalid date format. Please select your date of birth again.");
        return;
      }

      submitValues.dob = dateOnly;
    }

    console.log("[AppleProfileFlow] Submitting profile completion:", {
      username: submitValues.username,
      phone_number: submitValues.phone_number,
      address: submitValues.address,
      dob: submitValues.dob,
      gender: submitValues.gender,
    });

    setIsLoading(true);
    try {
      console.log("[AppleProfileFlow] About to call profileAPI.updateProfile...");

      // Call backend to save profile data
      const result = await profileAPI.updateProfile({
        firstName: submitValues.givenName,
        lastName: submitValues.familyName,
        email: submitValues.email,
        phone: submitValues.phone_number,
        address: submitValues.address,
        city: submitValues.city,
        postcode: submitValues.postcode,
        birthdate: submitValues.dob,
        gender: submitValues.gender,
      });

      console.log("[AppleProfileFlow] Profile API response:", result);
      console.log("[AppleProfileFlow] Profile completed successfully!");
      showSuccess("Profile completed successfully! Welcome to Expenzez!");

      // Small delay to ensure data is saved before redirect
      await new Promise(resolve => setTimeout(resolve, 500));

      // Redirect to main app
      router.replace("/(tabs)");
    } catch (error: any) {
      console.error("[AppleProfileFlow] Profile completion error:", error);
      console.error("[AppleProfileFlow] Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      showError(
        error.response?.data?.message || error.message || "Failed to complete profile. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Map steps: 1=Username, 2=DOB/Gender, 3=Address, 4=Phone
  const totalSteps = 4;
  const stepTitles = ["Username", "Personal Info", "Address", "Phone"];

  return (
    <>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.background.primary}
      />
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background.primary },
        ]}
      >
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            style={styles.keyboardView}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={step > 1 ? handleBack : undefined}
                  disabled={step === 1}
                >
                  {step > 1 && (
                    <Ionicons
                      name="arrow-back"
                      size={24}
                      color={colors.text.primary}
                    />
                  )}
                </TouchableOpacity>

                <View style={styles.headerText}>
                  <Typography
                    variant="h2"
                    style={[styles.title, { color: colors.text.primary }]}
                  >
                    Complete Your Profile
                  </Typography>
                  <Typography
                    variant="body"
                    style={[styles.subtitle, { color: colors.text.secondary }]}
                  >
                    Step {step} of {totalSteps}: {stepTitles[step - 1]}
                  </Typography>
                </View>

                <View style={styles.backButton} />
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    { backgroundColor: colors.border.light },
                  ]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${(step / totalSteps) * 100}%`,
                        backgroundColor: colors.primary[500],
                      },
                    ]}
                  />
                </View>
              </View>
            </View>

            <ScrollView
              ref={scrollViewRef}
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Step 1: Username (RegisterStep1 in username-only mode) */}
              {step === 1 && (
                <RegisterStep1
                  values={values}
                  onChange={handleChange}
                  onNext={handleNext}
                  usernameOnly={true}
                />
              )}

              {/* Step 2: DOB + Gender (RegisterStep2) */}
              {step === 2 && (
                <RegisterStep2
                  values={values}
                  onChange={handleChange}
                  onNext={handleNext}
                  onBack={handleBack}
                />
              )}

              {/* Step 3: Address (RegisterStep4) */}
              {step === 3 && (
                <RegisterStep4
                  values={values}
                  onChange={handleChange}
                  onNext={handleNext}
                  onBack={handleBack}
                />
              )}

              {/* Step 4: Phone (RegisterStep5) */}
              {step === 4 && (
                <RegisterStep5
                  values={values}
                  onChange={handleChange}
                  onSubmit={handleSubmit}
                  onBack={handleBack}
                  isLoading={isLoading}
                  submitButtonText="Complete Profile"
                />
              )}
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
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  progressBarContainer: {
    height: 4,
    marginTop: 8,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
});
