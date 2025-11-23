import React, { useState } from "react";
import { View, Text, Dimensions, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import dayjs from "dayjs";
import { LineChart, ChartData } from "../../charts";
import { useTheme } from "../../../contexts/ThemeContext";
import { spendingAnalyticsSectionStyles } from "./SpendingAnalyticsSection.styles";
import { AIInsightCard } from "../../ai/AIInsightCard";
import { AIButton } from "../../ai/AIButton";
import { ChartInsightResponse } from "../../../services/api/chartInsightsAPI";

interface SpendingAnalyticsSectionProps {
  selectedMonth: string;
  chartData: ChartData;
  hasTransactions: boolean;
  monthlyOverBudget: boolean;
  dailySpendingData?: {
    data: number[];
    labels: string[];
    prevMonthData: number[];
  };
  onPointSelect?: (point: any) => void;
  // AI insight props
  isPro?: boolean;
  aiInsight?: ChartInsightResponse | null;
  aiInsightLoading?: boolean;
  onRequestAIInsight?: () => void;
  canRequestInsight?: boolean;
}

export const SpendingAnalyticsSection: React.FC<
  SpendingAnalyticsSectionProps
> = ({
  selectedMonth,
  chartData,
  hasTransactions,
  monthlyOverBudget,
  dailySpendingData,
  onPointSelect,
  isPro,
  aiInsight,
  aiInsightLoading,
  onRequestAIInsight,
  canRequestInsight = true,
}) => {
  const { colors } = useTheme();
  const styles = spendingAnalyticsSectionStyles;
  const { width } = Dimensions.get("window");
  const [showAIInsight, setShowAIInsight] = useState(false);

  // Auto-show insight if it exists (from cache)
  React.useEffect(() => {
    if (aiInsight && !showAIInsight) {
      setShowAIInsight(true);
    }
  }, [aiInsight]);

  const handleAIButtonPress = () => {
    // Check if user can request a new insight
    if (!canRequestInsight) {
      Alert.alert(
        "AI Limit Reached",
        "You've reached your daily AI insight limit. Your insights will be available again in 24 hours.\n\nUpgrade to Premium for unlimited AI insights!",
        [{ text: "OK" }]
      );
      return;
    }

    if (!showAIInsight && onRequestAIInsight) {
      onRequestAIInsight();
    }
    setShowAIInsight(!showAIInsight);
  };

  return (
    <View style={styles.premiumSpendingCardWrapper}>
      <View
        style={[
          styles.premiumSpendingCard,
          { backgroundColor: colors.background.secondary },
        ]}
      >
        {/* Improved Analytics Header */}
        <View style={styles.premiumSpendingHeader}>
          <View style={styles.premiumSpendingHeaderLeft}>
            <View
              style={[
                styles.premiumAnalyticsIcon,
                { backgroundColor: "#4ECDC4" },
              ]}
            >
              <Ionicons name="analytics" size={20} color="white" />
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

          {/* AI Insight Button - Hidden when insight is active */}
          {isPro && hasTransactions && !showAIInsight && (
            <AIButton
              onPress={handleAIButtonPress}
              loading={aiInsightLoading}
              active={false}
              label="Ask AI"
            />
          )}
        </View>

        {/* Premium Custom Chart Section */}
        <View style={styles.premiumChartSection}>
          <View style={[styles.premiumCustomChartContainer]}>
            {hasTransactions ||
            dayjs(selectedMonth).isSame(dayjs(), "month") ? (
              <>
                {/* Enhanced Comparison Chart - MOVED UP */}
                <View
                  style={[
                    styles.enhancedChartContainer,
                    { backgroundColor: colors.background.secondary },
                  ]}
                >
                  {/* Modern Interactive Line Chart */}
                  <GestureHandlerRootView style={styles.animatedChartWrapper}>
                    <LineChart
                      data={chartData}
                      width={width - 16}
                      height={180}
                      animated={true}
                      interactive={true}
                      gradientColors={
                        monthlyOverBudget
                          ? ["#EF4444", "#F87171"] // Red gradient for over budget
                          : ["#8B5CF6", "#6366F1"] // Purple to indigo gradient for within budget
                      }
                      lineColor={monthlyOverBudget ? "#EF4444" : "#8B5CF6"}
                      pointColor={monthlyOverBudget ? "#EF4444" : "#8B5CF6"}
                      backgroundColor="transparent"
                      onPointSelect={onPointSelect}
                      showGrid={true}
                      showPoints={true}
                      curveType="bezier"
                      gridColor={colors.text.tertiary}
                      labelColor={colors.text.secondary}
                    />
                  </GestureHandlerRootView>
                </View>

                {/* Chart Legend - MOVED BELOW CHART */}
                <View style={styles.premiumChartLegend}>
                  <View style={styles.premiumChartLegendItem}>
                    <View
                      style={[
                        styles.premiumChartLegendDot,
                        { backgroundColor: colors.primary.main },
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
                  {dailySpendingData?.prevMonthData &&
                    dailySpendingData.prevMonthData.some(
                      (value) => value > 0
                    ) && (
                      <View style={styles.premiumChartLegendItem}>
                        <View
                          style={[
                            styles.premiumChartLegendDot,
                            {
                              backgroundColor: "rgba(156, 163, 175, 0.6)",
                              borderStyle: "dashed",
                              borderWidth: 1,
                              borderColor: "rgba(156, 163, 175, 0.8)",
                            },
                          ]}
                        />
                        <Text
                          style={[
                            styles.premiumChartLegendText,
                            { color: colors.text.secondary },
                          ]}
                        >
                          {dayjs(selectedMonth)
                            .subtract(1, "month")
                            .format("MMM")}
                        </Text>
                      </View>
                    )}
                </View>

                {/* Current Day Value Display */}
                {dailySpendingData && dailySpendingData.data.length > 0 && (() => {
                  // Calculate comparison for arrow direction and color
                  const daysToCompare = Math.min(
                    dailySpendingData.data.length,
                    dailySpendingData.prevMonthData?.length || 0
                  );

                  const thisMonthTotal = dailySpendingData.data
                    .slice(0, daysToCompare)
                    .reduce((a, b) => a + b, 0);
                  const lastMonthTotal = dailySpendingData.prevMonthData
                    ?.slice(0, daysToCompare)
                    .reduce((a, b) => a + b, 0) || 0;

                  const isIncrease = thisMonthTotal > lastMonthTotal;
                  const arrowName = isIncrease ? "arrow-up" : "arrow-down";
                  const arrowColor = isIncrease ? colors.error.main : colors.success.main;
                  const backgroundColor = isIncrease
                    ? 'rgba(239, 68, 68, 0.1)'  // Light red background for increase
                    : 'rgba(34, 197, 94, 0.1)';  // Light green background for decrease

                  return (
                    <View style={styles.currentValueContainer}>
                      <Text
                        style={[
                          styles.currentValue,
                          { color: arrowColor },
                        ]}
                      >
                        £
                        {dailySpendingData.data[
                          dailySpendingData.data.length - 1
                        ]?.toFixed(2) || "0.00"}
                      </Text>
                      <View style={[
                        styles.currentValueMeta,
                        { backgroundColor }
                      ]}>
                        <Ionicons
                          name={arrowName}
                          size={16}
                          color={arrowColor}
                        />
                        <Text
                          style={[
                            styles.currentValueLabel,
                            { color: arrowColor },
                          ]}
                        >
                          vs. {daysToCompare}{" "}
                          {dayjs(selectedMonth)
                            .subtract(1, "month")
                            .format("MMM")}
                        </Text>
                      </View>
                    </View>
                  );
                })()}

                {/* Mini Stat Cards - IMPROVED LAYOUT */}
                {dailySpendingData && dailySpendingData.data.length > 0 && (
                  <View style={styles.miniStatsContainer}>
                    {/* Peak Day Card */}
                    <View
                      style={[
                        styles.miniStatCard,
                        { backgroundColor: colors.background.secondary },
                      ]}
                    >
                      <View
                        style={[
                          styles.miniStatIcon,
                          { backgroundColor: colors.primary.main[100] },
                        ]}
                      >
                        <Ionicons
                          name="trending-up"
                          size={18}
                          color={colors.primary.main}
                        />
                      </View>
                      <View style={styles.miniStatContent}>
                        <Text
                          style={[
                            styles.miniStatValue,
                            { color: colors.text.primary },
                          ]}
                        >
                          £{Math.max(...dailySpendingData.data).toFixed(0)}
                        </Text>
                        <Text
                          style={[
                            styles.miniStatLabel,
                            { color: colors.text.secondary },
                          ]}
                        >
                          Peak Day
                        </Text>
                      </View>
                    </View>

                    {/* Daily Average Card */}
                    <View
                      style={[
                        styles.miniStatCard,
                        { backgroundColor: colors.background.secondary },
                      ]}
                    >
                      <View
                        style={[
                          styles.miniStatIcon,
                          { backgroundColor: colors.success[100] },
                        ]}
                      >
                        <Ionicons
                          name="bar-chart-outline"
                          size={18}
                          color={colors.success.main}
                        />
                      </View>
                      <View style={styles.miniStatContent}>
                        <Text
                          style={[
                            styles.miniStatValue,
                            { color: colors.text.primary },
                          ]}
                        >
                          £
                          {(
                            dailySpendingData.data.reduce((a, b) => a + b, 0) /
                            dailySpendingData.data.filter((v) => v > 0).length
                          ).toFixed(0)}
                        </Text>
                        <Text
                          style={[
                            styles.miniStatLabel,
                            { color: colors.text.secondary },
                          ]}
                        >
                          Daily Avg
                        </Text>
                      </View>
                    </View>

                    {/* vs Last Month Card */}
                    {dailySpendingData.prevMonthData &&
                      dailySpendingData.prevMonthData.some((v) => v > 0) &&
                      (() => {
                        // Only compare up to the same day in both months for fair comparison
                        // Current month has data up to today, so compare previous month up to the same day
                        const daysToCompare = Math.min(
                          dailySpendingData.data.length,
                          dailySpendingData.prevMonthData.length
                        );

                        const thisMonthTotal = dailySpendingData.data
                          .slice(0, daysToCompare)
                          .reduce((a, b) => a + b, 0);
                        const lastMonthTotal =
                          dailySpendingData.prevMonthData
                            .slice(0, daysToCompare)
                            .reduce((a, b) => a + b, 0);
                        const diff = thisMonthTotal - lastMonthTotal;
                        const percentChange =
                          lastMonthTotal > 0
                            ? (diff / lastMonthTotal) * 100
                            : 0;
                        const isIncrease = diff > 0;

                        return (
                          <View
                            style={[
                              styles.miniStatCard,
                              { backgroundColor: colors.background.secondary },
                            ]}
                          >
                            <View
                              style={[
                                styles.miniStatIcon,
                                {
                                  backgroundColor: isIncrease
                                    ? colors.error[100]
                                    : colors.success[100],
                                },
                              ]}
                            >
                              <Ionicons
                                name={isIncrease ? "arrow-up" : "arrow-down"}
                                size={18}
                                color={
                                  isIncrease
                                    ? colors.error.main
                                    : colors.success.main
                                }
                              />
                            </View>
                            <View style={styles.miniStatContent}>
                              <Text
                                style={[
                                  styles.miniStatValue,
                                  {
                                    color: isIncrease
                                      ? colors.error.main
                                      : colors.success.main,
                                  },
                                ]}
                              >
                                {isIncrease ? "+" : ""}
                                {Math.abs(percentChange).toFixed(0)}%
                              </Text>
                              <Text
                                style={[
                                  styles.miniStatLabel,
                                  { color: colors.text.secondary },
                                ]}
                              >
                                vs Last Mo
                              </Text>
                            </View>
                          </View>
                        );
                      })()}
                  </View>
                )}
              </>
            ) : (
              /* Empty Chart State */
              <View
                style={[
                  styles.premiumEmptyChart,
                  { backgroundColor: colors.background.secondary },
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

      {/* AI Spending Insight - Separate Container */}
      {isPro && showAIInsight && aiInsight && (
        <View style={styles.aiInsightSeparateContainer}>
          <AIInsightCard
            insight={aiInsight.insight}
            expandedInsight={aiInsight.expandedInsight}
            priority={aiInsight.priority}
            actionable={aiInsight.actionable}
            loading={aiInsightLoading}
            collapsedByDefault={true}
          />
        </View>
      )}
    </View>
  );
};
