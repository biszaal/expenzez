import dayjs from 'dayjs';
import { transactionAPI, Transaction as APITransaction } from './api/transactionAPI';
import { budgetAPI } from './api';

// Extended transaction interface for achievement calculations
interface Transaction extends APITransaction {
  type?: 'debit' | 'credit';
}

interface Achievement {
  userId: string;
  achievementId: string;
  title: string;
  description: string;
  type: 'spending_milestone' | 'goal_completion' | 'streak' | 'category_mastery' | 'savings_rate';
  category: string;
  difficulty: 'bronze' | 'silver' | 'gold' | 'platinum';
  pointsReward: number;
  earnedAt: string;
}

interface UserProgress {
  level: number;
  totalPoints: number;
  pointsToNextLevel: number;
  achievementCount: number;
}

interface UserStats {
  totalTransactions: number;
  totalSpent: number;
  totalIncome: number;
  categoriesUsed: number;
  daysWithTransactions: number;
  currentStreak: number;
  longestStreak: number;
  monthsActive: number;
  avgDailySpending: number;
  savingsRate: number;
}

export class AchievementCalculator {
  private static readonly POINTS_PER_LEVEL = 100;

  private static readonly ACHIEVEMENT_DEFINITIONS = [
    // Milestone Achievements
    { id: 'first-transaction', title: 'First Steps', description: 'Logged your first transaction', type: 'spending_milestone', category: 'general', difficulty: 'bronze', points: 50, trigger: (stats: UserStats) => stats.totalTransactions >= 1 },
    { id: 'transaction-10', title: 'Getting Started', description: 'Logged 10 transactions', type: 'spending_milestone', category: 'general', difficulty: 'bronze', points: 75, trigger: (stats: UserStats) => stats.totalTransactions >= 10 },
    { id: 'transaction-50', title: 'Consistent Tracker', description: 'Logged 50 transactions', type: 'spending_milestone', category: 'general', difficulty: 'silver', points: 100, trigger: (stats: UserStats) => stats.totalTransactions >= 50 },
    { id: 'transaction-100', title: 'Transaction Master', description: 'Logged 100 transactions', type: 'spending_milestone', category: 'general', difficulty: 'gold', points: 150, trigger: (stats: UserStats) => stats.totalTransactions >= 100 },

    // Category Achievements
    { id: 'category-5', title: 'Category Explorer', description: 'Used 5 different spending categories', type: 'category_mastery', category: 'organization', difficulty: 'bronze', points: 60, trigger: (stats: UserStats) => stats.categoriesUsed >= 5 },
    { id: 'category-10', title: 'Category Expert', description: 'Used 10 different spending categories', type: 'category_mastery', category: 'organization', difficulty: 'silver', points: 90, trigger: (stats: UserStats) => stats.categoriesUsed >= 10 },

    // Streak Achievements
    { id: 'streak-3', title: 'Building Habits', description: 'Logged transactions for 3 consecutive days', type: 'streak', category: 'habits', difficulty: 'bronze', points: 70, trigger: (stats: UserStats) => stats.currentStreak >= 3 },
    { id: 'streak-7', title: 'Week Warrior', description: 'Logged transactions for 7 consecutive days', type: 'streak', category: 'habits', difficulty: 'silver', points: 100, trigger: (stats: UserStats) => stats.currentStreak >= 7 },
    { id: 'streak-30', title: 'Monthly Master', description: 'Logged transactions for 30 consecutive days', type: 'streak', category: 'habits', difficulty: 'gold', points: 200, trigger: (stats: UserStats) => stats.currentStreak >= 30 },

    // Savings Achievements
    { id: 'positive-month', title: 'In the Green', description: 'Had positive cash flow for a month', type: 'savings_rate', category: 'savings', difficulty: 'bronze', points: 80, trigger: (stats: UserStats) => stats.savingsRate > 0 },
    { id: 'saver-10', title: 'Smart Saver', description: 'Achieved 10% savings rate', type: 'savings_rate', category: 'savings', difficulty: 'silver', points: 120, trigger: (stats: UserStats) => stats.savingsRate >= 0.1 },
    { id: 'saver-20', title: 'Super Saver', description: 'Achieved 20% savings rate', type: 'savings_rate', category: 'savings', difficulty: 'gold', points: 180, trigger: (stats: UserStats) => stats.savingsRate >= 0.2 },

    // Long-term Achievements
    { id: 'month-1', title: 'One Month Strong', description: 'Active for 1 month', type: 'goal_completion', category: 'consistency', difficulty: 'bronze', points: 90, trigger: (stats: UserStats) => stats.monthsActive >= 1 },
    { id: 'month-3', title: 'Quarter Champion', description: 'Active for 3 months', type: 'goal_completion', category: 'consistency', difficulty: 'silver', points: 150, trigger: (stats: UserStats) => stats.monthsActive >= 3 },
    { id: 'month-6', title: 'Half Year Hero', description: 'Active for 6 months', type: 'goal_completion', category: 'consistency', difficulty: 'gold', points: 250, trigger: (stats: UserStats) => stats.monthsActive >= 6 },
  ] as const;

