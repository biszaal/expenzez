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
import { PremiumFeature } from '../../services/subscriptionService';
import { useSubscription } from '../../hooks/useSubscription';
import { debugService } from '../../services/debugService';
import { PremiumGate } from '../../components/PremiumGate';
import { AnalyticsSummary } from '../../components/analytics/AnalyticsSummary';

const { width } = Dimensions.get('window');

export default function TrendsAnalysisScreen() {
  const { colors } = useTheme();
  const { isPremium } = useSubscription();
  const [trends, setTrends] = useState<MonthlySpendingTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<3 | 6 | 12>(6);
  const [activeTab, setActiveTab] = useState<'trends' | 'analytics'>('trends');
  const [debugPremiumEnabled, setDebugPremiumEnabled] = useState(false);

  // Check debug premium status on mount
  useEffect(() => {
    const checkDebugPremium = async () => {
      if (debugService.isDevEnvironment()) {
        const enabled = await debugService.isDebugPremiumEnabled();
        setDebugPremiumEnabled(enabled);
      }
    };
    checkDebugPremium();
  }, []);

  console.log("[TrendsAnalysisScreen] isPremium:", isPremium, "debugPremium:", debugPremiumEnabled);

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
    const gap = 12;
    const barWidth = Math.floor((chartWidth - 50 - (trends.length - 1) * gap) / trends.length);

    return (
      <View style={styles.chartContainer}>
        <Text style={[styles.chartTitle, { color: colors.text.primary }]}>
          Monthly Spending Trend
        </Text>

        <View style={styles.chart}>
          <View style={styles.yAxis}>
            <Text style={[styles.axisLabel, { color: colors.text.secondary }]}>
              £{(maxAmount).toFixed(0)}
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
              const height = Math.max(8, (trend.totalSpent / maxAmount) * 140);
              const changeIndicator = getChangeIndicator(trend.comparedToPrevious);
              const monthParts = formatMonth(trend.month).split(' ');

              return (
                <View
                  key={trend.month}
                  style={[
                    styles.barColumn,
                    {
                      width: barWidth,
                      marginRight: index < trends.length - 1 ? gap : 0,
                    }
                  ]}
                >
                  <View style={styles.barWrapper}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height,
                          backgroundColor: colors.primary[500],
                          width: barWidth,
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.barLabel}>
                    <Text style={[styles.monthLabelText, { color: colors.text.primary }]}>
                      {monthParts[0]}
                    </Text>
                    <Text style={[styles.monthLabelYear, { color: colors.text.secondary }]}>
                      {monthParts[1]}
                    </Text>
                    <View style={styles.changeIndicator}>
                      {index > 0 && (
                        <>
                          <Ionicons
                            name={changeIndicator.icon as any}
                            size={9}
                            color={changeIndicator.color}
                          />
                          <Text style={[styles.changeText, { color: changeIndicator.color }]}>
                            {changeIndicator.text}
                          </Text>
                        </>
                      )}
                    </View>
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
    <PremiumGate feature={PremiumFeature.ADVANCED_ANALYTICS}>
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

      {/* Unified Controls */}
      <View style={styles.controlsContainer}>
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {[3, 6, 12].map((period) => (
            <TouchableOpacity
              key={period}
              onPress={() => setSelectedPeriod(period as 3 | 6 | 12)}
              style={[
                styles.periodButton,
                {
                  backgroundColor: selectedPeriod === period ? colors.primary[500] : 'transparent',
                  borderColor: selectedPeriod === period ? colors.primary[500] : colors.border.light,
                },
              ]}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  {
                    color: selectedPeriod === period ? '#fff' : colors.text.secondary,
                    fontWeight: selectedPeriod === period ? '600' : '500',
                  },
                ]}
              >
                {period}m
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Selector */}
        <View style={styles.tabSelector}>
          <TouchableOpacity
            onPress={() => setActiveTab('trends')}
            style={[
              styles.tabButton,
              {
                borderBottomColor: activeTab === 'trends' ? colors.primary[500] : 'transparent',
                borderBottomWidth: activeTab === 'trends' ? 2 : 0,
              },
            ]}
          >
            <Text
              style={[
                styles.tabButtonText,
                {
                  color: activeTab === 'trends' ? colors.primary[500] : colors.text.secondary,
                  fontWeight: activeTab === 'trends' ? '600' : '500',
                },
              ]}
            >
              Trends
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('analytics')}
            style={[
              styles.tabButton,
              {
                borderBottomColor: activeTab === 'analytics' ? colors.primary[500] : 'transparent',
                borderBottomWidth: activeTab === 'analytics' ? 2 : 0,
              },
            ]}
          >
            <Text
              style={[
                styles.tabButtonText,
                {
                  color: activeTab === 'analytics' ? colors.primary[500] : colors.text.secondary,
                  fontWeight: activeTab === 'analytics' ? '600' : '500',
                },
              ]}
            >
              Analytics
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'trends' ? (
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
                      style={[styles.monthItem, { borderBottomColor: colors.border.light }]}
                    >
                      <View style={styles.monthItemHeader}>
                        <Text style={[styles.monthItemTitle, { color: colors.text.primary }]}>
                          {formatMonth(trend.month)}
                        </Text>
                        {index > 0 && (
                          <View style={styles.monthChange}>
                            <Ionicons
                              name={changeIndicator.icon as any}
                              size={14}
                              color={changeIndicator.color}
                            />
                            <Text style={[styles.monthChangeText, { color: changeIndicator.color }]}>
                              {changeIndicator.text}
                            </Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.monthItemContent}>
                        <View style={styles.statItem}>
                          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                            Total Spent
                          </Text>
                          <Text style={[styles.statValue, { color: colors.text.primary }]}>
                            £{trend.totalSpent.toFixed(2)}
                          </Text>
                        </View>

                        <View style={styles.statItem}>
                          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                            Weekly Average
                          </Text>
                          <Text style={[styles.statValue, { color: colors.text.primary }]}>
                            £{trend.weeklyAverage.toFixed(2)}
                          </Text>
                        </View>

                        {topCategory && (
                          <View style={styles.statItem}>
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

                  <View style={styles.insightsList}>
                    <View style={[styles.insightItem, { borderBottomColor: colors.border.light }]}>
                      <Text style={[styles.insightText, { color: colors.text.secondary }]}>
                        Highest spending month
                      </Text>
                      <Text style={[styles.insightValue, { color: colors.text.primary }]}>
                        {formatMonth(trends.reduce((max, t) => t.totalSpent > max.totalSpent ? t : max).month)}
                      </Text>
                    </View>

                    <View style={[styles.insightItem, { borderBottomColor: colors.border.light }]}>
                      <Text style={[styles.insightText, { color: colors.text.secondary }]}>
                        Average monthly
                      </Text>
                      <Text style={[styles.insightValue, { color: colors.text.primary }]}>
                        £{(trends.reduce((sum, t) => sum + t.totalSpent, 0) / trends.length).toFixed(2)}
                      </Text>
                    </View>

                    {trends.length >= 3 && (
                      <View style={styles.insightItem}>
                        <Text style={[styles.insightText, { color: colors.text.secondary }]}>
                          Recent trend
                        </Text>
                        <Text style={[styles.insightValue, { color: colors.text.primary }]}>
                          {trends[trends.length - 1].comparedToPrevious > 5 ? 'Increasing' : trends[trends.length - 1].comparedToPrevious < -5 ? 'Decreasing' : 'Stable'}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </>
          )}
        </ScrollView>
      ) : (
        <AnalyticsSummary />
      )}
    </SafeAreaView>
    </PremiumGate>
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
    fontSize: 20,
    fontWeight: '700',
  },
  controlsContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.md,
    alignItems: 'center',
  },
  periodSelector: {
    flexDirection: 'row',
    gap: spacing.xs,
    backgroundColor: 'transparent',
  },
  periodButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: 12,
    fontWeight: '600',
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
    paddingBottom: spacing.lg,
  },
  chartCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
  },
  chartContainer: {
    gap: spacing.lg,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'left',
    paddingHorizontal: spacing.md,
  },
  chart: {
    flexDirection: 'row',
    height: 200,
    alignItems: 'flex-end',
    paddingBottom: spacing.md,
  },
  yAxis: {
    width: 50,
    height: 140,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: spacing.md,
  },
  axisLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    height: 140,
  },
  barColumn: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  barWrapper: {
    height: 140,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  barLabel: {
    alignItems: 'center',
    gap: 3,
    paddingTop: spacing.sm,
    paddingHorizontal: 4,
    minWidth: 48,
  },
  monthLabelText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  monthLabelYear: {
    fontSize: 9,
    fontWeight: '500',
    textAlign: 'center',
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 14,
  },
  changeText: {
    fontSize: 9,
    fontWeight: '600',
  },
  monthlyDetails: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  monthItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  monthItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  monthItemTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  monthChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  monthChangeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  monthItemContent: {
    gap: spacing.sm,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 13,
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
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  insightsList: {
    gap: 0,
  },
  insightItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  insightText: {
    fontSize: 13,
    fontWeight: '500',
  },
  insightValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabSelector: {
    flexDirection: 'row',
    flex: 1,
    gap: spacing.lg,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 0,
    alignItems: 'center',
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },

});