import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { budgetService, BudgetProgress } from '../../services/budgetService';
import { EXPENSE_CATEGORIES } from '../../services/expenseStorage';
import { spacing, borderRadius, typography } from '../../constants/theme';

export default function BudgetsScreen() {
  const { colors } = useTheme();
  const [budgetProgress, setBudgetProgress] = useState<BudgetProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const progress = await budgetService.getAllBudgetProgress();
      setBudgetProgress(progress);
    } catch (error) {
      console.error('Error loading budgets:', error);
      Alert.alert('Error', 'Failed to load budgets');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDeleteBudget = (budgetId: string, budgetName: string) => {
    Alert.alert(
      'Delete Budget',
      `Are you sure you want to delete the "${budgetName}" budget?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await budgetService.deleteBudget(budgetId);
            if (success) {
              Alert.alert('Success', 'Budget deleted successfully');
              loadBudgets();
            } else {
              Alert.alert('Error', 'Failed to delete budget');
            }
          },
        },
      ]
    );
  };

  const getBudgetStatusColor = (status: BudgetProgress['status']) => {
    return budgetService.getBudgetStatusColor(status);
  };

  const getBudgetStatusIcon = (status: BudgetProgress['status']) => {
    return budgetService.getBudgetStatusIcon(status);
  };

  const formatCurrency = (amount: number) => {
    return `£${amount.toFixed(2)}`;
  };

  const renderBudgetCard = (progress: BudgetProgress) => {
    const categoryInfo = EXPENSE_CATEGORIES.find(cat => cat.id === progress.budget.category);
    const statusColor = getBudgetStatusColor(progress.status);
    const statusIcon = getBudgetStatusIcon(progress.status);

    return (
      <View
        key={progress.budget.id}
        style={[styles.budgetCard, { backgroundColor: colors.background.secondary }]}
      >
        <View style={styles.budgetHeader}>
          <View style={styles.budgetTitle}>
            <Text style={styles.budgetEmoji}>
              {categoryInfo?.emoji || '📊'}
            </Text>
            <View style={styles.budgetTitleText}>
              <Text style={[styles.budgetName, { color: colors.text.primary }]}>
                {progress.budget.name}
              </Text>
              <Text style={[styles.budgetPeriod, { color: colors.text.secondary }]}>
                {progress.budget.period} • {progress.daysLeft} days left
              </Text>
            </View>
          </View>

          <View style={styles.budgetActions}>
            <Text style={[styles.statusIcon, { color: statusColor }]}>
              {statusIcon}
            </Text>
            <TouchableOpacity
              onPress={() => router.push(`/budgets/edit?id=${progress.budget.id}`)}
              style={[styles.actionButton, { backgroundColor: colors.background.primary }]}
            >
              <Ionicons name="pencil" size={16} color={colors.text.secondary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDeleteBudget(progress.budget.id, progress.budget.name)}
              style={[styles.actionButton, { backgroundColor: colors.background.primary }]}
            >
              <Ionicons name="trash" size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.budgetAmount}>
          <View style={styles.amountRow}>
            <Text style={[styles.spent, { color: colors.text.primary }]}>
              {formatCurrency(progress.spent)}
            </Text>
            <Text style={[styles.total, { color: colors.text.secondary }]}>
              of {formatCurrency(progress.budget.amount)}
            </Text>
          </View>
          <Text
            style={[
              styles.remaining,
              {
                color: progress.remaining >= 0 ? colors.text.secondary : '#EF4444'
              },
            ]}
          >
            {progress.remaining >= 0 ? formatCurrency(progress.remaining) : formatCurrency(Math.abs(progress.remaining))} {progress.remaining >= 0 ? 'remaining' : 'over budget'}
          </Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: colors.border.light }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: statusColor,
                  width: `${Math.min(progress.percentage, 100)}%`,
                },
              ]}
            />
            {progress.percentage > 100 && (
              <View
                style={[
                  styles.progressOverflow,
                  {
                    backgroundColor: '#EF4444',
                    width: `${Math.min(progress.percentage - 100, 50)}%`,
                  },
                ]}
              />
            )}
          </View>
          <Text style={[styles.progressText, { color: colors.text.secondary }]}>
            {Math.round(progress.percentage)}%
          </Text>
        </View>

        <View style={styles.budgetInsights}>
          <View style={styles.insightItem}>
            <Text style={[styles.insightLabel, { color: colors.text.secondary }]}>
              Daily Budget
            </Text>
            <Text style={[styles.insightValue, { color: colors.text.primary }]}>
              {formatCurrency(progress.dailyBudget)}
            </Text>
          </View>
          <View style={styles.insightItem}>
            <Text style={[styles.insightLabel, { color: colors.text.secondary }]}>
              Projected
            </Text>
            <Text
              style={[
                styles.insightValue,
                {
                  color: progress.projectedSpend > progress.budget.amount
                    ? '#EF4444'
                    : colors.text.primary
                },
              ]}
            >
              {formatCurrency(progress.projectedSpend)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            Loading budgets...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={colors.primary[500]} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Budgets
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/budgets/create')}
          style={[styles.addButton, { backgroundColor: colors.primary[500] }]}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadBudgets(true)}
            tintColor={colors.primary[500]}
          />
        }
      >
        {budgetProgress.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💰</Text>
            <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
              No Budgets Yet
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.text.secondary }]}>
              Create your first budget to start tracking your spending and reach your financial goals.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/budgets/create')}
              style={[styles.emptyButton, { backgroundColor: colors.primary[500] }]}
            >
              <Text style={styles.emptyButtonText}>Create Budget</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.budgetList}>
            {budgetProgress.map(renderBudgetCard)}
          </View>
        )}

        {budgetProgress.length > 0 && (
          <View style={styles.suggestionsSection}>
            <TouchableOpacity
              onPress={() => router.push('/insights')}
              style={[styles.suggestionButton, { backgroundColor: colors.background.secondary }]}
            >
              <Ionicons name="bulb" size={20} color={colors.primary[500]} />
              <Text style={[styles.suggestionText, { color: colors.text.primary }]}>
                Get Budget Suggestions
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.text.secondary} />
            </TouchableOpacity>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: 14,
  },
  budgetList: {
    gap: spacing.md,
  },
  budgetCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  budgetTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  budgetEmoji: {
    fontSize: 24,
  },
  budgetTitleText: {
    flex: 1,
  },
  budgetName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  budgetPeriod: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  budgetActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusIcon: {
    fontSize: 18,
    marginRight: spacing.xs,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  budgetAmount: {
    gap: 4,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  spent: {
    fontSize: 20,
    fontWeight: '700',
  },
  total: {
    fontSize: 14,
  },
  remaining: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressOverflow: {
    position: 'absolute',
    height: '100%',
    right: 0,
    top: 0,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 35,
    textAlign: 'right',
  },
  budgetInsights: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  insightItem: {
    alignItems: 'center',
  },
  insightLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  insightValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  emptyButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  suggestionsSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
  },
  suggestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  suggestionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },

});