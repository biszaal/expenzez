import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Platform,
  StyleSheet,
  Modal,
} from "react-native";
import { Button, Typography } from "../../components/ui";
import { useTheme } from "../../contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

const genderOptions = [
  { label: "Male", value: "male", icon: "man" },
  { label: "Female", value: "female", icon: "woman" },
  { label: "Other", value: "other", icon: "person" },
];

// Expenzez is an 18+ service (see Terms of Service). Date of birth is required
// so we can confirm eligibility and stay out of scope of the ICO Children's Code.
const MINIMUM_AGE = 18;

// Whole years between a date and today.
const getAge = (date: Date): number => {
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const monthDiff = now.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < date.getDate())) {
    age--;
  }
  return age;
};

// The most recent date of birth that still qualifies as 18+. Also used as the
// date picker's default and maximum so an under-age date can't be selected.
const latestAllowedDob = (): Date => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - MINIMUM_AGE);
  return d;
};

// Helper function to format date as YYYY-MM-DD (EXACTLY 10 characters for AWS Cognito)
const formatDateForCognito = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const formatted = `${year}-${month}-${day}`;
  console.log("📅 [RegisterStep2] Formatted date:", {
    original: date,
    formatted,
    length: formatted.length,
  });
  return formatted;
};

export default function RegisterStep2({
  values,
  onChange,
  onNext,
  onBack,
}: any) {
  const { colors } = useTheme();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dobError, setDobError] = useState("");

  // Parse date from string format - handles both ISO (YYYY-MM-DD) and MM/DD/YYYY
  const parseDate = (dateString: string) => {
    if (!dateString) return new Date();

    console.log("🔍 [RegisterStep2] Parsing date:", dateString);

    // Remove any timestamp portion if present (T00:00:00.000Z)
    const dateOnly = dateString.split("T")[0];

    if (dateOnly.includes("/")) {
      // MM/DD/YYYY format - parse manually to avoid timezone issues
      const [month, day, year] = dateOnly.split("/").map(Number);
      const parsedDate = new Date(year, month - 1, day); // month is 0-indexed
      console.log("🔍 [RegisterStep2] Parsed MM/DD/YYYY:", parsedDate);
      return parsedDate;
    } else {
      // ISO format (YYYY-MM-DD) - parse manually to avoid timezone issues
      const [year, month, day] = dateOnly.split("-").map(Number);
      const parsedDate = new Date(year, month - 1, day); // month is 0-indexed
      console.log("🔍 [RegisterStep2] Parsed ISO:", parsedDate);
      return parsedDate;
    }
  };

  const [tempDate, setTempDate] = useState(
    values.dob ? parseDate(values.dob) : latestAllowedDob()
  );

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      // On Android, automatically close and save
      const currentDate = selectedDate || tempDate;
      setShowDatePicker(false);
      // Format as YYYY-MM-DD (EXACTLY 10 characters for AWS Cognito)
      const formattedDate = formatDateForCognito(currentDate);
      console.log("📅 [RegisterStep2] Android - Setting date:", formattedDate);
      onChange("dob", formattedDate);
      setDobError(
        getAge(currentDate) < MINIMUM_AGE
          ? `You must be at least ${MINIMUM_AGE} to use Expenzez.`
          : ""
      );
    } else {
      // On iOS, just update the temp date, don't close picker
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  const handleDateConfirm = () => {
    // Format as YYYY-MM-DD (EXACTLY 10 characters for AWS Cognito)
    const formattedDate = formatDateForCognito(tempDate);
    console.log("📅 [RegisterStep2] iOS - Setting date:", formattedDate);
    onChange("dob", formattedDate);
    setDobError(
      getAge(tempDate) < MINIMUM_AGE
        ? `You must be at least ${MINIMUM_AGE} to use Expenzez.`
        : ""
    );
    setShowDatePicker(false);
  };

  const handleDateCancel = () => {
    // Reset to original date and close
    setTempDate(values.dob ? parseDate(values.dob) : new Date());
    setShowDatePicker(false);
  };

  const handleNext = () => {
    // Date of birth is required: Expenzez is an 18+ service and we must verify
    // age before creating an account.
    if (!values.dob) {
      setDobError("Please enter your date of birth to continue.");
      return;
    }
    if (getAge(parseDate(values.dob)) < MINIMUM_AGE) {
      setDobError(`You must be at least ${MINIMUM_AGE} to use Expenzez.`);
      return;
    }
    setDobError("");
    onNext();
  };

  // Parse date from MM/DD/YYYY format or fallback to ISO format for backward compatibility
  const selectedDate = values.dob ? parseDate(values.dob) : latestAllowedDob();
  const maxDate = latestAllowedDob(); // Can't pick a date younger than the minimum age
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 120); // Maximum age 120

  // Update tempDate when showDatePicker is opened
  const openDatePicker = () => {
    setTempDate(values.dob ? parseDate(values.dob) : latestAllowedDob());
    setShowDatePicker(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      {/* Header */}
      <View style={styles.header}>
        <Typography variant="h2" style={[styles.title, { color: colors.text.primary }]}>
          Personal Details
        </Typography>
        <Typography variant="body" style={[styles.subtitle, { color: colors.text.secondary }]}>
          We need your date of birth to confirm you're old enough to use Expenzez (18+)
        </Typography>
      </View>

      {/* Form Fields */}
      <View style={styles.formFields}>
        {/* Date of Birth */}
        <View style={styles.inputContainer}>
          <Typography variant="body" style={[styles.inputLabel, { color: colors.text.primary }]} weight="medium">
            Date of Birth <Typography style={{ color: colors.error.main }}>*</Typography>
          </Typography>
          <TouchableOpacity
            onPress={openDatePicker}
            style={[styles.dateInput, {
              backgroundColor: colors.background.primary,
              borderColor: dobError ? colors.error.main : colors.border.light
            }]}
          >
            <Typography
              variant="body"
              style={{
                color: values.dob ? colors.text.primary : colors.text.tertiary,
              }}
            >
              {values.dob
                ? selectedDate.toLocaleDateString()
                : "Select your date of birth"}
            </Typography>
            <Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
          {dobError ? (
            <Typography variant="caption" style={{ color: colors.error.main, marginTop: 6 }}>
              {dobError}
            </Typography>
          ) : null}
        </View>

        {/* Gender Selection */}
        <View style={styles.inputContainer}>
          <Typography variant="body" style={[styles.inputLabel, { color: colors.text.primary }]} weight="medium">
            Gender (Optional)
          </Typography>
          <View style={styles.genderContainer}>
            {genderOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => onChange("gender", option.value)}
                style={[
                  styles.genderOption,
                  {
                    backgroundColor: colors.background.primary,
                    borderColor: colors.border.light
                  },
                  values.gender === option.value && {
                    backgroundColor: colors.primary.main,
                    borderColor: colors.primary.main
                  }
                ]}
              >
                <Ionicons
                  name={option.icon as any}
                  size={24}
                  color={values.gender === option.value ? "white" : colors.text.secondary}
                  style={styles.genderIcon}
                />
                <Typography
                  variant="body"
                  style={{
                    color: values.gender === option.value ? "white" : colors.text.primary,
                    fontWeight:
                      values.gender === option.value ? "600" : "normal",
                  }}
                  align="center"
                >
                  {option.label}
                </Typography>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Navigation Buttons */}
      <View style={styles.buttonContainer}>
        <Button
          title="Back"
          onPress={onBack}
          style={StyleSheet.flatten([styles.backButton, { borderColor: colors.primary.main, backgroundColor: 'transparent' }])}
          textStyle={{ color: colors.primary.main, fontWeight: '600' }}
        />
        <Button
          title="Continue"
          onPress={handleNext}
          style={StyleSheet.flatten([styles.continueButton, { backgroundColor: colors.primary.main }])}
        />
      </View>

      {/* Date Picker Modal */}
      {showDatePicker && Platform.OS === "ios" && (
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: colors.background.primary },
              ]}
            >
              {/* Modal Header */}
              <View
                style={[
                  styles.modalHeader,
                  { borderBottomColor: colors.border.light },
                ]}
              >
                <TouchableOpacity onPress={handleDateCancel}>
                  <Typography
                    variant="body"
                    style={{ color: colors.primary.main }}
                  >
                    Cancel
                  </Typography>
                </TouchableOpacity>
                <Typography
                  variant="body"
                  style={{ color: colors.text.primary }}
                  weight="medium"
                >
                  Select Date
                </Typography>
                <TouchableOpacity onPress={handleDateConfirm}>
                  <Typography
                    variant="body"
                    style={{ color: colors.primary.main }}
                    weight="medium"
                  >
                    Done
                  </Typography>
                </TouchableOpacity>
              </View>

              {/* Date Picker */}
              <DateTimePicker
                testID="dateTimePicker"
                value={tempDate}
                mode="date"
                is24Hour={true}
                display="spinner"
                onChange={handleDateChange}
                maximumDate={maxDate}
                minimumDate={minDate}
                style={styles.datePicker}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Android Date Picker */}
      {showDatePicker && Platform.OS === "android" && (
        <DateTimePicker
          testID="dateTimePicker"
          value={tempDate}
          mode="date"
          is24Hour={true}
          display="default"
          onChange={handleDateChange}
          maximumDate={maxDate}
          minimumDate={minDate}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  formFields: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    marginBottom: 6,
    fontSize: 14,
    fontWeight: "600",
  },
  dateInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 48,
  },
  genderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  genderOption: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 80,
  },
  genderIcon: {
    marginBottom: 8,
  },
  buttonContainer: {
    marginTop: 16,
    gap: 12,
  },
  topButtonRow: {
    flexDirection: "row",
    gap: 12,
  },
  backButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 14,
    minHeight: 48,
  },
  skipButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 14,
    minHeight: 48,
  },
  continueButton: {
    borderRadius: 10,
    paddingVertical: 14,
    minHeight: 48,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    maxHeight: "50%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  datePicker: {
    height: 200,
  },
});
