import { aiService } from './api/aiAPI';
import { goalsAPI } from './api/goalsAPI';
import { transactionAPI } from './api/transactionAPI';
import { achievementAPI } from './api/achievementAPI';
import { GamificationEngine } from './gamificationEngine';
import { NotificationHistoryItem } from '../contexts/NotificationContext';

export interface SmartNotificationTrigger {
  id: string;
  type: 'goal_milestone' | 'spending_pattern' | 'achievement_unlocked' | 'budget_alert' | 'savings_opportunity' | 'weekly_insight';
  condition: (data: UserFinancialData) => boolean;
  generateNotification: (data: UserFinancialData) => NotificationHistoryItem;
  priority: 'high' | 'medium' | 'low';
  cooldownHours: number; // Prevent spam
}

export interface UserFinancialData {
  userId: string;
  goals: any[];
  goalProgress: any[];
  achievements: any[];
  recentTransactions: any[];
  totalBalance: number;
  weeklySpending: number;
  monthlySpending: number;
  lastNotificationSent?: Record<string, number>; // trigger_id -> timestamp
}

export class SmartNotificationService {
  private static triggers: SmartNotificationTrigger[] = [
    // Goal Milestone Notifications
    {
      id: 'goal_25_percent',
      type: 'goal_milestone',
      condition: (data) => {
        return data.goalProgress.some(progress =>
          progress.progressPercentage >= 25 &&
          progress.progressPercentage < 30 &&
          !data.lastNotificationSent?.[`goal_25_${progress.goalId}`]
        );
      },
      generateNotification: (data) => {
        const milestone = data.goalProgress.find(p => p.progressPercentage >= 25 && p.progressPercentage < 30);
        const goal = data.goals.find(g => g.goalId === milestone.goalId);
        return {
          id: `goal_25_${goal.goalId}_${Date.now()}`,
          title: '🎯 Quarter Way There!',
          message: `Great progress on "${goal.title}" - you're ${milestone.progressPercentage}% complete! Keep up the momentum.`,
          time: 'Just now',
          type: 'insight',
          read: false,
          data: {
            goalId: goal.goalId,
            progressPercentage: milestone.progressPercentage,
            actionType: 'view_goal'
          }
        };
      },
      priority: 'medium',
      cooldownHours: 24
    },

    {
      id: 'goal_50_percent',
      type: 'goal_milestone',
      condition: (data) => {
        return data.goalProgress.some(progress =>
          progress.progressPercentage >= 50 &&
          progress.progressPercentage < 55 &&
          !data.lastNotificationSent?.[`goal_50_${progress.goalId}`]
        );
      },
      generateNotification: (data) => {
        const milestone = data.goalProgress.find(p => p.progressPercentage >= 50 && p.progressPercentage < 55);
        const goal = data.goals.find(g => g.goalId === milestone.goalId);
        return {
          id: `goal_50_${goal.goalId}_${Date.now()}`,
          title: '🚀 Halfway There!',
          message: `Amazing! You've reached the halfway point for "${goal.title}". You're doing great!`,
          time: 'Just now',
          type: 'insight',
          read: false,
          data: {
            goalId: goal.goalId,
            progressPercentage: milestone.progressPercentage,
            actionType: 'view_goal'
          }
        };
      },
      priority: 'high',
      cooldownHours: 24
    },

    {
      id: 'goal_90_percent',
      type: 'goal_milestone',
      condition: (data) => {
        return data.goalProgress.some(progress =>
          progress.progressPercentage >= 90 &&
          !data.lastNotificationSent?.[`goal_90_${progress.goalId}`]
        );
      },
      generateNotification: (data) => {
        const milestone = data.goalProgress.find(p => p.progressPercentage >= 90);
        const goal = data.goals.find(g => g.goalId === milestone.goalId);
        return {
          id: `goal_90_${goal.goalId}_${Date.now()}`,
          title: '🏆 Almost There!',
          message: `You're ${milestone.progressPercentage}% done with "${goal.title}"! Just ${goalsAPI.formatCurrency(milestone.amountRemaining)} to go!`,
          time: 'Just now',
          type: 'insight',
          read: false,
          data: {
            goalId: goal.goalId,
            progressPercentage: milestone.progressPercentage,
            amountRemaining: milestone.amountRemaining,
            actionType: 'contribute_to_goal'
          }
        };
      },
      priority: 'high',
      cooldownHours: 12
    },

    // Achievement Notifications
    {
      id: 'achievement_unlocked',
      type: 'achievement_unlocked',
      condition: (data) => {
        return data.achievements.some(achievement =>
          achievement.unlockedAt &&
          Date.now() - new Date(achievement.unlockedAt).getTime() < 5 * 60 * 1000 // Within 5 minutes
        );
      },
      generateNotification: (data) => {
        const newAchievement = data.achievements.find(a =>
          a.unlockedAt && Date.now() - new Date(a.unlockedAt).getTime() < 5 * 60 * 1000
        );
        return {
          id: `achievement_${newAchievement.id}_${Date.now()}`,
          title: '🏆 Achievement Unlocked!',
          message: `Congratulations! You've earned "${newAchievement.title}" and gained ${newAchievement.points} points!`,
          time: 'Just now',
          type: 'insight',
          read: false,
          data: {
            achievementId: newAchievement.id,
            points: newAchievement.points,
            actionType: 'view_achievements'
          }
        };
      },
      priority: 'high',
      cooldownHours: 1
    },

    // Spending Pattern Notifications
    {
      id: 'unusual_spending',
      type: 'spending_pattern',
      condition: (data) => {
        if (data.recentTransactions.length < 5) return false;

        const today = new Date();
        const todaySpending = data.recentTransactions
          .filter(tx => {
            const txDate = new Date(tx.date);
            return txDate.toDateString() === today.toDateString() && tx.amount < 0;
          })
          .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

        const avgDailySpending = data.weeklySpending / 7;
        return todaySpending > avgDailySpending * 2 &&
               !data.lastNotificationSent?.['unusual_spending_' + today.toDateString()];
      },
      generateNotification: (data) => {
        const today = new Date();
        const todaySpending = data.recentTransactions
          .filter(tx => {
            const txDate = new Date(tx.date);
            return txDate.toDateString() === today.toDateString() && tx.amount < 0;
          })
          .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

        return {
          id: `unusual_spending_${Date.now()}`,
          title: '💸 Higher Spending Today',
          message: `You've spent ${goalsAPI.formatCurrency(todaySpending)} today, which is above your usual daily average. Everything okay?`,
          time: 'Just now',
          type: 'budget',
          read: false,
          data: {
            amount: todaySpending,
            actionType: 'review_transactions'
          }
        };
      },
      priority: 'medium',
      cooldownHours: 24
    },

    // Savings Opportunity Notifications
    {
      id: 'subscription_spending',
      type: 'savings_opportunity',
      condition: (data) => {
        const subscriptionSpending = data.recentTransactions
          .filter(tx =>
            tx.category?.toLowerCase().includes('subscription') ||
            tx.merchant?.toLowerCase().includes('netflix') ||
            tx.merchant?.toLowerCase().includes('spotify') ||
            tx.merchant?.toLowerCase().includes('amazon prime')
          )
          .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

        return subscriptionSpending > 50 &&
               !data.lastNotificationSent?.['subscription_review'];
      },
      generateNotification: (data) => {
        const subscriptionSpending = data.recentTransactions
          .filter(tx =>
            tx.category?.toLowerCase().includes('subscription') ||
            tx.merchant?.toLowerCase().includes('netflix') ||
            tx.merchant?.toLowerCase().includes('spotify')
          )
          .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

        return {
          id: `subscription_review_${Date.now()}`,
          title: '🔄 Subscription Review',
          message: `You're spending ${goalsAPI.formatCurrency(subscriptionSpending)} on subscriptions this month. Consider reviewing which ones you still use.`,
          time: 'Just now',
          type: 'insight',
          read: false,
          data: {
            amount: subscriptionSpending,
            actionType: 'review_subscriptions'
          }
        };
      },
      priority: 'low',
      cooldownHours: 168 // Weekly
    },

    // Weekly Insight Notification
    {
      id: 'weekly_insight',
      type: 'weekly_insight',
      condition: (data) => {
        const today = new Date();
        const isMonday = today.getDay() === 1;
        const isEarlyMorning = today.getHours() >= 8 && today.getHours() <= 10;

        return isMonday && isEarlyMorning &&
               !data.lastNotificationSent?.['weekly_insight_' + today.toDateString()];
      },
      generateNotification: (data) => {
        const spendingTrend = data.weeklySpending > data.monthlySpending / 4 ? 'above' : 'below';
        const trendEmoji = spendingTrend === 'above' ? '📈' : '📉';

        return {
          id: `weekly_insight_${Date.now()}`,
          title: `${trendEmoji} Weekly Spending Insight`,
          message: `Last week you spent ${goalsAPI.formatCurrency(data.weeklySpending)}, which is ${spendingTrend} your monthly average. Tap for detailed insights.`,
          time: 'Just now',
          type: 'insight',
          read: false,
          data: {
            weeklySpending: data.weeklySpending,
            monthlyAverage: data.monthlySpending / 4,
            actionType: 'view_insights'
          }
        };
      },
      priority: 'medium',
      cooldownHours: 168 // Weekly
    }
  ];

