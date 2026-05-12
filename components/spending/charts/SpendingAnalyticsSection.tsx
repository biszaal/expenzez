import React, { useMemo, useState } from "react";
import { View, Text, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import dayjs from "dayjs";
import { LineChart, ChartData } from "../../charts";
import { useTheme } from "../../../contexts/ThemeContext";
import { spendingAnalyticsSectionStyles } from "./SpendingAnalyticsSection.styles";
import { AIInsightCard } from "../../ai/AIInsightCard";
import { ChartInsightResponse } from "../../../services/api/chartInsightsAPI";
import { fontFamily } from "../../../constants/theme";
import { getMerchantInfo } from "../../../services/merchantService";

interface Transaction {
  date?: string;
  amount: number;
  category?: string;
  description?: string;
  merchant?: string;
  type?: string;
}

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
  monthlyTransactions?: Transaction[];
  onPointSelect?: (point: any) => void;
  isPro?: boolean;
  aiInsight?: ChartInsightResponse | null;
  aiInsightLoading?: boolean;
  onRequestAIInsight?: () => void;
  canRequestInsight?: boolean;
}

function formatGBP(amount: number, decimals = false): string {
  const abs = Math.abs(amount);
  const fixed = decimals ? abs.toFixed(2) : abs.toFixed(0);
  const [whole, dec] = fixed.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decimals ? `${grouped}.${dec}` : grouped;
}

export const SpendingAnalyticsSection: React.FC<
  SpendingAnalyticsSectionProps
