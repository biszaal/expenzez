import React, { useState } from "react";
import { View, Text, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  RadialGradient,
  Stop,
} from "react-native-svg";
import dayjs from "dayjs";
import { useTheme } from "../../../contexts/ThemeContext";
import { budgetSummaryCardStyles } from "./BudgetSummaryCard.styles";
import { AIInsightCard } from "../../ai/AIInsightCard";
import { ChartInsightResponse } from "../../../services/api/chartInsightsAPI";
import { fontFamily } from "../../../constants/theme";

// Note: we deliberately use a plain Circle (not AnimatedCircle) for the
// progress arc. react-native-svg drops the url(#gradient) stroke ref when
// the Circle is wrapped in Animated.createAnimatedComponent, which made the
// ring render as flat purple instead of the purple→lime gradient. The
// Animated.View scale wrapper still gives the card its entry animation.

interface BudgetSummaryCardProps {
  selectedMonth: string;
  monthlyTotalSpent: number;
  totalBudget: number;
  averageSpendPerDay: number;
  predictedMonthlySpend: number;
  displayLeftToSpend: number;
  monthlySpentPercentage: number;
  monthlyOverBudget: boolean;
  currentMonth: boolean;
  formatAmount: (amount: number, currency?: string) => string;
  currency: string;
  animatedScale: Animated.Value;
  animatedProgress: Animated.Value;
  isPro?: boolean;
  aiInsight?: ChartInsightResponse | null;
  aiInsightLoading?: boolean;
  onRequestAIInsight?: () => void;
  canRequestInsight?: boolean;
}

// Hero ring geometry (matches design's 180px card with r=78 stroke=10).
const RING_SIZE = 180;
const RING_RADIUS = 78;
const RING_STROKE = 10;
const RING_CIRC = 2 * Math.PI * RING_RADIUS;

