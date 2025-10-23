import React, { useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Button, TextField, Typography } from "../../components/ui";
import { useTheme } from "../../contexts/ThemeContext";
import { spacing, borderRadius } from "../../constants/theme";
import { Ionicons } from "@expo/vector-icons";

// Country code interface
interface CountryCode {
  label: string;
  code: string;
  flag: string;
  value: string;
  expectedLength: number | number[];
  example: string;
  validateNumber?: (number: string) => boolean;
}

// Common country codes for phone numbers with validation patterns
const countryCodes: CountryCode[] = [
  {
    label: "United Kingdom",
    code: "+44",
    flag: "🇬🇧",
    value: "GB",
    expectedLength: 10, // After removing leading 0, UK mobile: 7xxxxxxxxx (10 digits)
    example: "07912 345678 → 7912345678",
    validateNumber: (number: string) => {
      // UK mobile numbers can be:
      // 1. Full format with leading 0: 07xxxxxxxxx (11 digits) - remove leading 0 for validation
      // 2. Without leading 0: 7xxxxxxxxx (10 digits)
      // Valid mobile prefixes: 071, 072, 073, 074, 075, 076, 077, 078, 079
      // But we'll be more flexible for user experience

      // Remove leading 0 if present
      const cleanNumber = number.replace(/^0+/, "");

      // Check if it's a valid UK mobile format: 7 followed by 9 digits (total 10 digits)
      return /^7\d{9}$/.test(cleanNumber);
    },
  },
  {
    label: "United States",
    code: "+1",
    flag: "🇺🇸",
    value: "US",
    expectedLength: 10, // US: (555) 123-4567 → 5551234567 (10 digits)
    example: "(555) 123-4567 → 5551234567",
  },
  {
    label: "Canada",
    code: "+1",
    flag: "🇨🇦",
    value: "CA",
    expectedLength: 10,
    example: "(555) 123-4567 → 5551234567",
  },
  {
    label: "Australia",
    code: "+61",
    flag: "🇦🇺",
    value: "AU",
    expectedLength: 9, // AU mobile: 04xx xxx xxx → 4xxxxxxxx (9 digits)
    example: "0412 345 678 → 412345678",
  },
  {
    label: "Germany",
    code: "+49",
    flag: "🇩🇪",
    value: "DE",
    expectedLength: [10, 11], // Variable length
    example: "0171 1234567 → 1711234567",
  },
  {
    label: "France",
    code: "+33",
    flag: "🇫🇷",
    value: "FR",
    expectedLength: 9, // FR: 06 12 34 56 78 → 612345678 (9 digits)
    example: "06 12 34 56 78 → 612345678",
  },
  {
    label: "Spain",
    code: "+34",
    flag: "🇪🇸",
    value: "ES",
    expectedLength: 9,
    example: "612 34 56 78 → 612345678",
  },
  {
    label: "Italy",
    code: "+39",
    flag: "🇮🇹",
    value: "IT",
    expectedLength: [9, 10], // Variable length
    example: "342 123 4567 → 3421234567",
  },
  {
    label: "Netherlands",
    code: "+31",
    flag: "🇳🇱",
    value: "NL",
    expectedLength: 9, // NL: 06 12345678 → 612345678 (9 digits)
    example: "06 12345678 → 612345678",
  },
  {
    label: "India",
    code: "+91",
    flag: "🇮🇳",
    value: "IN",
    expectedLength: 10, // IN: 98765 43210 → 9876543210 (10 digits)
    example: "98765 43210 → 9876543210",
  },
];

