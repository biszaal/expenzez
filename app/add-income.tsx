import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { transactionAPI } from '../services/api';
import { autoBillDetection } from '../services/automaticBillDetection';

interface IncomeCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const incomeCategories: IncomeCategory[] = [
  { id: 'salary', name: 'Salary', icon: 'briefcase', color: '#10B981' },
  { id: 'freelance', name: 'Freelance', icon: 'laptop', color: '#8B5CF6' },
  { id: 'business', name: 'Business', icon: 'storefront', color: '#3B82F6' },
  { id: 'investment', name: 'Investment', icon: 'trending-up', color: '#EF4444' },
  { id: 'rental', name: 'Rental', icon: 'home', color: '#F59E0B' },
  { id: 'gift', name: 'Gift', icon: 'gift', color: '#EC4899' },
  { id: 'other', name: 'Other', icon: 'ellipsis-horizontal', color: '#6B7280' },
];

export default function AddIncomeScreen() {
  const { colors } = useTheme();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<IncomeCategory>(incomeCategories[0]);
  const [loading, setLoading] = useState(false);

  const styles = createStyles(colors);

  const handleSaveIncome = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid income amount.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Missing Description', 'Please enter a description for this income.');
      return;
    }

    setLoading(true);

    try {
      // Create income using transactions API
      const transactionData = {
        amount: parseFloat(amount), // Positive amount for income
        originalAmount: parseFloat(amount),
        category: selectedCategory.id, // Use category ID
        description: description.trim(),
        date: new Date().toISOString(),
        type: 'credit' as const,
        tags: ['income', 'manual-entry'],
        merchant: description.trim(),
        accountId: 'manual',
        bankName: 'Manual Entry',
        accountType: 'Manual Account',
        isPending: false
      };

      const result = await transactionAPI.createTransaction(transactionData);

      // Trigger bill detection in the background for pattern analysis
      autoBillDetection.triggerBillDetection().catch(error => {
        console.warn('Background bill detection failed:', error);
      });

      Alert.alert(
        'Income Added!',
        `Successfully added £${parseFloat(amount).toFixed(2)} income to your account.`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error saving income:', error);
      Alert.alert(
        'Error',
        `Failed to save income: ${error.message || 'Please check your connection and try again.'}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Income</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Amount Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amount</Text>
            <View style={styles.amountContainer}>
              <Text style={styles.currencySymbol}>£</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor={colors.text.secondary}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                autoFocus
              />
            </View>
          </View>

          {/* Description Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <TextInput
              style={styles.descriptionInput}
              placeholder="e.g., Monthly salary, Freelance project payment"
              placeholderTextColor={colors.text.secondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Category Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category</Text>
            <View style={styles.categoriesGrid}>
              {incomeCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryItem,
                    selectedCategory.id === category.id && {
                      backgroundColor: category.color + '20',
                      borderColor: category.color,
                    },
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <View
                    style={[styles.categoryIcon, { backgroundColor: category.color }]}
                  >
                    <Ionicons name={category.icon as any} size={20} color="white" />
                  </View>
                  <Text
                    style={[
                      styles.categoryName,
                      selectedCategory.id === category.id && { color: category.color },
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: colors.primary[500] },
              loading && styles.saveButtonDisabled,
            ]}
            onPress={handleSaveIncome}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Add Income'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.primary,
    },
    backButton: {
      padding: 4,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text.primary,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    section: {
      marginTop: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text.primary,
      marginBottom: 12,
    },
    amountContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background.secondary,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderWidth: 1,
      borderColor: colors.border.primary,
    },
    currencySymbol: {
      fontSize: 24,
      fontWeight: '600',
      color: colors.text.primary,
      marginRight: 8,
    },
    amountInput: {
      flex: 1,
      fontSize: 24,
      fontWeight: '600',
      color: colors.text.primary,
    },
    descriptionInput: {
      backgroundColor: colors.background.secondary,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderWidth: 1,
      borderColor: colors.border.primary,
      fontSize: 16,
      color: colors.text.primary,
      textAlignVertical: 'top',
    },
    categoriesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    categoryItem: {
      width: '30%',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 8,
      borderRadius: 12,
      backgroundColor: colors.background.secondary,
      borderWidth: 1,
      borderColor: colors.border.primary,
    },
    categoryIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    categoryName: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.text.secondary,
      textAlign: 'center',
    },
    footer: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border.primary,
    },
    saveButton: {
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: 'white',
    },
  });