import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { FinancialGoal, GoalProgress, goalsAPI } from '../../services/api/goalsAPI';
import { SHADOWS, SPACING, BORDER_RADIUS } from '../../constants/Colors';

interface GoalCardProps {
  goal: FinancialGoal;
  progress: GoalProgress;
  onPress: (goal: FinancialGoal) => void;
  onQuickAction?: (goalId: string, action: 'contribute' | 'edit' | 'pause') => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  progress,
  onPress,
  onQuickAction
}) => {
  const { colors } = useTheme();

  const typeColor = goalsAPI.getGoalTypeColor(goal.type);
  const typeIcon = goalsAPI.getGoalTypeIcon(goal.type);
  const priorityColor = goalsAPI.getPriorityColor(goal.priority || 'low');

  const styles = createStyles(colors, typeColor, progress.progressPercentage);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(goal)}
      activeOpacity={0.8}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <Ionicons name={typeIcon as any} size={24} color={typeColor} />
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {goal.title}
            </Text>
            <View style={styles.metaContainer}>
              {goal.priority && (
                <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '20' }]}>
                  <Text style={[styles.priorityText, { color: priorityColor }]}>
                    {goal.priority.toUpperCase()}
                  </Text>
                </View>
              )}
              <Text style={styles.timeRemaining}>
                {progress.daysRemaining >= 0 ? goalsAPI.formatTimeRemaining(progress.daysRemaining) : 'No deadline'} left
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => onQuickAction?.(goal.goalId, 'contribute')}
        >
          <Ionicons name="add-circle-outline" size={24} color={colors.primary.main} />
        </TouchableOpacity>
      </View>

      {/* Progress Section */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>
            {goalsAPI.formatCurrency(goal.currentAmount || 0)} of {goalsAPI.formatCurrency(goal.targetAmount || 0)}
          </Text>
          <Text style={[styles.percentageText, {
            color: progress.isOnTrack ? colors.success.main : colors.warning.main
          }]}>
            {Math.round(progress.progressPercentage || 0)}%
          </Text>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
          {progress.isOnTrack && (
            <Ionicons name="checkmark-circle" size={16} color={colors.success.main} style={styles.trackingIcon} />
          )}
        </View>

        <Text style={styles.remainingText}>
          {goalsAPI.formatCurrency(progress.amountRemaining || 0)} remaining
        </Text>
      </View>

      {/* Next Milestone */}
      {progress.nextMilestone && (
        <View style={styles.milestoneSection}>
          <View style={styles.milestoneHeader}>
            <Ionicons name="flag-outline" size={16} color={colors.accent.main} />
            <Text style={styles.milestoneTitle}>Next milestone</Text>
          </View>
          <Text style={styles.milestoneTarget}>
            {goalsAPI.formatCurrency(progress.nextMilestone.targetAmount)} - {progress.nextMilestone.title}
          </Text>
        </View>
      )}

      {/* Auto-save indicator */}
      {goal.autoSaveSettings?.enabled && (
        <View style={styles.autoSaveIndicator}>
          <Ionicons name="repeat-outline" size={14} color={colors.primary.main} />
          <Text style={styles.autoSaveText}>
            Auto-saving {goalsAPI.formatCurrency(goal.autoSaveSettings.amount)} {goal.autoSaveSettings.frequency}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const createStyles = (colors: any, typeColor: string, progressPercentage: number) => StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.sm,
    borderLeftWidth: 4,
    borderLeftColor: typeColor,
    ...SHADOWS.md
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: typeColor + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md
  },
  titleContainer: {
    flex: 1
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: SPACING.xs
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  priorityBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.sm
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  timeRemaining: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500'
  },
  moreButton: {
    padding: SPACING.sm
  },
  progressSection: {
    marginBottom: SPACING.md
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary
  },
  percentageText: {
    fontSize: 16,
    fontWeight: '700'
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.background.tertiary,
    borderRadius: 4,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    width: `${Math.min(Math.max(progressPercentage || 0, 0), 100)}%`,
    backgroundColor: typeColor,
    borderRadius: 4
  },
  trackingIcon: {
    marginLeft: SPACING.sm
  },
  remainingText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center'
  },
  milestoneSection: {
    backgroundColor: colors.accent.main + '10',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs
  },
  milestoneTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent.main,
    marginLeft: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  milestoneTarget: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary
  },
  autoSaveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main + '10',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm
  },
  autoSaveText: {
    fontSize: 12,
    color: colors.primary.main,
    fontWeight: '500',
    marginLeft: SPACING.xs
  }
});