export default function RegisterStep5({
  values,
  onChange,
  onBack,
  onSubmit,
  isLoading,
}: any) {
  const { colors } = useTheme();
  const [selectedCountryCode, setSelectedCountryCode] = useState(
    countryCodes[0]
  );
  const [phoneNumber, setPhoneNumber] = useState(values.phone_number || "");
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  // Sync phone number with parent form state (only on initial load)
  useEffect(() => {
    if (values.phone_number && !phoneNumber) {
      setPhoneNumber(values.phone_number);
    }
  }, [values.phone_number]);

  // Set name field on component mount
  useEffect(() => {
    const fullName = `${values.givenName} ${values.familyName}`.trim();
    if (fullName && !values.name) {
      onChange("name", fullName);
    }
  }, []);

  const clearPhoneNumber = () => {
    setPhoneNumber("");
    setPhoneError("");
  };

  const handleSubmit = () => {
    // Clear previous errors
    setPhoneError("");

    // Basic phone number validation
    if (!phoneNumber.trim()) {
      setPhoneError("Phone number is required");
      return;
    }

    // Clean the phone number - remove any non-digit characters
    let cleanedNumber = phoneNumber.replace(/[^\d]/g, "");

    // Remove leading zeros (common in many countries)
    cleanedNumber = cleanedNumber.replace(/^0+/, "");

    // Check with custom validation function if available
    if (selectedCountryCode.validateNumber) {
      if (!selectedCountryCode.validateNumber(cleanedNumber)) {
        setPhoneError(
          `Invalid phone number format for ${selectedCountryCode.label}. Example: ${selectedCountryCode.example}`
        );
        return;
      }
    } else {
      // Check length based on country (fallback)
      const expectedLength = selectedCountryCode.expectedLength;
      const isValidLength = Array.isArray(expectedLength)
        ? expectedLength.includes(cleanedNumber.length)
        : cleanedNumber.length === expectedLength;

      if (!isValidLength) {
        const lengthText = Array.isArray(expectedLength)
          ? expectedLength.join(" or ")
          : expectedLength.toString();
        setPhoneError(
          `Invalid phone number length. Expected ${lengthText} digits for ${selectedCountryCode.label}. Example: ${selectedCountryCode.example}`
        );
        return;
      }
    }

    // Create formatted phone number in E.164 format
    const formattedPhone = `${selectedCountryCode.code}${cleanedNumber}`;

    console.log("Phone formatting debug:", {
      original: phoneNumber,
      cleaned: cleanedNumber,
      countryCode: selectedCountryCode.code,
      formatted: formattedPhone,
    });

    // Validate E.164 format (+ followed by 1-15 digits)
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    if (!e164Regex.test(formattedPhone)) {
      setPhoneError(
        `Invalid phone number format. Must be in E.164 format (e.g., ${selectedCountryCode.code}1234567890)`
      );
      return;
    }

    // Set phone number in E.164 format (backend expects 'phone_number' with underscore)
    onChange("phone_number", formattedPhone);

    // Also set the name field as concatenated first and last name for compatibility
    const fullName = `${values.givenName} ${values.familyName}`.trim();
    onChange("name", fullName);

    // Pass the values directly to onSubmit to avoid React state timing issues
    // This ensures the formatted phone_number and name are used immediately
    onSubmit({ phone_number: formattedPhone, name: fullName });
  };

  return (
    <View style={styles.container}>
      {/* Glass Progress Indicator - All Complete */}
      <View style={styles.progressContainer}>
        <View style={styles.completedStep}>
          <Ionicons name="checkmark" size={16} color="white" />
        </View>
        <View style={styles.completedLine} />
        <View style={styles.completedStep}>
          <Ionicons name="checkmark" size={16} color="white" />
        </View>
        <View style={styles.completedLine} />
        <View style={styles.completedStep}>
          <Ionicons name="checkmark" size={16} color="white" />
        </View>
        <View style={styles.completedLine} />
        <View style={styles.completedStep}>
          <Ionicons name="checkmark" size={16} color="white" />
        </View>
        <View style={styles.completedLine} />
        <View style={styles.activeStep}>
          <Typography variant="caption" style={styles.activeStepText}>
            5
          </Typography>
        </View>
      </View>

      {/* Glass Header */}
      <View style={styles.header}>
        <Typography variant="h2" style={styles.title}>
          Phone Number
        </Typography>
        <Typography variant="body" style={styles.subtitle}>
          Add your phone number for account security
        </Typography>
      </View>

      {/* Glass Form Fields */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formFields}>
          {/* Phone Number Input */}
          <View style={styles.inputContainer}>
            <Typography
              variant="body"
              style={styles.inputLabel}
              weight="medium"
            >
              Phone Number *
            </Typography>

            <View style={styles.phoneInputContainer}>
              {/* Country Code Picker */}
              <TouchableOpacity
                onPress={() => setShowCountryPicker(!showCountryPicker)}
                style={styles.countryCodeButton}
              >
                <Typography variant="body" style={{ color: "white" }}>
                  {selectedCountryCode.flag} {selectedCountryCode.code}
                </Typography>
                <Ionicons
                  name="chevron-down"
                  size={16}
                  color="rgba(255, 255, 255, 0.7)"
                />
              </TouchableOpacity>

              {/* Phone Number Field */}
              <View style={styles.phoneInputWrapper}>
                <TextField
                  placeholder="Enter phone number"
                  value={phoneNumber}
                  onChangeText={(text) => {
                    setPhoneNumber(text);
                    setPhoneError(""); // Clear error when user types
                    // Don't update parent form state here - only on submit with proper formatting
                  }}
                  keyboardType="phone-pad"
                  style={styles.phoneInput}
                  editable={true}
                  autoFocus={false}
                />
                {phoneNumber.length > 0 && (
                  <TouchableOpacity
                    onPress={clearPhoneNumber}
                    style={styles.clearButton}
                  >
                    <Ionicons
                      name="close-circle"
                      size={20}
                      color="rgba(255, 255, 255, 0.7)"
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Phone Error Display */}
            {phoneError && (
              <View style={styles.errorContainer}>
                <Ionicons name="warning" size={20} color="#ef4444" />
                <Typography variant="body" style={styles.errorText}>
                  {phoneError}
                </Typography>
              </View>
            )}

            {/* Country Code Options */}
            {showCountryPicker && (
              <View style={styles.countryList}>
                <ScrollView
                  style={styles.countryScrollView}
                  nestedScrollEnabled={true}
                >
                  {countryCodes.map((country, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.countryOption}
                      onPress={() => {
                        setSelectedCountryCode(country);
                        setShowCountryPicker(false);
                      }}
                    >
                      <Typography variant="body" style={{ color: "white" }}>
                        {country.flag} {country.code} {country.label}
                      </Typography>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Privacy Note */}
          <View style={styles.privacyNote}>
            <Ionicons name="shield-checkmark-outline" size={20} color="white" />
            <Typography variant="caption" style={styles.privacyText}>
              Your phone number will be used for account verification and
              security purposes only.
            </Typography>
          </View>

          {/* Review Summary */}
          <View style={styles.summaryContainer}>
            <Typography
              variant="body"
              style={styles.summaryTitle}
              weight="semibold"
            >
              Account Summary
            </Typography>

            <View style={styles.summaryItem}>
              <Typography variant="caption" style={styles.summaryLabel}>
                Name:
              </Typography>
              <Typography variant="caption" style={styles.summaryValue}>
                {values.givenName} {values.familyName}
              </Typography>
            </View>

            <View style={styles.summaryItem}>
              <Typography variant="caption" style={styles.summaryLabel}>
                Username:
              </Typography>
              <Typography variant="caption" style={styles.summaryValue}>
                {values.username}
              </Typography>
            </View>

            <View style={styles.summaryItem}>
              <Typography variant="caption" style={styles.summaryLabel}>
                Email:
              </Typography>
              <Typography variant="caption" style={styles.summaryValue}>
                {values.email}
              </Typography>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Glass Navigation Buttons */}
      <View style={styles.buttonContainer}>
        <Button
          title="Back"
          onPress={onBack}
          style={styles.backButton}
          textStyle={{ color: "white" }}
        />
        <Button
          title={isLoading ? "Creating Account..." : "Create Account"}
          onPress={handleSubmit}
          style={StyleSheet.flatten([
            styles.submitButton,
            { opacity: isLoading ? 0.7 : 1 },
          ])}
          disabled={isLoading || !phoneNumber.trim()}
        />
      </View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: spacing.md,
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  completedStep: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderWidth: 2,
    borderColor: "white",
  },
  activeStep: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderWidth: 2,
    borderColor: "white",
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  completedLine: {
    width: 24,
    height: 2,
    marginHorizontal: 4,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  progressLine: {
    width: 24,
    height: 2,
    marginHorizontal: 4,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  activeStepText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: spacing.xs,
    color: "white",
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    color: "rgba(255, 255, 255, 0.85)",
  },
  scrollView: {
    flex: 1,
  },
  formFields: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    color: "white",
    marginBottom: 6,
    fontSize: 14,
    fontWeight: "600",
  },
  phoneInputContainer: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  countryCodeButton: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minHeight: 48,
  },
  phoneInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  phoneInput: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "white",
    minHeight: 48,
  },
  clearButton: {
    position: "absolute",
    right: 12,
    padding: 4,
    zIndex: 1,
  },
  countryList: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 14,
    marginTop: spacing.xs,
    maxHeight: 200,
  },
  countryScrollView: {
    maxHeight: 200,
  },
  countryOption: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  privacyNote: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderColor: "rgba(255, 255, 255, 0.2)",
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    color: "rgba(255, 255, 255, 0.85)",
  },
  summaryContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  summaryTitle: {
    fontSize: 16,
    marginBottom: spacing.sm,
    color: "white",
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  summaryLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: "500",
    color: "white",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  backButton: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 25,
    paddingVertical: 16,
    minHeight: 54,
  },
  submitButton: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
    borderRadius: 25,
    paddingVertical: 16,
    minHeight: 54,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderColor: "rgba(239, 68, 68, 0.3)",
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  errorText: {
    marginLeft: spacing.sm,
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
    color: "white",
  },
});
