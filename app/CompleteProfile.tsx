import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "./auth/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { spacing, borderRadius, shadows, typography } from "../constants/theme";
import { useAlert } from "../hooks/useAlert";

export default function CompleteProfileScreen() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { colors } = useTheme();
  const { showSuccess, showError } = useAlert();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    address: "",
    occupation: "",
    company: "",
  });

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      // TODO: Implement API call to complete profile
      showSuccess("Profile completed successfully!");
      router.replace("/(tabs)");
    } catch (error) {
      showError("Failed to complete profile");
    }
  };

  const isFormValid = () => {
    return (
      formData.firstName &&
      formData.lastName &&
      formData.email &&
      formData.phone
    );
  };

  if (!isLoggedIn) {
    router.replace("/auth/Login");
    return null;
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background.secondary },
      ]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            { backgroundColor: colors.background.primary },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.backButton,
              { backgroundColor: colors.background.secondary },
              shadows.sm,
            ]}
            onPress={() => {
              if (window.history.length > 1) {
                router.back();
              } else {
                router.replace("/(tabs)");
              }
            }}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={colors.primary[500]}
            />
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
              Complete Profile
            </Text>
            <Text
              style={[styles.headerSubtitle, { color: colors.text.secondary }]}
            >
              Tell us more about yourself
            </Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          <View
            style={[
              styles.formSection,
              { backgroundColor: colors.background.primary },
              shadows.md,
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Personal Information
            </Text>

            <View style={styles.formRow}>
              <View
                style={[styles.formField, { flex: 1, marginRight: spacing.sm }]}
              >
                <Text
                  style={[styles.fieldLabel, { color: colors.text.primary }]}
                >
                  First Name
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      borderColor: colors.border.light,
                      backgroundColor: colors.background.secondary,
                      color: colors.text.primary,
                    },
                  ]}
                  value={formData.firstName}
                  onChangeText={(value) =>
                    handleFieldChange("firstName", value)
                  }
                  placeholder="Enter first name"
                  
                />
              </View>
              <View
                style={[styles.formField, { flex: 1, marginLeft: spacing.sm }]}
              >
                <Text
                  style={[styles.fieldLabel, { color: colors.text.primary }]}
                >
                  Last Name
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      borderColor: colors.border.light,
                      backgroundColor: colors.background.secondary,
                      color: colors.text.primary,
                    },
                  ]}
                  value={formData.lastName}
                  onChangeText={(value) => handleFieldChange("lastName", value)}
                  placeholder="Enter last name"
                  
                />
              </View>
            </View>

            <View style={styles.formField}>
              <Text style={[styles.fieldLabel, { color: colors.text.primary }]}>
                Email
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    borderColor: colors.border.light,
                    backgroundColor: colors.background.secondary,
                    color: colors.text.primary,
                  },
                ]}
                value={formData.email}
                onChangeText={(value) => handleFieldChange("email", value)}
                placeholder="Enter email address"
                
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formField}>
              <Text style={[styles.fieldLabel, { color: colors.text.primary }]}>
                Phone Number
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    borderColor: colors.border.light,
                    backgroundColor: colors.background.secondary,
                    color: colors.text.primary,
                  },
                ]}
                value={formData.phone}
                onChangeText={(value) => handleFieldChange("phone", value)}
                placeholder="Enter phone number"
                
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View
            style={[
              styles.formSection,
              { backgroundColor: colors.background.primary },
              shadows.md,
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Additional Information
            </Text>

            <View style={styles.formField}>
              <Text style={[styles.fieldLabel, { color: colors.text.primary }]}>
                Date of Birth
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    borderColor: colors.border.light,
                    backgroundColor: colors.background.secondary,
                    color: colors.text.primary,
                  },
                ]}
                value={formData.dateOfBirth}
                onChangeText={(value) =>
                  handleFieldChange("dateOfBirth", value)
                }
                placeholder="YYYY-MM-DD"
                
              />
            </View>

            <View style={styles.formField}>
              <Text style={[styles.fieldLabel, { color: colors.text.primary }]}>
                Address
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  styles.textArea,
                  {
                    borderColor: colors.border.light,
                    backgroundColor: colors.background.secondary,
                    color: colors.text.primary,
                  },
                ]}
                value={formData.address}
                onChangeText={(value) => handleFieldChange("address", value)}
                placeholder="Enter your address"
                
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formField}>
              <Text style={[styles.fieldLabel, { color: colors.text.primary }]}>
                Occupation
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    borderColor: colors.border.light,
                    backgroundColor: colors.background.secondary,
                    color: colors.text.primary,
                  },
                ]}
                value={formData.occupation}
                onChangeText={(value) => handleFieldChange("occupation", value)}
                placeholder="Enter your occupation"
                
              />
            </View>

            <View style={styles.formField}>
              <Text style={[styles.fieldLabel, { color: colors.text.primary }]}>
                Company
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    borderColor: colors.border.light,
                    backgroundColor: colors.background.secondary,
                    color: colors.text.primary,
                  },
                ]}
                value={formData.company}
                onChangeText={(value) => handleFieldChange("company", value)}
                placeholder="Enter your company name"
                
              />
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              {
                backgroundColor: isFormValid()
                  ? colors.primary[500]
                  : colors.gray[300],
              },
              shadows.md,
            ]}
            onPress={handleSubmit}
            disabled={!isFormValid()}
          >
            <Text
              style={[
                styles.submitButtonText,
                { color: isFormValid() ? "white" : colors.text.secondary },
              ]}
            >
              Complete Profile
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: typography.fontSizes["2xl"],
    fontWeight: "700" as const,
  },
  headerSubtitle: {
    fontSize: typography.fontSizes.base,
    marginTop: spacing.xs,
  },
  formContainer: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  formSection: {
    borderRadius: borderRadius["4xl"],
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: "700" as const,
    marginBottom: spacing.md,
  },
  formRow: {
    flexDirection: "row",
  },
  formField: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: typography.fontSizes.sm,
    fontWeight: "600" as const,
    marginBottom: spacing.xs,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSizes.base,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  buttonContainer: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  submitButton: {
    borderRadius: borderRadius["4xl"],
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    fontSize: typography.fontSizes.base,
    fontWeight: "600" as const,
  },
});
