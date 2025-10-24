import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { insightsEngine, MonthlySpendingTrend } from '../../services/insightsEngine';
import { spacing, borderRadius } from '../../constants/theme';
import { useSubscription, PremiumFeature } from '../../services/subscriptionService';
import PremiumPaywall from '../../components/PremiumPaywall';

const { width } = Dimensions.get('window');

export default function TrendsAnalysisScreen() {
  const { colors } = useTheme();
  const { hasFeatureAccess } = useSubscription();
  const [trends, setTrends] = useState<MonthlySpendingTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<3 | 6 | 12>(6);

  // Check if user has access to advanced analytics
  const analyticsAccess = hasFeatureAccess(PremiumFeature.ADVANCED_ANALYTICS);
  if (!analyticsAccess.hasAccess) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color={colors.primary[500]} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text.primary }]}>
              Spending Trends
            </Text>
          </View>
        </View>
        <PremiumPaywall
          feature="Advanced Analytics"
          description="Get detailed spending trends, monthly breakdowns, and key insights to understand your financial patterns better."
        />
      </SafeAreaView>
    );
  }

  useEffect(() => {
    loadTrends();
  }, [selectedPeriod]);

  const loadTrends = async () => {
    try {
      setLoading(true);
      const trendData = await insightsEngine.getSpendingTrend(selectedPeriod);
      setTrends(trendData);
    } catch (error) {
      console.error('Error loading trends:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMonth = (monthStr: string) => {
    const date = new Date(monthStr + '-01');
    return date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
  };

  const getChangeIndicator = (change: number) => {
    if (change > 5) return { icon: 'trending-up', color: '#EF4444', text: `+${change.toFixed(0)}%` };
    if (change < -5) return { icon: 'trending-down', color: '#10B981', text: `${change.toFixed(0)}%` };
    return { icon: 'remove', color: '#6B7280', text: '~0%' };
  };

  const getMaxAmount = () => {
    if (trends.length === 0) return 1000;
    return Math.max(...trends.map(t => t.totalSpent));
  };

  const renderSimpleChart = () => {
    if (trends.length === 0) return null;

    const maxAmount = getMaxAmount();
    const chartWidth = width - (spacing.md * 4);
    const barWidth = Math.max(20, (chartWidth - (trends.length - 1) * 8) / trends.length);

    return (
      <View style={styles.chartContainer}>
        <Text style={[styles.chartTitle, { color: colors.text.primary }]}>
          Monthly Spending Trend
        </Text>

        <View style={styles.chart}>
          <View style={styles.yAxis}>
            <Text style={[styles.axisLabel, { color: colors.text.secondary }]}>
              £{maxAmount.toFixed(0)}
            </Text>
            <Text style={[styles.axisLabel, { color: colors.text.secondary }]}>
              £{(maxAmount * 0.5).toFixed(0)}
            </Text>
            <Text style={[styles.axisLabel, { color: colors.text.secondary }]}>
              £0
            </Text>
          </View>

          <View style={styles.barsContainer}>
            {trends.map((trend, index) => {
              const height = Math.max(4, (trend.totalSpent / maxAmount) * 120);
              const changeIndicator = getChangeIndicator(trend.comparedToPrevious);

              return (
                <View key={trend.month} style={[styles.barColumn, { width: barWidth }]}>
                  <View style={styles.barWrapper}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height,
                          backgroundColor: colors.primary[500],
                          width: barWidth - 4,
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.barLabel}>
                    <Text style={[styles.monthLabel, { color: colors.text.secondary }]}>
                      {formatMonth(trend.month)}
                    </Text>
                    {index > 0 && (
                      <View style={styles.changeIndicator}>
                        <Ionicons
                          name={changeIndicator.icon as any}
                          size={10}
                          color={changeIndicator.color}
                        />
                        <Text style={[styles.changeText, { color: changeIndicator.color }]}>
                          {changeIndicator.text}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            Analyzing spending trends...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={colors.primary[500]} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Spending Trends
          </Text>
        </View>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {[3, 6, 12].map((period) => (
          <TouchableOpacity
            key={period}
            onPress={() => setSelectedPeriod(period as 3 | 6 | 12)}
            style={[
              styles.periodButton,
              {
                backgroundColor: selectedPeriod === period ? colors.primary[100] : colors.background.secondary,
                borderColor: selectedPeriod === period ? colors.primary[500] : colors.border.light,
              },
            ]}
          >
            <Text
              style={[
                styles.periodButtonText,
                {
                  color: selectedPeriod === period ? colors.primary[700] : colors.text.secondary,
                  fontWeight: selectedPeriod === period ? '600' : '400',
                },
              ]}
            >
              {period} months
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {trends.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📈</Text>
            <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
              No Trend Data
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.text.secondary }]}>
              Add expenses over multiple months to see spending trends and patterns.
            </Text>
          </View>
        ) : (
          <>
            {/* Chart */}
            <View style={[styles.chartCard, { backgroundColor: colors.background.secondary }]}>
              {renderSimpleChart()}
            </View>

            {/* Monthly Details */}
            <View style={styles.monthlyDetails}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Monthly Breakdown
              </Text>

              {trends.map((trend, index) => {
                const changeIndicator = getChangeIndicator(trend.comparedToPrevious);
                const topCategory = Object.entries(trend.categoryBreakdown)
                  .sort(([, a], [, b]) => b - a)[0];

                return (
                  <View
                    key={trend.month}
                    style={[styles.monthCard, { backgroundColor: colors.background.secondary }]}
                  >
                    <View style={styles.monthHeader}>
                      <Text style={[styles.monthTitle, { color: colors.text.primary }]}>
                        {formatMonth(trend.month)}
                      </Text>
                      {index > 0 && (
                        <View style={styles.monthChange}>
                          <Ionicons
                            name={changeIndicator.icon as any}
                            size={16}
                            color={changeIndicator.color}
                          />
                          <Text style={[styles.monthChangeText, { color: changeIndicator.color }]}>
                            {changeIndicator.text}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.monthStats}>
                      <View style={styles.statRow}>
                        <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                          Total Spent
                        </Text>
                        <Text style={[styles.statValue, { color: colors.text.primary }]}>
                          £{trend.totalSpent.toFixed(2)}
                        </Text>
                      </View>

                      <View style={styles.statRow}>
                        <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                          Weekly Average
                        </Text>
                        <Text style={[styles.statValue, { color: colors.text.primary }]}>
                          £{trend.weeklyAverage.toFixed(2)}
                        </Text>
                      </View>

                      {topCategory && (
                        <View style={styles.statRow}>
                          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                            Top Category
                          </Text>
                          <Text style={[styles.statValue, { color: colors.text.primary }]}>
                            {topCategory[0]} (£{topCategory[1].toFixed(2)})
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Summary Insights */}
            {trends.length > 1 && (
              <View style={styles.summarySection}>
                <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                  Key Insights
                </Text>

                <View style={[styles.summaryCard, { backgroundColor: colors.background.secondary }]}>
                  <View style={styles.insightRow}>
                    <Text style={[styles.insightText, { color: colors.text.secondary }]}>
                      Highest spending month: {formatMonth(trends.reduce((max, t) => t.totalSpent > max.totalSpent ? t : max).month)}
                    </Text>
                  </View>

                  <View style={styles.insightRow}>
                    <Text style={[styles.insightText, { color: colors.text.secondary }]}>
                      Average monthly spending: £{(trends.reduce((sum, t) => sum + t.totalSpent, 0) / trends.length).toFixed(2)}
                    </Text>
                  </View>

                  {trends.length >= 3 && (
                    <View style={styles.insightRow}>
                      <Text style={[styles.insightText, { color: colors.text.secondary }]}>
                        Recent trend: {trends[trends.length - 1].comparedToPrevious > 5 ? 'Increasing' : trends[trends.length - 1].comparedToPrevious < -5 ? 'Decreasing' : 'Stable'} spending
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  periodSelector: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  periodButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: 14,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  chartCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  chartContainer: {
    gap: spacing.md,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  chart: {
    flexDirection: 'row',
    height: 140,
    alignItems: 'flex-end',
  },
  yAxis: {
    width: 40,
    height: 120,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: spacing.sm,
  },
  axisLabel: {
    fontSize: 10,
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 120,
    gap: 8,
  },
  barColumn: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  barWrapper: {
    height: 120,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  barLabel: {
    alignItems: 'center',
    gap: 2,
    paddingTop: spacing.xs,
  },
  monthLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  changeText: {
    fontSize: 8,
    fontWeight: '600',
  },
  monthlyDetails: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  monthCard: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  monthChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  monthChangeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  monthStats: {
    gap: spacing.xs,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.lg,
  },
  summarySection: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  summaryCard: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  insightRow: {
    paddingVertical: spacing.xs,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
  },

});