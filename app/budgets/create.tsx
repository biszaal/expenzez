import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { budgetService } from '../../services/budgetService';
import { EXPENSE_CATEGORIES } from '../../services/expenseStorage';
import { spacing, borderRadius, typography } from '../../constants/theme';

const BUDGET_PERIODS = [
  { id: 'weekly', name: 'Weekly', days: 7 },
  { id: 'monthly', name: 'Monthly', days: 30 },
  { id: 'yearly', name: 'Yearly', days: 365 },
] as const;

const ALERT_THRESHOLDS = [50, 75, 80, 90];

export default function CreateBudgetScreen() {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [alertThreshold, setAlertThreshold] = useState(80);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a budget name');
      return;
    }

    if (!category) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      const selectedPeriod = BUDGET_PERIODS.find(p => p.id === period)!;
      const endDate = new Date(now);
      endDate.setDate(now.getDate() + selectedPeriod.days);

      const budget = await budgetService.createBudget({
        name: name.trim(),
        category,
        amount: numericAmount,
        period,
        startDate: now.toISOString(),
        endDate: endDate.toISOString(),
        alertThreshold,
      });

      Alert.alert(
        'Success',
        'Budget created successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Failed to create budget:', error);
      Alert.alert('Error', 'Failed to create budget. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateBudgetName = (categoryId: string, period: string) => {
    const categoryInfo = EXPENSE_CATEGORIES.find(cat => cat.id === categoryId);
    const periodName = BUDGET_PERIODS.find(p => p.id === period)?.name || 'Monthly';

    if (categoryInfo) {
      return `${categoryInfo.name} - ${periodName}`;
    }
    return '';
  };

  const handleCategorySelect = (categoryId: string) => {
    setCategory(categoryId);
    // Auto-generate name if it's empty or was auto-generated
    if (!name || name.includes(' - ')) {
      setName(generateBudgetName(categoryId, period));
    }
  };

  const handlePeriodSelect = (selectedPeriod: 'weekly' | 'monthly' | 'yearly') => {
    setPeriod(selectedPeriod);
    // Update name if it was auto-generated
    if (category && (!name || name.includes(' - '))) {
      setName(generateBudgetName(category, selectedPeriod));
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.cancelButton, { color: colors.primary[500] }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          Create Budget
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary[500]} />
          ) : (
            <Text style={[styles.saveButton, { color: colors.primary[500] }]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Budget Name */}
        <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Budget Name</Text>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: colors.background.primary,
                borderColor: colors.border.light,
                color: colors.text.primary,
              },
            ]}
            value={name}
            onChangeText={setName}
            placeholder="Enter budget name"
            placeholderTextColor={colors.text.secondary}
          />
        </View>

        {/* Category Selection */}
        <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Category</Text>
          <View style={styles.categoriesGrid}>
            {/* All Categories Option */}
            <TouchableOpacity
              style={[
                styles.categoryButton,
                {
                  backgroundColor: category === 'all' ? colors.primary[100] : colors.background.primary,
                  borderColor: category === 'all' ? colors.primary[500] : colors.border.light,
                },
              ]}
              onPress={() => handleCategorySelect('all')}
            >
              <Text style={styles.categoryEmoji}>📊</Text>
              <Text
                style={[
                  styles.categoryText,
                  {
                    color: category === 'all' ? colors.primary[700] : colors.text.secondary,
                    fontWeight: category === 'all' ? '600' : '400',
                  },
                ]}
              >
                All Expenses
              </Text>
            </TouchableOpacity>

            {/* Individual Categories */}
            {EXPENSE_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryButton,
                  {
                    backgroundColor: category === cat.id ? colors.primary[100] : colors.background.primary,
                    borderColor: category === cat.id ? colors.primary[500] : colors.border.light,
                  },
                ]}
                onPress={() => handleCategorySelect(cat.id)}
              >
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                <Text
                  style={[
                    styles.categoryText,
                    {
                      color: category === cat.id ? colors.primary[700] : colors.text.secondary,
                      fontWeight: category === cat.id ? '600' : '400',
                    },
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Budget Amount */}
        <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Budget Amount</Text>
          <View style={styles.amountContainer}>
            <Text style={[styles.currencySymbol, { color: colors.text.primary }]}>£</Text>
            <TextInput
              style={[
                styles.amountInput,
                {
                  color: colors.text.primary,
                  borderBottomColor: colors.border.light,
                },
              ]}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={colors.text.secondary}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Budget Period */}
        <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Budget Period</Text>
          <View style={styles.periodButtons}>
            {BUDGET_PERIODS.map((periodOption) => (
              <TouchableOpacity
                key={periodOption.id}
                style={[
                  styles.periodButton,
                  {
                    backgroundColor: period === periodOption.id ? colors.primary[100] : colors.background.primary,
                    borderColor: period === periodOption.id ? colors.primary[500] : colors.border.light,
                  },
                ]}
                onPress={() => handlePeriodSelect(periodOption.id)}
              >
                <Text
                  style={[
                    styles.periodText,
                    {
                      color: period === periodOption.id ? colors.primary[700] : colors.text.secondary,
                      fontWeight: period === periodOption.id ? '600' : '400',
                    },
                  ]}
                >
                  {periodOption.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Alert Threshold */}
        <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Alert Threshold</Text>
          <Text style={[styles.sectionDescription, { color: colors.text.secondary }]}>
            Get notified when you reach this percentage of your budget
          </Text>
          <View style={styles.thresholdButtons}>
            {ALERT_THRESHOLDS.map((threshold) => (
              <TouchableOpacity
                key={threshold}
                style={[
                  styles.thresholdButton,
                  {
                    backgroundColor: alertThreshold === threshold ? colors.primary[100] : colors.background.primary,
                    borderColor: alertThreshold === threshold ? colors.primary[500] : colors.border.light,
                  },
                ]}
                onPress={() => setAlertThreshold(threshold)}
              >
                <Text
                  style={[
                    styles.thresholdText,
                    {
                      color: alertThreshold === threshold ? colors.primary[700] : colors.text.secondary,
                      fontWeight: alertThreshold === threshold ? '600' : '400',
                    },
                  ]}
                >
                  {threshold}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Budget Preview */}
        {amount && category && (
          <View style={[styles.section, { backgroundColor: colors.primary[50] }]}>
            <Text style={[styles.sectionTitle, { color: colors.primary[700] }]}>Budget Preview</Text>
            <View style={styles.previewContent}>
              <View style={styles.previewRow}>
                <Text style={[styles.previewLabel, { color: colors.primary[600] }]}>Amount:</Text>
                <Text style={[styles.previewValue, { color: colors.primary[700] }]}>
                  £{parseFloat(amount || '0').toFixed(2)}
                </Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={[styles.previewLabel, { color: colors.primary[600] }]}>Period:</Text>
                <Text style={[styles.previewValue, { color: colors.primary[700] }]}>
                  {BUDGET_PERIODS.find(p => p.id === period)?.name}
                </Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={[styles.previewLabel, { color: colors.primary[600] }]}>Daily Limit:</Text>
                <Text style={[styles.previewValue, { color: colors.primary[700] }]}>
                  £{(parseFloat(amount || '0') / (BUDGET_PERIODS.find(p => p.id === period)?.days || 30)).toFixed(2)}
                </Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={[styles.previewLabel, { color: colors.primary[600] }]}>Alert at:</Text>
                <Text style={[styles.previewValue, { color: colors.primary[700] }]}>
                  £{((parseFloat(amount || '0') * alertThreshold) / 100).toFixed(2)} ({alertThreshold}%)
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  cancelButton: {
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  section: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryButton: {
    width: '47%',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    alignItems: 'center',
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  categoryText: {
    fontSize: 14,
    textAlign: 'center',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    marginRight: spacing.xs,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    borderBottomWidth: 2,
    paddingVertical: spacing.xs,
  },
  periodButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  periodButton: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    alignItems: 'center',
  },
  periodText: {
    fontSize: 14,
    textAlign: 'center',
  },
  thresholdButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  thresholdButton: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    alignItems: 'center',
  },
  thresholdText: {
    fontSize: 14,
    textAlign: 'center',
  },
  previewContent: {
    gap: spacing.xs,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 14,
  },
  previewValue: {
    fontSize: 14,
    fontWeight: '600',
  },

});