  static async generateSmartNotifications(userId: string): Promise<NotificationHistoryItem[]> {
    try {
      console.log('🔔 [SmartNotifications] Generating smart notifications for user:', userId);

      // Gather user financial data
      const userData = await this.gatherUserData(userId);

      const notifications: NotificationHistoryItem[] = [];

      // Check each trigger
      for (const trigger of this.triggers) {
        try {
          // Check cooldown
          if (this.isInCooldown(trigger, userData)) {
            continue;
          }

          // Check condition
          if (trigger.condition(userData)) {
            const notification = trigger.generateNotification(userData);
            notifications.push(notification);

            console.log(`✅ [SmartNotifications] Generated notification: ${trigger.id} - ${notification.title}`);
          }
        } catch (error) {
          console.error(`❌ [SmartNotifications] Error processing trigger ${trigger.id}:`, error);
        }
      }

      // Sort by priority
      notifications.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const triggerA = this.triggers.find(t => t.generateNotification(userData).id.startsWith(t.id));
        const triggerB = this.triggers.find(t => t.generateNotification(userData).id.startsWith(t.id));

        return (priorityOrder[triggerB?.priority || 'low'] || 0) - (priorityOrder[triggerA?.priority || 'low'] || 0);
      });

      console.log(`🔔 [SmartNotifications] Generated ${notifications.length} smart notifications`);
      return notifications.slice(0, 5); // Limit to top 5

    } catch (error) {
      console.error('❌ [SmartNotifications] Error generating smart notifications:', error);
      return [];
    }
  }

  private static async gatherUserData(userId: string): Promise<UserFinancialData> {
    try {
      // Gather data from all sources
      const [goalsData, achievementsData, transactionsData] = await Promise.allSettled([
        goalsAPI.getUserGoals(userId),
        achievementAPI.getUserAchievements(userId),
        transactionAPI.getTransactions({ limit: 50 })
      ]);

      const goals = goalsData.status === 'fulfilled' ? goalsData.value.activeGoals : [];
      const goalProgress = goalsData.status === 'fulfilled' ? goalsData.value.goalProgress : [];
      const achievements = achievementsData.status === 'fulfilled' ? achievementsData.value.achievements : [];
      const transactions = transactionsData.status === 'fulfilled' ? transactionsData.value.transactions : [];

      // Calculate spending metrics
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const weeklySpending = transactions
        .filter(tx => new Date(tx.date) >= weekAgo && tx.amount < 0)
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

      const monthlySpending = transactions
        .filter(tx => new Date(tx.date) >= monthAgo && tx.amount < 0)
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

      const totalBalance = transactions.reduce((sum, tx) => sum + tx.amount, 0);

      return {
        userId,
        goals,
        goalProgress,
        achievements,
        recentTransactions: transactions,
        totalBalance,
        weeklySpending,
        monthlySpending,
        lastNotificationSent: {} // TODO: Load from storage
      };
    } catch (error) {
      console.error('Error gathering user data:', error);
      return {
        userId,
        goals: [],
        goalProgress: [],
        achievements: [],
        recentTransactions: [],
        totalBalance: 0,
        weeklySpending: 0,
        monthlySpending: 0
      };
    }
  }

  private static isInCooldown(trigger: SmartNotificationTrigger, userData: UserFinancialData): boolean {
    const lastSent = userData.lastNotificationSent?.[trigger.id];
    if (!lastSent) return false;

    const cooldownMs = trigger.cooldownHours * 60 * 60 * 1000;
    return Date.now() - lastSent < cooldownMs;
  }

  static async triggerSmartNotificationCheck(userId: string): Promise<void> {
    try {
      const notifications = await this.generateSmartNotifications(userId);

      // In a real implementation, these would be sent as push notifications
      // For now, they'll be added to the notification history
      console.log('🔔 [SmartNotifications] Would send notifications:', notifications.map(n => n.title));

    } catch (error) {
      console.error('❌ [SmartNotifications] Error in smart notification check:', error);
    }
  }
}