  static async calculateUserAchievements(userId: string) {
    try {
      // Get user transactions
      const transactionResponse = await transactionAPI.getTransactions({ limit: 1000 });
      const transactions = transactionResponse.transactions || [];

      // Calculate user stats
      const stats = this.calculateUserStats(transactions);

      // Generate achievements based on stats
      const achievements = this.generateAchievements(userId, stats);

      // Calculate progress
      const progress = this.calculateProgress(achievements);

      // Calculate streaks
      const streaks = this.calculateStreaks(transactions);

      return {
        userId,
        progress,
        achievements,
        streaks: {
          currentSavingsStreak: streaks.currentStreak,
          longestSavingsStreak: streaks.longestStreak,
          currentBudgetStreak: streaks.currentStreak, // Same for now
          longestBudgetStreak: streaks.longestStreak,
        },
        milestones: {
          totalSaved: Math.max(0, stats.totalIncome - Math.abs(stats.totalSpent)),
          goalsCompleted: achievements.length,
          transactionsLogged: stats.totalTransactions,
          categoriesUsed: stats.categoriesUsed,
        },
        newAchievements: [],
        celebration: null,
        motivationalMessage: this.generateMotivationalMessage(progress.level, achievements.length),
      };
    } catch (error) {
      console.error('Error calculating user achievements:', error);
      // Return minimal fallback data
      return {
        userId,
        progress: { level: 1, totalPoints: 0, pointsToNextLevel: 100, achievementCount: 0 },
        achievements: [],
        streaks: { currentSavingsStreak: 0, longestSavingsStreak: 0, currentBudgetStreak: 0, longestBudgetStreak: 0 },
        milestones: { totalSaved: 0, goalsCompleted: 0, transactionsLogged: 0, categoriesUsed: 0 },
        newAchievements: [],
        celebration: null,
        motivationalMessage: "Start your financial journey to unlock achievements!",
      };
    }
  }

  private static calculateUserStats(transactions: Transaction[]): UserStats {
    if (!transactions.length) {
      return {
        totalTransactions: 0,
        totalSpent: 0,
        totalIncome: 0,
        categoriesUsed: 0,
        daysWithTransactions: 0,
        currentStreak: 0,
        longestStreak: 0,
        monthsActive: 0,
        avgDailySpending: 0,
        savingsRate: 0,
      };
    }

    // Calculate basic stats - use type if available, fallback to amount sign
    const totalSpent = transactions.filter(t =>
      t.type === 'debit' || (t.type === undefined && t.amount < 0)
    ).reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = transactions.filter(t =>
      t.type === 'credit' || (t.type === undefined && t.amount > 0)
    ).reduce((sum, t) => sum + t.amount, 0);
    const categoriesUsed = new Set(transactions.map(t => t.category).filter(Boolean)).size;

    // Calculate date-based stats
    const transactionDates = transactions.map(t => dayjs(t.date).format('YYYY-MM-DD'));
    const uniqueDates = new Set(transactionDates);
    const daysWithTransactions = uniqueDates.size;

    // Calculate months active
    const monthsSet = new Set(transactions.map(t => dayjs(t.date).format('YYYY-MM')));
    const monthsActive = monthsSet.size;

    // Calculate average daily spending
    const avgDailySpending = daysWithTransactions > 0 ? Math.abs(totalSpent) / daysWithTransactions : 0;

    // Calculate savings rate
    const savingsRate = totalIncome > 0 ? (totalIncome - Math.abs(totalSpent)) / totalIncome : 0;

    return {
      totalTransactions: transactions.length,
      totalSpent,
      totalIncome,
      categoriesUsed,
      daysWithTransactions,
      currentStreak: 0, // Will be calculated separately
      longestStreak: 0, // Will be calculated separately
      monthsActive,
      avgDailySpending,
      savingsRate,
    };
  }

