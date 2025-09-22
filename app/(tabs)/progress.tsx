import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, RefreshControl, StyleSheet, View, Text, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../auth/AuthContext';
import { TabLoadingScreen } from '../../components/ui';
import { achievementAPI, AchievementResponse } from '../../services/api/achievementAPI';
import {
  AchievementCard,
  LevelProgressBar,
  CelebrationAnimation
} from '../../components/achievements';
import { SPACING } from '../../constants/Colors';

export default function ProgressScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [achievementData, setAchievementData] = useState<AchievementResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationAchievement, setCelebrationAchievement] = useState(null);

  // Load achievement data
  const loadAchievementData = useCallback(async (isRefresh = false) => {
    console.log('🏆 [Progress] Loading tab, user:', user?.id ? 'available' : 'not available');

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Show demo data immediately for now since API endpoints may not be deployed
      const demoData = {
        userId: user?.id || 'demo-user',
        progress: {
          level: 3,
          totalPoints: 275,
          pointsToNextLevel: 125,
          achievementCount: 5
        },
        achievements: [
          {
            userId: user?.id || 'demo-user',
            achievementId: 'first-transaction',
            title: 'First Steps',
            description: 'Logged your first transaction',
            type: 'spending_milestone' as const,
            category: 'general',
            difficulty: 'bronze' as const,
            pointsReward: 50,
            earnedAt: new Date().toISOString()
          },
          {
            userId: user?.id || 'demo-user',
            achievementId: 'budget-creator',
            title: 'Budget Master',
            description: 'Created your first budget',
            type: 'goal_completion' as const,
            category: 'budgeting',
            difficulty: 'silver' as const,
            pointsReward: 75,
            earnedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          },
          {
            userId: user?.id || 'demo-user',
            achievementId: 'savings-streak',
            title: 'Saving Streak',
            description: 'Saved money for 5 consecutive days',
            type: 'streak' as const,
            category: 'savings',
            difficulty: 'gold' as const,
            pointsReward: 100,
            earnedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            userId: user?.id || 'demo-user',
            achievementId: 'category-master',
            title: 'Category Expert',
            description: 'Used 10 different spending categories',
            type: 'category_mastery' as const,
            category: 'organization',
            difficulty: 'silver' as const,
            pointsReward: 75,
            earnedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            userId: user?.id || 'demo-user',
            achievementId: 'high-saver',
            title: 'Super Saver',
            description: 'Achieved 20% savings rate',
            type: 'savings_rate' as const,
            category: 'savings',
            difficulty: 'platinum' as const,
            pointsReward: 150,
            earnedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          }
        ],
        streaks: {
          currentSavingsStreak: 8,
          longestSavingsStreak: 15,
          currentBudgetStreak: 12,
          longestBudgetStreak: 20
        },
        milestones: {
          totalSaved: 1250,
          goalsCompleted: 4,
          transactionsLogged: 156,
          categoriesUsed: 12
        },
        newAchievements: [],
        celebration: null,
        motivationalMessage: "Fantastic progress! You're mastering your financial habits."
      };

      setAchievementData(demoData);

      console.log('✅ [Progress] Demo achievement data loaded:', {
        level: demoData.progress?.level,
        totalPoints: demoData.progress?.totalPoints,
        achievementCount: demoData.achievements?.length
      });

      // Comment out API call for now
      /*
      if (!user?.id) return;

      const data = await achievementAPI.getUserAchievements(user.id);
      setAchievementData(data);

      // Show celebration for new achievements
      if (data.newAchievements && data.newAchievements.length > 0 && !isRefresh) {
        setCelebrationAchievement(data.newAchievements[0]);
        setShowCelebration(true);
      }
      */

    } catch (error: any) {
      console.error('❌ [Progress] Error loading achievement data:', error);
      setError('Failed to load progress data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  // Initial load
  useEffect(() => {
    loadAchievementData();
  }, [loadAchievementData]);

  // Filter achievements by category
  const filteredAchievements = achievementData?.achievements.filter(achievement => {
    if (selectedCategory === 'all') return true;
    return achievement.category === selectedCategory;
  }) || [];

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(
    achievementData?.achievements.map(a => a.category) || []
  ))];

  // Achievement category stats
  const getCategoryStats = () => {
    const stats = {
      goals: 0,
      savings: 0,
      budgeting: 0,
      habits: 0,
      special: 0
    };

    achievementData?.achievements.forEach(achievement => {
      if (achievement.category in stats) {
        stats[achievement.category as keyof typeof stats]++;
      }
    });

    return stats;
  };

  const categoryStats = getCategoryStats();

  if (loading) {
    return <TabLoadingScreen message="Loading your progress..." />;
  }

  if (error && !achievementData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.secondary }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={64} color={colors.error.main} />
          <Text style={[styles.errorTitle, { color: colors.text.primary }]}>
            Something went wrong
          </Text>
          <Text style={[styles.errorText, { color: colors.text.secondary }]}>
            {error}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadAchievementData(true)}
            colors={[colors.primary.main]}
            tintColor={colors.primary.main}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Your Progress</Text>
              <Text style={styles.headerSubtitle}>
                Keep building great financial habits!
              </Text>
            </View>

            <View style={styles.headerRight}>
              <View style={styles.levelBadge}>
                <Ionicons name="trophy" size={20} color="#FFD700" />
                <Text style={styles.levelText}>
                  Level {achievementData?.progress.level || 1}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Level Progress */}
        {achievementData && (
          <LevelProgressBar
            currentLevel={achievementData.progress.level}
            totalPoints={achievementData.progress.totalPoints}
            pointsToNextLevel={achievementData.progress.pointsToNextLevel}
            animated={true}
          />
        )}

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="star" size={24} color={colors.accent.main} />
            <Text style={styles.statValue}>
              {achievementData?.progress.totalPoints || 0}
            </Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="trophy" size={24} color="#FFD700" />
            <Text style={styles.statValue}>
              {achievementData?.achievements.length || 0}
            </Text>
            <Text style={styles.statLabel}>Achievements</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="flame" size={24} color="#FF6B6B" />
            <Text style={styles.statValue}>
              {achievementData?.streaks.currentSavingsStreak || 0}
            </Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
        </View>

        {/* Motivational Message */}
        {achievementData?.motivationalMessage && (
          <View style={styles.motivationalContainer}>
            <Text style={styles.motivationalMessage}>
              {achievementData.motivationalMessage}
            </Text>
          </View>
        )}

        {/* Category Filter */}
        <View style={styles.categoryFilterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryFilter}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.categoryButtonActive
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[
                  styles.categoryButtonText,
                  selectedCategory === category && styles.categoryButtonTextActive
                ]}>
                  {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
                  {category !== 'all' && categoryStats[category as keyof typeof categoryStats] > 0 && (
                    <Text style={styles.categoryCount}>
                      {' '}({categoryStats[category as keyof typeof categoryStats]})
                    </Text>
                  )}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Achievements Grid */}
        {filteredAchievements.length > 0 ? (
          <View style={styles.achievementsContainer}>
            <Text style={styles.sectionTitle}>
              {selectedCategory === 'all' ? 'All Achievements' : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Achievements`}
            </Text>

            <View style={styles.achievementsGrid}>
              {filteredAchievements.map((achievement) => (
                <AchievementCard
                  key={achievement.achievementId}
                  achievement={achievement}
                  size="medium"
                  onPress={(achievement) => {
                    Alert.alert(
                      achievement.title,
                      `${achievement.description}\n\nEarned: ${achievementAPI.formatAchievementDate(achievement.earnedAt)}\nPoints: ${achievement.pointsReward} XP`,
                      [{ text: 'OK' }]
                    );
                  }}
                />
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="trophy-outline" size={64} color={colors.text.secondary} />
            <Text style={styles.emptyStateTitle}>
              {selectedCategory === 'all' ? 'No achievements yet' : `No ${selectedCategory} achievements yet`}
            </Text>
            <Text style={styles.emptyStateText}>
              {selectedCategory === 'all'
                ? 'Start your financial journey to unlock your first achievement!'
                : `Complete activities in the ${selectedCategory} category to earn achievements.`
              }
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Celebration Modal */}
      <CelebrationAnimation
        visible={showCelebration}
        achievement={celebrationAchievement}
        celebrationMessage={achievementData?.celebration}
        onClose={() => {
          setShowCelebration(false);
          setCelebrationAchievement(null);
        }}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1
  },
  scrollView: {
    flex: 1
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerLeft: {
    flex: 1
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: 4
  },
  headerRight: {
    alignItems: 'flex-end'
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  levelText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginLeft: SPACING.xs
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    padding: SPACING.lg,
    alignItems: 'center',
    marginHorizontal: SPACING.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: SPACING.sm
  },
  statLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
    marginTop: 4
  },
  motivationalContainer: {
    backgroundColor: colors.primary.main + '10',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary.main
  },
  motivationalMessage: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22
  },
  categoryFilterContainer: {
    marginBottom: SPACING.lg
  },
  categoryFilter: {
    paddingHorizontal: SPACING.lg
  },
  categoryButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: colors.background.primary,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: colors.border.light
  },
  categoryButtonActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary
  },
  categoryButtonTextActive: {
    color: '#FFFFFF'
  },
  categoryCount: {
    opacity: 0.8
  },
  achievementsContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: SPACING.lg
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xl * 2
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    textAlign: 'center'
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    textAlign: 'center'
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22
  }
});