import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { budgetAPI } from '../services/api';
import { spacing, borderRadius, typography } from '../constants/theme';

export interface Budget {
  id: string;
  name: string;
  category: string;
  amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate?: string;
  alertThreshold: number;
  isActive: boolean;
  currentSpent: number;
  progress: number;
  isOverBudget: boolean;
  remainingAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  remainingTotal: number;
  overallProgress: number;
  overBudgetCount: number;
  totalCount: number;
}

export interface BudgetAlert {
  type: 'threshold' | 'exceeded';
  budgetId: string;
  budgetName: string;
  category: string;
  message: string;
  severity: 'warning' | 'error';
  currentSpent: number;
  budgetAmount: number;
  progress: number;
}

interface BudgetDashboardProps {
  onBudgetEdit?: (budget: Budget) => void;
  onCreateBudget?: () => void;
}

export const BudgetDashboard: React.FC<BudgetDashboardProps> = ({
  onBudgetEdit,
  onCreateBudget,
}) => {
  const { colors } = useTheme();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadBudgets = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      const [budgetResponse, alertResponse] = await Promise.all([
        budgetAPI.getBudgets(true),
        budgetAPI.getBudgetAlerts(),
      ]);

      setBudgets(budgetResponse.budgets || []);
      setSummary(budgetResponse.summary || null);
      setAlerts(alertResponse.alerts || []);
    } catch (error: any) {
      console.error('Error loading budgets:', error);
      Alert.alert('Error', 'Failed to load budgets');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBudgets();
  }, []);

  const handleDeleteBudget = (budget: Budget) => {
    Alert.alert(
      'Delete Budget',
      `Are you sure you want to delete the ${budget.name} budget?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await budgetAPI.deleteBudget(budget.id);
              Alert.alert('Success', 'Budget deleted successfully');
              loadBudgets();
            } catch (error: any) {
              console.error('Error deleting budget:', error);
              Alert.alert('Error', 'Failed to delete budget');
            }
          },
        },
      ]
    );
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

  const getProgressColor = (progress: number, isOverBudget: boolean) => {
    if (isOverBudget) return colors.red[500];
    if (progress >= 80) return colors.orange[500];
    if (progress >= 60) return colors.yellow[500];
    return colors.green[500];
  };

  const ProgressBar = ({ progress, isOverBudget }: { progress: number; isOverBudget: boolean }) => {
    const progressColor = getProgressColor(progress, isOverBudget);
    const clampedProgress = Math.min(progress, 100);

    return (
      <View style={[styles.progressBarContainer, { backgroundColor: colors.gray[200] }]}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${clampedProgress}%`,
              backgroundColor: progressColor,
            },
          ]}
        />
        {isOverBudget && (
          <View style={[styles.overBudgetIndicator, { backgroundColor: colors.red[500] }]} />
        )}
      </View>
    );
  };

  const renderBudgetItem = ({ item: budget }: { item: Budget }) => (
    <View style={[styles.budgetCard, { backgroundColor: colors.background.primary }]}>
      <View style={styles.budgetHeader}>
        <View style={styles.budgetInfo}>
          <View style={[
            styles.categoryIcon,
            { backgroundColor: `${getCategoryColor(budget.category)}20` }
          ]}>
            <Ionicons
              name={getCategoryIcon(budget.category) as any}
              size={20}
              color={getCategoryColor(budget.category)}
            />
          </View>
          <View style={styles.budgetDetails}>
            <Text style={[styles.budgetName, { color: colors.text.primary }]}>
              {budget.name}
            </Text>
            <Text style={[styles.budgetPeriod, { color: colors.text.secondary }]}>
              {budget.period.charAt(0).toUpperCase() + budget.period.slice(1)} Budget
            </Text>
          </View>
        </View>
        <View style={styles.budgetActions}>
          <TouchableOpacity
            onPress={() => onBudgetEdit?.(budget)}
            style={[styles.actionButton, { backgroundColor: colors.primary[100] }]}
          >
            <Ionicons name="pencil" size={16} color={colors.primary[600]} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteBudget(budget)}
            style={[styles.actionButton, { backgroundColor: colors.red[100] }]}
          >
            <Ionicons name="trash" size={16} color={colors.red[600]} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.budgetProgress}>
        <View style={styles.progressHeader}>
          <Text style={[styles.spentAmount, { color: colors.text.primary }]}>
            {formatAmount(budget.currentSpent)} spent
          </Text>
          <Text style={[styles.budgetAmount, { color: colors.text.secondary }]}>
            of {formatAmount(budget.amount)}
          </Text>
        </View>
        
        <ProgressBar progress={budget.progress} isOverBudget={budget.isOverBudget} />
        
        <View style={styles.progressFooter}>
          <Text style={[
            styles.progressPercent,
            { color: getProgressColor(budget.progress, budget.isOverBudget) }
          ]}>
            {budget.progress}%
          </Text>
          <Text style={[styles.remainingAmount, { color: colors.text.secondary }]}>
            {budget.isOverBudget 
              ? `Over by ${formatAmount(budget.currentSpent - budget.amount)}`
              : `${formatAmount(budget.remainingAmount)} remaining`
            }
          </Text>
        </View>
      </View>

      {budget.isOverBudget && (
        <View style={[styles.overBudgetBanner, { backgroundColor: colors.red[100] }]}>
          <Ionicons name="warning" size={16} color={colors.red[600]} />
          <Text style={[styles.overBudgetText, { color: colors.red[600] }]}>
            Budget exceeded!
          </Text>
        </View>
      )}
    </View>
  );

  const renderAlert = (alert: BudgetAlert, index: number) => (
    <View
      key={index}
      style={[
        styles.alertCard,
        {
          backgroundColor: alert.severity === 'error' ? colors.red[50] : colors.orange[50],
          borderColor: alert.severity === 'error' ? colors.red[200] : colors.orange[200],
        },
      ]}
    >
      <View style={styles.alertHeader}>
        <Ionicons
          name={alert.severity === 'error' ? 'alert-circle' : 'warning'}
          size={20}
          color={alert.severity === 'error' ? colors.red[600] : colors.orange[600]}
        />
        <Text style={[
          styles.alertMessage,
          { color: alert.severity === 'error' ? colors.red[700] : colors.orange[700] }
        ]}>
          {alert.message}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
          Loading budgets...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadBudgets(true)}
          colors={[colors.primary[500]]}
        />
      }
    >
      {/* Alerts Section */}
      {alerts.length > 0 && (
        <View style={styles.alertsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Budget Alerts ({alerts.length})
          </Text>
          {alerts.map(renderAlert)}
        </View>
      )}

      {/* Summary Section */}
      {summary && (
        <View style={[styles.summaryCard, { backgroundColor: colors.background.primary }]}>
          <LinearGradient
            colors={[colors.primary[500], colors.primary[600]]}
            style={styles.summaryGradient}
          >
            <Text style={styles.summaryTitle}>Monthly Overview</Text>
            <View style={styles.summaryStats}>
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatValue}>
                  {formatAmount(summary.totalSpent)}
                </Text>
                <Text style={styles.summaryStatLabel}>Spent</Text>
              </View>
              <View style={styles.summaryStatDivider} />
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatValue}>
                  {formatAmount(summary.totalBudget)}
                </Text>
                <Text style={styles.summaryStatLabel}>Budgeted</Text>
              </View>
              <View style={styles.summaryStatDivider} />
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatValue}>
                  {formatAmount(summary.remainingTotal)}
                </Text>
                <Text style={styles.summaryStatLabel}>Remaining</Text>
              </View>
            </View>
            
            <View style={styles.overallProgress}>
              <Text style={styles.overallProgressLabel}>
                Overall Progress: {summary.overallProgress}%
              </Text>
              <ProgressBar 
                progress={summary.overallProgress} 
                isOverBudget={summary.overallProgress > 100} 
              />
            </View>
          </LinearGradient>
        </View>
      )}

      {/* Budgets Section */}
      <View style={styles.budgetsSection}>
        <View style={styles.budgetsSectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Your Budgets ({budgets.length})
          </Text>
          <TouchableOpacity
            onPress={onCreateBudget}
            style={[styles.createButton, { backgroundColor: colors.primary[500] }]}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.createButtonText}>New Budget</Text>
          </TouchableOpacity>
        </View>
        
        {budgets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="pie-chart-outline" size={64} color={colors.gray[400]} />
            <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
              No budgets found
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.text.secondary }]}>
              Create your first budget to start tracking your spending
            </Text>
          </View>
        ) : (
          budgets.map((budget) => renderBudgetItem({ item: budget }))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  alertsSection: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  alertCard: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  alertMessage: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  summaryCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  summaryGradient: {
    padding: spacing.lg,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  summaryStatItem: {
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  summaryStatLabel: {
    fontSize: 12,
    color: '#E5E7EB',
    marginTop: 2,
  },
  summaryStatDivider: {
    width: 1,
    backgroundColor: '#ffffff40',
  },
  overallProgress: {
    alignItems: 'center',
  },
  overallProgressLabel: {
    fontSize: 14,
    color: '#E5E7EB',
    marginBottom: spacing.xs,
  },
  budgetsSection: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  budgetsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: 4,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  budgetCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  budgetInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  budgetDetails: {
    flex: 1,
  },
  budgetName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  budgetPeriod: {
    fontSize: 14,
  },
  budgetActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  budgetProgress: {
    marginBottom: spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  spentAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  budgetAmount: {
    fontSize: 14,
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: spacing.xs,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  overBudgetIndicator: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderRadius: 2,
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '600',
  },
  remainingAmount: {
    fontSize: 12,
  },
  overBudgetBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  overBudgetText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
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

export default BudgetDashboard;