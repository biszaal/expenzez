import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  TextInput,
  Alert,
  Text,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthGuard } from "../../hooks/useAuthGuard";
import { useAlert } from "../../hooks/useAlert";
import { Header, Section, ListItem, Button } from "../../components/ui";
import { useTheme } from "../../contexts/ThemeContext";
import { spacing } from "../../constants/theme";
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
  const { isLoggedIn } = useAuthGuard();
  const { showSuccess, showError } = useAlert();
  const { colors } = useTheme();
  const { user } = useAuth();

  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Parse birthdate (MM/DD/YYYY or ISO format) into components
  const parseBirthdate = (dateString: string) => {
    if (!dateString) return { year: "", month: "", day: "" };

    try {
      let year, month, day;

      // Check if it's ISO format (YYYY-MM-DD)
      if (dateString.includes("-") && dateString.length === 10) {
        const [isoYear, isoMonth, isoDay] = dateString.split("-");
        year = isoYear;
        month = isoMonth;
        day = isoDay;
      }
      // Check if it's MM/DD/YYYY format
      else if (dateString.includes("/")) {
        const [monthPart, dayPart, yearPart] = dateString.split("/");
        year = yearPart;
        month = monthPart;
        day = dayPart;
      } else {
        console.warn("Unknown birthdate format:", dateString);
        return { year: "", month: "", day: "" };
      }

      if (!year || !month || !day) {
        console.warn("Invalid birthdate format:", dateString);
        return { year: "", month: "", day: "" };
      }

      const result = {
        year: year,
        month: month.padStart(2, "0"),
        day: day.padStart(2, "0"),
      };

      console.log("🔍 [PersonalInfo] Parsing birthdate:", {
        input: dateString,
        format: dateString.includes("-") ? "ISO" : "MM/DD/YYYY",
        result,
      });

      return result;
    } catch (error) {
      console.warn("Error parsing birthdate:", error);
      return { year: "", month: "", day: "" };
    }
  };

  // Combine date components into MM/DD/YYYY format
  const combineDateComponents = (year: string, month: string, day: string) => {
    if (!year || !month || !day) return "";

    try {
      const yearNum = parseInt(year);
      const monthNum = parseInt(month);
      const dayNum = parseInt(day);

      console.log("🔍 [PersonalInfo] Combining date components:", {
        year,
        month,
        day,
        yearNum,
        monthNum,
        dayNum,
      });

      // Validate the date
      const date = new Date(yearNum, monthNum - 1, dayNum);
      if (isNaN(date.getTime())) return "";

      // Format as MM/DD/YYYY
      const result = `${monthNum.toString().padStart(2, "0")}/${dayNum.toString().padStart(2, "0")}/${yearNum}`;

      console.log("🔍 [PersonalInfo] Combined date result:", {
        input: { year, month, day },
        result,
      });

      return result;
    } catch (error) {
      console.warn("Error combining date components:", error);
      return "";
    }
  };

  // Format birthdate for display
  const formatBirthdate = (dateString: string) => {
    if (!dateString) return "";

    try {
      // Parse MM/DD/YYYY format
      const [month, day, year] = dateString.split("/");
      if (!month || !day || !year) return dateString;

      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (isNaN(date.getTime())) return dateString;

      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch (error) {
      console.warn("Error formatting birthdate:", error);
      return dateString;
    }
  };

  // Format phone number for display
  const formatPhoneNumber = (phone: string) => {
    if (!phone) return "";

    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, "");

    // Format UK phone numbers
    if (cleaned.startsWith("44") && cleaned.length === 12) {
      return `+44 ${cleaned.slice(2, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
    } else if (cleaned.startsWith("0") && cleaned.length === 11) {
      return `+44 ${cleaned.slice(1, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
    }

    return phone; // Return original if not a standard UK format
  };

  // Parse address into components
  const parseAddress = (address: string) => {
    if (!address) return { street: "", city: "", postcode: "", country: "" };

    // Parse UK address format: "Street, City, Postcode, Country"
    const parts = address.split(",").map((part) => part.trim());

    // For the address "Richard Street South, west bromwich, England, B70 8AN, United Kingdom"
    // parts[0] = "Richard Street South" (street)
    // parts[1] = "west bromwich" (city)
    // parts[2] = "England" (this should be country, not postcode)
    // parts[3] = "B70 8AN" (this should be postcode)
    // parts[4] = "United Kingdom" (this should be country)

    // Look for postcode pattern (UK postcodes: letters + numbers + space + letters + numbers)
    const postcodePattern = /\b[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}\b/i;
    let postcode = "";
    let country = "";
    let street = parts[0] || "";
    let city = parts[1] || "";

    // Find postcode and country
    for (let i = 2; i < parts.length; i++) {
      if (postcodePattern.test(parts[i])) {
        postcode = parts[i];
        // Everything after postcode is country
        if (i + 1 < parts.length) {
          country = parts.slice(i + 1).join(", ");
        }
        break;
      } else if (i === parts.length - 1) {
        // If no postcode found, last part is country
        country = parts[i];
      }
    }

    return {
      street,
      city,
      postcode,
      country,
    };
  };

  // Initialize form with user data from AuthContext
  useEffect(() => {
    if (user && !formData) {
      const dateComponents = parseBirthdate(user.birthdate || "");
      const initialData = {
        firstName: user.given_name || user.firstName || "",
        lastName: user.family_name || user.lastName || "",
        email: user.email || "",
        phone: user.phone_number || user.phone || "",
        address: user.address || "",
        city: "",
        postcode: "",
        country: "",
        birthdate: user.birthdate || "",
        birthYear: dateComponents.year,
        birthMonth: dateComponents.month,
        birthDay: dateComponents.day,
        occupation: user.occupation || "",
        company: user.company || "",
      };
      console.log(
        "🔄 [Personal] Initializing form with user data:",
        initialData
      );
      setFormData(initialData);
    }
  }, [user, formData]);

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
          // Parse address if it's a single string
          const addressData = data.address
            ? parseAddress(data.address)
            : { street: "", city: "", postcode: "", country: "" };

          // Parse birthdate into components
          const birthdate =
            data.birthdate ||
            data.dateOfBirth ||
            data.date_of_birth ||
            data.birthDate ||
            "";

          console.log("🔍 [PersonalInfo] Raw birthdate data:", {
            data_birthdate: data.birthdate,
            data_dateOfBirth: data.dateOfBirth,
            data_date_of_birth: data.date_of_birth,
            data_birthDate: data.birthDate,
            final_birthdate: birthdate,
          });

          const dateComponents = parseBirthdate(birthdate);

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
            address: addressData.street || data.address || "",
            city: data.city || addressData.city || "",
            postcode: data.postcode || addressData.postcode || "",
            country: data.country || addressData.country || "",
            birthdate: birthdate,
            birthYear: dateComponents.year,
            birthMonth: dateComponents.month,
            birthDay: dateComponents.day,
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
                birthdate: "",
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
                birthdate: "",
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
        const fallbackDateComponents = parseBirthdate(user?.birthdate || "");
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
              postcode: "",
              country: "",
              birthdate: user.birthdate || "",
              birthYear: fallbackDateComponents.year,
              birthMonth: fallbackDateComponents.month,
              birthDay: fallbackDateComponents.day,
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
              postcode: "",
              country: "",
              dateOfBirth: "",
              birthYear: "",
              birthMonth: "",
              birthDay: "",
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

      // Combine address fields into a single string for backend compatibility
      const addressParts = [
        formData.address?.trim() || "",
        formData.city?.trim() || "",
        formData.postcode?.trim() || "",
        formData.country?.trim() || "",
      ].filter((part) => part.length > 0);

      const combinedAddress = addressParts.join(", ");

      // Combine date components into MM/DD/YYYY string
      const combinedBirthdate = combineDateComponents(
        formData.birthYear?.trim() || "",
        formData.birthMonth?.trim() || "",
        formData.birthDay?.trim() || ""
      );

      console.log("🔍 [PersonalInfo] Date components debug:", {
        birthYear: formData.birthYear?.trim(),
        birthMonth: formData.birthMonth?.trim(),
        birthDay: formData.birthDay?.trim(),
        combinedBirthdate,
        originalBirthdate: formData.birthdate,
      });

      // Note: Email is intentionally excluded from updates (readonly for security)
      const updateData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(), // Included for backend compatibility, but will not be updated
        phone: formData.phone?.trim() || "",
        address: combinedAddress,
        city: formData.city?.trim() || "",
        postcode: formData.postcode?.trim() || "",
        country: formData.country?.trim() || "",
        birthdate: combinedBirthdate || formData.birthdate?.trim() || "",
        occupation: formData.occupation?.trim() || "",
        company: formData.company?.trim() || "",
      };

      console.log("📤 [PersonalInfo] Sending update request:", updateData);

      // Call the API to update profile
      console.log("🔍 [PersonalInfo] About to call profileAPI.updateProfile");
      const response = await profileAPI.updateProfile(updateData);

      console.log("📥 [PersonalInfo] Update response:", response);
      console.log("📥 [PersonalInfo] Response status:", response?.status);
      console.log("📥 [PersonalInfo] Response data:", response?.data);

      console.log("✅ [PersonalInfo] Profile updated successfully");
      setIsEditing(false);
      showSuccess("Profile updated successfully");

      // Clear cache to force fresh data on next load
      const { clearCachedData } = await import(
        "../../services/config/apiCache"
      );

      // Get the correct user-specific cache key
      const userStr = await AsyncStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      const userId =
        user?.sub || user?.id || user?.email || user?.username || "default";
      const cacheKey = `user_profile_${userId}`;

      // Clear the profile cache with the correct user-specific key
      await clearCachedData(cacheKey);

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

      // Import API client and logout function
      const { apiClient } = await import("../../services/config/apiClient");
      const { logout } = useAuth();

      // Call backend delete-account endpoint
      const response = await apiClient.delete("/auth/delete-account");

      if (response.status === 200) {
        console.log("Account deletion successful");

        Alert.alert(
          "Account Deleted",
          "Your account and all associated data have been permanently deleted.\n\nThank you for using Expenzez. We're sorry to see you go.",
          [
            {
              text: "OK",
              onPress: async () => {
                // Logout and clear all local data
                await logout();
                router.replace("/auth/login");
              },
            },
          ]
        );
      } else {
        throw new Error("Unexpected response from server");
      }
    } catch (error: any) {
      console.error("Error submitting data deletion request:", error);

      let errorMessage = "Failed to delete account. Please try again later.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      showError(errorMessage);
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
                value={
                  isEditing ? formData.phone : formatPhoneNumber(formData.phone)
                }
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
              <View style={styles.formRow}>
                <View
                  style={[
                    styles.formField,
                    { flex: 1, marginRight: spacing.xs },
                  ]}
                >
                  <Text
                    style={[
                      styles.subFieldLabel,
                      { color: colors.text.secondary },
                    ]}
                  >
                    Day
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
                    value={isEditing ? formData.birthDay : formData.birthDay}
                    onChangeText={(value) =>
                      handleFieldChange("birthDay", value)
                    }
                    editable={isEditing}
                    placeholder="DD"
                    keyboardType="numeric"
                    maxLength={2}
                  />
                </View>
                <View
                  style={[
                    styles.formField,
                    { flex: 1, marginHorizontal: spacing.xs },
                  ]}
                >
                  <Text
                    style={[
                      styles.subFieldLabel,
                      { color: colors.text.secondary },
                    ]}
                  >
                    Month
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
                    value={
                      isEditing ? formData.birthMonth : formData.birthMonth
                    }
                    onChangeText={(value) =>
                      handleFieldChange("birthMonth", value)
                    }
                    editable={isEditing}
                    placeholder="MM"
                    keyboardType="numeric"
                    maxLength={2}
                  />
                </View>
                <View
                  style={[
                    styles.formField,
                    { flex: 1, marginLeft: spacing.xs },
                  ]}
                >
                  <Text
                    style={[
                      styles.subFieldLabel,
                      { color: colors.text.secondary },
                    ]}
                  >
                    Year
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
                    value={isEditing ? formData.birthYear : formData.birthYear}
                    onChangeText={(value) =>
                      handleFieldChange("birthYear", value)
                    }
                    editable={isEditing}
                    placeholder="YYYY"
                    keyboardType="numeric"
                    maxLength={4}
                  />
                </View>
              </View>
              {!isEditing && formData.birthdate && (
                <Text
                  style={[styles.helperText, { color: colors.text.tertiary }]}
                >
                  {formatBirthdate(formData.birthdate)}
                </Text>
              )}
            </View>
          </View>
        </Section>

        {/* Address Section */}
        <Section title="Address">
          <View style={styles.formContainer}>
            <View style={styles.formField}>
              <Text style={[styles.fieldLabel, { color: colors.text.primary }]}>
                Street Address
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
                value={formData.address}
                onChangeText={(value) => handleFieldChange("address", value)}
                editable={isEditing}
                placeholder="Enter street address"
              />
            </View>

            <View style={styles.formRow}>
              <View
                style={[styles.formField, { flex: 1, marginRight: spacing.sm }]}
              >
                <Text
                  style={[styles.fieldLabel, { color: colors.text.primary }]}
                >
                  City
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
                  value={formData.city}
                  onChangeText={(value) => handleFieldChange("city", value)}
                  editable={isEditing}
                  placeholder="Enter city"
                />
              </View>
              <View
                style={[styles.formField, { flex: 1, marginLeft: spacing.sm }]}
              >
                <Text
                  style={[styles.fieldLabel, { color: colors.text.primary }]}
                >
                  Postcode
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
                  value={formData.postcode}
                  onChangeText={(value) => handleFieldChange("postcode", value)}
                  editable={isEditing}
                  placeholder="Enter postcode"
                  autoCapitalize="characters"
                />
              </View>
            </View>

            <View style={styles.formField}>
              <Text style={[styles.fieldLabel, { color: colors.text.primary }]}>
                Country
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
                value={formData.country}
                onChangeText={(value) => handleFieldChange("country", value)}
                editable={isEditing}
                placeholder="Enter country"
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
  subFieldLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
    opacity: 0.7,
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
