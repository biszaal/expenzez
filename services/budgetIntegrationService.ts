import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';
import TransactionCategorizationAlgorithm, { Transaction, TransactionCategory } from './transactionCategorizationAlgorithm';

export interface Budget {
  id: string;
  name: string;
  categoryId: string;
  amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate?: string;
  isActive: boolean;
  alertThreshold: number; // Percentage (0-1) when to send alerts
  createdAt: string;
  updatedAt: string;
}

export interface BudgetSpending {
  budgetId: string;
  categoryId: string;
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentageUsed: number;
  isOverBudget: boolean;
  projectedSpending?: number; // Based on current spending rate
  daysRemaining: number;
  transactions: Transaction[];
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface BudgetAlert {
  id: string;
  budgetId: string;
  type: 'threshold' | 'exceeded' | 'projected_exceed';
  message: string;
  severity: 'low' | 'medium' | 'high';
  createdAt: string;
  acknowledged: boolean;
}

export interface BudgetInsight {
  type: 'overspending' | 'underspending' | 'trend_change' | 'seasonal_pattern';
  title: string;
  description: string;
  categoryId: string;
  impact: 'positive' | 'negative' | 'neutral';
  actionable: boolean;
  suggestions: string[];
}

export class BudgetIntegrationService {
  private budgets: Budget[] = [];
  private categories: TransactionCategory[] = [];
  private readonly STORAGE_KEY = 'user_budgets';

  constructor(categories: TransactionCategory[]) {
    this.categories = categories;
    this.loadBudgets();
  }

  /**
   * Load budgets from storage
   */
  private async loadBudgets(): Promise<void> {
    try {
      const storedBudgets = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (storedBudgets) {
        this.budgets = JSON.parse(storedBudgets);
      }
    } catch (error) {
      console.error('Failed to load budgets:', error);
    }
  }

