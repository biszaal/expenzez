import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  KeyboardAvoidingView,
  Platform,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TextField, Typography } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from './AuthContext';
import { spacing, borderRadius, layout } from '../../constants/theme';
import { useAlert } from '../../hooks/useAlert';
import { profileAPI } from '../../services/api/profileAPI';

export default function AppleProfileCompletion() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const { showError, showSuccess } = useAlert();

  // Get Apple user info from params
  const appleUser = params.user ? JSON.parse(params.user as string) : null;

  // Auto-generate username from Apple email
  const generateUsernameFromEmail = (email: string) => {
    if (!email) return '';
    const emailPrefix = email.split('@')[0];
    return emailPrefix.replace(/[^a-zA-Z0-9]/g, '');
  };

  const [formData, setFormData] = useState({
    // Pre-filled from Apple
    name: appleUser?.name || '',
    email: appleUser?.email || '',

    // Auto-generated username from email
    username: appleUser?.email ? generateUsernameFromEmail(appleUser.email) : '',

    // Required fields to collect
    phone: '',
    address: '',
    city: '',
    postcode: '',
    dateOfBirth: '',
    gender: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleComplete = async () => {
    // Validate required fields
    if (!formData.username || !formData.phone || !formData.address || !formData.dateOfBirth) {
      showError('Please fill in all required fields');
      return;
    }

    // Validate phone number (UK format)
    const phoneRegex = /^(\+44|0)[1-9]\d{9,10}$/;
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      showError('Please enter a valid UK phone number (e.g., +44 7xxx xxx xxx or 07xxx xxx xxx)');
      return;
    }

    // Validate date of birth format (DD/MM/YYYY)
    const dobRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/(19|20)\d\d$/;
    if (!dobRegex.test(formData.dateOfBirth)) {
      showError('Please enter date of birth in DD/MM/YYYY format');
      return;
    }

    // Validate address minimum length
    if (formData.address.length < 5) {
      showError('Please enter a complete address');
      return;
    }

    setIsLoading(true);
    try {
      // Parse name into firstName and lastName
      const nameParts = formData.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      console.log('[AppleProfileCompletion] Submitting profile data:', {
        firstName,
        lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        postcode: formData.postcode,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender
      });

      // Send profile completion data to backend
      await profileAPI.updateProfile({
        firstName,
        lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        postcode: formData.postcode,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender
      });

      console.log('[AppleProfileCompletion] Profile updated successfully');
      showSuccess('Profile completed successfully! Welcome to Expenzez!');
      router.replace('/(tabs)');

    } catch (error: any) {
      console.error('[AppleProfileCompletion] Error:', error);
      showError(error.message || 'Failed to complete profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.background.primary}
      />
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background.primary },
        ]}
      >
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            style={styles.keyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Header */}
              <View style={styles.header}>
                <View
                  style={[
                    styles.logoContainer,
                    { backgroundColor: colors.primary[500] },
                  ]}
                >
                  <Ionicons name="person-add-outline" size={32} color="white" />
                </View>

                <Typography
                  variant="h1"
                  style={[
                    styles.welcomeTitle,
                    { color: colors.text.primary },
                  ]}
                  align="center"
                >
                  Complete Your Profile
                </Typography>
                <Typography
                  variant="body"
                  style={[
                    styles.welcomeSubtitle,
                    { color: colors.text.secondary },
                  ]}
                  align="center"
                >
                  We need a few more details to set up your account
                </Typography>
              </View>

              {/* Form Container */}
              <View
                style={[
                  styles.formContainer,
                  { backgroundColor: colors.background.secondary },
                ]}
              >
                <View style={styles.formContent}>
                  
                  {/* Pre-filled from Apple */}
                  <View style={styles.section}>
                    <Typography
                      variant="h3"
                      style={[styles.sectionTitle, { color: colors.text.primary }]}
                    >
                      From Apple ID
                    </Typography>
                    
                    <View style={styles.inputContainer}>
                      <Typography
                        variant="body"
                        style={[styles.inputLabel, { color: colors.text.primary }]}
                        weight="medium"
                      >
                        Full Name
                      </Typography>
                      <TextField
                        value={formData.name}
                        onChangeText={(value) => updateField('name', value)}
                        style={[
                          styles.input,
                          {
                            backgroundColor: colors.background.tertiary,
                            borderColor: colors.border.medium,
                          },
                        ]}
                        inputStyle={{ color: colors.text.primary }}
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Typography
                        variant="body"
                        style={[styles.inputLabel, { color: colors.text.primary }]}
                        weight="medium"
                      >
                        Email Address
                      </Typography>
                      <TextField
                        value={formData.email}
                        onChangeText={() => {}} 
                        editable={false}
                        style={[
                          styles.input,
                          styles.disabledInput,
                          {
                            backgroundColor: colors.background.tertiary,
                            borderColor: colors.border.light,
                          },
                        ]}
                        inputStyle={{ color: colors.text.secondary }}
                      />
                    </View>
                  </View>

                  {/* Required Additional Information */}
                  <View style={styles.section}>
                    <Typography
                      variant="h3"
                      style={[styles.sectionTitle, { color: colors.text.primary }]}
                    >
                      Additional Information Required *
                    </Typography>

                    <View style={styles.inputContainer}>
                      <Typography
                        variant="body"
                        style={[styles.inputLabel, { color: colors.text.primary }]}
                        weight="medium"
                      >
                        Username *
                      </Typography>
                      <TextField
                        placeholder={appleUser?.email ? "Auto-generated from your Apple email" : "Choose a unique username"}
                        value={formData.username}
                        onChangeText={(value) => updateField('username', value)}
                        autoCapitalize="none"
                        style={[
                          styles.input,
                          {
                            backgroundColor: colors.background.tertiary,
                            borderColor: colors.border.medium,
                          },
                        ]}
                        inputStyle={{ color: colors.text.primary }}
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Typography
                        variant="body"
                        style={[styles.inputLabel, { color: colors.text.primary }]}
                        weight="medium"
                      >
                        Phone Number *
                      </Typography>
                      <TextField
                        placeholder="+44 7xxx xxx xxx"
                        value={formData.phone}
                        onChangeText={(value) => updateField('phone', value)}
                        keyboardType="phone-pad"
                        style={[
                          styles.input,
                          {
                            backgroundColor: colors.background.tertiary,
                            borderColor: colors.border.medium,
                          },
                        ]}
                        inputStyle={{ color: colors.text.primary }}
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Typography
                        variant="body"
                        style={[styles.inputLabel, { color: colors.text.primary }]}
                        weight="medium"
                      >
                        Address *
                      </Typography>
                      <TextField
                        placeholder="Street address"
                        value={formData.address}
                        onChangeText={(value) => updateField('address', value)}
                        style={[
                          styles.input,
                          {
                            backgroundColor: colors.background.tertiary,
                            borderColor: colors.border.medium,
                          },
                        ]}
                        inputStyle={{ color: colors.text.primary }}
                      />
                    </View>

                    <View style={styles.row}>
                      <View style={[styles.inputContainer, styles.halfWidth]}>
                        <Typography
                          variant="body"
                          style={[styles.inputLabel, { color: colors.text.primary }]}
                          weight="medium"
                        >
                          City
                        </Typography>
                        <TextField
                          placeholder="City"
                          value={formData.city}
                          onChangeText={(value) => updateField('city', value)}
                          style={[
                            styles.input,
                            {
                              backgroundColor: colors.background.tertiary,
                              borderColor: colors.border.medium,
                            },
                          ]}
                          inputStyle={{ color: colors.text.primary }}
                        />
                      </View>

                      <View style={[styles.inputContainer, styles.halfWidth]}>
                        <Typography
                          variant="body"
                          style={[styles.inputLabel, { color: colors.text.primary }]}
                          weight="medium"
                        >
                          Postcode
                        </Typography>
                        <TextField
                          placeholder="SW1A 1AA"
                          value={formData.postcode}
                          onChangeText={(value) => updateField('postcode', value)}
                          style={[
                            styles.input,
                            {
                              backgroundColor: colors.background.tertiary,
                              borderColor: colors.border.medium,
                            },
                          ]}
                          inputStyle={{ color: colors.text.primary }}
                        />
                      </View>
                    </View>

                    <View style={styles.inputContainer}>
                      <Typography
                        variant="body"
                        style={[styles.inputLabel, { color: colors.text.primary }]}
                        weight="medium"
                      >
                        Date of Birth *
                      </Typography>
                      <TextField
                        placeholder="DD/MM/YYYY"
                        value={formData.dateOfBirth}
                        onChangeText={(value) => updateField('dateOfBirth', value)}
                        style={[
                          styles.input,
                          {
                            backgroundColor: colors.background.tertiary,
                            borderColor: colors.border.medium,
                          },
                        ]}
                        inputStyle={{ color: colors.text.primary }}
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Typography
                        variant="body"
                        style={[styles.inputLabel, { color: colors.text.primary }]}
                        weight="medium"
                      >
                        Gender (Optional)
                      </Typography>
                      <TextField
                        placeholder="Gender"
                        value={formData.gender}
                        onChangeText={(value) => updateField('gender', value)}
                        style={[
                          styles.input,
                          {
                            backgroundColor: colors.background.tertiary,
                            borderColor: colors.border.medium,
                          },
                        ]}
                        inputStyle={{ color: colors.text.primary }}
                      />
                    </View>
                  </View>

                  {/* Complete Button */}
                  <TouchableOpacity
                    style={[
                      styles.completeButton,
                      {
                        backgroundColor: colors.primary[500],
                        opacity: isLoading ? 0.6 : 1,
                      },
                    ]}
                    onPress={handleComplete}
                    disabled={isLoading}
                  >
                    <Typography
                      variant="body"
                      weight="semibold"
                      style={{ color: 'white' }}
                    >
                      {isLoading ? 'Completing Profile...' : 'Complete Profile & Continue'}
                    </Typography>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.lg,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  welcomeSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    maxWidth: '90%',
    lineHeight: 22,
  },

  // Form
  formContainer: {
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  formContent: {
    padding: spacing.lg,
  },

  // Sections
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.md,
  },

  // Inputs
  inputContainer: {
    marginBottom: spacing.md,
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
    minHeight: layout.inputHeight,
  },
  disabledInput: {
    opacity: 0.6,
  },

  // Layout
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfWidth: {
    flex: 1,
  },

  // Buttons
  completeButton: {
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    minHeight: layout.buttonHeight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  skipButton: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
  },
});