  private static generateAchievements(userId: string, stats: UserStats): Achievement[] {
    const achievements: Achievement[] = [];

    for (const def of this.ACHIEVEMENT_DEFINITIONS) {
      if (def.trigger(stats)) {
        achievements.push({
          userId,
          achievementId: def.id,
          title: def.title,
          description: def.description,
          type: def.type,
          category: def.category,
          difficulty: def.difficulty,
          pointsReward: def.points,
          earnedAt: new Date().toISOString(),
        });
      }
    }

    return achievements;
  }

  private static calculateProgress(achievements: Achievement[]): UserProgress {
    const totalPoints = achievements.reduce((sum, achievement) => sum + achievement.pointsReward, 0);
    const level = Math.floor(totalPoints / this.POINTS_PER_LEVEL) + 1;
    const pointsInCurrentLevel = totalPoints % this.POINTS_PER_LEVEL;
    const pointsToNextLevel = this.POINTS_PER_LEVEL - pointsInCurrentLevel;

    return {
      level,
      totalPoints,
      pointsToNextLevel,
      achievementCount: achievements.length,
    };
  }

  private static calculateStreaks(transactions: Transaction[]) {
    if (!transactions.length) return { currentStreak: 0, longestStreak: 0 };

    // Sort transactions by date
    const sortedTransactions = transactions
      .map(t => ({ ...t, date: dayjs(t.date) }))
      .sort((a, b) => a.date.valueOf() - b.date.valueOf());

    // Get unique dates with transactions
    const uniqueDates = Array.from(new Set(
      sortedTransactions.map(t => t.date.format('YYYY-MM-DD'))
    )).map(dateStr => dayjs(dateStr)).sort((a, b) => a.valueOf() - b.valueOf());

    let longestStreak = 0;
    let currentStreakLength = 1;

    // Calculate streaks
    for (let i = 1; i < uniqueDates.length; i++) {
      const prevDate = uniqueDates[i - 1];
      const currentDate = uniqueDates[i];
      const dayDiff = currentDate.diff(prevDate, 'day');

      if (dayDiff === 1) {
        currentStreakLength++;
      } else {
        longestStreak = Math.max(longestStreak, currentStreakLength);
        currentStreakLength = 1;
      }
    }
    longestStreak = Math.max(longestStreak, currentStreakLength);

    // Calculate current streak (from today backwards)
    const today = dayjs();
    let currentStreak = 0;

    // Check if user has transaction today or recently
    const recentDates = uniqueDates.reverse(); // Most recent first
    for (const date of recentDates) {
      const daysFromToday = today.diff(date, 'day');
      if (daysFromToday <= currentStreak + 1) {
        currentStreak = Math.max(currentStreak, daysFromToday + 1);
      } else {
        break;
      }
    }

    return { currentStreak: Math.max(currentStreak, 1), longestStreak };
  }

  private static generateMotivationalMessage(level: number, achievementCount: number): string {
    const messages = [
      "You're just getting started on your financial journey!",
      "Great progress! Keep building those financial habits.",
      "Fantastic work! You're mastering your finances.",
      "Incredible dedication! You're a financial champion.",
      "Outstanding achievement! You're setting the example for others.",
    ];

    if (level === 1 && achievementCount === 0) return messages[0];
    if (level <= 2) return messages[1];
    if (level <= 4) return messages[2];
    if (level <= 6) return messages[3];
    return messages[4];
  }
}