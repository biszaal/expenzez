import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { ExpenseList, Expense } from '../../components/ExpenseList';
import { expenseAPI } from '../../services/api';
import { spacing, borderRadius, typography } from '../../constants/theme';

const categories = [
  'Groceries',
  'Transport',
  'Dining',
  'Shopping',
  'Bills',
  'Health',
  'Entertainment',
  'Other',
];

export default function ExpenseManagementPage() {
  const { colors } = useTheme();
  const router = useRouter();
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [dateRange, setDateRange] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});
  
  // Edit expense modal states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDate, setEditDate] = useState(new Date());
  const [editTags, setEditTags] = useState('');
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  
  // Filter modal state
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const handleExpenseEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setEditAmount(expense.amount.toString());
    setEditCategory(expense.category);
    setEditDescription(expense.description || '');
    setEditDate(new Date(expense.date));
    setEditTags(expense.tags?.join(', ') || '');
    setEditModalVisible(true);
  };

  const handleSaveExpense = async () => {
    if (!editingExpense) return;

    const numericAmount = parseFloat(editAmount);
    if (!editAmount || isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount.');
      return;
    }

    setEditLoading(true);

    try {
      await expenseAPI.updateExpense(editingExpense.id, {
        amount: numericAmount,
        category: editCategory.toLowerCase(),
        description: editDescription.trim() || undefined,
        date: editDate.toISOString(),
        tags: editTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
      });

      Alert.alert('Success', 'Expense updated successfully!');
      setEditModalVisible(false);
      setEditingExpense(null);
    } catch (error: any) {
      console.error('Error updating expense:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to update expense. Please try again.'
      );
    } finally {
      setEditLoading(false);
    }
  };

  const applyFilters = () => {
    setFilterModalVisible(false);
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setDateRange({});
    setFilterModalVisible(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.secondary }}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color={colors.primary[500]} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            Expenses
          </Text>
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => setFilterModalVisible(true)}
            style={[styles.filterButton, { backgroundColor: colors.background.primary }]}
          >
            <Ionicons name="funnel" size={20} color={colors.primary[500]} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/expenses/add')}
            style={[styles.addButton, { backgroundColor: colors.primary[500] }]}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Active filters display */}
      {(selectedCategory || dateRange.startDate || dateRange.endDate) && (
        <View style={[styles.activeFilters, { backgroundColor: colors.background.primary }]}>
          <View style={styles.filterTags}>
            {selectedCategory && (
              <View style={[styles.filterTag, { backgroundColor: colors.primary[100] }]}>
                <Text style={[styles.filterTagText, { color: colors.primary[700] }]}>
                  {selectedCategory}
                </Text>
                <TouchableOpacity onPress={() => setSelectedCategory('')}>
                  <Ionicons name="close" size={16} color={colors.primary[700]} />
                </TouchableOpacity>
              </View>
            )}
            {dateRange.startDate && (
              <View style={[styles.filterTag, { backgroundColor: colors.primary[100] }]}>
                <Text style={[styles.filterTagText, { color: colors.primary[700] }]}>
                  From: {new Date(dateRange.startDate).toLocaleDateString()}
                </Text>
                <TouchableOpacity onPress={() => setDateRange(prev => ({ ...prev, startDate: undefined }))}>
                  <Ionicons name="close" size={16} color={colors.primary[700]} />
                </TouchableOpacity>
              </View>
            )}
            {dateRange.endDate && (
              <View style={[styles.filterTag, { backgroundColor: colors.primary[100] }]}>
                <Text style={[styles.filterTagText, { color: colors.primary[700] }]}>
                  To: {new Date(dateRange.endDate).toLocaleDateString()}
                </Text>
                <TouchableOpacity onPress={() => setDateRange(prev => ({ ...prev, endDate: undefined }))}>
                  <Ionicons name="close" size={16} color={colors.primary[700]} />
                </TouchableOpacity>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={clearFilters} style={styles.clearFiltersButton}>
            <Text style={[styles.clearFiltersText, { color: colors.primary[600] }]}>
              Clear All
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Expense List */}
      <ExpenseList
        onExpenseEdit={handleExpenseEdit}
        categoryFilter={selectedCategory}
        dateRange={dateRange}
      />

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.secondary }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
              <Text style={[styles.modalCancel, { color: colors.primary[500] }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>Filters</Text>
            <TouchableOpacity onPress={applyFilters}>
              <Text style={[styles.modalApply, { color: colors.primary[500] }]}>Apply</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={[styles.filterSectionTitle, { color: colors.text.primary }]}>
              Category
            </Text>
            <View style={styles.categoryGrid}>
              <TouchableOpacity
                onPress={() => setSelectedCategory('')}
                style={[
                  styles.categoryOption,
                  {
                    backgroundColor: selectedCategory === '' ? colors.primary[100] : colors.background.primary,
                    borderColor: colors.border.light,
                  },
                ]}
              >
                <Text style={{
                  color: selectedCategory === '' ? colors.primary[600] : colors.text.primary,
                  fontWeight: selectedCategory === '' ? '600' : '400',
                }}>
                  All Categories
                </Text>
              </TouchableOpacity>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  onPress={() => setSelectedCategory(category.toLowerCase())}
                  style={[
                    styles.categoryOption,
                    {
                      backgroundColor: selectedCategory === category.toLowerCase() ? colors.primary[100] : colors.background.primary,
                      borderColor: colors.border.light,
                    },
                  ]}
                >
                  <Text style={{
                    color: selectedCategory === category.toLowerCase() ? colors.primary[600] : colors.text.primary,
                    fontWeight: selectedCategory === category.toLowerCase() ? '600' : '400',
                  }}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.filterSectionTitle, { color: colors.text.primary }]}>
              Date Range
            </Text>
            <View style={styles.dateRangeSection}>
              <Text style={[styles.dateLabel, { color: colors.text.secondary }]}>From:</Text>
              <Text style={[styles.dateValue, { color: colors.text.primary }]}>
                {dateRange.startDate ? new Date(dateRange.startDate).toLocaleDateString() : 'Not set'}
              </Text>
              
              <Text style={[styles.dateLabel, { color: colors.text.secondary }]}>To:</Text>
              <Text style={[styles.dateValue, { color: colors.text.primary }]}>
                {dateRange.endDate ? new Date(dateRange.endDate).toLocaleDateString() : 'Not set'}
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Edit Expense Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.secondary }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => {
                setEditModalVisible(false);
                setEditingExpense(null);
              }}
            >
              <Text style={[styles.modalCancel, { color: colors.primary[500] }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>Edit Expense</Text>
            <TouchableOpacity onPress={handleSaveExpense} disabled={editLoading}>
              <Text style={[styles.modalApply, { 
                color: editLoading ? colors.gray[400] : colors.primary[500] 
              }]}>
                {editLoading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={[styles.label, { color: colors.text.primary }]}>Amount</Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: colors.background.primary,
                color: colors.text.primary,
                borderColor: colors.border.light,
              }]}
              placeholder="0.00"
              
              keyboardType="decimal-pad"
              value={editAmount}
              onChangeText={setEditAmount}
            />

            <Text style={[styles.label, { color: colors.text.primary }]}>Category</Text>
            <View style={styles.categoryGrid}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryOption,
                    {
                      backgroundColor: editCategory === cat.toLowerCase() 
                        ? colors.primary[100] 
                        : colors.background.primary,
                      borderColor: colors.border.light,
                    },
                  ]}
                  onPress={() => setEditCategory(cat.toLowerCase())}
                >
                  <Text style={{
                    color: editCategory === cat.toLowerCase() 
                      ? colors.primary[600] 
                      : colors.text.primary,
                    fontWeight: editCategory === cat.toLowerCase() ? '600' : '400',
                  }}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.text.primary }]}>Date</Text>
            <TouchableOpacity
              onPress={() => setShowEditDatePicker(true)}
              style={[styles.input, {
                backgroundColor: colors.background.primary,
                borderColor: colors.border.light,
                flexDirection: 'row',
                alignItems: 'center',
              }]}
            >
              <Ionicons
                name="calendar-outline"
                size={20}
                color={colors.primary[500]}
                style={{ marginRight: 8 }}
              />
              <Text style={{ color: colors.text.primary }}>
                {editDate.toDateString()}
              </Text>
            </TouchableOpacity>
            {showEditDatePicker && (
              <DateTimePicker
                value={editDate}
                mode="date"
                display="default"
                onChange={(_, selectedDate) => {
                  setShowEditDatePicker(false);
                  if (selectedDate) setEditDate(selectedDate);
                }}
              />
            )}

            <Text style={[styles.label, { color: colors.text.primary }]}>Description</Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: colors.background.primary,
                color: colors.text.primary,
                borderColor: colors.border.light,
                height: 80,
                textAlignVertical: 'top',
              }]}
              placeholder="Description (optional)"
              
              value={editDescription}
              onChangeText={setEditDescription}
              multiline
            />

            <Text style={[styles.label, { color: colors.text.primary }]}>Tags</Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: colors.background.primary,
                color: colors.text.primary,
                borderColor: colors.border.light,
              }]}
              placeholder="Enter tags separated by commas"
              
              value={editTags}
              onChangeText={setEditTags}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: spacing.sm,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeFilters: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  filterTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
    gap: spacing.xs,
  },
  filterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },
  filterTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  clearFiltersButton: {
    marginLeft: spacing.sm,
  },
  clearFiltersText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalCancel: {
    fontSize: 16,
  },
  modalApply: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  categoryOption: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  dateRangeSection: {
    gap: spacing.sm,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  dateValue: {
    fontSize: 16,
  },
  label: {
    fontWeight: '600',
    fontSize: 15,
    marginBottom: 6,
    marginTop: 18,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: 16,
    marginBottom: spacing.sm,
  },
});