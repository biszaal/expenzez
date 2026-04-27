/**
 * Cost of Living Service
 * Analyzes user spending against UK national/regional averages
 * Provides Cost-of-Living Score and category insights
 */

import { Transaction, TransactionService } from './transactionService';
import {
  CostCategory,
  UKRegion,
  CategoryAverage,
  UK_CATEGORY_AVERAGES,
  UK_TOTAL_MONTHLY_AVERAGE,
  CATEGORY_KEYWORDS,
  getScoreThreshold,
  getCategoryAverage,
  UK_REGION_LABELS,
  CostOfLivingScoreThreshold,
} from '../constants/ukAverages';

// Category spending breakdown
export interface CategorySpending {
  category: CostCategory;
  label: string;
  icon: string;
  color: string;
  userSpending: number;
  nationalAverage: number;
  regionalAverage: number;
  percentageOfAverage: number; // 100 = exactly average, >100 = above, <100 = below
  difference: number; // Positive = overspending, negative = saving
  status: 'excellent' | 'good' | 'average' | 'high' | 'very_high';
}

// Overall Cost-of-Living analysis
export interface CostOfLivingAnalysis {
  score: number; // 0-100
  scoreThreshold: CostOfLivingScoreThreshold;
  totalUserSpending: number;
  totalNationalAverage: number;
  totalRegionalAverage: number;
  overallPercentage: number;
  categoryBreakdown: CategorySpending[];
  region: UKRegion;
  period: {
    startDate: Date;
    endDate: Date;
    daysInPeriod: number;
    isPartialMonth: boolean;
  };
  insights: string[];
}

// Monthly trend data point
export interface MonthlyTrend {
  month: string; // YYYY-MM
  label: string; // "Jan 2025"
  score: number;
  totalSpending: number;
  categorySpending: Record<CostCategory, number>;
}

class CostOfLivingService {
  private region: UKRegion = 'national';

  /**
   * Set the user's region for regional comparisons
   */
  setRegion(region: UKRegion): void {
    this.region = region;
  }

  /**
   * Get current region
   */
  getRegion(): UKRegion {
    return this.region;
  }

  /**
   * Get region label for display
   */
  getRegionLabel(): string {
    return UK_REGION_LABELS[this.region];
  }

  /**
   * Match a transaction to a cost-of-living category based on description and category
   */
  matchTransactionToCategory(transaction: Transaction): CostCategory | null {
    const description = (transaction.description || '').toLowerCase();
    const txCategory = (transaction.category || '').toLowerCase();

    // First, check description against keywords (most accurate)
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      for (const keyword of keywords) {
        if (description.includes(keyword.toLowerCase())) {
          return category as CostCategory;
        }
      }
    }

    // Comprehensive category mapping from transaction categories to CoL categories
    const categoryMapping: Record<string, CostCategory> = {
      // Housing mappings
      'housing': 'housing',
      'rent': 'housing',
      'mortgage': 'housing',
      'home': 'housing',
      'property': 'housing',
      'accommodation': 'housing',
      'council tax': 'housing',
      'insurance': 'housing', // Default insurance to housing

      // Energy mappings
      'utilities': 'energy',
      'bills': 'energy',
      'energy': 'energy',
      'electricity': 'energy',
      'gas': 'energy',
      'water': 'energy',
      'power': 'energy',

      // Food mappings
      'groceries': 'food',
      'food': 'food',
      'dining': 'food',
      'restaurants': 'food',
      'food & drink': 'food',
      'food and drink': 'food',
      'supermarket': 'food',
      'eating out': 'food',
      'takeaway': 'food',
      'takeout': 'food',
      'cafe': 'food',
      'coffee': 'food',

      // Transport mappings
      'transport': 'transport',
      'transportation': 'transport',
      'travel': 'transport',
      'fuel': 'transport',
      'petrol': 'transport',
      'diesel': 'transport',
      'car': 'transport',
      'vehicle': 'transport',
      'parking': 'transport',
      'taxi': 'transport',
      'uber': 'transport',
      'public transport': 'transport',
      'train': 'transport',
      'bus': 'transport',
      'tube': 'transport',
      'commute': 'transport',
      'commuting': 'transport',
    };

    // Check transaction category
    if (txCategory && categoryMapping[txCategory]) {
      return categoryMapping[txCategory];
    }

    // Try partial matching on category
    for (const [key, value] of Object.entries(categoryMapping)) {
      if (txCategory.includes(key) || key.includes(txCategory)) {
        return value;
      }
    }

