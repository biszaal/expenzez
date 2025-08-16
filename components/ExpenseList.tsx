import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { expenseAPI } from '../services/api';
import { spacing, borderRadius, typography } from '../constants/theme';

export interface Expense {
  id: string;
  amount: number;
  category: string;
  description?: string;
  date: string;
  receipt?: {
    url?: string;
    filename?: string;
  };
  tags?: string[];
  isRecurring?: boolean;
  recurringPattern?: {
    frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval?: number;
    endDate?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ExpenseListProps {
  onExpenseEdit?: (expense: Expense) => void;
  categoryFilter?: string;
  dateRange?: {
    startDate?: string;
    endDate?: string;
  };
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  onExpenseEdit,
  categoryFilter,
  dateRange,
}) => {
  const { colors } = useTheme();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);

  const loadExpenses = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      const params: any = {
        limit: 50,
        ...(categoryFilter && { category: categoryFilter }),
        ...(dateRange?.startDate && { startDate: dateRange.startDate }),
        ...(dateRange?.endDate && { endDate: dateRange.endDate }),
      };

      const response = await expenseAPI.getExpenses(params);
      setExpenses(response.expenses || []);
      setTotalAmount(response.totalAmount || 0);
    } catch (error: any) {
      console.error('Error loading expenses:', error);
      Alert.alert('Error', 'Failed to load expenses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [categoryFilter, dateRange]);

  const handleDeleteExpense = (expense: Expense) => {
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to delete this ${expense.category} expense?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await expenseAPI.deleteExpense(expense.id);
              Alert.alert('Success', 'Expense deleted successfully');
              loadExpenses();
            } catch (error: any) {
              console.error('Error deleting expense:', error);
              Alert.alert('Error', 'Failed to delete expense');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatAmount = (amount: number) => {
    return `£${Math.abs(amount).toFixed(2)}`;
  };

  const getCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: string } = {
      groceries: 'basket',
      transport: 'car',
      dining: 'restaurant',
      shopping: 'bag',
      bills: 'receipt',
      health: 'medical',
      entertainment: 'game-controller',
      other: 'ellipse',
    };
    return iconMap[category.toLowerCase()] || 'ellipse';
  };

  const getCategoryColor = (category: string) => {
    const colorMap: { [key: string]: string } = {
      groceries: '#10B981',
      transport: '#3B82F6',
      dining: '#F59E0B',
      shopping: '#8B5CF6',
      bills: '#EF4444',
      health: '#06B6D4',
      entertainment: '#EC4899',
      other: '#6B7280',
    };
    return colorMap[category.toLowerCase()] || '#6B7280';
  };

  const renderExpenseItem = ({ item: expense }: { item: Expense }) => (
    <View style={[styles.expenseItem, { backgroundColor: colors.background.primary }]}>
      <View style={styles.expenseHeader}>
        <View style={styles.expenseInfo}>
          <View style={[
            styles.categoryIcon,
            { backgroundColor: `${getCategoryColor(expense.category)}20` }
          ]}>
            <Ionicons
              name={getCategoryIcon(expense.category) as any}
              size={20}
              color={getCategoryColor(expense.category)}
            />
          </View>
          <View style={styles.expenseDetails}>
            <Text style={[styles.categoryText, { color: colors.text.primary }]}>
              {expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}
            </Text>
            {expense.description && (
              <Text style={[styles.descriptionText, { color: colors.text.secondary }]}>
                {expense.description}
              </Text>
            )}
            <Text style={[styles.dateText, { color: colors.text.tertiary }]}>
              {formatDate(expense.date)}
            </Text>
          </View>
        </View>
        <View style={styles.expenseActions}>
          <Text style={[styles.amountText, { color: colors.text.primary }]}>
            {formatAmount(expense.amount)}
          </Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={() => onExpenseEdit?.(expense)}
              style={[styles.actionButton, { backgroundColor: colors.primary[100] }]}
            >
              <Ionicons name="pencil" size={16} color={colors.primary[600]} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDeleteExpense(expense)}
              style={[styles.actionButton, { backgroundColor: colors.red[100] }]}
            >
              <Ionicons name="trash" size={16} color={colors.red[600]} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {expense.tags && expense.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {expense.tags.map((tag, index) => (
            <View key={index} style={[styles.tag, { backgroundColor: colors.gray[200] }]}>
              <Text style={[styles.tagText, { color: colors.text.secondary }]}>
                {tag}
              </Text>
            </View>
          ))}
        </View>
      )}
      
      {expense.isRecurring && (
        <View style={styles.recurringBadge}>
          <Ionicons name="refresh" size={12} color={colors.primary[600]} />
          <Text style={[styles.recurringText, { color: colors.primary[600] }]}>
            Recurring
          </Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
          Loading expenses...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.totalText, { color: colors.text.primary }]}>
          Total: {formatAmount(totalAmount)}
        </Text>
        <Text style={[styles.countText, { color: colors.text.secondary }]}>
          {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
        </Text>
      </View>
      
      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        renderItem={renderExpenseItem}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadExpenses(true)}
            colors={[colors.primary[500]]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color={colors.gray[400]} />
            <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
              No expenses found
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.text.secondary }]}>
              Add your first expense to get started
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  totalText: {
    fontSize: 18,
    fontWeight: '700',
  },
  countText: {
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
  },
  expenseItem: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  expenseInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  expenseDetails: {
    flex: 1,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  descriptionText: {
    fontSize: 14,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
  },
  expenseActions: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  tag: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
  },
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: 4,
  },
  recurringText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default ExpenseList;