export const BudgetSummaryCard: React.FC<BudgetSummaryCardProps> = ({
  selectedMonth,
  monthlyTotalSpent,
  totalBudget,
  averageSpendPerDay,
  predictedMonthlySpend,
  displayLeftToSpend,
  monthlySpentPercentage,
  monthlyOverBudget,
  currentMonth,
  formatAmount,
  currency,
  animatedScale,
  animatedProgress,
  isPro,
  aiInsight,
  aiInsightLoading,
}) => {
  const { colors, isDark } = useTheme();
  const styles = budgetSummaryCardStyles;
  const [showAIInsight, setShowAIInsight] = useState(false);

  React.useEffect(() => {
    if (aiInsight && !showAIInsight) {
      setShowAIInsight(true);
    }
  }, [aiInsight]);

  // Warning level for the optional banner above the hero ring.
  const getWarningLevel = () => {
    if (totalBudget === 0) return null;
    const percentage = monthlySpentPercentage;
    if (percentage > 150) return "critical";
    if (percentage > 100) return "warning";
    if (percentage > 80) return "caution";
    return null;
  };
  const warningLevel = getWarningLevel();
  const getWarningMessage = () => {
    const overAmount = Math.abs(displayLeftToSpend);
    if (monthlySpentPercentage > 150) {
      return `You're significantly over budget by ${formatAmount(overAmount, currency)}. Consider reviewing your spending categories.`;
    }
    if (monthlySpentPercentage > 100) {
      return `You've exceeded your budget by ${formatAmount(overAmount, currency)}. Review your expenses to get back on track.`;
    }
    if (monthlySpentPercentage > 80) {
      return `You're approaching your budget limit. ${formatAmount(displayLeftToSpend, currency)} remaining.`;
    }
    return null;
  };
  const warningMessage = getWarningMessage();

  // Status pill color shown inside the ring center under the percentage.
  const onTrack = monthlySpentPercentage <= 80;
  const atRisk = monthlySpentPercentage > 80 && monthlySpentPercentage <= 100;
  const statusLabel = monthlyOverBudget
    ? "OVER BUDGET"
    : atRisk
      ? "AT RISK"
      : onTrack
        ? "ON TRACK"
        : "TRACKING";
  const statusColor = monthlyOverBudget
    ? colors.rose[500]
    : atRisk
      ? colors.amber[500]
      : colors.posFg;

  // Days remaining used to compute the daily-safe figure.
  const monthEnd = dayjs(selectedMonth).endOf("month");
  const daysRemaining = currentMonth
    ? Math.max(monthEnd.diff(dayjs(), "day") + 1, 1)
    : monthEnd.daysInMonth();
  const dailySafe = Math.max(displayLeftToSpend, 0) / daysRemaining;
  const dailySafeColor =
    displayLeftToSpend < 0 ? colors.rose[500] : colors.posFg;

  // Glow color at the top-right of the card; matches design's primary glow.
  const glowColor = isDark ? "rgba(157,91,255,0.35)" : "rgba(123,63,228,0.24)";

  return (
    <View style={styles.simpleBudgetContainer}>
      <View
        style={[
          styles.simpleBudgetCard,
          {
            backgroundColor: colors.card.background,
            borderColor: colors.border.medium,
          },
        ]}
      >
        {/* Optional warning banner */}
        {warningLevel &&
          warningMessage &&
          (() => {
            const isOver =
              warningLevel === "critical" || warningLevel === "warning";
            const accent = isOver ? colors.rose[500] : colors.amber[500];
            const tintBg = isOver ? colors.negBg : "rgba(245,179,66,0.12)";
            return (
              <View style={[styles.warningBanner, { backgroundColor: tintBg }]}>
                <Ionicons
                  name={
                    warningLevel === "critical" ? "alert-circle" : "warning"
                  }
                  size={20}
                  color={accent}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.warningTitle,
                      { color: accent, fontFamily: fontFamily.semibold },
                    ]}
                  >
                    {warningLevel === "critical"
                      ? "Critical Budget Alert"
                      : warningLevel === "warning"
                        ? "Budget Exceeded"
                        : "Budget Warning"}
                  </Text>
                  <Text
                    style={[
                      styles.warningBody,
                      {
                        color: colors.text.secondary,
                        fontFamily: fontFamily.medium,
                      },
                    ]}
                  >
                    {warningMessage}
                  </Text>
                </View>
              </View>
            );
          })()}

        {/* Title row */}
        <View style={styles.heroHeaderRow}>
          <Text
            numberOfLines={1}
            style={[
              styles.simpleBudgetTitle,
              {
                color: colors.text.primary,
                fontFamily: fontFamily.semibold,
              },
            ]}
          >
            {dayjs(selectedMonth).format("MMMM YYYY")} Budget
          </Text>
        </View>

        {/* Hero layout: ring on left, ledger on right */}
        <Animated.View
          style={[styles.heroLayout, { transform: [{ scale: animatedScale }] }]}
        >
          {/* Ring */}
          <View style={styles.ringWrapper}>
            <Svg
              width={RING_SIZE}
              height={RING_SIZE}
              viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
            >
              <Defs>
                <SvgLinearGradient
                  id="budgetRingGrad"
                  x1="0"
                  y1="0"
                  x2={RING_SIZE}
                  y2={RING_SIZE}
                >
                  <Stop offset="0" stopColor={colors.primary[500]} />
                  <Stop offset="1" stopColor={colors.lime[500]} />
                </SvgLinearGradient>
              </Defs>
              {/* Background track */}
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                fill="none"
                stroke={
                  isDark ? "rgba(255,255,255,0.08)" : "rgba(40,20,80,0.08)"
                }
                strokeWidth={RING_STROKE}
              />
              {/* Progress ring (non-animated so url(#grad) renders) */}
              {monthlySpentPercentage > 0 && (
                <Circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_RADIUS}
                  fill="none"
                  stroke={
                    monthlyOverBudget
                      ? colors.rose[500]
                      : "url(#budgetRingGrad)"
                  }
                  strokeWidth={RING_STROKE}
                  strokeLinecap="round"
                  strokeDasharray={`${RING_CIRC}`}
                  strokeDashoffset={
                    RING_CIRC * (1 - Math.min(monthlySpentPercentage / 100, 1))
                  }
                  transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
                />
              )}
              {/* Over-budget secondary ring */}
              {monthlySpentPercentage > 100 && (
                <Circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_RADIUS}
                  fill="none"
                  stroke={colors.rose[500]}
                  strokeWidth={RING_STROKE}
                  strokeLinecap="round"
                  strokeDasharray={`${RING_CIRC}`}
                  strokeDashoffset={
                    RING_CIRC *
                    (1 - Math.min((monthlySpentPercentage - 100) / 100, 1))
                  }
                  transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
                  opacity={0.55}
                />
              )}
            </Svg>
            {/* Ring center */}
            <View style={styles.ringCenter}>
              <Text
                style={[
                  styles.ringCenterCaption,
                  {
                    color: colors.text.tertiary,
                    fontFamily: fontFamily.semibold,
                  },
                ]}
              >
                USED
              </Text>
              <Text
                style={[
                  styles.ringCenterPercent,
                  {
                    color: monthlyOverBudget
                      ? colors.rose[500]
                      : colors.text.primary,
                    fontFamily: fontFamily.monoSemibold,
                  },
                ]}
              >
                {Math.round(monthlySpentPercentage)}
                <Text style={styles.ringCenterPercentSign}>%</Text>
              </Text>
              <Text
                style={[
                  styles.ringCenterStatus,
                  {
                    color: statusColor,
                    fontFamily: fontFamily.semibold,
                  },
                ]}
              >
                {statusLabel}
              </Text>
            </View>
          </View>

          {/* Stats column */}
          <View style={styles.statsCol}>
            <Text
              style={[
                styles.statsCaption,
                {
                  color: colors.text.tertiary,
                  fontFamily: fontFamily.semibold,
                },
              ]}
            >
              REMAINING
            </Text>
            <Text
              numberOfLines={1}
              style={[
                styles.statsRemaining,
                {
                  color:
                    displayLeftToSpend < 0
                      ? colors.rose[500]
                      : colors.text.primary,
                  fontFamily: fontFamily.monoMedium,
                },
              ]}
            >
              {formatAmount(Math.max(displayLeftToSpend, 0), currency)}
            </Text>
            <View
              style={[
                styles.statsDivider,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.04)"
                    : "rgba(40,20,80,0.05)",
                },
              ]}
            />
            <View style={styles.statsRowFirst}>
              <Text
                style={[
                  styles.statsRowLabel,
                  {
                    color: colors.text.secondary,
                    fontFamily: fontFamily.medium,
                  },
                ]}
              >
                Spent
              </Text>
              <Text
                style={[
                  styles.statsRowValue,
                  {
                    color: colors.text.primary,
                    fontFamily: fontFamily.monoMedium,
                  },
                ]}
              >
                {formatAmount(monthlyTotalSpent, currency)}
              </Text>
            </View>
            <View style={styles.statsRow}>
              <Text
                style={[
                  styles.statsRowLabel,
                  {
                    color: colors.text.secondary,
                    fontFamily: fontFamily.medium,
                  },
                ]}
              >
                Budget
              </Text>
              <Text
                style={[
                  styles.statsRowValue,
                  {
                    color: colors.text.primary,
                    fontFamily: fontFamily.monoMedium,
                  },
                ]}
              >
                {formatAmount(totalBudget, currency)}
              </Text>
            </View>
            <View style={styles.statsRow}>
              <Text
                style={[
                  styles.statsRowLabel,
                  {
                    color: colors.text.secondary,
                    fontFamily: fontFamily.medium,
                  },
                ]}
              >
                {currentMonth ? "Daily safe" : "Avg / day"}
              </Text>
              <Text
                style={[
                  styles.statsRowValue,
                  {
                    color: currentMonth ? dailySafeColor : colors.text.primary,
                    fontFamily: fontFamily.monoMedium,
                  },
                ]}
              >
                {formatAmount(
                  currentMonth ? dailySafe : averageSpendPerDay,
                  currency,
                )}
                {currentMonth ? " / day" : ""}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* AI Budget Insight - Premium */}
        {isPro && showAIInsight && aiInsight && totalBudget > 0 && (
          <View style={{ marginTop: 16 }}>
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
    </View>
  );
};
