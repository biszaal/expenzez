import { FinancialGoal, GoalProgress } from './api/goalsAPI';
import { Achievement } from './api/achievementAPI';

interface UserFinancialData {
  userId: string;
  goals: FinancialGoal[];
  goalProgress: GoalProgress[];
  totalTransactions: number;
  monthsActive: number;
  totalSaved: number;
  currentStreaks: {
    savings: number;
    budgetCompliance: number;
  };
}

interface GamificationResult {
  currentLevel: number;
  totalPoints: number;
  pointsToNextLevel: number;
  achievements: Achievement[];
  newAchievements: Achievement[];
  motivationalMessage: string;
}

export class GamificationEngine {
  // Level system configuration
  private static readonly POINTS_PER_LEVEL = 100;
  private static readonly MAX_LEVEL = 50;

  // Achievement templates
  private static readonly ACHIEVEMENT_TEMPLATES = {
    goalMilestones: [
      { percentage: 25, title: 'Quarter Way There!', points: 50, difficulty: 'bronze' as const },
      { percentage: 50, title: 'Halfway Hero', points: 100, difficulty: 'silver' as const },
      { percentage: 75, title: 'Almost There!', points: 150, difficulty: 'gold' as const },
      { percentage: 100, title: 'Goal Achieved!', points: 250, difficulty: 'platinum' as const }
    ],
    goalCreation: [
      { count: 1, title: 'Goal Setter', description: 'Created your first financial goal', points: 25, difficulty: 'bronze' as const },
      { count: 3, title: 'Goal Planner', description: 'Created 3 financial goals', points: 75, difficulty: 'silver' as const },
      { count: 5, title: 'Goal Master', description: 'Created 5 financial goals', points: 125, difficulty: 'gold' as const }
    ],
    savingsStreaks: [
      { days: 7, title: 'Week Saver', description: 'Saved money for 7 consecutive days', points: 50, difficulty: 'bronze' as const },
      { days: 30, title: 'Monthly Saver', description: 'Saved money for 30 consecutive days', points: 100, difficulty: 'silver' as const },
      { days: 90, title: 'Seasonal Saver', description: 'Saved money for 3 months straight', points: 200, difficulty: 'gold' as const },
      { days: 365, title: 'Year-Long Saver', description: 'Saved money every day for a year', points: 500, difficulty: 'platinum' as const }
    ],
    totalSavings: [
      { amount: 100, title: 'First £100', description: 'Saved your first £100', points: 30, difficulty: 'bronze' as const },
      { amount: 500, title: 'Half Grand', description: 'Saved £500 total', points: 75, difficulty: 'silver' as const },
      { amount: 1000, title: 'Four Figures', description: 'Saved £1,000 total', points: 150, difficulty: 'gold' as const },
      { amount: 5000, title: 'Five Grand Master', description: 'Saved £5,000 total', points: 300, difficulty: 'platinum' as const }
    ]
  };

