import { api } from '../config/apiClient';

export interface SavingsOpportunity {
  type: 'subscription_optimization' | 'category_reduction' | 'goal_acceleration' | 'emergency_fund' | 'habit_change';
  title: string;
  description: string;
  potentialMonthlySavings: number;
  potentialYearlySavings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  urgency: 'low' | 'medium' | 'high';
  goalImpact?: {
    goalId: string;
    goalTitle: string;
    monthsReduced: number;
    acceleratedCompletion: string;
  };
  actionSteps: string[];
  confidence: number;
}

export interface SavingsInsightsResponse {
  userId: string;
  totalPotentialMonthlySavings: number;
  totalPotentialYearlySavings: number;
  opportunities: SavingsOpportunity[];
  topRecommendation: SavingsOpportunity | null;
  personalizedMessage: string;
  lastUpdated: string;
}

export const savingsInsightsAPI = {
  async getSavingsOpportunities(userId: string): Promise<SavingsInsightsResponse> {
    try {
      console.log(`💰 [SavingsInsightsAPI] Fetching savings opportunities for user: ${userId}`);

      const response = await api.get(`/insights/savings-opportunities`);

      console.log(`✅ [SavingsInsightsAPI] Successfully fetched savings insights:`, {
        opportunityCount: response.data.opportunities?.length,
        totalMonthlySavings: response.data.totalPotentialMonthlySavings,
        hasTopRecommendation: !!response.data.topRecommendation
      });

      return response.data;
    } catch (error: any) {
      // 404 is expected - this feature is optional and not yet deployed
      if (error.response?.status === 404 || error.statusCode === 404) {
        console.log('🔄 [SavingsInsightsAPI] Savings insights endpoint not available (404), using fallback data');
      } else {
        // Only log non-404 errors as actual errors
        console.error('❌ [SavingsInsightsAPI] Error fetching savings opportunities:', error);
      }

      // Provide fallback data for development
      const fallbackData: SavingsInsightsResponse = {
        userId,
        totalPotentialMonthlySavings: 0,
        totalPotentialYearlySavings: 0,
        opportunities: [],
        topRecommendation: null,
        personalizedMessage: "Start tracking your expenses to discover savings opportunities!",
        lastUpdated: new Date().toISOString()
      };

      return fallbackData;
    }
  },

  getOpportunityTypeIcon(type: SavingsOpportunity['type']): string {
    switch (type) {
      case 'subscription_optimization':
        return 'refresh-outline';
      case 'category_reduction':
        return 'trending-down-outline';
      case 'goal_acceleration':
        return 'rocket-outline';
      case 'emergency_fund':
        return 'shield-outline';
      case 'habit_change':
        return 'bulb-outline';
      default:
        return 'cash-outline';
    }
  },

  getOpportunityTypeColor(type: SavingsOpportunity['type']): string {
    switch (type) {
      case 'subscription_optimization':
        return '#3B82F6'; // Blue
      case 'category_reduction':
        return '#EF4444'; // Red
      case 'goal_acceleration':
        return '#10B981'; // Green
      case 'emergency_fund':
        return '#F59E0B'; // Amber
      case 'habit_change':
        return '#8B5CF6'; // Purple
      default:
        return '#6B7280'; // Gray
    }
  },

  getDifficultyColor(difficulty: SavingsOpportunity['difficulty']): string {
    switch (difficulty) {
      case 'easy':
        return '#10B981'; // Green
      case 'medium':
        return '#F59E0B'; // Amber
      case 'hard':
        return '#EF4444'; // Red
      default:
        return '#6B7280'; // Gray
    }
  },

  getUrgencyColor(urgency: SavingsOpportunity['urgency']): string {
    switch (urgency) {
      case 'low':
        return '#6B7280'; // Gray
      case 'medium':
        return '#F59E0B'; // Amber
      case 'high':
        return '#EF4444'; // Red
      default:
        return '#6B7280'; // Gray
    }
  },

  formatSavingsAmount(amount: number, currency = 'GBP'): string {
    const formatter = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    return formatter.format(amount);
  },

  getConfidenceLevel(confidence: number): string {
    if (confidence >= 0.8) {
      return 'High';
    } else if (confidence >= 0.6) {
      return 'Medium';
    } else {
      return 'Low';
    }
  },

  getConfidenceColor(confidence: number): string {
    if (confidence >= 0.8) {
      return '#10B981'; // Green
    } else if (confidence >= 0.6) {
      return '#F59E0B'; // Amber
    } else {
      return '#EF4444'; // Red
    }
  },

  formatGoalAcceleration(monthsReduced: number): string {
    if (monthsReduced < 1) {
      const weeks = Math.round(monthsReduced * 4);
      return `${weeks} week${weeks !== 1 ? 's' : ''}`;
    } else if (monthsReduced < 12) {
      return `${Math.round(monthsReduced)} month${Math.round(monthsReduced) !== 1 ? 's' : ''}`;
    } else {
      const years = Math.round(monthsReduced / 12 * 10) / 10;
      return `${years} year${years !== 1 ? 's' : ''}`;
    }
  },

  sortOpportunitiesByPriority(opportunities: SavingsOpportunity[]): SavingsOpportunity[] {
    return opportunities.sort((a, b) => {
      // First sort by urgency (high > medium > low)
      const urgencyOrder = { high: 3, medium: 2, low: 1 };
      const urgencyDiff = urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
      if (urgencyDiff !== 0) return urgencyDiff;

      // Then by potential monthly savings (higher is better)
      const savingsDiff = b.potentialMonthlySavings - a.potentialMonthlySavings;
      if (savingsDiff !== 0) return savingsDiff;

      // Then by confidence (higher is better)
      const confidenceDiff = b.confidence - a.confidence;
      if (confidenceDiff !== 0) return confidenceDiff;

      // Finally by difficulty (easier is better)
      const difficultyOrder = { easy: 3, medium: 2, hard: 1 };
      return difficultyOrder[b.difficulty] - difficultyOrder[a.difficulty];
    });
  }
};