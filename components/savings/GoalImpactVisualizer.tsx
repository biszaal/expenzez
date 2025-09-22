import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { savingsInsightsAPI } from '../../services/api/savingsInsightsAPI';
import { SPACING, BORDER_RADIUS } from '../../constants/Colors';

interface GoalImpactVisualizerProps {
  goalImpact: {
    goalId: string;
    goalTitle: string;
    monthsReduced: number;
    acceleratedCompletion: string;
  };
}

export const GoalImpactVisualizer: React.FC<GoalImpactVisualizerProps> = ({
  goalImpact
}) => {
  const { colors } = useTheme();

  const formattedTimeReduction = savingsInsightsAPI.formatGoalAcceleration(goalImpact.monthsReduced);
  const acceleratedDate = new Date(goalImpact.acceleratedCompletion);

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      {/* Goal Impact Header */}
      <View style={styles.header}>
        <Ionicons name="rocket" size={20} color={colors.primary.main} />
        <Text style={styles.headerText}>Goal Impact</Text>
      </View>

      {/* Goal Title */}
      <Text style={styles.goalTitle}>
        {goalImpact.goalTitle}
      </Text>

      {/* Impact Visualization */}
      <View style={styles.impactContainer}>
        <View style={styles.impactItem}>
          <View style={styles.impactIcon}>
            <Ionicons name="time" size={18} color={colors.success.main} />
          </View>
          <View style={styles.impactText}>
            <Text style={styles.impactLabel}>Time Saved</Text>
            <Text style={styles.impactValue}>
              {formattedTimeReduction}
            </Text>
          </View>
        </View>

        <View style={styles.separator} />

        <View style={styles.impactItem}>
          <View style={styles.impactIcon}>
            <Ionicons name="calendar" size={18} color={colors.primary.main} />
          </View>
          <View style={styles.impactText}>
            <Text style={styles.impactLabel}>New Target Date</Text>
            <Text style={styles.impactValue}>
              {acceleratedDate.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </Text>
          </View>
        </View>
      </View>

      {/* Progress Acceleration Indicator */}
      <View style={styles.accelerationIndicator}>
        <View style={styles.accelerationTrack}>
          <View style={styles.accelerationFill} />
          <View style={styles.accelerationBoost} />
        </View>
        <Text style={styles.accelerationText}>
          ⚡ Goal completion accelerated by {formattedTimeReduction}
        </Text>
      </View>
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.primary.main + '10',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: colors.primary.main + '30'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm
  },
  headerText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary.main,
    marginLeft: SPACING.sm
  },
  goalTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: SPACING.md
  },
  impactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md
  },
  impactItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center'
  },
  impactIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm
  },
  impactText: {
    flex: 1
  },
  impactLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500'
  },
  impactValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary
  },
  separator: {
    width: 1,
    height: 40,
    backgroundColor: colors.border.light,
    marginHorizontal: SPACING.md
  },
  accelerationIndicator: {
    alignItems: 'center'
  },
  accelerationTrack: {
    width: '100%',
    height: 6,
    backgroundColor: colors.border.light,
    borderRadius: 3,
    position: 'relative',
    marginBottom: SPACING.sm
  },
  accelerationFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '70%',
    height: '100%',
    backgroundColor: colors.text.secondary,
    borderRadius: 3
  },
  accelerationBoost: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: '30%',
    height: '100%',
    backgroundColor: colors.success.main,
    borderRadius: 3
  },
  accelerationText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.success.main,
    textAlign: 'center'
  }
});