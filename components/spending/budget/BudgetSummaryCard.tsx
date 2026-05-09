import React, { useState } from "react";
import { View, Text, Animated, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from "react-native-svg";
import dayjs from "dayjs";
import { useTheme } from "../../../contexts/ThemeContext";
import { budgetSummaryCardStyles } from "./BudgetSummaryCard.styles";
import { AIInsightCard } from "../../ai/AIInsightCard";
import { AIButton } from "../../ai/AIButton";
import { ChartInsightResponse } from "../../../services/api/chartInsightsAPI";
import { fontFamily } from "../../../constants/theme";

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
  // AI insight props
  isPro?: boolean;
  aiInsight?: ChartInsightResponse | null;
  aiInsightLoading?: boolean;
  onRequestAIInsight?: () => void;
  canRequestInsight?: boolean;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

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
  onRequestAIInsight,
  canRequestInsight = true,
}) => {
  const { colors, isDark } = useTheme();
  const styles = budgetSummaryCardStyles;
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

  // Calculate warning level
  const getWarningLevel = () => {
    if (totalBudget === 0) return null;
    const percentage = monthlySpentPercentage;
    if (percentage > 150) return "critical"; // Over 150%
    if (percentage > 100) return "warning"; // Over 100%
    if (percentage > 80) return "caution"; // 80-100%
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
        {/* Warning Alert Banner */}
        {warningLevel && warningMessage && (() => {
          const isOver = warningLevel === "critical" || warningLevel === "warning";
          const accent = isOver ? colors.rose[500] : colors.amber[500];
          const tintBg = isOver ? colors.negBg : "rgba(245,179,66,0.12)";
          return (
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                padding: 12,
                borderRadius: 14,
                marginBottom: 16,
                gap: 12,
                backgroundColor: tintBg,
              }}
            >
              <Ionicons
                name={warningLevel === "critical" ? "alert-circle" : "warning"}
                size={20}
                color={accent}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: fontFamily.semibold,
                    color: accent,
                    marginBottom: 2,
                    letterSpacing: 0.2,
                  }}
                >
                  {warningLevel === "critical"
                    ? "Critical Budget Alert"
                    : warningLevel === "warning"
                      ? "Budget Exceeded"
                      : "Budget Warning"}
                </Text>
                <Text
                  style={{
                    fontSize: 12.5,
                    lineHeight: 17,
                    fontFamily: fontFamily.medium,
                    color: colors.text.secondary,
                  }}
                >
                  {warningMessage}
                </Text>
              </View>
            </View>
          );
        })()}

        {/* Header with AI Button */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <Text
            style={[
              styles.simpleBudgetTitle,
              {
                color: colors.text.primary,
                marginBottom: 0,
                flex: 1,
                textAlign: "left",
                fontFamily: fontFamily.semibold,
              },
            ]}
            numberOfLines={1}
          >
            {dayjs(selectedMonth).format("MMMM YYYY")} Budget
          </Text>
        </View>

        {/* Animated SVG Donut Chart - MOVED ABOVE METRICS */}
        <Animated.View
          style={[
            styles.donutChartContainer,
            {
              transform: [{ scale: animatedScale }],
            },
          ]}
        >
          <View style={styles.donutChart}>
            <Svg width={240} height={240} style={{ position: "absolute" }}>
              <Defs>
                <SvgLinearGradient id="budgetRingGrad" x1="0" y1="0" x2="240" y2="240">
                  <Stop offset="0" stopColor={colors.primary[500]} />
                  <Stop offset="1" stopColor={colors.lime[500]} />
                </SvgLinearGradient>
              </Defs>

              {/* Background Ring */}
              <Circle
                cx={120}
                cy={120}
                r={100}
                fill="none"
                stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(40,20,80,0.08)"}
                strokeWidth={20}
              />

              {/* Progress Ring with Rounded Caps */}
              {monthlySpentPercentage > 0 && (
                <>
                  {/* Main Progress Ring (gradient when on track, rose when over) */}
                  <AnimatedCircle
                    cx={120}
                    cy={120}
                    r={100}
                    fill="none"
                    stroke={monthlyOverBudget ? colors.rose[500] : "url(#budgetRingGrad)"}
                    strokeWidth={20}
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 100}`}
                    strokeDashoffset={animatedProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [2 * Math.PI * 100, 0],
                    })}
                    transform={`rotate(-90 120 120)`}
                  />

                  {/* Over-Budget Second Ring */}
                  {monthlySpentPercentage > 100 && (
                    <AnimatedCircle
                      cx={120}
                      cy={120}
                      r={100}
                      fill="none"
                      stroke={colors.rose[500]}
                      strokeWidth={20}
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 100}`}
                      strokeDashoffset={animatedProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [
                          2 * Math.PI * 100,
                          2 *
                            Math.PI *
                            100 *
                            (1 - (monthlySpentPercentage - 100) / 100),
                        ],
                      })}
                      transform={`rotate(-90 120 120)`}
                      opacity={0.55}
                    />
                  )}
                </>
              )}
            </Svg>

            {/* Center Content with Fade Animation */}
            <Animated.View
              style={[
                styles.donutCenter,
                {
                  backgroundColor: colors.card.background,
                  opacity: animatedProgress.interpolate({
                    inputRange: [0, 0.1, 1],
                    outputRange: [0.8, 1, 1],
                  }),
                },
              ]}
            >
              <Animated.Text
                style={[
                  styles.donutCenterPercentage,
                  {
                    color: monthlyOverBudget
                      ? colors.rose[500]
                      : colors.text.primary,
                    fontFamily: fontFamily.monoSemibold,
                    opacity: animatedProgress.interpolate({
                      inputRange: [0, 0.2, 1],
                      outputRange: [0.7, 1, 1],
                    }),
                  },
                ]}
              >
                {Math.round(monthlySpentPercentage)}%
              </Animated.Text>
              <Animated.Text
                style={[
                  styles.donutCenterLabel,
                  {
                    color: colors.text.tertiary,
                    fontFamily: fontFamily.semibold,
                    opacity: animatedProgress.interpolate({
                      inputRange: [0, 0.3, 1],
                      outputRange: [0.6, 1, 1],
                    }),
                  },
                ]}
              >
                USED
              </Animated.Text>
              <Animated.Text
                style={[
                  styles.donutCenterAmount,
                  {
                    color:
                      displayLeftToSpend < 0
                        ? colors.rose[500]
                        : colors.text.secondary,
                    fontFamily: fontFamily.mono,
                    opacity: animatedProgress.interpolate({
                      inputRange: [0, 0.4, 1],
                      outputRange: [0.5, 1, 1],
                    }),
                  },
                ]}
              >
                {displayLeftToSpend < 0
                  ? `Over ${formatAmount(Math.abs(displayLeftToSpend), currency)}`
                  : `${formatAmount(displayLeftToSpend, currency)} left`}
              </Animated.Text>
            </Animated.View>
          </View>
        </Animated.View>

        {/* Spending Metrics 2x2 Grid Layout - MOVED BELOW CHART */}
        <View style={styles.budgetGridContainer}>
          {/* Top Row */}
          <View style={styles.budgetRow}>
            <View
              style={[
                styles.budgetCard,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.03)"
                    : "rgba(40,20,80,0.03)",
                  borderColor: colors.border.medium,
                },
              ]}
            >
              <Text
                style={[
                  styles.budgetCardAmount,
                  { color: colors.text.primary, fontFamily: fontFamily.monoMedium },
                ]}
              >
                {formatAmount(monthlyTotalSpent, currency)}
              </Text>
              <Text
                style={[
                  styles.budgetCardLabel,
                  { color: colors.text.tertiary, fontFamily: fontFamily.semibold },
                ]}
              >
                THIS MONTH SPENT
              </Text>
            </View>

            <View
              style={[
                styles.budgetCard,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.03)"
                    : "rgba(40,20,80,0.03)",
                  borderColor: colors.border.medium,
                },
              ]}
            >
              <Text
                style={[
                  styles.budgetCardAmount,
                  { color: colors.text.primary, fontFamily: fontFamily.monoMedium },
                ]}
              >
                {formatAmount(totalBudget, currency)}
              </Text>
              <Text
                style={[
                  styles.budgetCardLabel,
                  { color: colors.text.tertiary, fontFamily: fontFamily.semibold },
                ]}
              >
                MONTHLY BUDGET
              </Text>
            </View>
          </View>

          {/* Bottom Row */}
          <View style={styles.budgetRow}>
            <View
              style={[
                styles.budgetCard,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.03)"
                    : "rgba(40,20,80,0.03)",
                  borderColor: colors.border.medium,
                },
              ]}
            >
              <Text
                style={[
                  styles.budgetCardAmount,
                  { color: colors.primary[500], fontFamily: fontFamily.monoMedium },
                ]}
              >
                {formatAmount(averageSpendPerDay, currency)}
              </Text>
              <Text
                style={[
                  styles.budgetCardLabel,
                  { color: colors.text.tertiary, fontFamily: fontFamily.semibold },
                ]}
              >
                AVERAGE PER DAY
              </Text>
            </View>

            <View
              style={[
                styles.budgetCard,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.03)"
                    : "rgba(40,20,80,0.03)",
                  borderColor: colors.border.medium,
                },
              ]}
            >
              <Text
                style={[
                  styles.budgetCardAmount,
                  {
                    color: (() => {
                      if (totalBudget === 0) return colors.text.primary;
                      const percentage =
                        (predictedMonthlySpend / totalBudget) * 100;
                      if (percentage > 100) return colors.rose[500];
                      if (percentage > 80) return colors.amber[500];
                      return colors.lime[500];
                    })(),
                    fontFamily: fontFamily.monoMedium,
                  },
                ]}
              >
                {formatAmount(predictedMonthlySpend, currency)}
              </Text>
              <Text
                style={[
                  styles.budgetCardLabel,
                  { color: colors.text.tertiary, fontFamily: fontFamily.semibold },
                ]}
              >
                EXPECTED TOTAL
              </Text>
            </View>
          </View>

          {/* AI Budget Insight - Premium Feature */}
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
    </View>
  );
};
