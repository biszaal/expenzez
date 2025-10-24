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
      <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
        <Text style={[styles.errorText, { color: '#EF4444' }]}>
          📊 Advanced Analytics
        </Text>
        <Text style={[styles.errorMessage, { color: colors.text.secondary }]}>
          {error || 'Insufficient data for analytics'}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary[500] }]}
          onPress={loadAnalytics}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Forecast Section */}
      {analytics.forecast.length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            📈 Spending Forecast
          </Text>

          {analytics.forecast.slice(0, 3).map((forecast) => (
            <View key={forecast.month} style={styles.forecastItem}>
              <View style={styles.forecastHeader}>
                <Text style={[styles.monthText, { color: colors.text.primary }]}>
                  {forecast.month}
                </Text>
                <View style={styles.confidenceTag}>
                  <Text style={styles.confidenceText}>
                    {analyticsAPI.formatConfidence(forecast.confidence)}
                  </Text>
                </View>
              </View>
              <Text style={[styles.forecastAmount, { color: colors.primary[500] }]}>
                £{forecast.predicted.toFixed(2)}
              </Text>
              <Text style={[styles.forecastRange, { color: colors.text.secondary }]}>
                Range: £{forecast.lower_bound.toFixed(0)} - £{forecast.upper_bound.toFixed(0)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Category Trends */}
      {analytics.categoryTrends.length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            📊 Category Trends
          </Text>

          {analytics.categoryTrends.slice(0, 5).map((trend) => (
            <View key={trend.category} style={styles.trendItem}>
              <View style={styles.trendHeader}>
                <Text style={[styles.categoryName, { color: colors.text.primary }]}>
                  {trend.category}
                </Text>
                <Text
                  style={[
                    styles.trendBadge,
                    {
                      color: analyticsAPI.getTrendColor(trend.trend),
                      fontWeight: '600',
                    },
                  ]}
                >
                  {analyticsAPI.getTrendIcon(trend.trend)} {analyticsAPI.formatPercentage(trend.changePercent)}
                </Text>
              </View>
              <Text style={[styles.trendAmount, { color: colors.text.secondary }]}>
                This month: £{trend.currentMonth.toFixed(2)} • Last month: £{trend.previousMonth.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Anomalies */}
      {analytics.anomalies.length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            ⚠️ Unusual Spending
          </Text>

          {analytics.anomalies.slice(0, 3).map((anomaly) => (
            <View
              key={anomaly.transactionId}
              style={[
                styles.anomalyItem,
                {
                  borderLeftColor: analyticsAPI.getAnomalySeverityColor(anomaly.severity),
                },
              ]}
            >
              <Text style={[styles.anomalyMerchant, { color: colors.text.primary }]}>
                {anomaly.merchant}
              </Text>
              <Text style={[styles.anomalyAmount, { color: colors.primary[500] }]}>
                £{anomaly.amount.toFixed(2)}
              </Text>
              <Text style={[styles.anomalyReason, { color: colors.text.secondary }]}>
                {anomaly.reason}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Key Metrics */}
      <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          💡 Key Insights
        </Text>

        <View style={styles.metricRow}>
          <Text style={[styles.metricLabel, { color: colors.text.secondary }]}>
            Savings Opportunity
          </Text>
          <Text style={[styles.metricValue, { color: '#10B981' }]}>
            £{analytics.savingsOpportunity.toFixed(2)}/mo
          </Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={[styles.metricLabel, { color: colors.text.secondary }]}>
            Spending Velocity
          </Text>
          <Text
            style={[
              styles.metricValue,
              { color: analytics.spendingVelocity > 0 ? '#EF4444' : '#10B981' },
            ]}
          >
            {analytics.spendingVelocity > 0 ? '+' : ''}£{analytics.spendingVelocity.toFixed(2)}/mo
          </Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={[styles.metricLabel, { color: colors.text.secondary }]}>
            Month vs Month
          </Text>
          <Text
            style={[
              styles.metricValue,
              {
                color: analytics.comparisonMetrics.monthOverMonth > 0 ? '#EF4444' : '#10B981',
              },
            ]}
          >
            {analyticsAPI.formatPercentage(analytics.comparisonMetrics.monthOverMonth)}
          </Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={[styles.metricLabel, { color: colors.text.secondary }]}>
            Year vs Year
          </Text>
          <Text
            style={[
              styles.metricValue,
              {
                color: analytics.comparisonMetrics.yearOverYear > 0 ? '#EF4444' : '#10B981',
              },
            ]}
          >
            {analyticsAPI.formatPercentage(analytics.comparisonMetrics.yearOverYear)}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
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
    marginBottom: 16,
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
  trendBadge: {
    fontSize: 12,
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
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  anomalyMerchant: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  anomalyAmount: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  anomalyReason: {
    fontSize: 12,
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
});