> = ({
  selectedMonth,
  chartData,
  hasTransactions,
  monthlyOverBudget,
  dailySpendingData,
  monthlyTransactions,
  onPointSelect,
  isPro,
  aiInsight,
  aiInsightLoading,
}) => {
  const { colors, isDark } = useTheme();
  const styles = spendingAnalyticsSectionStyles;
  const { width } = Dimensions.get("window");
  const [showAIInsight, setShowAIInsight] = useState(false);

  React.useEffect(() => {
    if (aiInsight && !showAIInsight) {
      setShowAIInsight(true);
    }
  }, [aiInsight]);

  const prevMonthLabel = dayjs(selectedMonth)
    .subtract(1, "month")
    .format("MMM");
  const monthShort = dayjs(selectedMonth).format("MMM");

  // Derived figures shown in the header + 3 stat tiles.
  const stats = useMemo(() => {
    const data = dailySpendingData?.data || [];
    const prev = dailySpendingData?.prevMonthData || [];

    const total = data.reduce((s, v) => s + v, 0);
    const prevTotal = prev.reduce((s, v) => s + v, 0);

    const daysWithData = data.filter((v) => v > 0).length;
    const dailyAvg = daysWithData > 0 ? total / daysWithData : 0;
    const prevDaysWithData = prev.filter((v) => v > 0).length;
    const prevDailyAvg =
      prevDaysWithData > 0 ? prevTotal / prevDaysWithData : 0;
    const dailyDelta = dailyAvg - prevDailyAvg;

    const deltaPct = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0;

    // Largest single expense + merchant.
    const expenses = (monthlyTransactions || []).filter((t) => {
      const amt = Number(t.amount) || 0;
      return t.type === "debit" || amt < 0;
    });
    let largestTx: Transaction | null = null;
    expenses.forEach((t) => {
      const a = Math.abs(Number(t.amount) || 0);
      if (!largestTx || a > Math.abs(Number(largestTx.amount) || 0)) {
        largestTx = t;
      }
    });
    const largestAmount = largestTx
      ? Math.abs(Number(largestTx.amount) || 0)
      : 0;
    const largestMerchant = largestTx
      ? getMerchantInfo(
          largestTx.description || largestTx.merchant || "Unknown"
        ).name
      : null;

    // Most-used category by transaction count.
    const counts: Record<string, number> = {};
    expenses.forEach((t) => {
      const cat = (t.category || "Other").replace(/^.*?[&]\s*/, "").trim();
      counts[cat] = (counts[cat] || 0) + 1;
    });
    const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const topCat = ranked[0]?.[0] || null;
    const topCount = ranked[0]?.[1] || 0;

    return {
      total,
      prevTotal,
      dailyAvg,
      dailyDelta,
      deltaPct,
      deltaIsUp: total >= prevTotal,
      largestAmount,
      largestMerchant,
      mostUsed: topCat,
      mostUsedCount: topCount,
    };
  }, [dailySpendingData, monthlyTransactions]);

  const chartLineColor = monthlyOverBudget
    ? colors.rose[500]
    : colors.primary[500];
  const hasPrevData = (dailySpendingData?.prevMonthData || []).some(
    (v) => v > 0
  );

  // Format the big total — use the chart sum so it tracks the visible curve.
  const totalFormatted = formatGBP(stats.total, true);
  const [totalWhole, totalDec] = totalFormatted.split(".");

  return (
    <>
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
          {/* Header — design parity with screens/spending.jsx */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Text
                style={[
                  styles.headerEyebrow,
                  {
                    color: colors.text.tertiary,
                    fontFamily: fontFamily.semibold,
                  },
                ]}
              >
                TOTAL SPENT
              </Text>
              <View style={styles.headerAmountRow}>
                <Text
                  style={[
                    styles.headerAmountWhole,
                    {
                      color: colors.text.primary,
                      fontFamily: fontFamily.monoMedium,
                    },
                  ]}
                >
                  £{totalWhole}
                </Text>
                <Text
                  style={[
                    styles.headerAmountDec,
                    {
                      color: colors.text.tertiary,
                      fontFamily: fontFamily.mono,
                    },
                  ]}
                >
                  .{totalDec}
                </Text>
              </View>
              {hasPrevData && stats.prevTotal > 0 && (
                <View style={styles.headerDeltaRow}>
                  <View
                    style={[
                      styles.headerDeltaChip,
                      {
                        backgroundColor: stats.deltaIsUp
                          ? colors.negBg
                          : colors.posBg,
                      },
                    ]}
                  >
                    <Ionicons
                      name={stats.deltaIsUp ? "arrow-up" : "arrow-down"}
                      size={10}
                      color={
                        stats.deltaIsUp ? colors.rose[500] : colors.lime[500]
                      }
                    />
                    <Text
                      style={[
                        styles.headerDeltaChipText,
                        {
                          color: stats.deltaIsUp
                            ? colors.rose[500]
                            : colors.lime[500],
                          fontFamily: fontFamily.semibold,
                        },
                      ]}
                    >
                      {stats.deltaIsUp ? "+" : "−"}
                      {Math.abs(stats.deltaPct).toFixed(1)}%
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.headerDeltaSub,
                      {
                        color: colors.text.secondary,
                        fontFamily: fontFamily.medium,
                      },
                    ]}
                  >
                    vs {prevMonthLabel}
                  </Text>
                </View>
              )}
            </View>

            {/* Right-side legend */}
            <View style={styles.legendCol}>
              <View style={styles.legendRow}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: chartLineColor },
                  ]}
                />
                <Text
                  style={[
                    styles.legendText,
                    {
                      color: colors.text.secondary,
                      fontFamily: fontFamily.medium,
                    },
                  ]}
                >
                  {monthShort}
                </Text>
              </View>
              {hasPrevData && (
                <View style={styles.legendRow}>
                  <View
                    style={[
                      styles.legendDot,
                      {
                        backgroundColor: colors.text.tertiary,
                        opacity: 0.5,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.legendText,
                      {
                        color: colors.text.tertiary,
                        fontFamily: fontFamily.medium,
                      },
                    ]}
                  >
                    {prevMonthLabel}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Chart */}
          {hasTransactions ||
          dayjs(selectedMonth).isSame(dayjs(), "month") ? (
            <View style={styles.chartSection}>
              <GestureHandlerRootView style={styles.chartArea}>
                <LineChart
                  data={chartData}
                  width={width - 84}
                  height={150}
                  animated={true}
                  interactive={true}
                  gradientColors={
                    monthlyOverBudget
                      ? [colors.rose[500], colors.rose[600]]
                      : [colors.primary[500], colors.lime[500]]
                  }
                  lineColor={chartLineColor}
                  pointColor={chartLineColor}
                  backgroundColor="transparent"
                  onPointSelect={onPointSelect}
                  showGrid={false}
                  showPoints={true}
                  curveType="bezier"
                  gridColor={colors.text.tertiary}
                  labelColor={colors.text.secondary}
                />
              </GestureHandlerRootView>
              <View style={styles.xAxisRow}>
                <Text
                  style={[
                    styles.xAxisLabel,
                    {
                      color: colors.text.tertiary,
                      fontFamily: fontFamily.medium,
                    },
                  ]}
                >
                  1 {monthShort}
                </Text>
                <Text
                  style={[
                    styles.xAxisLabel,
                    {
                      color: colors.text.tertiary,
                      fontFamily: fontFamily.medium,
                    },
                  ]}
                >
                  10 {monthShort}
                </Text>
                <Text
                  style={[
                    styles.xAxisLabel,
                    {
                      color: colors.text.tertiary,
                      fontFamily: fontFamily.medium,
                    },
                  ]}
                >
                  20 {monthShort}
                </Text>
                <Text
                  style={[
                    styles.xAxisLabel,
                    {
                      color: colors.text.tertiary,
                      fontFamily: fontFamily.medium,
                    },
                  ]}
                >
                  {dayjs(selectedMonth).daysInMonth()} {monthShort}
                </Text>
              </View>
            </View>
          ) : (
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
                  {
                    color: colors.text.primary,
                    fontFamily: fontFamily.semibold,
                  },
                ]}
              >
                No spending data
              </Text>
              <Text
                style={[
                  styles.premiumEmptyChartSubtitle,
                  {
                    color: colors.text.secondary,
                    fontFamily: fontFamily.medium,
                  },
                ]}
              >
                Start spending to see your analytics
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* 3 stat tiles below the chart card */}
      {hasTransactions && (
        <View style={styles.statsRow}>
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: colors.card.background,
                borderColor: colors.border.medium,
              },
            ]}
          >
            <Text
              style={[
                styles.statLabel,
                {
                  color: colors.text.tertiary,
                  fontFamily: fontFamily.semibold,
                },
              ]}
            >
              Daily avg
            </Text>
            <Text
              style={[
                styles.statValue,
                {
                  color: colors.text.primary,
                  fontFamily: fontFamily.monoSemibold,
                },
              ]}
            >
              £{formatGBP(stats.dailyAvg, true)}
            </Text>
            {Math.abs(stats.dailyDelta) >= 0.01 && (
              <Text
                style={[
                  styles.statSub,
                  {
                    color:
                      stats.dailyDelta > 0
                        ? colors.rose[500]
                        : colors.lime[500],
                    fontFamily: fontFamily.medium,
                  },
                ]}
              >
                {stats.dailyDelta > 0 ? "+" : "−"}£
                {formatGBP(stats.dailyDelta, true)}
              </Text>
            )}
          </View>

          <View
            style={[
              styles.statCard,
              {
                backgroundColor: colors.card.background,
                borderColor: colors.border.medium,
              },
            ]}
          >
            <Text
              style={[
                styles.statLabel,
                {
                  color: colors.text.tertiary,
                  fontFamily: fontFamily.semibold,
                },
              ]}
            >
              Largest
            </Text>
            <Text
              style={[
                styles.statValue,
                {
                  color: colors.text.primary,
                  fontFamily: fontFamily.monoSemibold,
                },
              ]}
            >
              £{formatGBP(stats.largestAmount)}
            </Text>
            {stats.largestMerchant && (
              <Text
                numberOfLines={1}
                style={[
                  styles.statSub,
                  {
                    color: colors.text.tertiary,
                    fontFamily: fontFamily.medium,
                  },
                ]}
              >
                {stats.largestMerchant}
              </Text>
            )}
          </View>

          <View
            style={[
              styles.statCard,
              {
                backgroundColor: colors.card.background,
                borderColor: colors.border.medium,
              },
            ]}
          >
            <Text
              style={[
                styles.statLabel,
                {
                  color: colors.text.tertiary,
                  fontFamily: fontFamily.semibold,
                },
              ]}
            >
              Most-used
            </Text>
            <Text
              numberOfLines={1}
              style={[
                styles.statValue,
                {
                  color: colors.text.primary,
                  fontFamily: fontFamily.semibold,
                  fontSize: 14,
                  letterSpacing: -0.2,
                },
              ]}
            >
              {stats.mostUsed || "—"}
            </Text>
            {stats.mostUsedCount > 0 && (
              <Text
                style={[
                  styles.statSub,
                  {
                    color: colors.text.tertiary,
                    fontFamily: fontFamily.medium,
                  },
                ]}
              >
                {stats.mostUsedCount}×
              </Text>
            )}
          </View>
        </View>
      )}

      {/* AI Spending Insight */}
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
    </>
  );
};
