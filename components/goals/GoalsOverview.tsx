import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { GoalsResponse, goalsAPI } from '../../services/api/goalsAPI';
import { SHADOWS, SPACING, BORDER_RADIUS } from '../../constants/Colors';

interface GoalsOverviewProps {
  goalsData: GoalsResponse;
}

export const GoalsOverview: React.FC<GoalsOverviewProps> = ({ goalsData }) => {
  const { colors } = useTheme();

  const overallProgress = goalsData.totalGoalAmount > 0
    ? (goalsData.totalSavedTowardsGoals / goalsData.totalGoalAmount) * 100
    : 0;

  const styles = createStyles(colors, overallProgress);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="trophy" size={24} color="#FFD700" />
          <Text style={styles.headerTitle}>Your Goals</Text>
        </View>
        <View style={styles.goalCount}>
          <Text style={styles.goalCountNumber}>{goalsData.activeGoals.length}</Text>
          <Text style={styles.goalCountLabel}>active</Text>
        </View>
      </View>

      {/* Overall Progress */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Total Progress</Text>
          <Text style={styles.progressPercentage}>
            {Math.round(overallProgress)}%
          </Text>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
        </View>

        <View style={styles.progressDetails}>
          <Text style={styles.progressAmount}>
            {goalsAPI.formatCurrency(goalsData.totalSavedTowardsGoals)} of {goalsAPI.formatCurrency(goalsData.totalGoalAmount)}
          </Text>
          <Text style={styles.monthlyAverage}>
            Avg. {goalsAPI.formatCurrency(goalsData.averageMonthlyProgress)}/month
          </Text>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsSection}>
        <View style={styles.statItem}>
          <Ionicons name="trending-up-outline" size={20} color={colors.success.main} />
          <Text style={styles.statValue}>
            {goalsData.completedGoals.length}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Ionicons name="time-outline" size={20} color={colors.primary.main} />
          <Text style={styles.statValue}>
            {goalsData.activeGoals.length}
          </Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Ionicons name="calendar-outline" size={20} color={colors.accent.main} />
          <Text style={styles.statValue}>
            {Math.round(goalsData.averageMonthlyProgress)}
          </Text>
          <Text style={styles.statLabel}>Monthly Avg</Text>
        </View>
      </View>

      {/* Motivational Message */}
      {goalsData.motivationalMessage && (
        <View style={styles.messageContainer}>
          <Text style={styles.motivationalMessage}>
            💪 {goalsData.motivationalMessage}
          </Text>
        </View>
      )}
    </View>
  );
};

const createStyles = (colors: any, overallProgress: number) => StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.sm,
    ...SHADOWS.md
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginLeft: SPACING.sm
  },
  goalCount: {
    alignItems: 'center'
  },
  goalCountNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary.main
  },
  goalCountLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500'
  },
  progressSection: {
    marginBottom: SPACING.lg
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary
  },
  progressPercentage: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary.main
  },
  progressBarContainer: {
    marginBottom: SPACING.sm
  },
  progressTrack: {
    height: 12,
    backgroundColor: colors.background.tertiary,
    borderRadius: 6,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    width: `${Math.min(overallProgress, 100)}%`,
    backgroundColor: colors.primary.main,
    borderRadius: 6
  },
  progressDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  progressAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary
  },
  monthlyAverage: {
    fontSize: 12,
    color: colors.success.main,
    fontWeight: '500'
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md
  },
  statItem: {
    alignItems: 'center',
    flex: 1
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: SPACING.xs,
    marginBottom: 2
  },
  statLabel: {
    fontSize: 11,
    color: colors.text.secondary,
    fontWeight: '500',
    textAlign: 'center'
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border.light,
    marginHorizontal: SPACING.sm
  },
  messageContainer: {
    backgroundColor: colors.success.main + '10',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.success.main
  },
  motivationalMessage: {
    fontSize: 14,
    color: colors.text.primary,
    fontStyle: 'italic',
    lineHeight: 18,
    textAlign: 'center'
  }
});