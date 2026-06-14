import { api } from '../config/apiClient';
import { formatCurrency as formatCurrencyUtil } from '../../utils/formatters';

export interface FinancialGoal {
  userId: string;
  goalId: string;
  title: string;
  description: string;
  type: 'emergency_fund' | 'vacation' | 'debt_payoff' | 'major_purchase' | 'retirement' | 'custom';
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  milestones: GoalMilestone[];
  linkedSavingsOpportunityIds: string[];
  autoSaveSettings?: {
    enabled: boolean;
    amount: number;
    frequency: 'weekly' | 'monthly' | 'per_transaction';
    roundUpEnabled: boolean;
  };
}

export interface GoalMilestone {
  milestoneId: string;
  goalId: string;
  title: string;
  targetAmount: number;
  achievedAt?: string;
  celebrationShown: boolean;
  rewardPoints: number;
}

export interface GoalProgress {
  goalId: string;
  progressPercentage: number;
  amountRemaining: number;
  daysRemaining: number;
  isOnTrack: boolean;
  projectedCompletionDate: string;
  recommendedMonthlySavings: number;
  nextMilestone?: GoalMilestone;
}

export interface GoalRecommendation {
  type: 'emergency_fund' | 'vacation' | 'debt_payoff' | 'major_purchase' | 'retirement' | 'custom';
  title: string;
  description: string;
  suggestedAmount: number;
  suggestedTimeframe: number; // months
  priority: 'high' | 'medium' | 'low';
  reasoning: string;
  basedOnSpending: boolean;
  basedOnIncome: boolean;
}

export interface GoalsResponse {
  userId: string;
  activeGoals: FinancialGoal[];
  completedGoals: FinancialGoal[];
  goalProgress: GoalProgress[];
  totalSavedTowardsGoals: number;
  totalGoalAmount: number;
  averageMonthlyProgress: number;
  recommendations: GoalRecommendation[];
  motivationalMessage: string;
  lastUpdated: string;
}

export interface CreateGoalRequest {
  title: string;
  description: string;
  type: FinancialGoal['type'];
  targetAmount: number;
  targetDate: string;
  priority: FinancialGoal['priority'];
  category: string;
  autoSaveSettings?: FinancialGoal['autoSaveSettings'];
}

export interface UpdateGoalRequest extends Partial<CreateGoalRequest> {
  currentAmount?: number;
  isActive?: boolean;
}

