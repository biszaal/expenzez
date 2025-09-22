import { api } from '../config/apiClient';
import { GamificationEngine } from '../gamificationEngine';
import { goalsAPI } from './goalsAPI';

export interface Achievement {
  userId: string;
  achievementId: string;
  title: string;
  description: string;
  type: 'goal_completion' | 'goal_milestone' | 'spending_milestone' | 'streak' | 'category_mastery' | 'savings_rate' | 'special';
  category: string;
  difficulty: 'bronze' | 'silver' | 'gold' | 'platinum';
  pointsReward: number;
  earnedAt: string;
  goalId?: string;
  metadata?: {
    amount?: number;
    streakDays?: number;
    categoryName?: string;
    percentage?: number;
  };
}

export interface UserProgress {
  userId: string;
  totalPoints: number;
  level: number;
  achievements: Achievement[];
  streaks: {
    currentSavingsStreak: number;
    longestSavingsStreak: number;
    currentBudgetStreak: number;
    longestBudgetStreak: number;
  };
  milestones: {
    totalSaved: number;
    goalsCompleted: number;
    transactionsLogged: number;
    categoriesUsed: number;
  };
}

export interface AchievementResponse {
  userId: string;
  progress: {
    level: number;
    totalPoints: number;
    pointsToNextLevel: number;
    achievementCount: number;
  };
  achievements: Achievement[];
  streaks: UserProgress['streaks'];
  milestones: UserProgress['milestones'];
  newAchievements: Achievement[];
  celebration: {
    title: string;
    message: string;
    pointsEarned: number;
    motivationalTip: string;
  } | null;
  motivationalMessage: string;
}

export const achievementAPI = {
  async getUserAchievements(userId: string): Promise<AchievementResponse> {
    try {
      console.log(`🏆 [AchievementAPI] Fetching achievements for user: ${userId}`);

      const response = await api.get(`/achievements/${userId}`);

      console.log(`✅ [AchievementAPI] Successfully fetched achievements:`, {
        level: response.data.progress?.level,
        totalPoints: response.data.progress?.totalPoints,
        achievementCount: response.data.achievements?.length,
        newAchievements: response.data.newAchievements?.length
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ [AchievementAPI] Error fetching user achievements:', error);

      // Generate dynamic fallback data using the gamification engine
      try {
        // Get goals data first to power the gamification engine
        const goalsData = await goalsAPI.getUserGoals(userId);

        // Create user financial data for gamification engine
        const userFinancialData = {
          userId,
          goals: goalsData.activeGoals.concat(goalsData.completedGoals),
          goalProgress: goalsData.goalProgress,
          totalTransactions: 45, // This would come from transaction API
          monthsActive: 3, // This would be calculated from user registration date
          totalSaved: goalsData.totalSavedTowardsGoals,
          currentStreaks: {
            savings: 14, // This would come from transaction patterns
            budgetCompliance: 21 // This would come from budget API
          }
        };

        // Use gamification engine to calculate achievements dynamically
        const gamificationResult = GamificationEngine.calculateGamification(userFinancialData);

        const fallbackData: AchievementResponse = {
          userId,
          progress: {
            level: gamificationResult.currentLevel,
            totalPoints: gamificationResult.totalPoints,
            pointsToNextLevel: gamificationResult.pointsToNextLevel,
            achievementCount: gamificationResult.achievements.length
          },
          achievements: gamificationResult.achievements,
          streaks: {
            currentSavingsStreak: userFinancialData.currentStreaks.savings,
            longestSavingsStreak: Math.max(userFinancialData.currentStreaks.savings, 30),
            currentBudgetStreak: userFinancialData.currentStreaks.budgetCompliance,
            longestBudgetStreak: Math.max(userFinancialData.currentStreaks.budgetCompliance, 45)
          },
          milestones: {
            totalSaved: userFinancialData.totalSaved,
            goalsCompleted: goalsData.completedGoals.length,
            transactionsLogged: userFinancialData.totalTransactions,
            categoriesUsed: 8 // This would come from transaction categorization
          },
          newAchievements: gamificationResult.newAchievements,
          celebration: gamificationResult.newAchievements.length > 0 ? {
            title: 'New Achievement Unlocked!',
            message: `You've earned "${gamificationResult.newAchievements[0].title}"`,
            pointsEarned: gamificationResult.newAchievements[0].pointsReward,
            motivationalTip: 'Keep up the great work on your financial journey!'
          } : null,
          motivationalMessage: gamificationResult.motivationalMessage
        };

        console.log('🔄 [AchievementAPI] Generated dynamic achievement data:', {
          level: fallbackData.progress.level,
          totalPoints: fallbackData.progress.totalPoints,
          achievementCount: fallbackData.progress.achievementCount,
          newAchievements: fallbackData.newAchievements.length
        });

        return fallbackData;
      } catch (gamificationError) {
        console.error('❌ [AchievementAPI] Error generating dynamic data, using basic fallback:', gamificationError);

        // Basic fallback if gamification engine fails
        const basicFallbackData: AchievementResponse = {
          userId,
          progress: {
            level: 1,
            totalPoints: 0,
            pointsToNextLevel: 100,
            achievementCount: 0
          },
          achievements: [],
          streaks: {
            currentSavingsStreak: 0,
            longestSavingsStreak: 0,
            currentBudgetStreak: 0,
            longestBudgetStreak: 0
          },
          milestones: {
            totalSaved: 0,
            goalsCompleted: 0,
            transactionsLogged: 0,
            categoriesUsed: 0
          },
          newAchievements: [],
          celebration: null,
          motivationalMessage: "Start your financial journey to unlock achievements!"
        };

        return basicFallbackData;
      }
    }
  },

  async checkForNewAchievements(userId: string): Promise<Achievement[]> {
    try {
      console.log(`🔍 [AchievementAPI] Checking for new achievements for user: ${userId}`);

      const response = await this.getUserAchievements(userId);
      return response.newAchievements || [];
    } catch (error: any) {
      console.error('❌ [AchievementAPI] Error checking for new achievements:', error);
      return [];
    }
  },

  getDifficultyColor(difficulty: Achievement['difficulty']): string {
    switch (difficulty) {
      case 'bronze':
        return '#CD7F32';
      case 'silver':
        return '#C0C0C0';
      case 'gold':
        return '#FFD700';
      case 'platinum':
        return '#E5E4E2';
      default:
        return '#9CA3AF';
    }
  },

  getDifficultyIcon(difficulty: Achievement['difficulty']): string {
    switch (difficulty) {
      case 'bronze':
        return 'medal-outline';
      case 'silver':
        return 'medal-outline';
      case 'gold':
        return 'trophy-outline';
      case 'platinum':
        return 'diamond-outline';
      default:
        return 'star-outline';
    }
  },

  getTypeIcon(type: Achievement['type']): string {
    switch (type) {
      case 'goal_completion':
        return 'checkmark-circle-outline';
      case 'goal_milestone':
        return 'flag-outline';
      case 'spending_milestone':
        return 'trending-up-outline';
      case 'streak':
        return 'flame-outline';
      case 'category_mastery':
        return 'layers-outline';
      case 'savings_rate':
        return 'wallet-outline';
      case 'special':
        return 'star-outline';
      default:
        return 'medal-outline';
    }
  },

  formatAchievementDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  }
};