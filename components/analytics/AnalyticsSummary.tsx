/**
 * Analytics Summary Component
 * Displays key metrics, forecasts, and anomalies
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { analyticsAPI, AnalyticsMetrics } from '../../services/api/analyticsAPI';

interface AnalyticsSummaryProps {
  onDataLoad?: (data: AnalyticsMetrics) => void;
}

export const AnalyticsSummary: React.FC<AnalyticsSummaryProps> = ({ onDataLoad }) => {
  const { colors } = useTheme();
  const [analytics, setAnalytics] = useState<AnalyticsMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsAPI.getAdvancedAnalytics();
      setAnalytics(data);
      onDataLoad?.(data);
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Unable to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
          Computing advanced analytics...
        </Text>
      </View>
    );
  }

  if (error || !analytics) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyStateContainer}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.background.secondary }]}>
            <Ionicons name="bar-chart-outline" size={32} color={colors.text.tertiary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
            Advanced Analytics
          </Text>
          <Text style={[styles.emptyMessage, { color: colors.text.secondary }]}>
            {error === 'We need at least 10 transactions to generate analytics'
              ? 'More data needed'
              : error === 'Need at least 3 months of data to generate forecasts'
              ? 'Need historical data'
              : 'Unable to load'}
          </Text>
          <Text style={[styles.emptyDescription, { color: colors.text.tertiary }]}>
            {error?.includes('transactions')
              ? 'Add 10+ transactions across 3+ months to unlock AI-powered insights'
              : 'Try again in a moment'}
          </Text>
          <TouchableOpacity
            style={[styles.emptyRetryButton, { borderColor: colors.primary[500] }]}
            onPress={loadAnalytics}
          >
            <Text style={[styles.emptyRetryButtonText, { color: colors.primary[500] }]}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.headerSection}>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Advanced Analytics</Text>
        <Text style={[styles.headerSubtitle, { color: colors.text.secondary }]}>AI-powered insights into your spending</Text>
      </View>

      {/* Forecast Section */}
      {analytics.forecast.length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trending-up" size={20} color={colors.primary[500]} />
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Spending Forecast
            </Text>
          </View>

          {analytics.forecast.slice(0, 3).map((forecast, index) => (
            <View
              key={forecast.month}
              style={[
                styles.forecastItem,
                index === analytics.forecast.slice(0, 3).length - 1 && styles.lastItem
              ]}
            >
              <View style={styles.forecastHeader}>
                <View>
                  <Text style={[styles.monthText, { color: colors.text.primary }]}>
                    {forecast.month}
                  </Text>
                </View>
                <View style={[styles.confidenceTag, { backgroundColor: colors.primary[100] }]}>
                  <Text style={[styles.confidenceText, { color: colors.primary[600] }]}>
                    {analyticsAPI.formatConfidence(forecast.confidence)}
                  </Text>
                </View>
              </View>
              <Text style={[styles.forecastAmount, { color: colors.primary[500] }]}>
                £{forecast.predicted.toFixed(2)}
              </Text>
              <View style={styles.rangeContainer}>
                <Ionicons name="swap-vertical-outline" size={12} color={colors.text.tertiary} />
                <Text style={[styles.forecastRange, { color: colors.text.secondary }]}>
                  Range: £{forecast.lower_bound.toFixed(0)} - £{forecast.upper_bound.toFixed(0)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Category Trends */}
      {analytics.categoryTrends.length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bar-chart" size={20} color={colors.primary[500]} />
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Category Trends
            </Text>
          </View>

          {analytics.categoryTrends.slice(0, 5).map((trend, index) => (
            <View
              key={trend.category}
              style={[
                styles.trendItem,
                index === Math.min(4, analytics.categoryTrends.length - 1) && styles.lastItem
              ]}
            >
              <View style={styles.trendHeader}>
                <View>
                  <Text style={[styles.categoryName, { color: colors.text.primary }]}>
                    {trend.category}
                  </Text>
                  <Text style={[styles.trendAmount, { color: colors.text.secondary }]}>
                    £{trend.currentMonth.toFixed(2)} this month
                  </Text>
                </View>
                <View style={styles.trendBadgeContainer}>
                  <Ionicons
                    name={trend.trend === 'increasing' ? 'arrow-up' : trend.trend === 'decreasing' ? 'arrow-down' : 'remove'}
                    size={16}
                    color={analyticsAPI.getTrendColor(trend.trend)}
                  />
                  <Text
                    style={[
                      styles.trendBadge,
                      {
                        color: analyticsAPI.getTrendColor(trend.trend),
                      },
                    ]}
                  >
                    {analyticsAPI.formatPercentage(trend.changePercent)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Anomalies */}
      {analytics.anomalies.length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="alert-circle" size={20} color="#EF4444" />
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Unusual Spending
            </Text>
          </View>

          {analytics.anomalies.slice(0, 3).map((anomaly, index) => (
            <View
              key={anomaly.transactionId}
              style={[
                styles.anomalyItem,
                {
                  borderLeftColor: analyticsAPI.getAnomalySeverityColor(anomaly.severity),
                  backgroundColor: analyticsAPI.getAnomalySeverityColor(anomaly.severity) + '15',
                },
                index === Math.min(2, analytics.anomalies.length - 1) && styles.lastItem,
              ]}
            >
              <View style={styles.anomalyHeader}>
                <View style={styles.anomalyInfo}>
                  <Text style={[styles.anomalyMerchant, { color: colors.text.primary }]}>
                    {anomaly.merchant}
                  </Text>
                  <Text style={[styles.anomalyReason, { color: colors.text.secondary }]}>
                    {anomaly.reason}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.anomalyAmount,
                    { color: analyticsAPI.getAnomalySeverityColor(anomaly.severity) },
                  ]}
                >
                  £{anomaly.amount.toFixed(2)}
                </Text>
              </View>
              <View style={styles.anomalySeverityBadge}>
                <Text
                  style={[
                    styles.anomalySeverityText,
                    { color: analyticsAPI.getAnomalySeverityColor(anomaly.severity) },
                  ]}
                >
                  {anomaly.severity.charAt(0).toUpperCase() + anomaly.severity.slice(1)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Key Metrics */}
      <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary, marginBottom: 16 }]}>
          Key Insights
        </Text>

        <View style={styles.metricsGrid}>
          <View style={[styles.metricItem, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.metricLabel, { color: colors.text.secondary }]}>
              Savings Opportunity
            </Text>
            <Text style={[styles.metricValue, { color: colors.primary[500] }]}>
              £{analytics.savingsOpportunity.toFixed(2)}
            </Text>
          </View>

          <View style={[styles.metricItem, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.metricLabel, { color: colors.text.secondary }]}>
              Spending Velocity
            </Text>
            <Text
              style={[
                styles.metricValue,
                { color: analytics.spendingVelocity > 0 ? '#EF4444' : '#10B981' },
              ]}
            >
              {analytics.spendingVelocity > 0 ? '+' : ''}£{analytics.spendingVelocity.toFixed(2)}
            </Text>
          </View>

          <View style={[styles.metricItem, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.metricLabel, { color: colors.text.secondary }]}>
              Month vs Month
            </Text>
            <Text
              style={[
                styles.metricValue,
                {
                  color:
                    analytics.comparisonMetrics.monthOverMonth > 0 ? '#EF4444' : '#10B981',
                },
              ]}
            >
              {analyticsAPI.formatPercentage(analytics.comparisonMetrics.monthOverMonth)}
            </Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: colors.text.secondary }]}>
              Year vs Year
            </Text>
            <Text
              style={[
                styles.metricValue,
                {
                  color:
                    analytics.comparisonMetrics.yearOverYear > 0 ? '#EF4444' : '#10B981',
                },
              ]}
            >
              {analyticsAPI.formatPercentage(analytics.comparisonMetrics.yearOverYear)}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '400',
  },
  section: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    marginHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  errorHint: {
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  forecastItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  forecastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  monthText: {
    fontSize: 14,
    fontWeight: '500',
  },
  confidenceTag: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
  },
  forecastAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  rangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  forecastRange: {
    fontSize: 12,
  },
  trendItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
  },
  trendBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendBadge: {
    fontSize: 12,
    fontWeight: '600',
  },
  trendAmount: {
    fontSize: 12,
  },
  anomalyItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  anomalyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  anomalyInfo: {
    flex: 1,
  },
  anomalyMerchant: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  anomalyAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  anomalyReason: {
    fontSize: 12,
  },
  anomalySeverityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  anomalySeverityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  lastItem: {
    borderBottomWidth: 0,
    marginBottom: 0,
  },
  metricCard: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 10,
  },
  metricCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metricCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  metricCardContent: {
    flex: 1,
  },
  metricCardLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  metricCardValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  metricLabel: {
    fontSize: 14,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyRetryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  emptyRetryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  metricsGrid: {
    gap: 0,
  },
  metricItem: {
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