    return null;
  }

  /**
   * Calculate spending by Cost-of-Living category for a set of transactions
   */
  calculateCategorySpending(transactions: Transaction[]): Record<CostCategory, number> {
    const spending: Record<CostCategory, number> = {
      housing: 0,
      energy: 0,
      food: 0,
      transport: 0,
    };

    for (const transaction of transactions) {
      if (transaction.type !== 'debit') continue;

      const category = this.matchTransactionToCategory(transaction);
      if (category) {
        spending[category] += Math.abs(transaction.amount);
      }
    }

    return spending;
  }

  /**
   * Calculate the status based on percentage of average
   */
  private getSpendingStatus(percentageOfAverage: number): CategorySpending['status'] {
    if (percentageOfAverage <= 70) return 'excellent';
    if (percentageOfAverage <= 90) return 'good';
    if (percentageOfAverage <= 110) return 'average';
    if (percentageOfAverage <= 140) return 'high';
    return 'very_high';
  }

  /**
   * Calculate the Cost-of-Living score (0-100)
   * Higher score = better (spending less than average)
   */
  calculateScore(totalUserSpending: number, totalAverage: number): number {
    if (totalAverage === 0) return 50;

    const ratio = totalUserSpending / totalAverage;

    // Score calculation:
    // ratio = 0.5 (50% of average) -> score = 100
    // ratio = 1.0 (100% of average) -> score = 50
    // ratio = 1.5 (150% of average) -> score = 0
    // Linear interpolation between these points

    if (ratio <= 0.5) return 100;
    if (ratio >= 1.5) return 0;

    // Linear mapping from [0.5, 1.5] to [100, 0]
    const score = 100 - ((ratio - 0.5) / 1.0) * 100;
    return Math.round(Math.max(0, Math.min(100, score)));
  }

  /**
   * Generate insights based on the analysis
   */
  private generateInsights(analysis: Omit<CostOfLivingAnalysis, 'insights'>): string[] {
    const insights: string[] = [];

    // Overall spending insight
    if (analysis.overallPercentage < 80) {
      insights.push(`You're spending ${Math.round(100 - analysis.overallPercentage)}% less than the UK average. Great job!`);
    } else if (analysis.overallPercentage > 120) {
      insights.push(`Your spending is ${Math.round(analysis.overallPercentage - 100)}% above the UK average.`);
    }

    // Find biggest overspend
    const overspendCategories = analysis.categoryBreakdown
      .filter(c => c.percentageOfAverage > 110)
      .sort((a, b) => b.percentageOfAverage - a.percentageOfAverage);

    if (overspendCategories.length > 0) {
      const highest = overspendCategories[0];
      insights.push(`${highest.label} is your highest overspend at ${Math.round(highest.percentageOfAverage)}% of average.`);
    }

    // Find best savings
    const savingsCategories = analysis.categoryBreakdown
      .filter(c => c.percentageOfAverage < 90 && c.userSpending > 0)
      .sort((a, b) => a.percentageOfAverage - b.percentageOfAverage);

    if (savingsCategories.length > 0) {
      const best = savingsCategories[0];
      insights.push(`You're saving £${Math.abs(Math.round(best.difference))} on ${best.label} vs UK average.`);
    }

    // Partial month warning
    if (analysis.period.isPartialMonth) {
      insights.push(`Based on ${analysis.period.daysInPeriod} days of data this month.`);
    }

    return insights;
  }

  /**
   * Get full Cost-of-Living analysis for the current month
   */
  async analyzeCurrentMonth(transactions?: Transaction[]): Promise<CostOfLivingAnalysis> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return this.analyze(startOfMonth, endOfMonth, transactions);
  }

  /**
   * Get full Cost-of-Living analysis for a specific period
   */
  async analyze(
    startDate: Date,
    endDate: Date,
    existingTransactions?: Transaction[]
  ): Promise<CostOfLivingAnalysis> {
    // Get transactions for the period
    const transactions = existingTransactions ||
      await TransactionService.getTransactionsByDateRange(startDate, endDate);

    // Filter to debit transactions only
    const debitTransactions = transactions.filter(t => t.type === 'debit');

    // Calculate days in period for pro-rating
    const daysInPeriod = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const daysInMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
    const monthRatio = daysInPeriod / daysInMonth;
    const isPartialMonth = daysInPeriod < daysInMonth;

    // Calculate spending by category
    const categorySpending = this.calculateCategorySpending(debitTransactions);

    // Build category breakdown
    const categoryBreakdown: CategorySpending[] = UK_CATEGORY_AVERAGES.map(avg => {
      const userSpending = categorySpending[avg.category] || 0;
      // Pro-rate averages for partial months
      const nationalAverage = avg.nationalAverage * monthRatio;
      const regionalAverage = avg.regionalAverages[this.region] * monthRatio;

      const percentageOfAverage = nationalAverage > 0
        ? (userSpending / nationalAverage) * 100
        : 0;

      return {
        category: avg.category,
        label: avg.label,
        icon: avg.icon,
        color: avg.color,
        userSpending,
        nationalAverage: Math.round(nationalAverage),
        regionalAverage: Math.round(regionalAverage),
        percentageOfAverage: Math.round(percentageOfAverage),
        difference: userSpending - nationalAverage,
        status: this.getSpendingStatus(percentageOfAverage),
      };
    });

    // Calculate totals
    const totalUserSpending = categoryBreakdown.reduce((sum, c) => sum + c.userSpending, 0);
    const totalNationalAverage = Math.round(UK_TOTAL_MONTHLY_AVERAGE * monthRatio);
    const totalRegionalAverage = Math.round(
      UK_CATEGORY_AVERAGES.reduce((sum, c) => sum + c.regionalAverages[this.region], 0) * monthRatio
    );

    const overallPercentage = totalNationalAverage > 0
      ? Math.round((totalUserSpending / totalNationalAverage) * 100)
      : 0;

    const score = this.calculateScore(totalUserSpending, totalNationalAverage);
    const scoreThreshold = getScoreThreshold(score);

    const analysisWithoutInsights = {
      score,
      scoreThreshold,
      totalUserSpending,
      totalNationalAverage,
      totalRegionalAverage,
      overallPercentage,
      categoryBreakdown,
      region: this.region,
      period: {
        startDate,
        endDate,
        daysInPeriod,
        isPartialMonth,
      },
    };

    return {
      ...analysisWithoutInsights,
      insights: this.generateInsights(analysisWithoutInsights),
    };
  }

  /**
   * Get monthly trend for the last N months
   */
  async getMonthlyTrends(months: number = 6): Promise<MonthlyTrend[]> {
    const trends: MonthlyTrend[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

      // For current month, only go up to today
      const effectiveEnd = i === 0 ? now : endOfMonth;

      const analysis = await this.analyze(startOfMonth, effectiveEnd);

      const categorySpending: Record<CostCategory, number> = {
        housing: 0,
        energy: 0,
        food: 0,
        transport: 0,
      };

      for (const cat of analysis.categoryBreakdown) {
        categorySpending[cat.category] = cat.userSpending;
      }

      trends.push({
        month: `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`,
        label: monthDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
        score: analysis.score,
        totalSpending: analysis.totalUserSpending,
        categorySpending,
      });
    }

    return trends;
  }

  /**
   * Get a quick summary for the home screen widget
   */
  async getWidgetSummary(transactions?: Transaction[]): Promise<{
    score: number;
    scoreLabel: string;
    scoreColor: string;
    totalSpending: number;
    vsAverage: number; // Percentage vs average
    topCategory: CategorySpending | null;
    worstCategory: CategorySpending | null;
  }> {
    const analysis = await this.analyzeCurrentMonth(transactions);

    // Find top spending category
    const sortedBySpending = [...analysis.categoryBreakdown]
      .filter(c => c.userSpending > 0)
      .sort((a, b) => b.userSpending - a.userSpending);

    // Find worst (most over average) category
    const sortedByOverspend = [...analysis.categoryBreakdown]
      .filter(c => c.userSpending > 0)
      .sort((a, b) => b.percentageOfAverage - a.percentageOfAverage);

    return {
      score: analysis.score,
      scoreLabel: analysis.scoreThreshold.label,
      scoreColor: analysis.scoreThreshold.color,
      totalSpending: analysis.totalUserSpending,
      vsAverage: analysis.overallPercentage,
      topCategory: sortedBySpending[0] || null,
      worstCategory: sortedByOverspend[0]?.percentageOfAverage > 100
        ? sortedByOverspend[0]
        : null,
    };
  }
}

// Export singleton instance
export const costOfLivingService = new CostOfLivingService();

// Export class for testing
export { CostOfLivingService };
