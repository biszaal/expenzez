import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../app/auth/AuthContext';
import { savingsInsightsAPI, SavingsInsightsResponse } from '../../../services/api/savingsInsightsAPI';
import { SavingsActionButton } from '../../savings';
import { SHADOWS, SPACING, BORDER_RADIUS } from '../../../constants/Colors';

export const SavingsOpportunitiesCard: React.FC = () => {
  const { colors } = useTheme();
  const { user } = useAuth();

  const [savingsData, setSavingsData] = useState<SavingsInsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSavingsData = async () => {
      console.log('SavingsOpportunitiesCard: Loading widget, user:', user?.id ? 'available' : 'not available');

      // Show demo savings opportunities immediately
      setSavingsData({
        userId: user?.id || 'demo-user',
        totalPotentialMonthlySavings: 125,
        totalPotentialYearlySavings: 1500,
        opportunities: [
          {
            type: 'subscription_optimization',
            title: 'Optimize Subscriptions',
            description: 'Cancel or downgrade unused streaming services to save money each month.',
            potentialMonthlySavings: 35,
            potentialYearlySavings: 420,
            difficulty: 'easy',
            urgency: 'medium',
            goalImpact: {
              goalId: 'emergency-fund-001',
              goalTitle: 'Emergency Fund',
              monthsReduced: 2.1,
              acceleratedCompletion: '2 months earlier'
            },
            actionSteps: [
              'Review all active subscriptions',
              'Cancel unused services',
              'Downgrade premium plans you don\'t fully use'
            ],
            confidence: 0.85
          },
          {
            type: 'category_reduction',
            title: 'Reduce Dining Out',
            description: 'Cook more meals at home to significantly reduce food expenses.',
            potentialMonthlySavings: 90,
            potentialYearlySavings: 1080,
            difficulty: 'medium',
            urgency: 'high',
            goalImpact: {
              goalId: 'vacation-001',
              goalTitle: 'Summer Vacation',
              monthsReduced: 3.6,
              acceleratedCompletion: '3 months earlier'
            },
            actionSteps: [
              'Plan weekly meal prep',
              'Set a dining out budget',
              'Find quick home-cooking recipes'
            ],
            confidence: 0.75
          }
        ],
        topRecommendation: {
          type: 'category_reduction',
          title: 'Reduce Dining Out',
          description: 'Cook more meals at home to significantly reduce food expenses.',
          potentialMonthlySavings: 90,
          potentialYearlySavings: 1080,
          difficulty: 'medium',
          urgency: 'high',
          goalImpact: {
            goalId: 'vacation-001',
            goalTitle: 'Summer Vacation',
            monthsReduced: 3.6,
            acceleratedCompletion: '3 months earlier'
          },
          actionSteps: [
            'Plan weekly meal prep',
            'Set a dining out budget',
            'Find quick home-cooking recipes'
          ],
          confidence: 0.75
        },
        personalizedMessage: "These savings could help you reach your Emergency Fund 2 months faster and your Summer Vacation 3 months earlier!",
        lastUpdated: new Date().toISOString()
      });
      setLoading(false);

      // Comment out API call for now
      /*
      if (!user?.id) {
        console.log('SavingsOpportunitiesCard: No user ID available');
        setLoading(false);
        return;
      }

      try {
        const data = await savingsInsightsAPI.getSavingsOpportunities(user.id);
        console.log('SavingsOpportunitiesCard: Successfully loaded data:', data);
        setSavingsData(data);
      } catch (error) {
        console.error('SavingsOpportunitiesCard: Error loading savings data:', error);
      } finally {
        setLoading(false);
      }
      */
    };

    loadSavingsData();
  }, [user?.id]);

  if (loading || !savingsData) {
    const loadingStyles = createStyles(colors);
    return (
      <View style={[loadingStyles.container, { backgroundColor: colors.background.primary }]}>
        <View style={loadingStyles.loadingContent}>
          <Ionicons name="bulb-outline" size={24} color={colors.text.secondary} />
          <Text style={[loadingStyles.loadingText, { color: colors.text.secondary }]}>
            Analyzing spending patterns...
          </Text>
        </View>
      </View>
    );
  }

  const topOpportunities = savingsInsightsAPI.sortOpportunitiesByPriority(
    savingsData.opportunities
  ).slice(0, 2);

  const styles = createStyles(colors);

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="bulb" size={20} color={colors.accent.main} />
          <Text style={styles.headerTitle}>Savings Opportunities</Text>
        </View>
        {savingsData.totalPotentialMonthlySavings > 0 && (
          <View style={styles.totalSavingsContainer}>
            <Text style={styles.totalSavingsAmount}>
              {savingsInsightsAPI.formatSavingsAmount(savingsData.totalPotentialMonthlySavings)}
            </Text>
            <Text style={styles.totalSavingsLabel}>potential</Text>
          </View>
        )}
      </View>

      {/* Top Opportunities */}
      {topOpportunities.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.opportunitiesScroll}
        >
          {topOpportunities.map((opportunity, index) => {
            const typeColor = savingsInsightsAPI.getOpportunityTypeColor(opportunity.type);
            const typeIcon = savingsInsightsAPI.getOpportunityTypeIcon(opportunity.type);

            return (
              <TouchableOpacity
                key={index}
                style={[styles.opportunityCard, { borderLeftColor: typeColor }]}
                activeOpacity={0.8}
              >
                <View style={styles.opportunityHeader}>
                  <View style={[styles.opportunityIcon, { backgroundColor: typeColor + '20' }]}>
                    <Ionicons name={typeIcon as any} size={18} color={typeColor} />
                  </View>
                  <View style={styles.opportunityInfo}>
                    <Text style={styles.opportunityTitle} numberOfLines={1}>
                      {opportunity.title}
                    </Text>
                    <Text style={styles.opportunityAmount}>
                      {savingsInsightsAPI.formatSavingsAmount(opportunity.potentialMonthlySavings)}/month
                    </Text>
                  </View>
                </View>

                <Text style={styles.opportunityDescription} numberOfLines={2}>
                  {opportunity.description}
                </Text>

                <View style={styles.opportunityFooter}>
                  <View style={styles.urgencyBadge}>
                    <Text style={[styles.urgencyText, {
                      color: savingsInsightsAPI.getUrgencyColor(opportunity.urgency)
                    }]}>
                      {opportunity.urgency.toUpperCase()}
                    </Text>
                  </View>

                  {opportunity.goalImpact && (
                    <View style={styles.goalImpact}>
                      <Ionicons name="rocket" size={12} color={colors.primary.main} />
                      <Text style={styles.goalImpactText}>
                        -{savingsInsightsAPI.formatGoalAcceleration(opportunity.goalImpact.monthsReduced)}
                      </Text>
                    </View>
                  )}
                </View>

                <SavingsActionButton
                  opportunity={opportunity}
                  onPress={() => {
                    console.log('Savings action pressed:', opportunity.type);
                    // Handle action press
                  }}
                  variant="outline"
                  size="small"
                />
              </TouchableOpacity>
            );
          })}

          {/* View All Card */}
          <TouchableOpacity style={styles.viewAllCard} activeOpacity={0.8}>
            <Ionicons name="arrow-forward" size={24} color={colors.primary.main} />
            <Text style={styles.viewAllText}>View All</Text>
            <Text style={styles.viewAllSubtext}>
              {savingsData.opportunities.length - 2} more opportunities
            </Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View style={styles.noOpportunitiesContainer}>
          <Ionicons name="checkmark-circle" size={32} color={colors.success.main} />
          <Text style={styles.noOpportunitiesTitle}>
            Great job!
          </Text>
          <Text style={styles.noOpportunitiesText}>
            No immediate savings opportunities found. Keep tracking your expenses for personalized insights.
          </Text>
        </View>
      )}

      {/* Personalized Message */}
      {savingsData.personalizedMessage && (
        <View style={styles.messageContainer}>
          <Text style={styles.personalizedMessage}>
            💡 {savingsData.personalizedMessage}
          </Text>
        </View>
      )}
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
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
    marginBottom: SPACING.lg
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginLeft: SPACING.sm
  },
  totalSavingsContainer: {
    alignItems: 'flex-end'
  },
  totalSavingsAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.success.main
  },
  totalSavingsLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500'
  },
  opportunitiesScroll: {
    paddingRight: SPACING.lg
  },
  opportunityCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginRight: SPACING.md,
    width: 280,
    borderLeftWidth: 4,
    ...SHADOWS.sm
  },
  opportunityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm
  },
  opportunityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm
  },
  opportunityInfo: {
    flex: 1
  },
  opportunityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary
  },
  opportunityAmount: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success.main
  },
  opportunityDescription: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 16,
    marginBottom: SPACING.sm
  },
  opportunityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md
  },
  urgencyBadge: {
    backgroundColor: colors.background.primary,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  goalImpact: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  goalImpactText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary.main,
    marginLeft: 2
  },
  viewAllCard: {
    backgroundColor: colors.primary.main + '10',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    width: 140,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary.main + '30',
    borderStyle: 'dashed'
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary.main,
    marginTop: SPACING.xs
  },
  viewAllSubtext: {
    fontSize: 11,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 2
  },
  noOpportunitiesContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.lg
  },
  noOpportunitiesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs
  },
  noOpportunitiesText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18
  },
  messageContainer: {
    backgroundColor: colors.accent.main + '10',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent.main
  },
  personalizedMessage: {
    fontSize: 13,
    color: colors.text.secondary,
    fontStyle: 'italic',
    lineHeight: 16
  }
});