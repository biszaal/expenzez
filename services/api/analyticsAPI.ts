/**
 * Advanced Analytics API Service
 *
 * Handles all advanced analytics requests including:
 * - Spending forecasts
 * - Anomaly detection
 * - Category trends
 * - Comparison metrics
 */

import { api } from '../config/apiClient';
import { formatCurrency as formatCurrencyUtil } from '../../utils/formatters';

export interface AnalyticsMetrics {
  forecast: ForecastResult[];
  anomalies: AnomalyResult[];
  categoryTrends: CategoryTrend[];
  savingsOpportunity: number;
  spendingVelocity: number;
  comparisonMetrics: {
    monthOverMonth: number;
    yearOverYear: number;
  };
}

export interface ForecastResult {
  month: string;
  predicted: number;
  confidence: number;
  upper_bound: number;
  lower_bound: number;
}

export interface AnomalyResult {
  transactionId: string;
  merchant: string;
  amount: number;
  expectedAmount: number;
  zScore: number;
  severity: 'low' | 'medium' | 'high';
  reason: string;
}

export interface CategoryTrend {
  category: string;
  currentMonth: number;
  previousMonth: number;
  changePercent: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  velocity: number;
}

class AnalyticsAPI {
  /**
   * Get comprehensive analytics report
   */
  async getAdvancedAnalytics(): Promise<AnalyticsMetrics> {
    try {
      const response = await api.get<{ success: boolean; data?: AnalyticsMetrics; message?: string; details?: string }>(
        '/analytics/advanced'
      );

      console.log('📊 Analytics API Response:', {
        status: response.status,
        success: response.data.success,
        message: response.data.message,
        details: response.data.details,
        hasData: !!response.data.data,
      });

      // Handle both success and error responses with proper data format
      if (!response.data.success) {
        const errorMsg = response.data.message || response.data.details || 'Failed to fetch analytics';
        console.error('❌ Analytics API Error:', errorMsg);
        throw new Error(errorMsg);
      }

      // Return empty analytics if no data but success (insufficient data scenario)
      if (!response.data.data) {
        console.warn('⚠️ No analytics data returned, using fallback empty analytics');
        return {
          forecast: [],
          anomalies: [],
          categoryTrends: [],
          savingsOpportunity: 0,
          spendingVelocity: 0,
          comparisonMetrics: {
            monthOverMonth: 0,
            yearOverYear: 0,
          },
        };
      }

      return response.data.data;
    } catch (error: any) {
      console.error('❌ Error fetching advanced analytics:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount: number): string {
    return formatCurrencyUtil(amount);
  }

  /**
   * Format percentage for display
   */
  formatPercentage(value: number): string {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  }

  /**
   * Get trend icon based on trend direction
   */
  getTrendIcon(trend: 'increasing' | 'decreasing' | 'stable'): string {
    switch (trend) {
      case 'increasing':
        return '📈';
      case 'decreasing':
        return '📉';
      case 'stable':
        return '➡️';
      default:
        return '➡️';
    }
  }

  /**
   * Get trend color based on direction
   */
  getTrendColor(trend: 'increasing' | 'decreasing' | 'stable'): string {
    switch (trend) {
      case 'increasing':
        return '#EF4444'; // Red for increasing (bad)
      case 'decreasing':
        return '#10B981'; // Green for decreasing (good)
      case 'stable':
        return '#6B7280'; // Gray for stable
      default:
        return '#6B7280';
    }
  }

  /**
   * Get anomaly severity color
   */
  getAnomalySeverityColor(severity: 'low' | 'medium' | 'high'): string {
    switch (severity) {
      case 'high':
        return '#DC2626';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#3B82F6';
      default:
        return '#3B82F6';
    }
  }

  /**
   * Format forecast accuracy as confidence percentage
   */
  formatConfidence(confidence: number): string {
    return `${Math.round(confidence * 100)}%`;
  }

  /**
   * Categorize forecast accuracy
   */
  getConfidenceLevel(confidence: number): string {
    if (confidence >= 0.8) return 'Very High';
    if (confidence >= 0.6) return 'High';
    if (confidence >= 0.4) return 'Moderate';
    return 'Low';
  }
}

export const analyticsAPI = new AnalyticsAPI();
