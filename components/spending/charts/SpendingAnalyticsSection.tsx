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
import { fontFamily } from "../../../constants/theme";

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
  const { colors, isDark } = useTheme();
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
          {
            backgroundColor: colors.card.background,
            borderColor: colors.border.medium,
          },
        ]}
      >
        {/* Improved Analytics Header */}
        <View style={styles.premiumSpendingHeader}>
          <View style={styles.premiumSpendingHeaderLeft}>
            <View
              style={[
                styles.premiumAnalyticsIcon,
                {
                  backgroundColor: isDark
                    ? "rgba(157,91,255,0.16)"
                    : "rgba(123,63,228,0.12)",
                },
              ]}
            >
              <Ionicons name="analytics" size={18} color={colors.primary[500]} />
            </View>
            <View style={styles.premiumSpendingHeaderText}>
              <Text
                style={[
                  styles.premiumSpendingTitle,
                  { color: colors.text.primary, fontFamily: fontFamily.semibold },
                ]}
              >
                {dayjs(selectedMonth).format("MMMM")} Analytics
              </Text>
              <Text
                style={[
                  styles.premiumSpendingSubtitle,
                  { color: colors.text.secondary, fontFamily: fontFamily.medium },
                ]}
              >
                Spending overview
              </Text>
            </View>
          </View>
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
                    {
                      backgroundColor: 'transparent',
                    },
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
                          ? [colors.rose[500], colors.rose[600]]
                          : [colors.primary[500], colors.lime[500]]
                      }
                      lineColor={
                        monthlyOverBudget ? colors.rose[500] : colors.primary[500]
                      }
                      pointColor={
                        monthlyOverBudget ? colors.rose[500] : colors.primary[500]
                      }
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
                        {
                          backgroundColor: monthlyOverBudget
                            ? colors.rose[500]
                            : colors.primary[500],
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.premiumChartLegendText,
                        { color: colors.text.secondary, fontFamily: fontFamily.medium },
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
                              backgroundColor: colors.text.tertiary,
                              opacity: 0.6,
                            },
                          ]}
                        />
                        <Text
                          style={[
                            styles.premiumChartLegendText,
                            { color: colors.text.secondary, fontFamily: fontFamily.medium },
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
                  const arrowColor = isIncrease ? colors.rose[500] : colors.lime[500];
                  const backgroundColor = isIncrease ? colors.negBg : colors.posBg;

                  return (
                    <View style={styles.currentValueContainer}>
                      <Text
                        style={[
                          styles.currentValue,
                          { color: colors.text.primary, fontFamily: fontFamily.monoMedium },
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
                          size={13}
                          color={arrowColor}
                        />
                        <Text
                          style={[
                            styles.currentValueLabel,
                            { color: arrowColor, fontFamily: fontFamily.semibold },
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
                {dailySpendingData && dailySpendingData.data.length > 0 && (() => {
                  const tileBg = isDark
                    ? "rgba(255,255,255,0.03)"
                    : "rgba(40,20,80,0.03)";
                  const primaryTint = isDark
                    ? "rgba(157,91,255,0.16)"
                    : "rgba(123,63,228,0.12)";
                  return (
                    <View style={styles.miniStatsContainer}>
                      {/* Peak Day Card */}
                      <View
                        style={[
                          styles.miniStatCard,
                          { backgroundColor: tileBg, borderColor: colors.border.medium },
                        ]}
                      >
                        <View
                          style={[
                            styles.miniStatIcon,
                            { backgroundColor: primaryTint },
                          ]}
                        >
                          <Ionicons
                            name="trending-up"
                            size={16}
                            color={colors.primary[500]}
                          />
                        </View>
                        <View style={styles.miniStatContent}>
                          <Text
                            style={[
                              styles.miniStatValue,
                              { color: colors.text.primary, fontFamily: fontFamily.monoMedium },
                            ]}
                          >
                            £{Math.max(...dailySpendingData.data).toFixed(0)}
                          </Text>
                          <Text
                            style={[
                              styles.miniStatLabel,
                              { color: colors.text.tertiary, fontFamily: fontFamily.semibold },
                            ]}
                          >
                            PEAK DAY
                          </Text>
                        </View>
                      </View>

                      {/* Daily Average Card */}
                      <View
                        style={[
                          styles.miniStatCard,
                          { backgroundColor: tileBg, borderColor: colors.border.medium },
                        ]}
                      >
                        <View
                          style={[
                            styles.miniStatIcon,
                            { backgroundColor: colors.posBg },
                          ]}
                        >
                          <Ionicons
                            name="bar-chart-outline"
                            size={16}
                            color={colors.lime[500]}
                          />
                        </View>
                        <View style={styles.miniStatContent}>
                          <Text
                            style={[
                              styles.miniStatValue,
                              { color: colors.text.primary, fontFamily: fontFamily.monoMedium },
                            ]}
                          >
                            £
                            {(
                              dailySpendingData.data.reduce((a, b) => a + b, 0) /
                              Math.max(
                                dailySpendingData.data.filter((v) => v > 0).length,
                                1
                              )
                            ).toFixed(0)}
                          </Text>
                          <Text
                            style={[
                              styles.miniStatLabel,
                              { color: colors.text.tertiary, fontFamily: fontFamily.semibold },
                            ]}
                          >
                            DAILY AVG
                          </Text>
                        </View>
                      </View>

                      {/* vs Last Month Card */}
                      {dailySpendingData.prevMonthData &&
                        dailySpendingData.prevMonthData.some((v) => v > 0) &&
                        (() => {
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
                          const accent = isIncrease
                            ? colors.rose[500]
                            : colors.lime[500];
                          const accentBg = isIncrease
                            ? colors.negBg
                            : colors.posBg;
                          return (
                            <View
                              style={[
                                styles.miniStatCard,
                                { backgroundColor: tileBg, borderColor: colors.border.medium },
                              ]}
                            >
                              <View
                                style={[
                                  styles.miniStatIcon,
                                  { backgroundColor: accentBg },
                                ]}
                              >
                                <Ionicons
                                  name={isIncrease ? "arrow-up" : "arrow-down"}
                                  size={16}
                                  color={accent}
                                />
                              </View>
                              <View style={styles.miniStatContent}>
                                <Text
                                  style={[
                                    styles.miniStatValue,
                                    { color: accent, fontFamily: fontFamily.monoMedium },
                                  ]}
                                >
                                  {isIncrease ? "+" : ""}
                                  {Math.abs(percentChange).toFixed(0)}%
                                </Text>
                                <Text
                                  style={[
                                    styles.miniStatLabel,
                                    { color: colors.text.tertiary, fontFamily: fontFamily.semibold },
                                  ]}
                                >
                                  VS LAST MO
                                </Text>
                              </View>
                            </View>
                          );
                        })()}
                    </View>
                  );
                })()}
              </>
            ) : (
              /* Empty Chart State */
              <View
                style={[
                  styles.premiumEmptyChart,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.03)"
                      : "rgba(40,20,80,0.03)",
                    borderColor: colors.border.medium,
                  },
                ]}
              >
                <View
                  style={[
                    styles.premiumEmptyChartIcon,
                    {
                      backgroundColor: isDark
                        ? "rgba(157,91,255,0.16)"
                        : "rgba(123,63,228,0.12)",
                    },
                  ]}
                >
                  <Ionicons
                    name="analytics-outline"
                    size={28}
                    color={colors.primary[500]}
                  />
                </View>
                <Text
                  style={[
                    styles.premiumEmptyChartTitle,
                    { color: colors.text.primary, fontFamily: fontFamily.semibold },
                  ]}
                >
                  No spending data
                </Text>
                <Text
                  style={[
                    styles.premiumEmptyChartSubtitle,
                    { color: colors.text.secondary, fontFamily: fontFamily.medium },
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
