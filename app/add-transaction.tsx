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
import { useXP } from '../hooks/useXP';
import { useAuth } from './auth/AuthContext';
import { StreakService } from '../services/streakService';
import { MilestoneService } from '../services/milestoneService';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const expenseCategories: Category[] = [
  { id: 'food', name: 'Food & Dining', icon: 'restaurant', color: '#EF4444' },
  { id: 'transport', name: 'Transport', icon: 'car', color: '#3B82F6' },
  { id: 'shopping', name: 'Shopping', icon: 'bag', color: '#EC4899' },
  { id: 'entertainment', name: 'Entertainment', icon: 'game-controller', color: '#8B5CF6' },
  { id: 'bills', name: 'Bills & Utilities', icon: 'receipt', color: '#F59E0B' },
  { id: 'healthcare', name: 'Healthcare', icon: 'medical', color: '#10B981' },
  { id: 'education', name: 'Education', icon: 'school', color: '#06B6D4' },
  { id: 'travel', name: 'Travel', icon: 'airplane', color: '#84CC16' },
  { id: 'groceries', name: 'Groceries', icon: 'basket', color: '#22C55E' },
  { id: 'fuel', name: 'Fuel', icon: 'car-sport', color: '#F97316' },
  { id: 'subscriptions', name: 'Subscriptions', icon: 'card', color: '#A855F7' },
  { id: 'other', name: 'Other', icon: 'ellipsis-horizontal', color: '#6B7280' },
];

const incomeCategories: Category[] = [
  { id: 'salary', name: 'Salary', icon: 'briefcase', color: '#10B981' },
  { id: 'freelance', name: 'Freelance', icon: 'laptop', color: '#8B5CF6' },
  { id: 'business', name: 'Business', icon: 'storefront', color: '#3B82F6' },
  { id: 'investment', name: 'Investment', icon: 'trending-up', color: '#EF4444' },
  { id: 'rental', name: 'Rental', icon: 'home', color: '#F59E0B' },
  { id: 'gift', name: 'Gift', icon: 'gift', color: '#EC4899' },
  { id: 'other', name: 'Other', icon: 'ellipsis-horizontal', color: '#6B7280' },
];

type TransactionType = 'expense' | 'income';

