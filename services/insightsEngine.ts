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
  transactionCount: number;
  averageAmount: number;
  trend: 'up' | 'down' | 'stable';
  insights: SpendingInsight[];
}

export interface MonthlySpendingTrend {
  month: string;
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