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

/**
 * Personal Information Screen
 *
 * Features:
 * - View and edit personal information
 * - Update profile details
 * - Change avatar
 * - Save changes
 */
export default function PersonalInformationScreen() {
  const router = useRouter();
  const { isLoggedIn } = useAuthGuard();
  const { showSuccess, showError } = useAlert();
  const { colors } = useTheme();

  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const data = await getProfile();
      setFormData(data);
      setLoading(false);
    };
    fetchProfile();
  }, []);

  if (loading || !formData) return <Text>Loading...</Text>;

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
      // TODO: Implement API call to update profile
      setIsEditing(false);
      showSuccess("Profile updated successfully");
    } catch (error) {
      showError("Failed to update profile");
    }
  };

  // Handle cancel editing
  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data to original values from API
    fetchProfile();
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
        {/* Profile Picture Section */}
        <Section title="Profile Picture">
          <View style={styles.profilePictureContainer}>
            <View
              style={[
                styles.profilePicture,
                { backgroundColor: colors.gray[100] },
              ]}
            >
              <Ionicons name="person" size={40} color={colors.gray[400]} />
            </View>
            <TouchableOpacity
              style={[
                styles.changePictureButton,
                { backgroundColor: colors.primary[500] },
              ]}
              onPress={() => {
                // TODO: Implement image picker
                showError("Image picker not implemented yet");
              }}
            >
              <Text style={styles.changePictureText}>Change Picture</Text>
            </TouchableOpacity>
          </View>
        </Section>

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
                  placeholderTextColor={colors.text.tertiary}
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
                  placeholderTextColor={colors.text.tertiary}
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
                    backgroundColor: colors.background.primary,
                    color: colors.text.primary,
                  },
                  !isEditing && {
                    backgroundColor: colors.gray[50],
                    color: colors.text.secondary,
                  },
                ]}
                value={formData.email}
                onChangeText={(value) => handleFieldChange("email", value)}
                editable={isEditing}
                placeholder="Enter email address"
                placeholderTextColor={colors.text.tertiary}
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
                placeholderTextColor={colors.text.tertiary}
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
                placeholderTextColor={colors.text.tertiary}
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
                placeholderTextColor={colors.text.tertiary}
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
                placeholderTextColor={colors.text.tertiary}
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
                placeholderTextColor={colors.text.tertiary}
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
            onPress={() => {
              // TODO: Implement data export
              showSuccess("Data export not implemented yet");
            }}
          />

          <ListItem
            icon={{ name: "trash-outline", backgroundColor: "#FEE2E2" }}
            title="Delete Personal Data"
            subtitle="Request data deletion"
            onPress={() => {
              // TODO: Implement data deletion request
              showError("Data deletion request not implemented yet");
            }}
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
    paddingBottom: spacing["2xl"],
  },
  profilePictureContainer: {
    alignItems: "center",
    paddingVertical: spacing.lg,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    ...shadows.md,
  },
  changePictureButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  changePictureText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  formContainer: {
    gap: spacing.md,
  },
  formRow: {
    flexDirection: "row",
  },
  formField: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
});
