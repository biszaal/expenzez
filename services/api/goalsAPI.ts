import { api } from '../config/apiClient';
import { GamificationEngine } from '../gamificationEngine';

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
      console.error('❌ [GoalsAPI] Error fetching user goals:', error);

      // Provide fallback data for development
      const fallbackData: GoalsResponse = {
        userId,
        activeGoals: [
          {
            userId,
            goalId: 'emergency-fund-001',
            title: 'Emergency Fund',
            description: '6 months of expenses for financial security',
            type: 'emergency_fund',
            targetAmount: 15000,
            currentAmount: 3750,
            targetDate: new Date(Date.now() + 18 * 30 * 24 * 60 * 60 * 1000).toISOString(),
            priority: 'high',
            category: 'security',
            isActive: true,
            createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString(),
            milestones: [
              {
                milestoneId: 'milestone-001',
                goalId: 'emergency-fund-001',
                title: '25% Complete',
                targetAmount: 3750,
                achievedAt: new Date().toISOString(),
                celebrationShown: false,
                rewardPoints: 100
              },
              {
                milestoneId: 'milestone-002',
                goalId: 'emergency-fund-001',
                title: '50% Complete',
                targetAmount: 7500,
                celebrationShown: false,
                rewardPoints: 150
              }
            ],
            linkedSavingsOpportunityIds: ['subscription_optimization'],
            autoSaveSettings: {
              enabled: true,
              amount: 250,
              frequency: 'monthly',
              roundUpEnabled: true
            }
          },
          {
            userId,
            goalId: 'vacation-001',
            title: 'Summer Vacation',
            description: 'Trip to Italy for 2 weeks',
            type: 'vacation',
            targetAmount: 4500,
            currentAmount: 1200,
            targetDate: new Date(Date.now() + 8 * 30 * 24 * 60 * 60 * 1000).toISOString(),
            priority: 'medium',
            category: 'lifestyle',
            isActive: true,
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString(),
            milestones: [
              {
                milestoneId: 'milestone-003',
                goalId: 'vacation-001',
                title: '25% Complete',
                targetAmount: 1125,
                achievedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                celebrationShown: true,
                rewardPoints: 75
              }
            ],
            linkedSavingsOpportunityIds: ['category_reduction'],
            autoSaveSettings: {
              enabled: true,
              amount: 150,
              frequency: 'weekly',
              roundUpEnabled: false
            }
          }
        ],
        completedGoals: [],
        goalProgress: [
          {
            goalId: 'emergency-fund-001',
            progressPercentage: 25,
            amountRemaining: 11250,
            daysRemaining: 540,
            isOnTrack: true,
            projectedCompletionDate: new Date(Date.now() + 16 * 30 * 24 * 60 * 60 * 1000).toISOString(),
            recommendedMonthlySavings: 625,
            nextMilestone: {
              milestoneId: 'milestone-002',
              goalId: 'emergency-fund-001',
              title: '50% Complete',
              targetAmount: 7500,
              celebrationShown: false,
              rewardPoints: 150
            }
          },
          {
            goalId: 'vacation-001',
            progressPercentage: 27,
            amountRemaining: 3300,
            daysRemaining: 240,
            isOnTrack: true,
            projectedCompletionDate: new Date(Date.now() + 7 * 30 * 24 * 60 * 60 * 1000).toISOString(),
            recommendedMonthlySavings: 550
          }
        ],
        totalSavedTowardsGoals: 4950,
        totalGoalAmount: 19500,
        averageMonthlyProgress: 412,
        recommendations: [], // Will be populated dynamically below
        motivationalMessage: "Great progress! You're 25.4% of the way to achieving your financial goals. Keep up the momentum!",
        lastUpdated: new Date().toISOString()
      };

      // Generate dynamic recommendations based on current goals and user behavior
      const userFinancialData = {
        userId,
        goals: fallbackData.activeGoals.concat(fallbackData.completedGoals),
        goalProgress: fallbackData.goalProgress,
        totalTransactions: 45, // This would come from transaction API in real implementation
        monthsActive: 3, // This would be calculated from user registration
        totalSaved: fallbackData.totalSavedTowardsGoals,
        currentStreaks: {
          savings: 14, // This would come from transaction patterns
          budgetCompliance: 21 // This would come from budget API
        }
      };

      const dynamicRecommendations = GamificationEngine.generateGoalRecommendations(userFinancialData);

      // Convert to the expected format
      fallbackData.recommendations = dynamicRecommendations.map(rec => ({
        type: rec.type,
        title: rec.title,
        description: rec.description,
        suggestedAmount: rec.suggestedAmount,
        suggestedTimeframe: rec.suggestedTimeframe,
        priority: rec.priority,
        reasoning: rec.reasoning,
        basedOnSpending: rec.type === 'debt_payoff' || rec.type === 'emergency_fund',
        basedOnIncome: rec.type === 'retirement' || rec.type === 'major_purchase'
      }));

      console.log('🔄 [GoalsAPI] Generated dynamic goals data with', fallbackData.recommendations.length, 'recommendations');
      return fallbackData;
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

      // Return demo created goal for development
      const demoGoal: FinancialGoal = {
        userId,
        goalId: `goal-${Date.now()}`,
        ...goalData,
        currentAmount: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        milestones: [
          {
            milestoneId: `milestone-${Date.now()}-1`,
            goalId: `goal-${Date.now()}`,
            title: '25% Complete',
            targetAmount: goalData.targetAmount * 0.25,
            celebrationShown: false,
            rewardPoints: 100
          },
          {
            milestoneId: `milestone-${Date.now()}-2`,
            goalId: `goal-${Date.now()}`,
            title: '50% Complete',
            targetAmount: goalData.targetAmount * 0.5,
            celebrationShown: false,
            rewardPoints: 150
          },
          {
            milestoneId: `milestone-${Date.now()}-3`,
            goalId: `goal-${Date.now()}`,
            title: '75% Complete',
            targetAmount: goalData.targetAmount * 0.75,
            celebrationShown: false,
            rewardPoints: 200
          },
          {
            milestoneId: `milestone-${Date.now()}-4`,
            goalId: `goal-${Date.now()}`,
            title: 'Goal Complete!',
            targetAmount: goalData.targetAmount,
            celebrationShown: false,
            rewardPoints: 500
          }
        ],
        linkedSavingsOpportunityIds: []
      };

      return demoGoal;
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

  formatCurrency(amount: number, currency = 'GBP'): string {
    const formatter = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    return formatter.format(amount);
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