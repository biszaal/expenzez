import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, RefreshControl, StyleSheet, View, Text, Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../auth/AuthContext';
import { TabLoadingScreen } from '../../components/ui';
import { achievementAPI, AchievementResponse } from '../../services/api/achievementAPI';
import { AchievementCalculator } from '../../services/achievementCalculator';
import { XPService, UserXPData } from '../../services/xpService';
import { useXP } from '../../hooks/useXP';
import {
  AchievementCard,
  LevelProgressBar,
  CelebrationAnimation
} from '../../components/achievements';
import { SPACING, BORDER_RADIUS } from '../../constants/Colors';

export default function ProgressScreen() {
  const { colors } = useTheme();
  const { user, isLoggedIn } = useAuth();
  const { awardXPSilently } = useXP();

  // Styles
  const styles = createStyles(colors);

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [achievementData, setAchievementData] = useState<AchievementResponse | null>(null);
  const [xpData, setXpData] = useState<UserXPData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationAchievement, setCelebrationAchievement] = useState(null);

  // Load achievement data
  const loadAchievementData = useCallback(async (isRefresh = false) => {
    console.log('🏆 [Progress] Loading tab, user:', user?.id ? `available (${user.id})` : 'not available', 'isLoggedIn:', isLoggedIn, 'isRefresh:', isRefresh);

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Use user ID if available, otherwise use fallback for logged in users
      let userId = user?.id;
      if (isLoggedIn && !userId) {
        console.log('🏆 [Progress] Using fallback user ID for logged in user');
        userId = 'current_user'; // Use a fallback ID for logged in users
      }

      // Only show login message if truly not logged in
      if (!isLoggedIn) {
        console.log('🏆 [Progress] User not logged in, using guest data');

        const guestData = {
          userId: 'guest',
          progress: { level: 1, totalPoints: 0, pointsToNextLevel: 100, achievementCount: 0 },
          achievements: [],
          streaks: { currentSavingsStreak: 0, longestSavingsStreak: 0, currentBudgetStreak: 0, longestBudgetStreak: 0 },
          milestones: { totalSaved: 0, goalsCompleted: 0, transactionsLogged: 0, categoriesUsed: 0 },
          newAchievements: [],
          celebration: null,
          motivationalMessage: "Please log in to track your financial achievements!",
        };

        setAchievementData(guestData);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      console.log('🏆 [Progress] Calculating dynamic achievements for user:', userId);

      try {
        // Calculate achievements based on real user data
        const achievementData = await AchievementCalculator.calculateUserAchievements(userId);
        setAchievementData(achievementData);

        // Load XP data and sync with achievements
        await XPService.syncWithAchievements(userId);
        const userXP = await XPService.getUserXP();
        setXpData(userXP);

        // Award XP for checking progress (silently, no popup)
        if (user?.id) {
          awardXPSilently('check-progress');
        }
      } catch (calculationError) {
        console.error('🏆 [Progress] Achievement calculation failed:', calculationError);

        // Provide fallback data if calculation fails
        const fallbackData = {
          userId: userId,
          progress: { level: 1, totalPoints: 0, pointsToNextLevel: 100, achievementCount: 0 },
          achievements: [],
          streaks: { currentSavingsStreak: 0, longestSavingsStreak: 0, currentBudgetStreak: 0, longestBudgetStreak: 0 },
          milestones: { totalSaved: 0, goalsCompleted: 0, transactionsLogged: 0, categoriesUsed: 0 },
          newAchievements: [],
          celebration: null,
          motivationalMessage: "Start your financial journey to unlock achievements!",
        };

        setAchievementData(fallbackData);
        console.log('🏆 [Progress] Using fallback achievement data');
      }

      // Check if we have achievement data to log (only if not using fallback)
      if (user?.id && achievementData) {
        console.log('✅ [Progress] Dynamic achievement data loaded:', {
          level: achievementData.progress?.level,
          totalPoints: achievementData.progress?.totalPoints,
          achievementCount: achievementData.achievements?.length,
          transactionsLogged: achievementData.milestones?.transactionsLogged,
          categoriesUsed: achievementData.milestones?.categoriesUsed
        });
      }

      // Show celebration for new achievements (for future enhancement)
      if (achievementData && achievementData.newAchievements && achievementData.newAchievements.length > 0 && !isRefresh) {
        setCelebrationAchievement(achievementData.newAchievements[0] as any);
        setShowCelebration(true);
      }

    } catch (error: any) {
      console.error('❌ [Progress] Error loading achievement data:', error);
      setError('Failed to load progress data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, isLoggedIn, awardXPSilently]);

  // Initial load - retry when user becomes available
  // Clear data when user logs out
  useEffect(() => {
    if (!isLoggedIn || !user) {
      // Clear all user-specific data
      setAchievementData(null);
      setXpData(null);
      setError(null);
      setCelebrationAchievement(null);
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    loadAchievementData();
  }, [loadAchievementData]); // Re-run when loadAchievementData changes (which includes user.id and isLoggedIn)

  // Check for XP updates periodically
  useEffect(() => {
    const checkForXPUpdates = async () => {
      try {
        const lastUpdateFlag = await AsyncStorage.getItem('@xp_update_flag');
        if (lastUpdateFlag) {
          // Clear the flag and refresh data
          await AsyncStorage.removeItem('@xp_update_flag');
          console.log('🏆 [Progress] XP update detected, refreshing...');

          // Reload XP data
          if (user?.id) {
            const userXP = await XPService.getUserXP();
            setXpData(userXP);
          }
        }
      } catch (error) {
        console.warn('🏆 [Progress] Error checking XP updates:', error);
      }
    };

    // Check every 2 seconds
    const interval = setInterval(checkForXPUpdates, 2000);
    return () => clearInterval(interval);
  }, [user?.id]);

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
    const stats: Record<string, number> = {};

    achievementData?.achievements.forEach(achievement => {
      const category = achievement.category;
      stats[category] = (stats[category] || 0) + 1;
    });

    return stats;
  };

  const categoryStats = getCategoryStats();

  if (loading) {
    return <TabLoadingScreen message="Loading your progress..." />;
  }

  // Show loading if user is not loaded yet AND no achievement data exists (authentication in progress)
  if (!user?.id && !error && !achievementData) {
    return <TabLoadingScreen message="Authenticating..." />;
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
        {/* Clean Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Progress</Text>
          <Text style={styles.headerSubtitle}>
            Keep building great financial habits!
          </Text>
        </View>

        {/* Level Progress */}
        {xpData && (
          <LevelProgressBar
            currentLevel={xpData.level}
            totalPoints={xpData.totalXP}
            pointsToNextLevel={XPService.calculateLevelProgress(xpData.totalXP).xpToNextLevel}
            animated={true}
          />
        )}

        {/* Enhanced Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.statCardXP]}>
            <View style={styles.statCardHeader}>
              <View style={styles.statIconContainer}>
                <Ionicons name="star" size={24} color="#60A5FA" />
              </View>
              <View style={styles.statTrend}>
                <Ionicons name="trending-up" size={12} color="#10B981" />
              </View>
            </View>
            <Text style={styles.statValue}>
              {xpData?.totalXP || 0}
            </Text>
            <Text style={styles.statLabel}>Total XP</Text>
            <View style={styles.statProgress}>
              <View style={[styles.statProgressBar, { backgroundColor: '#60A5FA' }]} />
            </View>
          </View>

          <View style={[styles.statCard, styles.statCardAchievements]}>
            <View style={styles.statCardHeader}>
              <View style={styles.statIconContainer}>
                <Ionicons name="trophy" size={24} color="#FFD700" />
              </View>
              <View style={styles.statBadge}>
                <Text style={styles.statBadgeText}>{achievementData?.achievements.filter(a => a.earnedAt).length || 0}</Text>
              </View>
            </View>
            <Text style={styles.statValue}>
              {achievementData?.achievements.length || 0}
            </Text>
            <Text style={styles.statLabel}>Achievements</Text>
            <View style={styles.statProgress}>
              <View style={[styles.statProgressBar, { backgroundColor: '#FFD700' }]} />
            </View>
          </View>

          <View style={[styles.statCard, styles.statCardStreak]}>
            <View style={styles.statCardHeader}>
              <View style={styles.statIconContainer}>
                <Ionicons name="flame" size={24} color="#FF6B6B" />
              </View>
              <View style={styles.statStreakIndicator}>
                <Text style={styles.statStreakText}>🔥</Text>
              </View>
            </View>
            <Text style={styles.statValue}>
              {achievementData?.streaks.currentSavingsStreak || 0}
            </Text>
            <Text style={styles.statLabel}>Day Streak</Text>
            <View style={styles.statProgress}>
              <View style={[styles.statProgressBar, { backgroundColor: '#FF6B6B' }]} />
            </View>
          </View>
        </View>

        {/* Enhanced Motivational Message */}
        {achievementData?.motivationalMessage && (
          <View style={styles.motivationalContainer}>
            <View style={styles.motivationalHeader}>
              <Ionicons name="sparkles" size={20} color={colors.primary.main} />
              <Text style={styles.motivationalTitle}>Keep Going!</Text>
              <Ionicons name="sparkles" size={20} color={colors.primary.main} />
            </View>
            <Text style={styles.motivationalMessage}>
              {achievementData.motivationalMessage}
            </Text>
            <View style={styles.motivationalFooter}>
              <View style={styles.progressDots}>
                {Array.from({ length: 5 }, (_, index) => {
                  const progressPercent = xpData ? XPService.calculateLevelProgress(xpData.totalXP).progressPercent : 0;
                  const isActive = (index + 1) * 20 <= progressPercent;
                  return (
                    <View
                      key={index}
                      style={[styles.progressDot, isActive && styles.progressDotActive]}
                    />
                  );
                })}
              </View>
            </View>
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
                  {category !== 'all' && categoryStats[category] > 0 && (
                    <Text style={styles.categoryCount}>
                      {' '}({categoryStats[category]})
                    </Text>
                  )}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* XP Leveling Guide */}
        <View style={styles.xpGuideContainer}>
          <View style={styles.xpGuideHeader}>
            <Ionicons name="rocket" size={24} color={colors.primary.main} />
            <Text style={styles.sectionTitle}>How to Level Up</Text>
          </View>
          <Text style={styles.xpGuideSubtitle}>
            Complete these activities to earn XP and level up faster!
          </Text>

          <View style={styles.xpActivityList}>
            {/* Daily Activities */}
            <View style={styles.xpCategorySection}>
              <Text style={styles.xpCategoryTitle}>Daily Activities</Text>

              <View style={styles.xpActivityItem}>
                <View style={styles.xpActivityLeft}>
                  <View style={[styles.xpActivityIcon, { backgroundColor: '#22C55E20' }]}>
                    <Ionicons name="add-circle" size={20} color="#22C55E" />
                  </View>
                  <View style={styles.xpActivityContent}>
                    <Text style={styles.xpActivityTitle}>Add Expense</Text>
                    <Text style={styles.xpActivityDescription}>Track your daily spending</Text>
                  </View>
                </View>
                <View style={styles.xpReward}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={styles.xpRewardText}>+5 XP</Text>
                </View>
              </View>

              <View style={styles.xpActivityItem}>
                <View style={styles.xpActivityLeft}>
                  <View style={[styles.xpActivityIcon, { backgroundColor: '#3B82F620' }]}>
                    <Ionicons name="trending-up" size={20} color="#3B82F6" />
                  </View>
                  <View style={styles.xpActivityContent}>
                    <Text style={styles.xpActivityTitle}>Check Progress</Text>
                    <Text style={styles.xpActivityDescription}>Review your financial stats</Text>
                  </View>
                </View>
                <View style={styles.xpReward}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={styles.xpRewardText}>+3 XP</Text>
                </View>
              </View>
            </View>

            {/* Weekly Goals */}
            <View style={styles.xpCategorySection}>
              <Text style={styles.xpCategoryTitle}>Weekly Goals</Text>

              <View style={styles.xpActivityItem}>
                <View style={styles.xpActivityLeft}>
                  <View style={[styles.xpActivityIcon, { backgroundColor: '#F59E0B20' }]}>
                    <Ionicons name="calendar" size={20} color="#F59E0B" />
                  </View>
                  <View style={styles.xpActivityContent}>
                    <Text style={styles.xpActivityTitle}>7-Day Streak</Text>
                    <Text style={styles.xpActivityDescription}>Track expenses for a full week</Text>
                  </View>
                </View>
                <View style={styles.xpReward}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={styles.xpRewardText}>+25 XP</Text>
                </View>
              </View>

              <View style={styles.xpActivityItem}>
                <View style={styles.xpActivityLeft}>
                  <View style={[styles.xpActivityIcon, { backgroundColor: '#8B5CF620' }]}>
                    <Ionicons name="pie-chart" size={20} color="#8B5CF6" />
                  </View>
                  <View style={styles.xpActivityContent}>
                    <Text style={styles.xpActivityTitle}>Budget Review</Text>
                    <Text style={styles.xpActivityDescription}>Stay within weekly budget</Text>
                  </View>
                </View>
                <View style={styles.xpReward}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={styles.xpRewardText}>+20 XP</Text>
                </View>
              </View>
            </View>

            {/* Major Milestones */}
            <View style={styles.xpCategorySection}>
              <Text style={styles.xpCategoryTitle}>Major Milestones</Text>

              <View style={styles.xpActivityItem}>
                <View style={styles.xpActivityLeft}>
                  <View style={[styles.xpActivityIcon, { backgroundColor: '#EF444420' }]}>
                    <Ionicons name="flash" size={20} color="#EF4444" />
                  </View>
                  <View style={styles.xpActivityContent}>
                    <Text style={styles.xpActivityTitle}>100 Transactions</Text>
                    <Text style={styles.xpActivityDescription}>Reach transaction milestone</Text>
                  </View>
                </View>
                <View style={styles.xpReward}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={styles.xpRewardText}>+100 XP</Text>
                </View>
              </View>

              <View style={styles.xpActivityItem}>
                <View style={styles.xpActivityLeft}>
                  <View style={[styles.xpActivityIcon, { backgroundColor: '#10B98120' }]}>
                    <Ionicons name="trophy" size={20} color="#10B981" />
                  </View>
                  <View style={styles.xpActivityContent}>
                    <Text style={styles.xpActivityTitle}>Master Saver</Text>
                    <Text style={styles.xpActivityDescription}>Save 20% of income for 3 months</Text>
                  </View>
                </View>
                <View style={styles.xpReward}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={styles.xpRewardText}>+300 XP</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Level Up Benefits */}
          <View style={styles.levelBenefitsContainer}>
            <Text style={styles.levelBenefitsTitle}>Level Up Benefits</Text>
            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <Ionicons name="gift" size={16} color={colors.accent.main} />
                <Text style={styles.benefitText}>Unlock new achievement badges</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="analytics" size={16} color={colors.accent.main} />
                <Text style={styles.benefitText}>Access advanced insights</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="star" size={16} color={colors.accent.main} />
                <Text style={styles.benefitText}>Earn exclusive rewards</Text>
              </View>
            </View>
          </View>
        </View>
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background.primary,
    borderRadius: 20,
    padding: SPACING.lg,
    marginHorizontal: SPACING.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    position: 'relative',
    overflow: 'hidden'
  },
  statCardXP: {
    borderLeftWidth: 4,
    borderLeftColor: '#60A5FA',
    backgroundColor: colors.background.primary
  },
  statCardAchievements: {
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
    backgroundColor: colors.background.primary
  },
  statCardStreak: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
    backgroundColor: colors.background.primary
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: SPACING.sm
  },
  statIconContainer: {
    backgroundColor: colors.background.secondary,
    padding: 8,
    borderRadius: 12
  },
  statTrend: {
    backgroundColor: '#10B98120',
    padding: 4,
    borderRadius: 8
  },
  statBadge: {
    backgroundColor: '#FFD70020',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10
  },
  statBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFD700'
  },
  statStreakIndicator: {
    transform: [{ rotate: '10deg' }]
  },
  statStreakText: {
    fontSize: 16
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text.primary,
    marginTop: SPACING.xs
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  statProgress: {
    width: '100%',
    height: 3,
    backgroundColor: colors.background.tertiary,
    borderRadius: 2,
    marginTop: SPACING.sm,
    overflow: 'hidden'
  },
  statProgressBar: {
    height: '100%',
    width: '70%',
    borderRadius: 2
  },
  motivationalContainer: {
    backgroundColor: colors.primary.main[50],
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    padding: SPACING.xl,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.primary.main[200],
    shadowColor: colors.primary.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  motivationalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md
  },
  motivationalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary.main,
    marginHorizontal: SPACING.sm
  },
  motivationalMessage: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.md
  },
  motivationalFooter: {
    alignItems: 'center'
  },
  progressDots: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border.light,
    marginHorizontal: 4
  },
  progressDotActive: {
    backgroundColor: colors.primary.main,
    width: 10,
    height: 10,
    borderRadius: 5
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
  achievementsList: {
    marginBottom: SPACING.md
  },
  achievementItem: {
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border.light
  },
  achievementLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md
  },
  achievementContent: {
    flex: 1
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4
  },
  achievementDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 18,
    marginBottom: 4
  },
  achievementDate: {
    fontSize: 12,
    color: colors.text.tertiary,
    fontWeight: '500'
  },
  achievementRight: {
    alignItems: 'flex-end'
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: SPACING.xs
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent.main,
    marginLeft: 4
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.main[50],
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    marginTop: SPACING.sm
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary.main,
    marginRight: SPACING.xs
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
  },

  // XP Guide Styles
  xpGuideContainer: {
    backgroundColor: colors.background.primary,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xl + SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    shadowColor: colors.shadow.medium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.border.light
  },
  xpGuideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm
  },
  xpGuideSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: SPACING.lg,
    lineHeight: 20
  },
  xpActivityList: {
    gap: SPACING.xl
  },
  xpCategorySection: {
    gap: SPACING.md
  },
  xpCategoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: SPACING.md,
    letterSpacing: 0.5
  },
  xpActivityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.secondary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    shadowColor: colors.shadow.subtle,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1
  },
  xpActivityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  xpActivityIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md
  },
  xpActivityContent: {
    flex: 1
  },
  xpActivityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4
  },
  xpActivityDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20
  },
  xpReward: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.xl,
    gap: 6,
    shadowColor: colors.primary.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2
  },
  xpRewardText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  levelBenefitsContainer: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.light
  },
  levelBenefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: SPACING.md
  },
  benefitsList: {
    gap: SPACING.sm
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm
  },
  benefitText: {
    fontSize: 14,
    color: colors.text.secondary,
    flex: 1
  }
});