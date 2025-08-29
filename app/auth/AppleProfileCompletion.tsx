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

export default function AppleProfileCompletion() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const { showError, showSuccess } = useAlert();

  // Get Apple user info from params
  const appleUser = params.user ? JSON.parse(params.user as string) : null;

  const [formData, setFormData] = useState({
    // Pre-filled from Apple
    name: appleUser?.name || '',
    email: appleUser?.email || '',
    
    // Required fields to collect
    username: '',
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

    setIsLoading(true);
    try {
      // TODO: Send profile completion data to backend
      console.log('Profile completion data:', formData);
      
      // For now, show success and redirect to main app
      showSuccess('Profile completed successfully! Welcome to Expenzez!');
      router.replace('/(tabs)');
      
    } catch (error: any) {
      console.error('Profile completion error:', error);
      showError('Failed to complete profile. Please try again.');
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
                            color: colors.text.primary,
                          },
                        ]}
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
                        editable={false}
                        style={[
                          styles.input,
                          styles.disabledInput,
                          {
                            backgroundColor: colors.background.tertiary,
                            borderColor: colors.border.light,
                            color: colors.text.secondary,
                          },
                        ]}
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
                        placeholder="Choose a unique username"
                        value={formData.username}
                        onChangeText={(value) => updateField('username', value)}
                        autoCapitalize="none"
                        style={[
                          styles.input,
                          {
                            backgroundColor: colors.background.tertiary,
                            borderColor: colors.border.medium,
                            color: colors.text.primary,
                          },
                        ]}
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
                            color: colors.text.primary,
                          },
                        ]}
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
                            color: colors.text.primary,
                          },
                        ]}
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
                              color: colors.text.primary,
                            },
                          ]}
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
                              color: colors.text.primary,
                            },
                          ]}
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
                            color: colors.text.primary,
                          },
                        ]}
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
                            color: colors.text.primary,
                          },
                        ]}
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

                  {/* Skip for now */}
                  <TouchableOpacity
                    style={styles.skipButton}
                    onPress={() => router.replace('/(tabs)')}
                  >
                    <Typography
                      variant="body"
                      style={{ color: colors.text.secondary }}
                      align="center"
                    >
                      Skip for now (you can complete this later)
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