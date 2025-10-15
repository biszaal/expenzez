import React, { useState } from "react";
import { View, TouchableOpacity, Platform, StyleSheet, Modal } from "react-native";
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

export default function RegisterStep2({
  values,
  onChange,
  onNext,
  onBack,
}: any) {
  const { colors } = useTheme();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(values.dob ? new Date(values.dob) : new Date());

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      // On Android, automatically close and save
      const currentDate = selectedDate || tempDate;
      setShowDatePicker(false);
      const formattedDate = currentDate.toISOString().split('T')[0];
      onChange("dob", formattedDate);
    } else {
      // On iOS, just update the temp date, don't close picker
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  const handleDateConfirm = () => {
    // Save the selected date
    const formattedDate = tempDate.toISOString().split('T')[0];
    onChange("dob", formattedDate);
    setShowDatePicker(false);
  };

  const handleDateCancel = () => {
    // Reset to original date and close
    setTempDate(values.dob ? new Date(values.dob) : new Date());
    setShowDatePicker(false);
  };

  const handleNext = () => {
    if (!values.dob || !values.gender) {
      return;
    }
    onNext();
  };

  const selectedDate = values.dob ? new Date(values.dob) : new Date();
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 13); // Minimum age 13
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 120); // Maximum age 120

  // Update tempDate when showDatePicker is opened
  const openDatePicker = () => {
    setTempDate(values.dob ? new Date(values.dob) : new Date());
    setShowDatePicker(true);
  };

  return (
    <View style={styles.container}>
      {/* Clean Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={StyleSheet.flatten([styles.progressStep, styles.completedStep, { backgroundColor: colors.background.tertiary, borderColor: '#8B5CF6' }])}>
          <Ionicons name="checkmark" size={16} color="#8B5CF6" />
        </View>
        <View style={StyleSheet.flatten([styles.progressLine, { backgroundColor: '#8B5CF6' }])} />
        <View style={StyleSheet.flatten([styles.progressStep, styles.activeStep, { backgroundColor: '#8B5CF6' }])}>
          <Typography variant="caption" style={styles.activeStepText}>2</Typography>
        </View>
        <View style={StyleSheet.flatten([styles.progressLine, { backgroundColor: colors.border.medium }])} />
        <View style={StyleSheet.flatten([styles.progressStep, { backgroundColor: colors.background.tertiary }])}>
          <Typography variant="caption" style={StyleSheet.flatten([styles.stepText, { color: colors.text.tertiary }])}>3</Typography>
        </View>
        <View style={StyleSheet.flatten([styles.progressLine, { backgroundColor: colors.border.medium }])} />
        <View style={StyleSheet.flatten([styles.progressStep, { backgroundColor: colors.background.tertiary }])}>
          <Typography variant="caption" style={StyleSheet.flatten([styles.stepText, { color: colors.text.tertiary }])}>4</Typography>
        </View>
        <View style={StyleSheet.flatten([styles.progressLine, { backgroundColor: colors.border.medium }])} />
        <View style={StyleSheet.flatten([styles.progressStep, { backgroundColor: colors.background.tertiary }])}>
          <Typography variant="caption" style={StyleSheet.flatten([styles.stepText, { color: colors.text.tertiary }])}>5</Typography>
        </View>
      </View>

      {/* Clean Header */}
      <View style={styles.header}>
        <Typography variant="h2" style={StyleSheet.flatten([styles.title, { color: colors.text.primary }])}>
          Personal Details
        </Typography>
        <Typography variant="body" style={StyleSheet.flatten([styles.subtitle, { color: colors.text.secondary }])}>
          Tell us about yourself
        </Typography>
      </View>

      {/* Clean Form Fields */}
      <View style={styles.formFields}>

        {/* Date of Birth */}
        <View style={styles.inputContainer}>
          <Typography variant="body" style={StyleSheet.flatten([styles.inputLabel, { color: colors.text.primary }])} weight="medium">
            Date of Birth
          </Typography>
          <TouchableOpacity
            onPress={openDatePicker}
            style={StyleSheet.flatten([styles.dateInput, {
              backgroundColor: colors.background.tertiary,
              borderColor: colors.border.medium,
            }])}
          >
            <Typography variant="body" style={{ color: values.dob ? colors.text.primary : colors.text.tertiary }}>
              {values.dob ? selectedDate.toLocaleDateString() : "Select your date of birth"}
            </Typography>
            <Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Gender Selection */}
        <View style={styles.inputContainer}>
          <Typography variant="body" style={StyleSheet.flatten([styles.inputLabel, { color: colors.text.primary }])} weight="medium">
            Gender
          </Typography>
          <View style={styles.genderContainer}>
            {genderOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => onChange("gender", option.value)}
                style={StyleSheet.flatten([styles.genderOption, {
                  backgroundColor: values.gender === option.value 
                    ? '#8B5CF6' 
                    : colors.background.tertiary,
                  borderColor: values.gender === option.value 
                    ? '#8B5CF6' 
                    : colors.border.medium,
                }])}
              >
                <Ionicons 
                  name={option.icon as any} 
                  size={24} 
                  color={values.gender === option.value ? 'white' : colors.text.secondary}
                  style={styles.genderIcon}
                />
                <Typography 
                  variant="body" 
                  style={{
                    color: values.gender === option.value ? 'white' : colors.text.primary,
                    fontWeight: values.gender === option.value ? '600' : 'normal'
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
          style={StyleSheet.flatten([styles.backButton, { backgroundColor: colors.background.tertiary, borderColor: colors.border.medium }])}
          textStyle={{ color: colors.text.primary }}
        />
        <Button 
          title="Continue" 
          onPress={handleNext}
          style={StyleSheet.flatten([styles.continueButton, { backgroundColor: '#8B5CF6' }])}
          disabled={!values.dob || !values.gender}
        />
      </View>

      {/* Date Picker Modal */}
      {showDatePicker && Platform.OS === 'ios' && (
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={StyleSheet.flatten([styles.modalContent, { backgroundColor: colors.background.primary }])}>
              {/* Modal Header */}
              <View style={StyleSheet.flatten([styles.modalHeader, { borderBottomColor: colors.border.light }])}>
                <TouchableOpacity onPress={handleDateCancel}>
                  <Typography variant="body" style={{ color: colors.primary.main }}>
                    Cancel
                  </Typography>
                </TouchableOpacity>
                <Typography variant="body" style={{ color: colors.text.primary }} weight="medium">
                  Select Date
                </Typography>
                <TouchableOpacity onPress={handleDateConfirm}>
                  <Typography variant="body" style={{ color: colors.primary.main }} weight="medium">
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
      {showDatePicker && Platform.OS === 'android' && (
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
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  progressStep: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedStep: {
    borderWidth: 2,
  },
  activeStep: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  progressLine: {
    width: 24,
    height: 2,
    marginHorizontal: 4,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeStepText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  formFields: {
    paddingHorizontal: spacing.md,
    flex: 1,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    marginBottom: spacing.xs,
    fontSize: 14,
  },
  dateInput: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderOption: {
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 2,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  genderIcon: {
    marginBottom: spacing.sm,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  backButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 2,
    minHeight: 44,
  },
  continueButton: {
    flex: 1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 2,
    minHeight: 44,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  datePicker: {
    height: 200,
  },
});