  static calculateGamification(userData: UserFinancialData, existingAchievements: Achievement[] = []): GamificationResult {
    const achievements: Achievement[] = [...existingAchievements];
    const newAchievements: Achievement[] = [];

    // Calculate goal milestone achievements
    for (const goal of userData.goals) {
      const progress = userData.goalProgress.find(p => p.goalId === goal.goalId);
      if (!progress) continue;

      for (const template of this.ACHIEVEMENT_TEMPLATES.goalMilestones) {
        if (progress.progressPercentage >= template.percentage) {
          const achievementId = `goal-${goal.goalId}-${template.percentage}`;

          // Check if this achievement already exists
          if (!achievements.find(a => a.achievementId === achievementId)) {
            const achievement: Achievement = {
              userId: userData.userId,
              achievementId,
              title: template.title,
              description: `Reached ${template.percentage}% of your ${goal.title} goal`,
              type: template.percentage === 100 ? 'goal_completion' : 'goal_milestone',
              category: 'goals',
              difficulty: template.difficulty,
              pointsReward: template.points,
              earnedAt: new Date().toISOString(),
              goalId: goal.goalId,
              metadata: {
                percentage: template.percentage,
                amount: goal.currentAmount
              }
            };

            achievements.push(achievement);
            newAchievements.push(achievement);
          }
        }
      }
    }

    // Calculate goal creation achievements
    const activeGoalCount = userData.goals.filter(g => g.isActive).length;
    for (const template of this.ACHIEVEMENT_TEMPLATES.goalCreation) {
      if (activeGoalCount >= template.count) {
        const achievementId = `goals-created-${template.count}`;

        if (!achievements.find(a => a.achievementId === achievementId)) {
          const achievement: Achievement = {
            userId: userData.userId,
            achievementId,
            title: template.title,
            description: template.description,
            type: 'goal_completion',
            category: 'goals',
            difficulty: template.difficulty,
            pointsReward: template.points,
            earnedAt: new Date().toISOString(),
            metadata: {
              amount: activeGoalCount
            }
          };

          achievements.push(achievement);
          newAchievements.push(achievement);
        }
      }
    }

    // Calculate savings streak achievements
    const currentSavingsStreak = userData.currentStreaks.savings;
    for (const template of this.ACHIEVEMENT_TEMPLATES.savingsStreaks) {
      if (currentSavingsStreak >= template.days) {
        const achievementId = `savings-streak-${template.days}`;

        if (!achievements.find(a => a.achievementId === achievementId)) {
          const achievement: Achievement = {
            userId: userData.userId,
            achievementId,
            title: template.title,
            description: template.description,
            type: 'streak',
            category: 'savings',
            difficulty: template.difficulty,
            pointsReward: template.points,
            earnedAt: new Date().toISOString(),
            metadata: {
              streakDays: currentSavingsStreak
            }
          };

          achievements.push(achievement);
          newAchievements.push(achievement);
        }
      }
    }

    // Calculate total savings achievements
    for (const template of this.ACHIEVEMENT_TEMPLATES.totalSavings) {
      if (userData.totalSaved >= template.amount) {
        const achievementId = `total-saved-${template.amount}`;

        if (!achievements.find(a => a.achievementId === achievementId)) {
          const achievement: Achievement = {
            userId: userData.userId,
            achievementId,
            title: template.title,
            description: template.description,
            type: 'savings_rate',
            category: 'savings',
            difficulty: template.difficulty,
            pointsReward: template.points,
            earnedAt: new Date().toISOString(),
            metadata: {
              amount: userData.totalSaved
            }
          };

          achievements.push(achievement);
          newAchievements.push(achievement);
        }
      }
    }

    // Calculate total points and level
    const totalPoints = achievements.reduce((sum, achievement) => sum + achievement.pointsReward, 0);
    const currentLevel = Math.min(Math.floor(totalPoints / this.POINTS_PER_LEVEL) + 1, this.MAX_LEVEL);
    const pointsToNextLevel = currentLevel < this.MAX_LEVEL
      ? (currentLevel * this.POINTS_PER_LEVEL) - totalPoints
      : 0;

    // Generate motivational message
    const motivationalMessage = this.generateMotivationalMessage(userData, achievements, newAchievements);

    return {
      currentLevel,
      totalPoints,
      pointsToNextLevel,
      achievements,
      newAchievements,
      motivationalMessage
    };
  }

