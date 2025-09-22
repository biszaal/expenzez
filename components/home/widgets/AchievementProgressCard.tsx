import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../app/auth/AuthContext';
import { useRouter } from 'expo-router';
import { achievementAPI, AchievementResponse } from '../../../services/api/achievementAPI';
import { AchievementBadge } from '../../achievements';
import { SHADOWS, SPACING, BORDER_RADIUS } from '../../../constants/Colors';

export const AchievementProgressCard: React.FC = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [achievementData, setAchievementData] = useState<AchievementResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAchievementData = async () => {
      console.log('AchievementProgressCard: Loading widget, user:', user?.id ? 'available' : 'not available');

      // Show fallback data immediately for now since API endpoints may not be deployed
      setAchievementData({
        userId: user?.id || 'demo-user',
        progress: {
          level: 2,
          totalPoints: 125,
          pointsToNextLevel: 75,
          achievementCount: 3
        },
        achievements: [
          {
            userId: user?.id || 'demo-user',
            achievementId: 'first-transaction',
            title: 'First Steps',
            description: 'Logged your first transaction',
            type: 'spending_milestone',
            category: 'general',
            difficulty: 'bronze',
            pointsReward: 50,
            earnedAt: new Date().toISOString()
          },
          {
            userId: user?.id || 'demo-user',
            achievementId: 'budget-creator',
            title: 'Budget Master',
            description: 'Created your first budget',
            type: 'goal_completion',
            category: 'budgeting',
            difficulty: 'silver',
            pointsReward: 75,
            earnedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          }
        ],
        streaks: {
          currentSavingsStreak: 3,
          longestSavingsStreak: 5,
          currentBudgetStreak: 7,
          longestBudgetStreak: 12
        },
        milestones: {
          totalSaved: 450,
          goalsCompleted: 2,
          transactionsLogged: 28,
          categoriesUsed: 8
        },
        newAchievements: [],
        celebration: null,
        motivationalMessage: "Great progress! You're building healthy financial habits."
      });
      setLoading(false);

      // Comment out API call for now
      /*
      if (!user?.id) {
        console.log('AchievementProgressCard: No user ID available');
        setLoading(false);
        return;
      }

      try {
        const data = await achievementAPI.getUserAchievements(user.id);
        console.log('AchievementProgressCard: Successfully loaded data:', data);
        setAchievementData(data);
      } catch (error) {
        console.error('AchievementProgressCard: Error loading achievement data:', error);
      } finally {
        setLoading(false);
      }
      */
    };

    loadAchievementData();
  }, [user?.id]);

  if (loading || !achievementData) {
    const loadingStyles = createStyles(colors, 0);
    return (
      <View style={[loadingStyles.container, { backgroundColor: colors.background.primary }]}>
        <View style={loadingStyles.loadingContent}>
          <Ionicons name="trophy-outline" size={24} color={colors.text.secondary} />
          <Text style={[loadingStyles.loadingText, { color: colors.text.secondary }]}>
            Loading progress...
          </Text>
        </View>
      </View>
    );
  }

  const progressPercentage = (achievementData.progress.totalPoints % 100) / 100;
  const recentAchievements = achievementData.achievements.slice(0, 3);

  const styles = createStyles(colors, progressPercentage);

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.background.primary }]}
      onPress={() => router.push('/(tabs)/progress')}
      activeOpacity={0.8}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="trophy" size={20} color="#FFD700" />
          <Text style={styles.headerTitle}>Your Progress</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.text.secondary} />
      </View>

      {/* Level Progress */}
      <View style={styles.levelContainer}>
        <View style={styles.levelInfo}>
          <Text style={styles.levelText}>Level {achievementData.progress.level}</Text>
          <Text style={styles.pointsText}>
            {achievementData.progress.totalPoints} XP
          </Text>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
          <Text style={styles.progressText}>
            {achievementData.progress.pointsToNextLevel} XP to next level
          </Text>
        </View>
      </View>

      {/* Recent Achievements */}
      {recentAchievements.length > 0 && (
        <View style={styles.achievementsContainer}>
          <Text style={styles.achievementsTitle}>Recent Achievements</Text>
          <View style={styles.achievementsList}>
            {recentAchievements.map((achievement, index) => (
              <View key={achievement.achievementId} style={styles.achievementItem}>
                <AchievementBadge achievement={achievement} size="small" />
              </View>
            ))}
            {recentAchievements.length < 3 && (
              <View style={styles.emptySlot}>
                <Ionicons name="add-circle-outline" size={24} color={colors.text.tertiary} />
              </View>
            )}
          </View>
        </View>
      )}

      {/* No Achievements State */}
      {recentAchievements.length === 0 && (
        <View style={styles.noAchievementsContainer}>
          <Ionicons name="star-outline" size={32} color={colors.text.secondary} />
          <Text style={styles.noAchievementsText}>
            Start your journey to earn your first achievement!
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const createStyles = (colors: any, progressPercentage: number) => StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.sm,
    ...SHADOWS.md
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: SPACING.sm
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginLeft: SPACING.sm
  },
  levelContainer: {
    marginBottom: SPACING.md
  },
  levelInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm
  },
  levelText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent.main
  },
  progressBarContainer: {
    marginBottom: SPACING.sm
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.background.tertiary,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: SPACING.xs
  },
  progressFill: {
    height: '100%',
    width: `${progressPercentage * 100}%`,
    backgroundColor: colors.primary.main,
    borderRadius: 3
  },
  progressText: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center'
  },
  achievementsContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: SPACING.md
  },
  achievementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: SPACING.sm
  },
  achievementsList: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  achievementItem: {
    alignItems: 'center'
  },
  emptySlot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border.light,
    borderStyle: 'dashed'
  },
  noAchievementsContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    marginTop: SPACING.md
  },
  noAchievementsText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 18
  }
});