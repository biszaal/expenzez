import React, { useMemo, useState } from "react";
import { View, Text, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import dayjs from "dayjs";
import { LineChart, ChartData } from "../../charts";
import { useTheme } from "../../../contexts/ThemeContext";
import { useCurrency } from "../../../contexts/CurrencyContext";
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
  const { symbol } = useCurrency();
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
  const prevMonthLong = dayjs(selectedMonth)
    .subtract(1, "month")
    .format("MMMM");
  const monthShort = dayjs(selectedMonth).format("MMM");
  const monthLong = dayjs(selectedMonth).format("MMMM");

  // Derived figures shown in the header + 3 stat tiles.
  const stats = useMemo(() => {
    // `data` / `prevMonthData` are CUMULATIVE running totals (built in
    // spending.tsx via `data.push(currentCumulative)`), so the month total is
    // the FINAL point on the curve — not the sum of the series. A previous
    // version summed the cumulative array, which inflated the total to roughly
    // dailyAvg × days (e.g. £28k instead of ~£1.8k). Per-day spend is the
    // difference between consecutive cumulative points.
    const data = dailySpendingData?.data || [];
    const prev = dailySpendingData?.prevMonthData || [];

    const lastValue = (series: number[]) =>
      series.length > 0 ? series[series.length - 1] : 0;
    const toDailyIncrements = (series: number[]) =>
      series.map((v, i) => (i === 0 ? v : v - series[i - 1]));

    const total = lastValue(data);
    const prevTotal = lastValue(prev);

    const dailyIncrements = toDailyIncrements(data);
    const prevIncrements = toDailyIncrements(prev);

    const daysWithData = dailyIncrements.filter((v) => v > 0).length;
    const dailyAvg = daysWithData > 0 ? total / daysWithData : 0;
    const prevDaysWithData = prevIncrements.filter((v) => v > 0).length;
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

  // Format the big total — the final cumulative point, so it matches the end
  // of the visible curve.
  const totalFormatted = formatGBP(stats.total, true);
  const [totalWhole, totalDec] = totalFormatted.split(".");

  // Comparison readout. Lead with the absolute £ change (always meaningful) and
  // only append the % when it's sane — when last month was near-zero the % blows
  // up into nonsense like +11502%, so we drop it and let the £ figure stand.
  const absDelta = Math.abs(stats.total - stats.prevTotal);
  const showDeltaPct = stats.prevTotal > 0 && Math.abs(stats.deltaPct) < 1000;
  const deltaColor = stats.deltaIsUp ? colors.rose[500] : colors.lime[500];

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
                TOTAL SPENT · {monthLong.toUpperCase()}
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
                  {symbol}{totalWhole}
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
                  <Ionicons
                    name={stats.deltaIsUp ? "arrow-up" : "arrow-down"}
                    size={13}
                    color={deltaColor}
                  />
                  <Text
                    style={[
                      styles.headerDeltaAmount,
                      { color: deltaColor, fontFamily: fontFamily.semibold },
                    ]}
                  >
                    {symbol}{formatGBP(absDelta)}
                  </Text>
                  <Text
                    style={[
                      styles.headerDeltaSub,
                      {
                        color: colors.text.secondary,
                        fontFamily: fontFamily.medium,
                      },
                    ]}
                  >
                    {stats.deltaIsUp ? "more than" : "less than"} {prevMonthLong}
                    {showDeltaPct
                      ? `  ·  ${stats.deltaIsUp ? "+" : "−"}${Math.abs(
                          stats.deltaPct
                        ).toFixed(0)}%`
                      : ""}
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
                      styles.legendDotHollow,
                      { borderColor: colors.text.tertiary },
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
                  showGrid={true}
                  showPoints={true}
                  curveType="monotone"
                  gridColor={colors.text.tertiary}
                  labelColor={colors.text.secondary}
                  endDotRingColor={colors.card.background}
                />
              </GestureHandlerRootView>
              {/* The LineChart draws its own date axis (1 / mid / last), so no
                  second label row here — one clean axis only. */}
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
                      ? "rgba(78,124,255,0.16)"
                      : "rgba(37,71,240,0.12)",
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

      {/* Stat row — one card, three columns split by hairline dividers. */}
      {hasTransactions && (
        <View style={styles.statsRow}>
          <View
            style={[
              styles.statsCard,
              {
                backgroundColor: colors.card.background,
                borderColor: colors.border.medium,
              },
            ]}
          >
            <View style={styles.statCol}>
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
                {symbol}{formatGBP(stats.dailyAvg, true)}
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
                  {stats.dailyDelta > 0 ? "+" : "−"}{symbol}
                  {formatGBP(Math.abs(stats.dailyDelta), true)}
                </Text>
              )}
            </View>

            <View
              style={[
                styles.statDivider,
                { backgroundColor: colors.border.medium },
              ]}
            />

            <View style={styles.statCol}>
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
                {symbol}{formatGBP(stats.largestAmount)}
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
                styles.statDivider,
                { backgroundColor: colors.border.medium },
              ]}
            />

            <View style={styles.statCol}>
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
