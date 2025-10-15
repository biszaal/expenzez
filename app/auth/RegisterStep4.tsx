import React, { useState } from "react";
import { View, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { Button, TextField, Typography } from "../../components/ui";
import { useTheme } from "../../contexts/ThemeContext";
import { spacing, borderRadius } from "../../constants/theme";
import { Ionicons } from "@expo/vector-icons";
import CustomAddressSearch from "../../components/CustomAddressSearch";
import { getPlaceDetails, parseAddressComponents, mapCountryCodeToPickerValue } from "../../config/googleMaps";

// Common countries for the picker
const countries = [
  { label: "United Kingdom", value: "GB", flag: "🇬🇧" },
  { label: "United States", value: "US", flag: "🇺🇸" },
  { label: "Canada", value: "CA", flag: "🇨🇦" },
  { label: "Australia", value: "AU", flag: "🇦🇺" },
  { label: "Germany", value: "DE", flag: "🇩🇪" },
  { label: "France", value: "FR", flag: "🇫🇷" },
  { label: "Spain", value: "ES", flag: "🇪🇸" },
  { label: "Italy", value: "IT", flag: "🇮🇹" },
  { label: "Netherlands", value: "NL", flag: "🇳🇱" },
  { label: "Other", value: "OTHER", flag: "🌍" },
];

export default function RegisterStep4({
  values,
  onChange,
  onNext,
  onBack,
}: any) {
  const { colors } = useTheme();
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [useManualEntry, setUseManualEntry] = useState(false);
  const [addressError, setAddressError] = useState("");

  // Handle address selection from Google Places API
  const handleAddressSelect = async (placeId: string, description: string) => {
    try {
      setAddressError("");
      const placeDetails = await getPlaceDetails(placeId);
      
      if (placeDetails.status === 'OK' && placeDetails.result) {
        const addressComponents = parseAddressComponents(placeDetails.result.address_components);
        
        // Auto-fill form fields
        const address1 = `${addressComponents.streetNumber} ${addressComponents.route}`.trim();
        const address2 = addressComponents.subpremise || "";
        const city = addressComponents.locality;
        const state = addressComponents.administrativeAreaLevel1;
        const postcode = addressComponents.postalCode;
        const countryCode = mapCountryCodeToPickerValue(addressComponents.countryCode);
        
        // Update form values
        onChange("address1", address1);
        onChange("address2", address2);
        onChange("city", city);
        onChange("state", state);
        onChange("postcode", postcode);
        onChange("country", countryCode);
        
        console.log("Address auto-filled:", {
          address1, address2, city, state, postcode, countryCode
        });
      }
    } catch (error) {
      console.error("Error getting place details:", error);
      setAddressError("Failed to get address details. Please try manual entry.");
    }
  };

  const handleAddressError = (error: string) => {
    setAddressError(error);
  };

  const handleNext = () => {
    const requiredFields = ['address1', 'city', 'country'];
    const missingFields = requiredFields.filter(field => !values[field]?.trim());
    
    if (missingFields.length > 0) {
      return;
    }
    
    // Combine address fields into a single address string
    const fullAddress = [
      values.address1,
      values.address2,
      values.city,
      values.state,
      values.postcode,
      countries.find(c => c.value === values.country)?.label
    ].filter(Boolean).join(', ');
    
    onChange('address', fullAddress);
    onNext();
  };

  const selectedCountry = countries.find(c => c.value === values.country);

  return (
    <View style={styles.container}>
      {/* Clean Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={StyleSheet.flatten([styles.progressStep, styles.completedStep, { backgroundColor: colors.background.tertiary, borderColor: '#8B5CF6' }])}>
          <Ionicons name="checkmark" size={16} color="#8B5CF6" />
        </View>
        <View style={StyleSheet.flatten([styles.progressLine, { backgroundColor: '#8B5CF6' }])} />
        <View style={StyleSheet.flatten([styles.progressStep, styles.completedStep, { backgroundColor: colors.background.tertiary, borderColor: '#8B5CF6' }])}>
          <Ionicons name="checkmark" size={16} color="#8B5CF6" />
        </View>
        <View style={StyleSheet.flatten([styles.progressLine, { backgroundColor: '#8B5CF6' }])} />
        <View style={StyleSheet.flatten([styles.progressStep, styles.completedStep, { backgroundColor: colors.background.tertiary, borderColor: '#8B5CF6' }])}>
          <Ionicons name="checkmark" size={16} color="#8B5CF6" />
        </View>
        <View style={StyleSheet.flatten([styles.progressLine, { backgroundColor: '#8B5CF6' }])} />
        <View style={StyleSheet.flatten([styles.progressStep, styles.activeStep, { backgroundColor: '#8B5CF6' }])}>
          <Typography variant="caption" style={styles.activeStepText}>4</Typography>
        </View>
        <View style={StyleSheet.flatten([styles.progressLine, { backgroundColor: colors.border.medium }])} />
        <View style={StyleSheet.flatten([styles.progressStep, { backgroundColor: colors.background.tertiary }])}>
          <Typography variant="caption" style={StyleSheet.flatten([styles.stepText, { color: colors.text.tertiary }])}>5</Typography>
        </View>
      </View>

      {/* Clean Header */}
      <View style={styles.header}>
        <Typography variant="h2" style={StyleSheet.flatten([styles.title, { color: colors.text.primary }])}>
          Address Information
        </Typography>
        <Typography variant="body" style={StyleSheet.flatten([styles.subtitle, { color: colors.text.secondary }])}>
          Enter your current address
        </Typography>
      </View>

      {/* Clean Form Fields */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.formFields}>
          {/* Address Search Section */}
          {!useManualEntry && (
            <View style={styles.inputContainer}>
              <Typography variant="body" style={StyleSheet.flatten([styles.inputLabel, { color: colors.text.primary }])} weight="medium">
                Search Address
              </Typography>
              <CustomAddressSearch
                onAddressSelect={handleAddressSelect}
                onError={handleAddressError}
                style={{ marginBottom: spacing.sm }}
              />
              <TouchableOpacity
                onPress={() => setUseManualEntry(true)}
                style={styles.manualEntryButton}
              >
                <Typography variant="caption" style={{ color: colors.primary[500] }}>
                  Enter address manually instead
                </Typography>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Manual Entry Toggle */}
          {useManualEntry && (
            <View style={styles.inputContainer}>
              <TouchableOpacity
                onPress={() => setUseManualEntry(false)}
                style={styles.autoSearchButton}
              >
                <Ionicons name="search" size={16} color={colors.primary[500]} />
                <Typography variant="caption" style={{ color: colors.primary[500], marginLeft: spacing.xs }}>
                  Use address search instead
                </Typography>
              </TouchableOpacity>
            </View>
          )}

          {/* Error Message */}
          {addressError && (
            <View style={StyleSheet.flatten([styles.errorContainer, { 
              backgroundColor: colors.error[50], 
              borderColor: colors.error[200]
            }])}>
              <Ionicons name="warning" size={20} color={colors.error[500]} />
              <Typography variant="body" style={StyleSheet.flatten([styles.errorText, { color: colors.error[700] }])}>
                {addressError}
              </Typography>
            </View>
          )}
          {/* Manual Address Fields - Only show when using manual entry or after address is selected */}
          {(useManualEntry || values.address1) && (
            <>
          {/* Address Line 1 */}
          <View style={styles.inputContainer}>
            <Typography variant="body" style={StyleSheet.flatten([styles.inputLabel, { color: colors.text.primary }])} weight="medium">
              Address Line 1 *
            </Typography>
            <TextField
              placeholder="Enter your street address"
              value={values.address1}
              onChangeText={(v) => onChange("address1", v)}
              style={StyleSheet.flatten([styles.input, {
                backgroundColor: colors.background.tertiary,
                borderColor: colors.border.medium,
                color: colors.text.primary
              }])}
            />
          </View>

          {/* Address Line 2 */}
          <View style={styles.inputContainer}>
            <Typography variant="body" style={StyleSheet.flatten([styles.inputLabel, { color: colors.text.primary }])} weight="medium">
              Address Line 2
            </Typography>
            <TextField
              placeholder="Apartment, unit, etc. (optional)"
              value={values.address2}
              onChangeText={(v) => onChange("address2", v)}
              style={StyleSheet.flatten([styles.input, {
                backgroundColor: colors.background.tertiary,
                borderColor: colors.border.medium,
                color: colors.text.primary
              }])}
            />
          </View>

          {/* City */}
          <View style={styles.inputContainer}>
            <Typography variant="body" style={StyleSheet.flatten([styles.inputLabel, { color: colors.text.primary }])} weight="medium">
              City *
            </Typography>
            <TextField
              placeholder="Enter your city"
              value={values.city}
              onChangeText={(v) => onChange("city", v)}
              style={StyleSheet.flatten([styles.input, {
                backgroundColor: colors.background.tertiary,
                borderColor: colors.border.medium,
                color: colors.text.primary
              }])}
            />
          </View>

          {/* State/Province and Postal Code */}
          <View style={styles.rowContainer}>
            <View style={StyleSheet.flatten([styles.inputContainer, { flex: 1, marginRight: spacing.sm }])}>
              <Typography variant="body" style={StyleSheet.flatten([styles.inputLabel, { color: colors.text.primary }])} weight="medium">
                State/Province
              </Typography>
              <TextField
                placeholder="State"
                value={values.state}
                onChangeText={(v) => onChange("state", v)}
                style={StyleSheet.flatten([styles.input, {
                  backgroundColor: colors.background.tertiary,
                  borderColor: colors.border.medium,
                }])}
                inputStyle={{
                  color: colors.text.primary
                }}
              />
            </View>

            <View style={StyleSheet.flatten([styles.inputContainer, { flex: 1, marginLeft: spacing.sm }])}>
              <Typography variant="body" style={StyleSheet.flatten([styles.inputLabel, { color: colors.text.primary }])} weight="medium">
                Postal Code
              </Typography>
              <TextField
                placeholder="ZIP/Postal"
                value={values.postcode}
                onChangeText={(v) => onChange("postcode", v)}
                style={StyleSheet.flatten([styles.input, {
                  backgroundColor: colors.background.tertiary,
                  borderColor: colors.border.medium,
                }])}
                inputStyle={{
                  color: colors.text.primary
                }}
              />
            </View>
          </View>

          {/* Country Picker */}
          <View style={styles.inputContainer}>
            <Typography variant="body" style={StyleSheet.flatten([styles.inputLabel, { color: colors.text.primary }])} weight="medium">
              Country *
            </Typography>
            <TouchableOpacity
              onPress={() => setShowCountryPicker(!showCountryPicker)}
              style={StyleSheet.flatten([styles.countryInput, {
                backgroundColor: colors.background.tertiary,
                borderColor: colors.border.medium,
              }])}
            >
              <Typography variant="body" style={{ color: selectedCountry ? colors.text.primary : colors.text.tertiary }}>
                {selectedCountry ? `${selectedCountry.flag} ${selectedCountry.label}` : "Select your country"}
              </Typography>
              <Ionicons name="chevron-down" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Country Options */}
          {showCountryPicker && (
            <View style={StyleSheet.flatten([styles.countryList, { backgroundColor: colors.background.tertiary, borderColor: colors.border.medium }])}>
              <ScrollView style={styles.countryScrollView} nestedScrollEnabled={true}>
                {countries.map((country) => (
                  <TouchableOpacity
                    key={country.value}
                    style={StyleSheet.flatten([styles.countryOption, { borderBottomColor: colors.border.light }])}
                    onPress={() => {
                      onChange("country", country.value);
                      setShowCountryPicker(false);
                    }}
                  >
                    <Typography variant="body" style={{ color: colors.text.primary }}>
                      {country.flag} {country.label}
                    </Typography>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
            </>
          )}
        </View>
      </ScrollView>

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
          disabled={!values.address1?.trim() || !values.city?.trim() || !values.country}
        />
      </View>
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
  scrollView: {
    flex: 1,
  },
  formFields: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    marginBottom: spacing.xs,
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 16,
    minHeight: 44,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  countryInput: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
  },
  countryList: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
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
  manualEntryButton: {
    alignSelf: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  autoSearchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
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
});