  /**
   * Save budgets to storage
   */
  private async saveBudgets(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.budgets));
    } catch (error) {
      console.error('Failed to save budgets:', error);
    }
  }

  /**
   * Create a new budget
   */
  async createBudget(budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>): Promise<Budget> {
    const now = dayjs().toISOString();
    const newBudget: Budget = {
      ...budget,
      id: `budget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };

    this.budgets.push(newBudget);
    await this.saveBudgets();
    return newBudget;
  }

  /**
   * Update existing budget
   */
  async updateBudget(budgetId: string, updates: Partial<Budget>): Promise<Budget | null> {
    const budgetIndex = this.budgets.findIndex(b => b.id === budgetId);
    if (budgetIndex === -1) return null;

    this.budgets[budgetIndex] = {
      ...this.budgets[budgetIndex],
      ...updates,
      updatedAt: dayjs().toISOString(),
    };

    await this.saveBudgets();
    return this.budgets[budgetIndex];
  }

  /**
   * Delete budget
   */
  async deleteBudget(budgetId: string): Promise<boolean> {
    const initialLength = this.budgets.length;
    this.budgets = this.budgets.filter(b => b.id !== budgetId);
    
    if (this.budgets.length < initialLength) {
      await this.saveBudgets();
      return true;
    }
    return false;
  }

  /**
   * Get all budgets
   */
  getBudgets(): Budget[] {
    return this.budgets.filter(budget => budget.isActive);
  }

  /**
   * Calculate budget spending for current period
   */
  calculateBudgetSpending(
    budgets: Budget[],
    categorizationAlgorithm: TransactionCategorizationAlgorithm
  ): BudgetSpending[] {
    const budgetSpending: BudgetSpending[] = [];

    for (const budget of budgets) {
      const { startDate, endDate } = this.getCurrentBudgetPeriod(budget);
      
      // Get spending by category for the period
      const spendingByCategory = categorizationAlgorithm.getSpendingByCategory(startDate, endDate);
      const spentAmount = spendingByCategory[budget.categoryId] || 0;

      // Calculate remaining and percentage
      const remainingAmount = Math.max(0, budget.amount - spentAmount);
      const percentageUsed = budget.amount > 0 ? spentAmount / budget.amount : 0;
      const isOverBudget = spentAmount > budget.amount;

      // Get transactions for this category and period
      const budgetTransactions = this.getBudgetTransactions(
        budget,
        categorizationAlgorithm,
        startDate,
        endDate
      );

      // Calculate projected spending
      const projectedSpending = this.calculateProjectedSpending(
        budgetTransactions,
        startDate,
        endDate,
        budget.period
      );

      // Calculate trend
      const trend = this.calculateSpendingTrend(budgetTransactions);

      // Calculate days remaining in period
      const daysRemaining = dayjs(endDate).diff(dayjs(), 'days');

      budgetSpending.push({
        budgetId: budget.id,
        categoryId: budget.categoryId,
        budgetAmount: budget.amount,
        spentAmount,
        remainingAmount,
        percentageUsed,
        isOverBudget,
        projectedSpending,
        daysRemaining: Math.max(0, daysRemaining),
        transactions: budgetTransactions,
        trend,
      });
    }

    return budgetSpending;
  }

  /**
   * Get current budget period dates
   */
  private getCurrentBudgetPeriod(budget: Budget): { startDate: string; endDate: string } {
    const now = dayjs();
    let startDate: dayjs.Dayjs;
    let endDate: dayjs.Dayjs;

    switch (budget.period) {
      case 'weekly':
        startDate = now.startOf('week');
        endDate = now.endOf('week');
        break;
      case 'monthly':
        startDate = now.startOf('month');
        endDate = now.endOf('month');
        break;
      case 'yearly':
        startDate = now.startOf('year');
        endDate = now.endOf('year');
        break;
    }

    return {
      startDate: startDate.format('YYYY-MM-DD'),
      endDate: endDate.format('YYYY-MM-DD'),
    };
  }

  /**
   * Get transactions for a specific budget period
   */
  private getBudgetTransactions(
    budget: Budget,
    categorizationAlgorithm: TransactionCategorizationAlgorithm,
    startDate: string,
    endDate: string
  ): Transaction[] {
    const relevantTransactions = categorizationAlgorithm.getBudgetRelevantTransactions();
    
    return relevantTransactions.filter(transaction => {
      // Filter by category
      if (transaction.category !== budget.categoryId) return false;
      
      // Filter by date range
      const transactionDate = dayjs(transaction.date);
      if (transactionDate.isBefore(dayjs(startDate)) || transactionDate.isAfter(dayjs(endDate))) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Calculate projected spending based on current rate
   */
  private calculateProjectedSpending(
    transactions: Transaction[],
    startDate: string,
    endDate: string,
    period: Budget['period']
  ): number {
    if (transactions.length === 0) return 0;

    const start = dayjs(startDate);
    const end = dayjs(endDate);
    const now = dayjs();
    
    // Calculate days elapsed and total days in period
    const daysElapsed = Math.max(1, now.diff(start, 'days'));
    const totalDays = end.diff(start, 'days') + 1;
    
    // Calculate total spending so far
    const currentSpending = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    
    // Project spending based on current rate
    const dailyRate = currentSpending / daysElapsed;
    const projectedSpending = dailyRate * totalDays;

    return projectedSpending;
  }

  /**
   * Calculate spending trend
   */
  private calculateSpendingTrend(transactions: Transaction[]): 'increasing' | 'decreasing' | 'stable' {
    if (transactions.length < 4) return 'stable';

    // Sort transactions by date
    const sortedTransactions = transactions.sort((a, b) => 
      dayjs(a.date).valueOf() - dayjs(b.date).valueOf()
    );

    // Split into two halves and compare average spending
    const midPoint = Math.floor(sortedTransactions.length / 2);
    const firstHalf = sortedTransactions.slice(0, midPoint);
    const secondHalf = sortedTransactions.slice(midPoint);

    const firstHalfAverage = firstHalf.reduce((sum, tx) => sum + tx.amount, 0) / firstHalf.length;
    const secondHalfAverage = secondHalf.reduce((sum, tx) => sum + tx.amount, 0) / secondHalf.length;

    const changePercentage = (secondHalfAverage - firstHalfAverage) / firstHalfAverage;

    if (changePercentage > 0.1) return 'increasing';
    if (changePercentage < -0.1) return 'decreasing';
    return 'stable';
  }

  /**
   * Generate budget alerts
   */
  generateBudgetAlerts(budgetSpending: BudgetSpending[]): BudgetAlert[] {
    const alerts: BudgetAlert[] = [];
    const now = dayjs().toISOString();

    for (const spending of budgetSpending) {
      const budget = this.budgets.find(b => b.id === spending.budgetId);
      if (!budget) continue;

      const categoryName = this.getCategoryName(spending.categoryId);

      // Threshold alert
      if (spending.percentageUsed >= budget.alertThreshold && spending.percentageUsed < 1.0) {
        alerts.push({
          id: `alert_${spending.budgetId}_threshold_${Date.now()}`,
          budgetId: spending.budgetId,
          type: 'threshold',
          message: `You've used ${Math.round(spending.percentageUsed * 100)}% of your ${categoryName} budget (£${spending.spentAmount.toFixed(2)} of £${spending.budgetAmount.toFixed(2)})`,
          severity: 'medium',
          createdAt: now,
          acknowledged: false,
        });
      }

      // Budget exceeded alert
      if (spending.isOverBudget) {
        const overAmount = spending.spentAmount - spending.budgetAmount;
        alerts.push({
          id: `alert_${spending.budgetId}_exceeded_${Date.now()}`,
          budgetId: spending.budgetId,
          type: 'exceeded',
          message: `You've exceeded your ${categoryName} budget by £${overAmount.toFixed(2)}`,
          severity: 'high',
          createdAt: now,
          acknowledged: false,
        });
      }

      // Projected to exceed alert
      if (spending.projectedSpending && spending.projectedSpending > spending.budgetAmount && !spending.isOverBudget) {
        const projectedOver = spending.projectedSpending - spending.budgetAmount;
        alerts.push({
          id: `alert_${spending.budgetId}_projected_${Date.now()}`,
          budgetId: spending.budgetId,
          type: 'projected_exceed',
          message: `At your current spending rate, you'll exceed your ${categoryName} budget by £${projectedOver.toFixed(2)}`,
          severity: 'medium',
          createdAt: now,
          acknowledged: false,
        });
      }
    }

    return alerts;
  }

  /**
   * Generate budget insights
   */
  generateBudgetInsights(budgetSpending: BudgetSpending[]): BudgetInsight[] {
    const insights: BudgetInsight[] = [];

    for (const spending of budgetSpending) {
      const categoryName = this.getCategoryName(spending.categoryId);

      // Overspending insight
      if (spending.isOverBudget) {
        const overPercentage = ((spending.spentAmount - spending.budgetAmount) / spending.budgetAmount) * 100;
        insights.push({
          type: 'overspending',
          title: `${categoryName} Overspending`,
          description: `You've exceeded your ${categoryName} budget by ${overPercentage.toFixed(1)}%`,
          categoryId: spending.categoryId,
          impact: 'negative',
          actionable: true,
          suggestions: [
            `Consider increasing your ${categoryName} budget`,
            `Look for ways to reduce ${categoryName} spending`,
            'Review recent transactions for unnecessary purchases',
          ],
        });
      }

      // Underspending insight
      else if (spending.percentageUsed < 0.5 && spending.daysRemaining < 7) {
        insights.push({
          type: 'underspending',
          title: `${categoryName} Underspending`,
          description: `You've only used ${Math.round(spending.percentageUsed * 100)}% of your ${categoryName} budget`,
          categoryId: spending.categoryId,
          impact: 'positive',
          actionable: true,
          suggestions: [
            `Consider reducing your ${categoryName} budget`,
            'Reallocate funds to other categories',
            'Use savings for future months',
          ],
        });
      }

      // Trend change insight
      if (spending.trend === 'increasing' && spending.projectedSpending) {
        const increaseAmount = spending.projectedSpending - spending.budgetAmount;
        if (increaseAmount > spending.budgetAmount * 0.1) {
          insights.push({
            type: 'trend_change',
            title: `Increasing ${categoryName} Spending`,
            description: `Your ${categoryName} spending is trending upward`,
            categoryId: spending.categoryId,
            impact: 'negative',
            actionable: true,
            suggestions: [
              'Monitor recent purchases more closely',
              'Set up spending alerts',
              'Consider finding alternatives to reduce costs',
            ],
          });
        }
      }
    }

    return insights;
  }

  /**
   * Get budget recommendations based on spending patterns
   */
  getBudgetRecommendations(
    budgetSpending: BudgetSpending[],
    categorizationAlgorithm: TransactionCategorizationAlgorithm
  ): { categoryId: string; suggestedAmount: number; reason: string }[] {
    const recommendations: { categoryId: string; suggestedAmount: number; reason: string }[] = [];

    // Get spending data for the last 3 months
    const threeMonthsAgo = dayjs().subtract(3, 'months').format('YYYY-MM-DD');
    const today = dayjs().format('YYYY-MM-DD');
    const historicalSpending = categorizationAlgorithm.getSpendingByCategory(threeMonthsAgo, today);

    // Calculate average monthly spending for each category
    const monthlyAverages: { [categoryId: string]: number } = {};
    for (const [categoryId, totalSpending] of Object.entries(historicalSpending)) {
      monthlyAverages[categoryId] = totalSpending / 3; // 3 months
    }

    // Compare with current budgets and make recommendations
    const budgetsByCategory: { [categoryId: string]: Budget } = {};
    this.budgets.forEach(budget => {
      budgetsByCategory[budget.categoryId] = budget;
    });

    for (const [categoryId, averageSpending] of Object.entries(monthlyAverages)) {
      if (averageSpending < 10) continue; // Skip categories with minimal spending

      const existingBudget = budgetsByCategory[categoryId];
      const categoryName = this.getCategoryName(categoryId);

      if (!existingBudget) {
        // Recommend creating a budget for categories with significant spending
        if (averageSpending > 50) {
          recommendations.push({
            categoryId,
            suggestedAmount: Math.ceil(averageSpending * 1.1), // 10% buffer
            reason: `Based on your average ${categoryName} spending of £${averageSpending.toFixed(2)}/month`,
          });
        }
      } else {
        // Recommend adjusting existing budgets
        const monthlyBudget = this.convertToMonthlyAmount(existingBudget.amount, existingBudget.period);
        const difference = averageSpending - monthlyBudget;
        const percentageDifference = Math.abs(difference) / monthlyBudget;

        if (percentageDifference > 0.2) { // 20% difference
          const suggestedAmount = Math.ceil(averageSpending * 1.05); // 5% buffer
          recommendations.push({
            categoryId,
            suggestedAmount: this.convertFromMonthlyAmount(suggestedAmount, existingBudget.period),
            reason: difference > 0 
              ? `Your average spending (£${averageSpending.toFixed(2)}) is higher than your budget`
              : `Your average spending (£${averageSpending.toFixed(2)}) is lower than your budget`,
          });
        }
      }
    }

    return recommendations;
  }

  /**
   * Convert budget amount to monthly equivalent
   */
  private convertToMonthlyAmount(amount: number, period: Budget['period']): number {
    switch (period) {
      case 'weekly': return amount * 4.33; // Average weeks per month
      case 'monthly': return amount;
      case 'yearly': return amount / 12;
    }
  }

  /**
   * Convert monthly amount to specified period
   */
  private convertFromMonthlyAmount(monthlyAmount: number, period: Budget['period']): number {
    switch (period) {
      case 'weekly': return monthlyAmount / 4.33;
      case 'monthly': return monthlyAmount;
      case 'yearly': return monthlyAmount * 12;
    }
  }

  /**
   * Get category name by ID
   */
  private getCategoryName(categoryId: string): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category?.name || 'Other';
  }

  /**
   * Get total budget vs actual spending summary
   */
  getBudgetSummary(budgetSpending: BudgetSpending[]): {
    totalBudget: number;
    totalSpent: number;
    totalRemaining: number;
    overallPercentageUsed: number;
    categoriesOverBudget: number;
    totalOverspent: number;
  } {
    let totalBudget = 0;
    let totalSpent = 0;
    let categoriesOverBudget = 0;
    let totalOverspent = 0;

    budgetSpending.forEach(spending => {
      totalBudget += spending.budgetAmount;
      totalSpent += spending.spentAmount;
      
      if (spending.isOverBudget) {
        categoriesOverBudget++;
        totalOverspent += spending.spentAmount - spending.budgetAmount;
      }
    });

    return {
      totalBudget,
      totalSpent,
      totalRemaining: Math.max(0, totalBudget - totalSpent),
      overallPercentageUsed: totalBudget > 0 ? totalSpent / totalBudget : 0,
      categoriesOverBudget,
      totalOverspent,
    };
  }
}

export default BudgetIntegrationService;