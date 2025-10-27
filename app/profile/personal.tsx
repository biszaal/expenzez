import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthGuard } from "../../hooks/useAuthGuard";
import { useAlert } from "../../hooks/useAlert";
import { Header, Section, ListItem, Button } from "../../components/ui";
import { useTheme } from "../../contexts/ThemeContext";
import { spacing, borderRadius, shadows } from "../../constants/theme";
import { getProfile } from "../../services/dataSource";
import { profileAPI } from "../../services/api/profileAPI";
import { useAuth } from "../../app/auth/AuthContext";

/**
 * Personal Information Screen
 *
 * Features:
 * - View and edit personal information
 * - Update profile details
 * - Save changes
 */
export default function PersonalInformationScreen() {
  const router = useRouter();
  const { isLoggedIn } = useAuthGuard();
  const { showSuccess, showError } = useAlert();
  const { colors } = useTheme();
  const { user } = useAuth();

  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Initialize form with user data from AuthContext
  useEffect(() => {
    if (user && !formData) {
      const initialData = {
        firstName: user.given_name || user.firstName || "",
        lastName: user.family_name || user.lastName || "",
        email: user.email || "",
        phone: user.phone_number || user.phone || "",
        address: user.address || "",
        dateOfBirth: user.birthdate || user.dateOfBirth || "",
        occupation: user.occupation || "",
        company: user.company || "",
      };
      console.log(
        "🔄 [Personal] Initializing form with user data:",
        initialData
      );
      setFormData(initialData);
    }
  }, [user]);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        console.log("🔍 [Personal] Fetching profile data...");
        console.log(
          "🔍 [Personal] Current user from AuthContext:",
          JSON.stringify(user, null, 2)
        );

        // Clear cache and force refresh to bypass cache
        try {
          const { clearCachedData } = await import(
            "../../services/config/apiCache"
          );
          // Clear the user-specific cache key
          const userId =
            user?.sub || user?.id || user?.email || user?.username || "default";
          const cacheKey = `user_profile_${userId}`;

          // Debug: Check if cache exists before clearing
          const { getCachedData } = await import(
            "../../services/config/apiCache"
          );
          const cachedBefore = await getCachedData(cacheKey);
          console.log(`🔍 [Personal] Cache before clearing:`, {
            cacheKey,
            cachedBefore: !!cachedBefore,
          });

          await clearCachedData(cacheKey);

          // Debug: Check if cache exists after clearing
          const cachedAfter = await getCachedData(cacheKey);
          console.log(`🔍 [Personal] Cache after clearing:`, {
            cacheKey,
            cachedAfter: !!cachedAfter,
          });
          console.log(
            `🧹 [Personal] Cleared profile cache for user: ${userId}`
          );
        } catch (cacheError) {
          console.warn("⚠️ [Personal] Could not clear cache:", cacheError);
        }

        const data = await getProfile({ forceRefresh: true });
        console.log(
          "📊 [Personal] Profile API response:",
          JSON.stringify(data, null, 2)
        );

        // Debug: Check if the API call is actually being made
        console.log("🔍 [Personal] Force refresh flag:", {
          forceRefresh: true,
        });
        console.log("🔍 [Personal] Specific fields check:", {
          phone: data?.phone,
          phone_number: data?.phone_number,
          dateOfBirth: data?.dateOfBirth,
          birthdate: data?.birthdate,
          address: data?.address,
        });

        // Debug: Check if data is null or empty
        if (!data) {
          console.warn("⚠️ [Personal] Profile data is null or undefined");
        } else {
          console.log(
            "✅ [Personal] Profile data received:",
            Object.keys(data)
          );
        }

        if (data) {
          // Map the API response to form fields
          const mappedData = {
            firstName:
              data.firstName ||
              data.given_name ||
              data.givenName ||
              data.first_name ||
              "",
            lastName:
              data.lastName ||
              data.family_name ||
              data.familyName ||
              data.last_name ||
              "",
            email: data.email || "",
            phone: data.phone || data.phone_number || data.phoneNumber || "",
            address: data.address || "",
            city: data.city || "",
            country: data.country || "",
            dateOfBirth:
              data.dateOfBirth ||
              data.birthdate ||
              data.date_of_birth ||
              data.birthDate ||
              "",
            occupation: data.occupation || "",
            company: data.company || "",
          };

          console.log(
            "✅ [Personal] Mapped profile data:",
            JSON.stringify(mappedData, null, 2)
          );
          setFormData(mappedData);
        } else {
          console.log(
            "⚠️ [Personal] No profile data returned, using user data as fallback"
          );
          // If profile is null, try to use user data from AuthContext
          const userData = user
            ? {
                firstName: user.name?.split(" ")[0] || "",
                lastName: user.name?.split(" ").slice(1).join(" ") || "",
                email: user.email || "",
                phone: "",
                address: "",
                city: "",
                country: "",
                dateOfBirth: "",
                occupation: "",
                company: "",
              }
            : {
                firstName: "",
                lastName: "",
                email: "",
                phone: "",
                address: "",
                city: "",
                country: "",
                dateOfBirth: "",
                occupation: "",
                company: "",
              };

          console.log(
            "👤 [Personal] Using user data as fallback:",
            JSON.stringify(userData, null, 2)
          );
          setFormData(userData);
        }
      } catch (error: any) {
        console.error("❌ [Personal] Error loading profile:", error);
        console.error("❌ [Personal] Error details:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          stack: error.stack,
        });
        // Try to use user data as fallback on error
        const userData = user
          ? {
              firstName:
                user.name?.split(" ")[0] ||
                user.given_name ||
                user.firstName ||
                "",
              lastName:
                user.name?.split(" ").slice(1).join(" ") ||
                user.family_name ||
                user.lastName ||
                "",
              email: user.email || "",
              phone: user.phone_number || user.phone || "",
              address: user.address || "",
              city: "",
              country: "",
              dateOfBirth: user.birthdate || user.dateOfBirth || "",
              occupation: user.occupation || "",
              company: user.company || "",
            }
          : {
              firstName: "",
              lastName: "",
              email: "",
              phone: "",
              address: "",
              city: "",
              country: "",
              dateOfBirth: "",
              occupation: "",
              company: "",
            };

        console.log(
          "🔄 [Personal] Using user data as fallback after error:",
          JSON.stringify(userData, null, 2)
        );
        setFormData(userData);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  if (loading)
    return <Text style={{ padding: 20, textAlign: "center" }}>Loading...</Text>;
  if (!formData)
    return (
      <Text style={{ padding: 20, textAlign: "center" }}>
        Unable to load profile
      </Text>
    );

  // Handle form field changes
  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle save changes
  const handleSave = async () => {
    try {
      // Basic validation
      if (!formData.firstName.trim()) {
        showError("First name is required");
        return;
      }
      if (!formData.lastName.trim()) {
        showError("Last name is required");
        return;
      }

      console.log("💾 [PersonalInfo] Saving profile data:", formData);

      // Note: Email is intentionally excluded from updates (readonly for security)
      const updateData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(), // Included for backend compatibility, but will not be updated
        phone: formData.phone?.trim() || "",
        address: formData.address?.trim() || "",
        dateOfBirth: formData.dateOfBirth?.trim() || "",
        occupation: formData.occupation?.trim() || "",
        company: formData.company?.trim() || "",
      };

      console.log("📤 [PersonalInfo] Sending update request:", updateData);

      // Call the API to update profile
      const response = await profileAPI.updateProfile(updateData);

      console.log("📥 [PersonalInfo] Update response:", response);

      console.log("✅ [PersonalInfo] Profile updated successfully");
      setIsEditing(false);
      showSuccess("Profile updated successfully");

      // Clear cache to force fresh data on next load
      const { clearCachedData } = await import(
        "../../services/config/apiCache"
      );

      // Clear the profile cache (uses "user_profile" key in cachedApiCall)
      await clearCachedData("user_profile");

      console.log("🧹 [PersonalInfo] Cleared profile cache");

      // Refresh the profile data to show updated values
      const updatedProfile = await getProfile({ forceRefresh: true });
      if (updatedProfile) {
        setFormData(updatedProfile);
        console.log(
          "🔄 [PersonalInfo] Refreshed profile data:",
          updatedProfile
        );
      }
    } catch (error) {
      console.error("❌ [PersonalInfo] Failed to update profile:", error);
      showError("Failed to update profile. Please try again.");
    }
  };

  // Handle cancel editing
  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data to original values from API
    getProfile();
  };

  // Handle data deletion request
  const handleDataDeletionRequest = () => {
    Alert.alert(
      "Request Data Deletion",
      "This will initiate a formal request to delete your personal data from our servers.\n\nYour request will be processed within 30 days in accordance with data protection regulations (GDPR).\n\nYou will receive an email confirmation once your data has been deleted.\n\nNote: This is different from account deletion - you can continue using the app, but your stored personal information will be removed.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit Request",
          style: "destructive",
          onPress: () => {
            // Second confirmation
            Alert.alert(
              "Confirm Data Deletion Request",
              "Are you sure you want to request deletion of your personal data?\n\nThis action will:\n• Remove your profile information\n• Delete your transaction history\n• Clear your banking connections\n• Remove all stored personal data\n\nYour account will remain active but will need to be set up again.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Yes, Submit Request",
                  style: "destructive",
                  onPress: submitDataDeletionRequest,
                },
              ]
            );
          },
        },
      ]
    );
  };

  // Submit the data deletion request
  const submitDataDeletionRequest = async () => {
    try {
      console.log("Submitting data deletion request...");

      // TODO: Implement API call to submit data deletion request
      // For now, we'll show a success message with instructions

      Alert.alert(
        "Data Deletion Request Submitted",
        "Your request has been successfully submitted.\n\nReference ID: DDR-" +
          Date.now() +
          "\n\nYou will receive an email confirmation shortly. Your data will be deleted within 30 days as required by data protection regulations.\n\nIf you need to contact us about this request, please reference the ID above.",
        [
          {
            text: "OK",
            onPress: () => {
              // Optionally navigate back or perform other actions
              console.log("Data deletion request acknowledged by user");
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error submitting data deletion request:", error);
      showError(
        "Failed to submit data deletion request. Please try again later."
      );
    }
  };

  // Handle data export request
  const handleDataExport = () => {
    Alert.alert(
      "Export Your Data",
      "Choose the format for your data export. This will include your profile information, transaction history, and account settings.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "JSON Format",
          onPress: () => exportData("json"),
        },
        {
          text: "CSV Format",
          onPress: () => exportData("csv"),
        },
      ]
    );
  };

  // Export data in specified format
  const exportData = async (format: string) => {
    try {
      console.log(`Starting ${format.toUpperCase()} data export...`);

      // TODO: Implement actual data export API call
      // For now, we'll show a success message

      const exportId = "EXP-" + Date.now();

      Alert.alert(
        "Data Export Started",
        `Your data export in ${format.toUpperCase()} format has been initiated.\n\nExport ID: ${exportId}\n\nYou will receive an email with a download link within the next few minutes. The download link will be valid for 7 days.\n\nYour export will include:\n• Profile information\n• Transaction history\n• Account settings\n• Banking connections (anonymized)`,
        [
          {
            text: "OK",
            onPress: () => {
              showSuccess(
                `${format.toUpperCase()} export requested successfully`
              );
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error requesting data export:", error);
      showError("Failed to start data export. Please try again later.");
    }
  };

  // If not logged in, don't render anything (auth guard will handle redirect)
  if (!isLoggedIn) {
    return null;
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background.secondary },
      ]}
    >
      {/* Header */}
      <Header
        title="Personal Information"
        subtitle="Update your profile details"
        showBackButton={true}
        rightButton={
          isEditing
            ? {
                icon: "close-outline",
                onPress: handleCancel,
              }
            : {
                icon: "create-outline",
                onPress: () => setIsEditing(true),
              }
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Personal Details Section */}
        <Section title="Personal Details">
          <View style={styles.formContainer}>
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
                      backgroundColor: colors.background.primary,
                      color: colors.text.primary,
                    },
                    !isEditing && {
                      backgroundColor: colors.gray[50],
                      color: colors.text.secondary,
                    },
                  ]}
                  value={formData.firstName}
                  onChangeText={(value) =>
                    handleFieldChange("firstName", value)
                  }
                  editable={isEditing}
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
                      backgroundColor: colors.background.primary,
                      color: colors.text.primary,
                    },
                    !isEditing && {
                      backgroundColor: colors.gray[50],
                      color: colors.text.secondary,
                    },
                  ]}
                  value={formData.lastName}
                  onChangeText={(value) => handleFieldChange("lastName", value)}
                  editable={isEditing}
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
                    backgroundColor: colors.gray[50],
                    color: colors.text.secondary,
                  },
                ]}
                value={formData.email}
                editable={false}
                placeholder="Enter email address"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Text
                style={[styles.helperText, { color: colors.text.tertiary }]}
              >
                Email address cannot be changed for security reasons
              </Text>
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
                    backgroundColor: colors.background.primary,
                    color: colors.text.primary,
                  },
                  !isEditing && {
                    backgroundColor: colors.gray[50],
                    color: colors.text.secondary,
                  },
                ]}
                value={formData.phone}
                onChangeText={(value) => handleFieldChange("phone", value)}
                editable={isEditing}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formField}>
              <Text style={[styles.fieldLabel, { color: colors.text.primary }]}>
                Date of Birth
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    borderColor: colors.border.light,
                    backgroundColor: colors.background.primary,
                    color: colors.text.primary,
                  },
                  !isEditing && {
                    backgroundColor: colors.gray[50],
                    color: colors.text.secondary,
                  },
                ]}
                value={formData.dateOfBirth}
                onChangeText={(value) =>
                  handleFieldChange("dateOfBirth", value)
                }
                editable={isEditing}
                placeholder="YYYY-MM-DD"
              />
            </View>
          </View>
        </Section>

        {/* Address Section */}
        <Section title="Address">
          <View style={styles.formContainer}>
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
                    backgroundColor: colors.background.primary,
                    color: colors.text.primary,
                  },
                  !isEditing && {
                    backgroundColor: colors.gray[50],
                    color: colors.text.secondary,
                  },
                ]}
                value={formData.address}
                onChangeText={(value) => handleFieldChange("address", value)}
                editable={isEditing}
                placeholder="Enter your address"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </Section>

        {/* Professional Information Section */}
        <Section title="Professional Information">
          <View style={styles.formContainer}>
            <View style={styles.formField}>
              <Text style={[styles.fieldLabel, { color: colors.text.primary }]}>
                Occupation
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    borderColor: colors.border.light,
                    backgroundColor: colors.background.primary,
                    color: colors.text.primary,
                  },
                  !isEditing && {
                    backgroundColor: colors.gray[50],
                    color: colors.text.secondary,
                  },
                ]}
                value={formData.occupation}
                onChangeText={(value) => handleFieldChange("occupation", value)}
                editable={isEditing}
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
                    backgroundColor: colors.background.primary,
                    color: colors.text.primary,
                  },
                  !isEditing && {
                    backgroundColor: colors.gray[50],
                    color: colors.text.secondary,
                  },
                ]}
                value={formData.company}
                onChangeText={(value) => handleFieldChange("company", value)}
                editable={isEditing}
                placeholder="Enter your company name"
              />
            </View>
          </View>
        </Section>

        {/* Save Button */}
        {isEditing && (
          <Section marginTop={spacing.lg}>
            <Button
              title="Save Changes"
              onPress={handleSave}
              variant="primary"
              size="large"
              fullWidth
            />
          </Section>
        )}

        {/* Additional Options */}
        <Section title="Additional Options">
          <ListItem
            icon={{ name: "download-outline", backgroundColor: "#DBEAFE" }}
            title="Export Data"
            subtitle="Download your personal data"
            onPress={handleDataExport}
          />

          <ListItem
            icon={{ name: "trash-outline", backgroundColor: "#FEE2E2" }}
            title="Delete Personal Data"
            subtitle="Request data deletion"
            onPress={handleDataDeletionRequest}
            variant="danger"
          />
        </Section>
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
    paddingBottom: 24,
  },
  formContainer: {
    gap: 12,
  },
  formRow: {
    flexDirection: "row",
  },
  formField: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 6,
    opacity: 0.8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: "italic",
  },
});