  private static generateMotivationalMessage(
    userData: UserFinancialData,
    achievements: Achievement[],
    newAchievements: Achievement[]
  ): string {
    if (newAchievements.length > 0) {
      const latestAchievement = newAchievements[newAchievements.length - 1];
      return `🎉 Congratulations on earning "${latestAchievement.title}"! Keep up the great work!`;
    }

    const activeGoals = userData.goals.filter(g => g.isActive).length;
    const completedGoals = userData.goals.filter(g => !g.isActive).length;

    if (activeGoals === 0) {
      return "Ready to set your first financial goal? Start building your future today!";
    }

    if (completedGoals > 0) {
      return `Amazing! You've completed ${completedGoals} goal${completedGoals !== 1 ? 's' : ''} and are working on ${activeGoals} more. You're building great financial habits!`;
    }

    const totalProgress = userData.goalProgress.reduce((sum, p) => sum + p.progressPercentage, 0) / userData.goalProgress.length;

    if (totalProgress > 75) {
      return "Incredible progress! You're so close to achieving your goals. The finish line is in sight!";
    } else if (totalProgress > 50) {
      return "Great momentum! You're more than halfway to achieving your financial goals.";
    } else if (totalProgress > 25) {
      return "Solid progress! You're building great financial habits. Keep it up!";
    } else {
      return "Every journey starts with a single step. You're on your way to financial success!";
    }
  }

  static calculateLevelProgress(totalPoints: number): { level: number; progressInLevel: number; pointsToNext: number } {
    const level = Math.min(Math.floor(totalPoints / this.POINTS_PER_LEVEL) + 1, this.MAX_LEVEL);
    const pointsInCurrentLevel = totalPoints % this.POINTS_PER_LEVEL;
    const progressInLevel = level < this.MAX_LEVEL ? (pointsInCurrentLevel / this.POINTS_PER_LEVEL) * 100 : 100;
    const pointsToNext = level < this.MAX_LEVEL ? this.POINTS_PER_LEVEL - pointsInCurrentLevel : 0;

    return {
      level,
      progressInLevel,
      pointsToNext
    };
  }

  static generateGoalRecommendations(userData: UserFinancialData): Array<{
    type: FinancialGoal['type'];
    title: string;
    description: string;
    suggestedAmount: number;
    suggestedTimeframe: number;
    priority: 'high' | 'medium' | 'low';
    reasoning: string;
  }> {
    const recommendations: any[] = [];

    // Check if user has emergency fund
    const hasEmergencyFund = userData.goals.some(g => g.type === 'emergency_fund' && g.isActive);
    if (!hasEmergencyFund) {
      recommendations.push({
        type: 'emergency_fund',
        title: 'Emergency Fund',
        description: '3-6 months of expenses for financial security',
        suggestedAmount: userData.totalSaved > 0 ? userData.totalSaved * 6 : 5000,
        suggestedTimeframe: 12,
        priority: 'high',
        reasoning: 'An emergency fund is the foundation of financial security and should be your top priority.'
      });
    }

    // Suggest retirement if user is older or has good savings habits
    if (userData.monthsActive > 6 && userData.currentStreaks.savings > 30) {
      const hasRetirementGoal = userData.goals.some(g => g.type === 'retirement' && g.isActive);
      if (!hasRetirementGoal) {
        recommendations.push({
          type: 'retirement',
          title: 'Retirement Savings',
          description: 'Start building your retirement fund early',
          suggestedAmount: 25000,
          suggestedTimeframe: 120, // 10 years
          priority: 'medium',
          reasoning: 'Starting retirement savings early takes advantage of compound interest over time.'
        });
      }
    }

    // Suggest vacation or lifestyle goal if user has good saving habits
    if (userData.totalSaved > 1000 && userData.currentStreaks.savings > 14) {
      const hasLifestyleGoal = userData.goals.some(g => g.type === 'vacation' && g.isActive);
      if (!hasLifestyleGoal && recommendations.length < 2) {
        recommendations.push({
          type: 'vacation',
          title: 'Dream Vacation',
          description: 'Save for a memorable trip or experience',
          suggestedAmount: Math.min(userData.totalSaved * 2, 5000),
          suggestedTimeframe: 8,
          priority: 'low',
          reasoning: 'You\'ve shown great saving discipline. A reward goal can help maintain motivation!'
        });
      }
    }

    return recommendations;
  }
}