export const goalsAPI = {
  async getUserGoals(userId: string): Promise<GoalsResponse> {
    try {
      console.log(`🎯 [GoalsAPI] Fetching goals for user: ${userId}`);

      const response = await api.get(`/goals`);

      console.log(`✅ [GoalsAPI] Successfully fetched goals:`, {
        activeGoals: response.data.activeGoals?.length,
        completedGoals: response.data.completedGoals?.length,
        totalSaved: response.data.totalSavedTowardsGoals
      });

      return response.data;
    } catch (error: any) {
      // Handle 404 as optional endpoint - log as info instead of error
      if (error?.statusCode === 404 || error?.response?.status === 404) {
        console.log('🔄 [GoalsAPI] Goals endpoint not available (404), using fallback data');
      } else {
        console.error('❌ [GoalsAPI] Error fetching user goals:', error);
      }

      // Production app: never fabricate goals. Return an empty, valid response
      // so the screen shows a real empty state instead of demo data.
      return {
        userId,
        activeGoals: [],
        completedGoals: [],
        goalProgress: [],
        totalSavedTowardsGoals: 0,
        totalGoalAmount: 0,
        averageMonthlyProgress: 0,
        recommendations: [],
        motivationalMessage:
          "Set your first goal to start tracking your savings.",
        lastUpdated: new Date().toISOString(),
      };
    }
  },

  async createGoal(userId: string, goalData: CreateGoalRequest): Promise<FinancialGoal> {
    try {
      console.log(`🎯 [GoalsAPI] Creating new goal for user: ${userId}`, goalData);

      const response = await api.post(`/goals/${userId}`, goalData);

      console.log(`✅ [GoalsAPI] Successfully created goal:`, {
        goalId: response.data.goalId,
        title: response.data.title,
        targetAmount: response.data.targetAmount
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ [GoalsAPI] Error creating goal:', error);
      throw error;
    }
  },

  async updateGoal(userId: string, goalId: string, updates: UpdateGoalRequest): Promise<FinancialGoal> {
    try {
      console.log(`🎯 [GoalsAPI] Updating goal ${goalId} for user: ${userId}`, updates);

      const response = await api.put(`/goals/${userId}/${goalId}`, updates);

      console.log(`✅ [GoalsAPI] Successfully updated goal:`, {
        goalId: response.data.goalId,
        updatedFields: Object.keys(updates)
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ [GoalsAPI] Error updating goal:', error);
      throw error;
    }
  },

  async deleteGoal(userId: string, goalId: string): Promise<void> {
    try {
      console.log(`🎯 [GoalsAPI] Deleting goal ${goalId} for user: ${userId}`);

      await api.delete(`/goals/${userId}/${goalId}`);

      console.log(`✅ [GoalsAPI] Successfully deleted goal: ${goalId}`);
    } catch (error: any) {
      console.error('❌ [GoalsAPI] Error deleting goal:', error);
      throw error;
    }
  },

  async addContributionToGoal(userId: string, goalId: string, amount: number, source: string): Promise<GoalProgress> {
    try {
      console.log(`🎯 [GoalsAPI] Adding contribution to goal ${goalId}:`, { amount, source });

      const response = await api.post(`/goals/${userId}/${goalId}/contributions`, {
        amount,
        source,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ [GoalsAPI] Successfully added contribution`);
      return response.data;
    } catch (error: any) {
      console.error('❌ [GoalsAPI] Error adding contribution:', error);
      throw error;
    }
  },

  // Utility functions
  getGoalTypeIcon(type: FinancialGoal['type']): string {
    switch (type) {
      case 'emergency_fund':
        return 'shield-checkmark-outline';
      case 'vacation':
        return 'airplane-outline';
      case 'debt_payoff':
        return 'card-outline';
      case 'major_purchase':
        return 'home-outline';
      case 'retirement':
        return 'trending-up-outline';
      case 'custom':
        return 'flag-outline';
      default:
        return 'target-outline';
    }
  },

  getGoalTypeColor(type: FinancialGoal['type']): string {
    switch (type) {
      case 'emergency_fund':
        return '#10B981'; // Green
      case 'vacation':
        return '#3B82F6'; // Blue
      case 'debt_payoff':
        return '#EF4444'; // Red
      case 'major_purchase':
        return '#F59E0B'; // Amber
      case 'retirement':
        return '#8B5CF6'; // Purple
      case 'custom':
        return '#6B7280'; // Gray
      default:
        return '#6B7280';
    }
  },

  getPriorityColor(priority: FinancialGoal['priority']): string {
    switch (priority) {
      case 'high':
        return '#EF4444'; // Red
      case 'medium':
        return '#F59E0B'; // Amber
      case 'low':
        return '#10B981'; // Green
      default:
        return '#6B7280'; // Gray
    }
  },

  formatCurrency(amount: number, currency?: string): string {
    return formatCurrencyUtil(amount, currency, undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  },

  formatTimeRemaining(daysRemaining: number): string {
    if (daysRemaining < 30) {
      return `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`;
    } else if (daysRemaining < 365) {
      const months = Math.round(daysRemaining / 30);
      return `${months} month${months !== 1 ? 's' : ''}`;
    } else {
      const years = Math.round(daysRemaining / 365 * 10) / 10;
      return `${years} year${years !== 1 ? 's' : ''}`;
    }
  },

  calculateGoalProgress(goal: FinancialGoal): GoalProgress {
    const progressPercentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
    const amountRemaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
    const targetDate = new Date(goal.targetDate);
    const now = new Date();
    const daysRemaining = Math.max(Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)), 0);

    const recommendedMonthlySavings = daysRemaining > 0
      ? Math.ceil(amountRemaining / (daysRemaining / 30))
      : 0;

    const isOnTrack = progressPercentage >= ((Date.now() - new Date(goal.createdAt).getTime()) / (targetDate.getTime() - new Date(goal.createdAt).getTime())) * 100;

    const nextMilestone = goal.milestones.find(m => !m.achievedAt && goal.currentAmount < m.targetAmount);

    return {
      goalId: goal.goalId,
      progressPercentage: Math.round(progressPercentage),
      amountRemaining,
      daysRemaining,
      isOnTrack,
      projectedCompletionDate: goal.targetDate,
      recommendedMonthlySavings,
      nextMilestone
    };
  }
};