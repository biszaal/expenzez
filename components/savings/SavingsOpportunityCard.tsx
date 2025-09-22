import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { SavingsOpportunity, savingsInsightsAPI } from '../../services/api/savingsInsightsAPI';
import { ConfidenceIndicator } from './ConfidenceIndicator';
import { GoalImpactVisualizer } from './GoalImpactVisualizer';
import { SHADOWS, SPACING, BORDER_RADIUS } from '../../constants/Colors';

interface SavingsOpportunityCardProps {
  opportunity: SavingsOpportunity;
  onActionPress?: (opportunity: SavingsOpportunity) => void;
  expanded?: boolean;
  onToggleExpanded?: () => void;
}

export const SavingsOpportunityCard: React.FC<SavingsOpportunityCardProps> = ({
  opportunity,
  onActionPress,
  expanded = false,
  onToggleExpanded
}) => {
  const { colors } = useTheme();

  const typeColor = savingsInsightsAPI.getOpportunityTypeColor(opportunity.type);
  const typeIcon = savingsInsightsAPI.getOpportunityTypeIcon(opportunity.type);
  const urgencyColor = savingsInsightsAPI.getUrgencyColor(opportunity.urgency);
  const difficultyColor = savingsInsightsAPI.getDifficultyColor(opportunity.difficulty);

  const styles = createStyles(colors, typeColor, urgencyColor);

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={onToggleExpanded}
        activeOpacity={0.8}
      >
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <Ionicons
              name={typeIcon as any}
              size={24}
              color={typeColor}
            />
          </View>

          <View style={styles.headerText}>
            <Text style={styles.title} numberOfLines={2}>
              {opportunity.title}
            </Text>
            <Text style={styles.description} numberOfLines={2}>
              {opportunity.description}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.savingsContainer}>
            <Text style={styles.savingsAmount}>
              {savingsInsightsAPI.formatSavingsAmount(opportunity.potentialMonthlySavings)}
            </Text>
            <Text style={styles.savingsLabel}>per month</Text>
          </View>

          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={colors.text.secondary}
          />
        </View>
      </TouchableOpacity>

      {/* Badges */}
      <View style={styles.badgesContainer}>
        <View style={[styles.badge, { backgroundColor: urgencyColor + '20' }]}>
          <Text style={[styles.badgeText, { color: urgencyColor }]}>
            {opportunity.urgency.toUpperCase()} PRIORITY
          </Text>
        </View>

        <View style={[styles.badge, { backgroundColor: difficultyColor + '20' }]}>
          <Text style={[styles.badgeText, { color: difficultyColor }]}>
            {opportunity.difficulty.toUpperCase()}
          </Text>
        </View>

        <ConfidenceIndicator confidence={opportunity.confidence} />
      </View>

      {/* Expanded Content */}
      {expanded && (
        <View style={styles.expandedContent}>
          {/* Goal Impact */}
          {opportunity.goalImpact && (
            <GoalImpactVisualizer goalImpact={opportunity.goalImpact} />
          )}

          {/* Annual Savings */}
          <View style={styles.annualSavingsContainer}>
            <Ionicons name="trending-up" size={18} color={colors.success.main} />
            <Text style={styles.annualSavingsText}>
              Potential yearly savings: {' '}
              <Text style={styles.annualSavingsAmount}>
                {savingsInsightsAPI.formatSavingsAmount(opportunity.potentialYearlySavings)}
              </Text>
            </Text>
          </View>

          {/* Action Steps */}
          <View style={styles.actionStepsContainer}>
            <Text style={styles.actionStepsTitle}>Action Steps:</Text>
            {opportunity.actionSteps.map((step, index) => (
              <View key={index} style={styles.actionStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: typeColor }]}
            onPress={() => onActionPress?.(opportunity)}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Start Saving</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const createStyles = (colors: any, typeColor: string, urgencyColor: string) => StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.sm,
    borderLeftWidth: 4,
    borderLeftColor: typeColor,
    ...SHADOWS.md
  },
  header: {
    flexDirection: 'row',
    padding: SPACING.lg,
    alignItems: 'center'
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center'
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
  headerText: {
    flex: 1
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 2
  },
  description: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 18
  },
  headerRight: {
    alignItems: 'flex-end'
  },
  savingsContainer: {
    alignItems: 'flex-end',
    marginBottom: SPACING.xs
  },
  savingsAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.success.main
  },
  savingsLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500'
  },
  badgesContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    flexWrap: 'wrap'
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.xs,
    marginBottom: SPACING.xs
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  expandedContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.light
  },
  annualSavingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success.main + '10',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg
  },
  annualSavingsText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginLeft: SPACING.sm,
    flex: 1
  },
  annualSavingsAmount: {
    fontWeight: '700',
    color: colors.success.main
  },
  actionStepsContainer: {
    marginBottom: SPACING.lg
  },
  actionStepsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: SPACING.md
  },
  actionStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: typeColor,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
    marginTop: 2
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.sm
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: SPACING.sm
  }
});