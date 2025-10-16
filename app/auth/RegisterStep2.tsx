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
import { spacing, borderRadius } from "../../constants/theme";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

const genderOptions = [
  { label: "Male", value: "male", icon: "man" },
  { label: "Female", value: "female", icon: "woman" },
  { label: "Other", value: "other", icon: "person" },
];

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
    values.dob ? parseDate(values.dob) : new Date()
  );

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      // On Android, automatically close and save
      const currentDate = selectedDate || tempDate;
      setShowDatePicker(false);
      // Format as YYYY-MM-DD (EXACTLY 10 characters for AWS Cognito)
      const formattedDate = formatDateForCognito(currentDate);
      console.log("📅 [RegisterStep2] Android - Setting date:", formattedDate);
      console.log(
        "📅 [RegisterStep2] Android - Date length:",
        formattedDate.length
      );
      console.log(
        "📅 [RegisterStep2] Android - Date type:",
        typeof formattedDate
      );
      onChange("dob", formattedDate);
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
    console.log("📅 [RegisterStep2] iOS - Date length:", formattedDate.length);
    console.log("📅 [RegisterStep2] iOS - Date type:", typeof formattedDate);
    onChange("dob", formattedDate);
    setShowDatePicker(false);
  };

  const handleDateCancel = () => {
    // Reset to original date and close
    setTempDate(values.dob ? parseDate(values.dob) : new Date());
    setShowDatePicker(false);
  };

  const handleNext = () => {
    if (!values.dob || !values.gender) {
      return;
    }
    onNext();
  };

  // Parse date from MM/DD/YYYY format or fallback to ISO format for backward compatibility
  const selectedDate = values.dob ? parseDate(values.dob) : new Date();
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 13); // Minimum age 13
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 120); // Maximum age 120

  // Update tempDate when showDatePicker is opened
  const openDatePicker = () => {
    setTempDate(values.dob ? parseDate(values.dob) : new Date());
    setShowDatePicker(true);
  };

  return (
    <View style={styles.container}>
      {/* Glass Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.completedStep}>
          <Ionicons name="checkmark" size={16} color="white" />
        </View>
        <View style={styles.completedLine} />
        <View style={styles.activeStep}>
          <Typography variant="caption" style={styles.activeStepText}>
            2
          </Typography>
        </View>
        <View style={styles.progressLine} />
        <View style={styles.inactiveStep}>
          <Typography variant="caption" style={styles.stepText}>
            3
          </Typography>
        </View>
        <View style={styles.progressLine} />
        <View style={styles.inactiveStep}>
          <Typography variant="caption" style={styles.stepText}>
            4
          </Typography>
        </View>
        <View style={styles.progressLine} />
        <View style={styles.inactiveStep}>
          <Typography variant="caption" style={styles.stepText}>
            5
          </Typography>
        </View>
      </View>

      {/* Glass Header */}
      <View style={styles.header}>
        <Typography variant="h2" style={styles.title}>
          Personal Details
        </Typography>
        <Typography variant="body" style={styles.subtitle}>
          Tell us about yourself
        </Typography>
      </View>

      {/* Glass Form Fields */}
      <View style={styles.formFields}>
        {/* Date of Birth */}
        <View style={styles.inputContainer}>
          <Typography variant="body" style={styles.inputLabel} weight="medium">
            Date of Birth
          </Typography>
          <TouchableOpacity onPress={openDatePicker} style={styles.dateInput}>
            <Typography
              variant="body"
              style={{
                color: values.dob ? "white" : "rgba(255, 255, 255, 0.5)",
              }}
            >
              {values.dob
                ? selectedDate.toLocaleDateString()
                : "Select your date of birth"}
            </Typography>
            <Ionicons name="calendar-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Gender Selection */}
        <View style={styles.inputContainer}>
          <Typography variant="body" style={styles.inputLabel} weight="medium">
            Gender
          </Typography>
          <View style={styles.genderContainer}>
            {genderOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => onChange("gender", option.value)}
                style={[
                  styles.genderOption,
                  values.gender === option.value && styles.genderOptionSelected,
                ]}
              >
                <Ionicons
                  name={option.icon as any}
                  size={24}
                  color="white"
                  style={styles.genderIcon}
                />
                <Typography
                  variant="body"
                  style={{
                    color: "white",
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
          style={styles.backButton}
          textStyle={{ color: "white" }}
        />
        <Button
          title="Continue"
          onPress={handleNext}
          style={styles.continueButton}
          disabled={!values.dob || !values.gender}
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
              style={StyleSheet.flatten([
                styles.modalContent,
                { backgroundColor: colors.background.primary },
              ])}
            >
              {/* Modal Header */}
              <View
                style={StyleSheet.flatten([
                  styles.modalHeader,
                  { borderBottomColor: colors.border.light },
                ])}
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
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  activeStep: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.5)",
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  inactiveStep: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
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
  stepText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.6)",
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
  formFields: {
    flex: 1,
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
  dateInput: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 14,
    paddingHorizontal: 16,
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
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 14,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 80,
  },
  genderOptionSelected: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  genderIcon: {
    marginBottom: spacing.sm,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  backButton: {
    flex: 1,
    borderRadius: 25,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    paddingVertical: 16,
    minHeight: 54,
  },
  continueButton: {
    flex: 1,
    borderRadius: 25,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
    paddingVertical: 16,
    minHeight: 54,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "50%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  datePicker: {
    height: 200,
  },
});
