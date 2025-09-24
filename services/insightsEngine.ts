import { Expense } from '../types/expense';

export interface SpendingInsight {
  id: string;
  type: 'spending_trend' | 'budget_alert' | 'savings_opportunity';
  title: string;
  description: string;
  advisorNote?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  category?: string;
  amount?: number;
  percentage?: number;
  actionType?: 'create_budget' | 'review_category' | 'view_details';
  actionText?: string;
  isDismissed?: boolean;
}

export interface SpendingNudge {
  id: string;
  type: 'daily_limit' | 'budget_warning' | 'weekly_summary' | 'saving_tip' | 'category_review' | 'financial_milestone' | 'spending_streak' | 'goal_reminder';
  message: string;
  priority: 'warning' | 'success' | 'celebration' | 'info';
  category?: string;
  createdAt: string;
}

export interface CategoryInsights {
  category: string;
  totalSpent: number;
  frequency: number;
  averageTransaction: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  trendPercentage: number;
  topMerchants: Array<{ name: string; amount: number }>;
  unusualTransactions: Array<{ id: string; amount: number; description: string }>;
  // Legacy properties for backward compatibility
  transactionCount: number;
  averageAmount: number;
  insights: SpendingInsight[];
}

export interface MonthlySpendingTrend {
  month: string;
  totalSpent: number;
  comparedToPrevious: number;
  weeklyAverage: number;
  categoryBreakdown: Record<string, number>;
  // Legacy properties for backward compatibility
  amount: number;
  change: number;
}

export class InsightsEngine {
  static async generateInsights(expenses: Expense[]): Promise<SpendingInsight[]> {
    try {
      const insights: SpendingInsight[] = [];

      // Basic spending analysis
      if (expenses.length > 0) {
        const totalSpent = expenses.reduce((sum, exp) => sum + Math.abs(exp.amount), 0);
        const avgPerTransaction = totalSpent / expenses.length;

        insights.push({
          id: `spending_analysis_${Date.now()}`,
          type: 'spending_trend',
          title: 'Spending Summary',
          description: `You've made ${expenses.length} transactions totaling £${totalSpent.toFixed(2)}. Average per transaction: £${avgPerTransaction.toFixed(2)}.`,
          advisorNote: 'Track your spending regularly to maintain good financial habits.',
          priority: 'medium',
          createdAt: new Date().toISOString(),
          category: 'spending'
        });
      }

      return insights;
    } catch (error) {
      console.error('Error generating insights:', error);
      return [];
    }
  }

  static async storeInsights(insights: SpendingInsight[]): Promise<void> {
    // Basic storage - in a real implementation this would use AsyncStorage or API
    console.log('Insights stored:', insights.length);
  }

  static async getStoredInsights(): Promise<SpendingInsight[]> {
    // Basic retrieval - in a real implementation this would fetch from storage
    return [];
  }

  static async generateDailyNudges(): Promise<SpendingNudge[]> {
    try {
      const nudges: SpendingNudge[] = [];

      // Generate a basic daily nudge
      nudges.push({
        id: `nudge_${Date.now()}`,
        type: 'daily_limit',
        message: 'Consider setting a daily spending limit to stay on track with your budget.',
        priority: 'info',
        createdAt: new Date().toISOString(),
      });

      return nudges;
    } catch (error) {
      console.error('Error generating nudges:', error);
      return [];
    }
  }

  static async markInsightAsRead(insightId: string): Promise<void> {
    console.log('Marking insight as read:', insightId);
  }

  static async dismissInsight(insightId: string): Promise<void> {
    console.log('Dismissing insight:', insightId);
  }

  static async getCategoryInsights(category: string): Promise<CategoryInsights | null> {
    try {
      // In a real implementation, this would fetch data from API/storage
      // For now, return mock data for categories that would have transactions

      const mockCategories = ['food', 'transport', 'shopping', 'entertainment', 'bills'];
      if (!mockCategories.includes(category)) {
        return null;
      }

      // Generate mock data based on category
      const mockData: CategoryInsights = {
        category,
        totalSpent: Math.random() * 500 + 100, // Random amount between 100-600
        frequency: Math.floor(Math.random() * 20) + 5, // 5-25 transactions
        averageTransaction: 0, // Will be calculated
        trend: Math.random() > 0.5 ? 'increasing' : 'decreasing',
        trendPercentage: Math.random() * 30 + 5, // 5-35% trend
        topMerchants: [
          { name: `Top ${category} merchant`, amount: Math.random() * 100 + 50 },
          { name: `Second ${category} merchant`, amount: Math.random() * 80 + 30 }
        ],
        unusualTransactions: Math.random() > 0.7 ? [
          {
            id: `unusual_${Date.now()}`,
            amount: Math.random() * 200 + 100,
            description: `Unusual ${category} transaction`
          }
        ] : [],
        // Legacy properties
        transactionCount: 0,
        averageAmount: 0,
        insights: []
      };

      // Calculate derived values
      mockData.averageTransaction = mockData.totalSpent / mockData.frequency;
      mockData.transactionCount = mockData.frequency;
      mockData.averageAmount = mockData.averageTransaction;

      return mockData;
    } catch (error) {
      console.error('Error getting category insights:', error);
      return null;
    }
  }

  static async getSpendingTrend(months: 3 | 6 | 12): Promise<MonthlySpendingTrend[]> {
    try {
      // In a real implementation, this would fetch data from API/storage
      // For now, generate mock data for the requested number of months

      const trends: MonthlySpendingTrend[] = [];
      const currentDate = new Date();

      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        // Generate mock spending data
        const baseAmount = Math.random() * 800 + 400; // 400-1200 range
        const categoryBreakdown = {
          food: Math.random() * 200 + 100,
          transport: Math.random() * 150 + 50,
          shopping: Math.random() * 300 + 100,
          bills: Math.random() * 400 + 200,
          entertainment: Math.random() * 150 + 50,
        };

        const totalSpent = Object.values(categoryBreakdown).reduce((sum, amount) => sum + amount, 0);
        const weeklyAverage = totalSpent / 4.33; // Average weeks per month

        // Calculate change compared to previous month
        let comparedToPrevious = 0;
        if (trends.length > 0) {
          const previousAmount = trends[trends.length - 1].totalSpent;
          comparedToPrevious = ((totalSpent - previousAmount) / previousAmount) * 100;
        }

        trends.push({
          month: monthStr,
          totalSpent,
          comparedToPrevious,
          weeklyAverage,
          categoryBreakdown,
          // Legacy properties
          amount: totalSpent,
          change: comparedToPrevious,
        });
      }

      return trends;
    } catch (error) {
      console.error('Error getting spending trend:', error);
      return [];
    }
  }

  private static analyzeTrends(expenses: Expense[]): SpendingInsight[] {
    // Basic trend analysis
    return [];
  }

  private static generateBudgetAlerts(expenses: Expense[]): SpendingInsight[] {
    // Basic budget alert generation
    return [];
  }

  private static generateSavingsOpportunities(expenses: Expense[]): SpendingInsight[] {
    // Basic savings opportunity detection
    return [];
  }

  private static generateWealthBuildingAdvice(expenses: Expense[]): SpendingInsight[] {
    // Basic wealth building advice
    return [];
  }
}

// Export a singleton instance for convenience
export const insightsEngine = InsightsEngine;