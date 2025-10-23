import React, { useState } from "react";
import { View, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { Button, TextField, Typography } from "../../components/ui";
import { useTheme } from "../../contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import CustomAddressSearch from "../../components/CustomAddressSearch";
import { getPlaceDetails, parseAddressComponents, mapCountryCodeToPickerValue } from "../../config/googleMaps";

const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

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
    <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      {/* Header */}
      <View style={styles.header}>
        <Typography variant="h2" style={[styles.title, { color: colors.text.primary }]}>
          Address Information
        </Typography>
        <Typography variant="body" style={[styles.subtitle, { color: colors.text.secondary }]}>
          Enter your current address
        </Typography>
      </View>

      {/* Glass Form Fields */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.formFields}>
          {/* Address Search Section */}
          {!useManualEntry && (
            <View style={styles.inputContainer}>
              <Typography variant="body" style={[styles.inputLabel, { color: colors.text.primary }]} weight="medium">
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
            <View style={[styles.errorContainer, {
              backgroundColor: colors.error[500] + '15',
              borderColor: colors.error[500] + '30'
            }]}>
              <Ionicons name="warning" size={20} color={colors.error[500]} />
              <Typography variant="body" style={[styles.errorText, { color: colors.text.primary }]}>
                {addressError}
              </Typography>
            </View>
          )}
          {/* Manual Address Fields - Only show when using manual entry or after address is selected */}
          {(useManualEntry || values.address1) && (
            <>
          {/* Address Line 1 */}
          <View style={styles.inputContainer}>
            <Typography variant="body" style={[styles.inputLabel, { color: colors.text.primary }]} weight="medium">
              Address Line 1 *
            </Typography>
            <TextField
              placeholder="Enter your street address"
              value={values.address1}
              onChangeText={(v) => onChange("address1", v)}
              style={[styles.input, {
                backgroundColor: colors.background.primary,
                borderColor: colors.border.light,
                color: colors.text.primary
              }]}
              placeholderTextColor={colors.text.tertiary}
            />
          </View>

          {/* Address Line 2 */}
          <View style={styles.inputContainer}>
            <Typography variant="body" style={[styles.inputLabel, { color: colors.text.primary }]} weight="medium">
              Address Line 2
            </Typography>
            <TextField
              placeholder="Apartment, unit, etc. (optional)"
              value={values.address2}
              onChangeText={(v) => onChange("address2", v)}
              style={[styles.input, {
                backgroundColor: colors.background.primary,
                borderColor: colors.border.light,
                color: colors.text.primary
              }]}
              placeholderTextColor={colors.text.tertiary}
            />
          </View>

          {/* City */}
          <View style={styles.inputContainer}>
            <Typography variant="body" style={[styles.inputLabel, { color: colors.text.primary }]} weight="medium">
              City *
            </Typography>
            <TextField
              placeholder="Enter your city"
              value={values.city}
              onChangeText={(v) => onChange("city", v)}
              style={[styles.input, {
                backgroundColor: colors.background.primary,
                borderColor: colors.border.light,
                color: colors.text.primary
              }]}
              placeholderTextColor={colors.text.tertiary}
            />
          </View>

          {/* State/Province and Postal Code */}
          <View style={styles.rowContainer}>
            <View style={StyleSheet.flatten([styles.inputContainer, { flex: 1, marginRight: spacing.sm }])}>
              <Typography variant="body" style={[styles.inputLabel, { color: colors.text.primary }]} weight="medium">
                State/Province
              </Typography>
              <TextField
                placeholder="State"
                value={values.state}
                onChangeText={(v) => onChange("state", v)}
                style={[styles.input, {
                  backgroundColor: colors.background.primary,
                  borderColor: colors.border.light,
                  color: colors.text.primary
                }]}
                placeholderTextColor={colors.text.tertiary}
              />
            </View>

            <View style={StyleSheet.flatten([styles.inputContainer, { flex: 1, marginLeft: spacing.sm }])}>
              <Typography variant="body" style={[styles.inputLabel, { color: colors.text.primary }]} weight="medium">
                Postal Code
              </Typography>
              <TextField
                placeholder="ZIP/Postal"
                value={values.postcode}
                onChangeText={(v) => onChange("postcode", v)}
                style={[styles.input, {
                  backgroundColor: colors.background.primary,
                  borderColor: colors.border.light,
                  color: colors.text.primary
                }]}
                placeholderTextColor={colors.text.tertiary}
              />
            </View>
          </View>

          {/* Country Picker */}
          <View style={styles.inputContainer}>
            <Typography variant="body" style={[styles.inputLabel, { color: colors.text.primary }]} weight="medium">
              Country *
            </Typography>
            <TouchableOpacity
              onPress={() => setShowCountryPicker(!showCountryPicker)}
              style={[styles.countryInput, {
                backgroundColor: colors.background.primary,
                borderColor: colors.border.light
              }]}
            >
              <Typography variant="body" style={{ color: selectedCountry ? colors.text.primary : colors.text.tertiary }}>
                {selectedCountry ? `${selectedCountry.flag} ${selectedCountry.label}` : "Select your country"}
              </Typography>
              <Ionicons name="chevron-down" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Country Options */}
          {showCountryPicker && (
            <View style={[styles.countryList, {
              backgroundColor: colors.background.primary,
              borderColor: colors.border.light
            }]}>
              <ScrollView style={styles.countryScrollView} nestedScrollEnabled={true}>
                {countries.map((country) => (
                  <TouchableOpacity
                    key={country.value}
                    style={[styles.countryOption, { borderBottomColor: colors.border.light }]}
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
          style={[styles.backButton, { borderColor: colors.border.light }]}
          textStyle={{ color: colors.text.primary }}
        />
        <Button
          title="Continue"
          onPress={handleNext}
          style={[styles.continueButton, { backgroundColor: colors.primary[500] }]}
          disabled={!values.address1?.trim() || !values.city?.trim() || !values.country}
        />
      </View>
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
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  formFields: {
    paddingBottom: spacing.lg,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    marginBottom: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 48,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  countryInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
  },
  countryList: {
    borderWidth: 1,
    borderRadius: 10,
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
    marginTop: 16,
    gap: 12,
  },
  backButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 14,
    minHeight: 48,
  },
  continueButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 14,
    minHeight: 48,
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
    borderRadius: 10,
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