export default function AddTransactionScreen() {
  const { colors } = useTheme();
  const { user, isLoggedIn } = useAuth();
  const { awardXP } = useXP();
  const [transactionType, setTransactionType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>(expenseCategories[0]);
  const [loading, setLoading] = useState(false);

  const styles = createStyles(colors);


  // Get current categories based on transaction type
  const currentCategories = transactionType === 'expense' ? expenseCategories : incomeCategories;

  // Handle transaction type toggle
  const handleToggleType = (type: TransactionType) => {
    setTransactionType(type);
    // Reset to first category of the new type
    const newCategories = type === 'expense' ? expenseCategories : incomeCategories;
    setSelectedCategory(newCategories[0]);
  };

  const handleSaveTransaction = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', `Please enter a valid ${transactionType} amount.`);
      return;
    }

    if (!description.trim()) {
      Alert.alert('Missing Description', `Please enter a description for this ${transactionType}.`);
      return;
    }

    try {
      setLoading(true);

      const transactionAmount = transactionType === 'expense'
        ? -Math.abs(parseFloat(amount)) // Expenses are negative
        : Math.abs(parseFloat(amount));  // Income is positive

      const transactionData = {
        amount: transactionAmount,
        description: description.trim(),
        category: selectedCategory.name,
        type: transactionType === 'expense' ? 'debit' as const : 'credit' as const,
        date: new Date().toISOString(),
        merchant: description.trim(),
        currency: 'GBP',
      };

      console.log(`💰 Saving ${transactionType}:`, transactionData);

      const result = await transactionAPI.createTransaction(transactionData);

      // Award XP for adding a transaction (for both expenses and income)
      if (result) {
        try {
          // Track milestone progress for all transactions
          const achievedMilestones = await MilestoneService.recordTransaction();

          // Award milestone XP
          for (const milestoneAction of achievedMilestones) {
            console.log(`🎯 [AddTransaction] Milestone achieved: ${milestoneAction}`);
            await awardXP(milestoneAction);
          }

          // For expenses only: award daily XP and track streaks
          if (transactionType === 'expense') {
            // Award XP for adding expense
            await awardXP('add-expense');

            // Track daily streak and award weekly streak XP if earned
            const { shouldAwardWeekly, newStreak } = await StreakService.recordDailyActivity();

            if (shouldAwardWeekly) {
              console.log(`🔥 [AddTransaction] 7-day streak achieved! Current streak: ${newStreak} days`);
              await awardXP('week-streak');
            }
          }
        } catch (xpError) {
          console.error('[AddTransaction] Error awarding XP:', xpError);
        }
      }

      if (result) {
        Alert.alert(
          'Success',
          `${transactionType === 'expense' ? 'Expense' : 'Income'} saved successfully!`,
          [
            {
              text: 'Add Another',
              onPress: () => {
                setAmount('');
                setDescription('');
              },
            },
            {
              text: 'Done',
              style: 'default',
              onPress: () => router.back(),
            },
          ]
        );

        // Auto-detect bills for expenses (disabled for now)
        if (transactionType === 'expense') {
          try {
            // TODO: Implement bill detection method
            console.log('Bill detection would run here for:', {
              description: description.trim(),
              amount: Math.abs(parseFloat(amount)),
              category: selectedCategory.name,
            });
          } catch (billError) {
            console.log('Bill detection error (non-critical):', billError);
          }
        }
      }
    } catch (error: any) {
      console.error(`Error saving ${transactionType}:`, error);
      Alert.alert('Error', `Failed to save ${transactionType}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Transaction</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Transaction Type Toggle */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                styles.toggleLeft,
                transactionType === 'expense' && styles.toggleActive
              ]}
              onPress={() => handleToggleType('expense')}
            >
              <Ionicons
                name="remove-circle"
                size={20}
                color={transactionType === 'expense' ? '#FFFFFF' : colors.text.secondary}
              />
              <Text style={[
                styles.toggleText,
                transactionType === 'expense' && styles.toggleTextActive
              ]}>
                Expense
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                styles.toggleRight,
                transactionType === 'income' && styles.toggleActive
              ]}
              onPress={() => handleToggleType('income')}
            >
              <Ionicons
                name="add-circle"
                size={20}
                color={transactionType === 'income' ? '#FFFFFF' : colors.text.secondary}
              />
              <Text style={[
                styles.toggleText,
                transactionType === 'income' && styles.toggleTextActive
              ]}>
                Income
              </Text>
            </TouchableOpacity>
          </View>

          {/* Amount Input */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Amount</Text>
            <View style={styles.amountContainer}>
              <Text style={styles.currencySymbol}>£</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor={colors.text.tertiary}
                autoFocus
              />
            </View>
          </View>

          {/* Description Input */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Description</Text>
            <TextInput
              style={styles.descriptionInput}
              value={description}
              onChangeText={setDescription}
              placeholder={`What's this ${transactionType} for?`}
              placeholderTextColor={colors.text.tertiary}
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Category Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
              <View style={styles.categoriesContainer}>
                {currentCategories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryItem,
                      selectedCategory.id === category.id && styles.categoryItemSelected,
                      { backgroundColor: selectedCategory.id === category.id ? category.color : colors.background.secondary }
                    ]}
                    onPress={() => setSelectedCategory(category)}
                  >
                    <Ionicons
                      name={category.icon as any}
                      size={24}
                      color={selectedCategory.id === category.id ? '#FFFFFF' : category.color}
                    />
                    <Text style={[
                      styles.categoryText,
                      { color: selectedCategory.id === category.id ? '#FFFFFF' : colors.text.secondary }
                    ]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              {
                backgroundColor: transactionType === 'expense' ? '#EF4444' : '#10B981',
                opacity: loading ? 0.7 : 1
              }
            ]}
            onPress={handleSaveTransaction}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.saveButtonText}>Saving...</Text>
            ) : (
              <>
                <Ionicons
                  name={transactionType === 'expense' ? 'remove-circle' : 'add-circle'}
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.saveButtonText}>
                  Save {transactionType === 'expense' ? 'Expense' : 'Income'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  toggleLeft: {},
  toggleRight: {},
  toggleActive: {
    backgroundColor: colors.primary.main,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
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
    paddingVertical: 4,
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
    paddingVertical: 16,
  },
  descriptionInput: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: colors.text.primary,
    textAlignVertical: 'top',
  },
  categoriesScroll: {
    marginHorizontal: -16,
  },
  categoriesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryItem: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 80,
    gap: 8,
  },
  categoryItemSelected: {
    // Color set dynamically
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});