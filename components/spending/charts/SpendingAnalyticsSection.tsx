import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import dayjs from 'dayjs';
import { LineChart, ChartData } from '../../charts';
import { useTheme } from '../../../contexts/ThemeContext';
import { spendingAnalyticsSectionStyles } from './SpendingAnalyticsSection.styles';

interface SpendingAnalyticsSectionProps {
  selectedMonth: string;
  chartData: ChartData;
  hasTransactions: boolean;
  monthlyOverBudget: boolean;
  dailySpendingData?: { data: number[]; labels: string[]; prevMonthData: number[] };
  onPointSelect?: (point: any) => void;
}

export const SpendingAnalyticsSection: React.FC<SpendingAnalyticsSectionProps> = ({
  selectedMonth,
  chartData,
  hasTransactions,
  monthlyOverBudget,
  dailySpendingData,
  onPointSelect
}) => {
  const { colors } = useTheme();
  const styles = spendingAnalyticsSectionStyles;
  const { width } = Dimensions.get('window');

  return (
    <View style={styles.premiumSpendingCardWrapper}>
      <View
        style={[
          styles.premiumSpendingCard,
          { backgroundColor: colors.background.primary },
        ]}
      >
        {/* Analytics Header */}
        <View style={styles.premiumSpendingHeader}>
          <View style={styles.premiumSpendingHeaderLeft}>
            <View
              style={[
                styles.premiumAnalyticsIcon,
                { backgroundColor: "#4ECDC4" },
              ]}
            >
              <Ionicons name="analytics" size={24} color="white" />
            </View>
            <View style={styles.premiumSpendingHeaderText}>
              <Text
                style={[
                  styles.premiumSpendingTitle,
                  { color: colors.text.primary },
                ]}
              >
                {dayjs(selectedMonth).format("MMMM")} Analytics
              </Text>
              <Text
                style={[
                  styles.premiumSpendingSubtitle,
                  { color: colors.text.secondary },
                ]}
              >
                Spending overview
              </Text>
            </View>
          </View>
        </View>

        {/* Premium Custom Chart Section */}
        <View style={styles.premiumChartSection}>
          <View
            style={[
              styles.premiumCustomChartContainer,
              { backgroundColor: colors.background.secondary },
            ]}
          >
            {hasTransactions ? (
              <>
                {/* Chart Legend */}
                <View style={styles.premiumChartTitleRow}>
                  <Text
                    style={[
                      styles.premiumChartTitle,
                      { color: colors.text.primary },
                    ]}
                  >
                    Daily Spending Trend
                  </Text>
                  <View style={styles.premiumChartLegend}>
                    <View style={styles.premiumChartLegendItem}>
                      <View
                        style={[
                          styles.premiumChartLegendDot,
                          { backgroundColor: colors.primary[500] },
                        ]}
                      />
                      <Text
                        style={[
                          styles.premiumChartLegendText,
                          { color: colors.text.secondary },
                        ]}
                      >
                        This Month
                      </Text>
                    </View>
                    {/* Previous month legend */}
                    {dailySpendingData?.prevMonthData && dailySpendingData.prevMonthData.some(value => value > 0) && (
                      <View style={styles.premiumChartLegendItem}>
                        <View
                          style={[
                            styles.premiumChartLegendDot,
                            { 
                              backgroundColor: 'rgba(156, 163, 175, 0.6)',
                              borderStyle: 'dashed',
                              borderWidth: 1,
                              borderColor: 'rgba(156, 163, 175, 0.8)'
                            },
                          ]}
                        />
                        <Text
                          style={[
                            styles.premiumChartLegendText,
                            { color: colors.text.secondary },
                          ]}
                        >
                          {dayjs(selectedMonth).subtract(1, 'month').format('MMM')}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Current Day Value Display */}
                {dailySpendingData && dailySpendingData.data.length > 0 && (
                  <View style={styles.currentValueContainer}>
                    <Text style={[styles.currentValue, { color: colors.success[500] }]}>
                      £{dailySpendingData.data[dailySpendingData.data.length - 1]?.toFixed(2) || '0.00'}
                    </Text>
                    <View style={styles.currentValueMeta}>
                      <Ionicons name="arrow-down" size={16} color={colors.success[500]} />
                      <Text style={[styles.currentValueLabel, { color: colors.text.secondary }]}>
                        vs. {dayjs().date()} {dayjs(selectedMonth).subtract(1, 'month').format('MMM')}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Enhanced Comparison Chart */}
                <View
                  style={[
                    styles.enhancedChartContainer,
                    { backgroundColor: colors.background.primary },
                  ]}
                >
                  {/* Modern Interactive Line Chart */}
                  <GestureHandlerRootView style={styles.animatedChartWrapper}>
                    <LineChart
                      data={chartData}
                      width={width - 32}
                      height={200}
                      animated={true}
                      interactive={true}
                      gradientColors={
                        monthlyOverBudget 
                          ? ['#EF4444', '#F87171'] // Red gradient for over budget
                          : ['#8B5CF6', '#6366F1'] // Purple to indigo gradient for within budget
                      }
                      lineColor={monthlyOverBudget ? '#EF4444' : '#8B5CF6'}
                      pointColor={monthlyOverBudget ? '#EF4444' : '#8B5CF6'}
                      backgroundColor={colors.background.primary}
                      onPointSelect={onPointSelect}
                      showGrid={true}
                      showPoints={true}
                      curveType="bezier"
                    />
                  </GestureHandlerRootView>
                </View>
              </>
            ) : (
              /* Empty Chart State */
              <View
                style={[
                  styles.premiumEmptyChart,
                  { backgroundColor: colors.background.primary },
                ]}
              >
                <View
                  style={[
                    styles.premiumEmptyChartIcon,
                    { backgroundColor: colors.background.secondary },
                  ]}
                >
                  <Ionicons
                    name="analytics-outline"
                    size={32}
                    color={colors.text.tertiary}
                  />
                </View>
                <Text
                  style={[
                    styles.premiumEmptyChartTitle,
                    { color: colors.text.primary },
                  ]}
                >
                  No spending data
                </Text>
                <Text
                  style={[
                    styles.premiumEmptyChartSubtitle,
                    { color: colors.text.secondary },
                  ]}
                >
                  Start spending to see your analytics
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};