import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAuth } from '../../app/auth/AuthContext';
import { aiService } from '../../services/api/aiAPI';
import { goalsAPI } from '../../services/api/goalsAPI';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/Colors';

interface SmartInsight {
  id: string;
  type: 'goal_progress' | 'spending_trend' | 'achievement' | 'budget_alert' | 'savings_opportunity';
  title: string;
  message: string;
  actionText?: string;
  actionRoute?: string;
  priority: 'high' | 'medium' | 'low';
  icon: string;
  color: string;
}

export const SmartNotificationInsights: React.FC = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { preferences } = useNotifications();
  const router = useRouter();
  const [insights, setInsights] = useState<SmartInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateSmartInsights();
  }, [user]);

  const generateSmartInsights = async () => {
    try {
      const userId = user?.id || user?.username || user?.sub;
      if (!userId) return;

      const insights: SmartInsight[] = [];

      // Generate goal-based insights
      try {
        const goalsData = await goalsAPI.getUserGoals(userId);

        // Check for goals near completion
        goalsData.goalProgress.forEach(progress => {
          const goal = goalsData.activeGoals.find(g => g.goalId === progress.goalId);
          if (!goal) return;

          if (progress.progressPercentage >= 90) {
            insights.push({
              id: `goal_near_completion_${goal.goalId}`,
              type: 'goal_progress',
              title: '🎯 Goal Almost Complete!',
              message: `You're ${progress.progressPercentage}% done with "${goal.title}". Just ${goalsAPI.formatCurrency(progress.amountRemaining)} to go!`,
              actionText: 'View Goal',
              actionRoute: '/goals',
              priority: 'high',
              icon: 'flag',
              color: colors.success.main
            });
          } else if (progress.progressPercentage >= 50 && progress.progressPercentage < 75) {
            insights.push({
              id: `goal_halfway_${goal.goalId}`,
              type: 'goal_progress',
              title: '🚀 Halfway There!',
              message: `Great progress on "${goal.title}" - you're ${progress.progressPercentage}% complete!`,
              actionText: 'Keep Going',
              actionRoute: '/goals',
              priority: 'medium',
              icon: 'trending-up',
              color: colors.primary.main
            });
          }

          // Check if goal is behind schedule
          if (!progress.isOnTrack) {
            insights.push({
              id: `goal_behind_${goal.goalId}`,
              type: 'goal_progress',
              title: '⚠️ Goal Needs Attention',
              message: `"${goal.title}" is behind schedule. Consider increasing your monthly savings to ${goalsAPI.formatCurrency(progress.recommendedMonthlySavings)}.`,
              actionText: 'Adjust Goal',
              actionRoute: '/goals',
              priority: 'high',
              icon: 'warning',
              color: colors.warning.main
            });
          }
        });

        // Suggest new goals if user has few active goals
        if (goalsData.activeGoals.length < 2) {
          insights.push({
            id: 'suggest_new_goal',
            type: 'goal_progress',
            title: '💡 Set More Goals',
            message: 'Having multiple financial goals helps you stay motivated and organized. Consider adding an emergency fund or vacation goal.',
            actionText: 'Browse Goals',
            actionRoute: '/goals',
            priority: 'medium',
            icon: 'add-circle',
            color: colors.accent.main
          });
        }
      } catch (error) {
        console.log('Error generating goal insights:', error);
      }

      // Generate AI-powered insights
      try {
        const aiInsights = await aiService.generateProactiveInsights(userId);

        aiInsights.slice(0, 2).forEach((insight, index) => {
          insights.push({
            id: `ai_insight_${index}`,
            type: 'savings_opportunity',
            title: insight.title.replace(/[🎉🏆💡⚠️🚀🌟📊]/g, '').trim(),
            message: insight.description,
            actionText: insight.actionable ? 'Take Action' : 'Learn More',
            actionRoute: '/ai-assistant',
            priority: insight.priority === 'high' ? 'high' : 'medium',
            icon: 'bulb',
            color: colors.accent.main
          });
        });
      } catch (error) {
        console.log('Error generating AI insights:', error);
      }

      // Add spending pattern insights
      const currentHour = new Date().getHours();
      if (currentHour >= 9 && currentHour <= 17) {
        insights.push({
          id: 'spending_reminder',
          type: 'spending_trend',
          title: '📱 Quick Check-in',
          message: 'How has your spending been today? Track your expenses to stay on top of your budget.',
          actionText: 'Add Expense',
          actionRoute: '/add-transaction',
          priority: 'low',
          icon: 'add',
          color: colors.primary.main
        });
      }

      // Notification optimization tip
      if (preferences && preferences.maxNotificationsPerDay > 20) {
        insights.push({
          id: 'notification_tip',
          type: 'achievement',
          title: '🔔 Optimize Notifications',
          message: 'You\'re receiving many notifications. Consider adjusting your preferences for a better experience.',
          actionText: 'Settings',
          actionRoute: '/settings/notifications',
          priority: 'low',
          icon: 'settings',
          color: colors.text.secondary
        });
      }

      // Sort by priority and limit to top 3
      const sortedInsights = insights
        .sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        })
        .slice(0, 3);

      setInsights(sortedInsights);
    } catch (error) {
      console.error('Error generating smart insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInsightPress = (insight: SmartInsight) => {
    if (insight.actionRoute) {
      router.push(insight.actionRoute as any);
    }
  };

  if (loading || insights.length === 0) {
    return null;
  }

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Smart Insights</Text>
        <Text style={styles.headerSubtitle}>Personalized for you</Text>
      </View>

      {insights.map((insight, index) => (
        <TouchableOpacity
          key={insight.id}
          style={[styles.insightCard, { borderLeftColor: insight.color }]}
          onPress={() => handleInsightPress(insight)}
          activeOpacity={0.8}
        >
          <View style={styles.insightContent}>
            <View style={[styles.insightIcon, { backgroundColor: insight.color + '15' }]}>
              <Ionicons name={insight.icon as any} size={20} color={insight.color} />
            </View>

            <View style={styles.insightText}>
              <Text style={styles.insightTitle}>{insight.title}</Text>
              <Text style={styles.insightMessage} numberOfLines={2}>
                {insight.message}
              </Text>
              {insight.actionText && (
                <Text style={[styles.actionText, { color: insight.color }]}>
                  {insight.actionText} →
                </Text>
              )}
            </View>

            <View style={styles.priorityIndicator}>
              <View style={[
                styles.priorityDot,
                {
                  backgroundColor: insight.priority === 'high' ? colors.error.main :
                    insight.priority === 'medium' ? colors.warning.main : colors.success.main
                }
              ]} />
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    margin: SPACING.lg
  },
  header: {
    marginBottom: SPACING.md
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: SPACING.xs
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500'
  },
  insightCard: {
    backgroundColor: colors.background.primary,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    borderLeftWidth: 4,
    ...SHADOWS.sm
  },
  insightContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.md,
    gap: SPACING.md
  },
  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2
  },
  insightText: {
    flex: 1
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: SPACING.xs
  },
  insightMessage: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 18,
    marginBottom: SPACING.sm
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600'
  },
  priorityIndicator: {
    marginTop: 4
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  }
});