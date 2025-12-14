import React, { useState } from "react";
import { View, Text, Animated, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import dayjs from "dayjs";
import { useTheme } from "../../../contexts/ThemeContext";
import { budgetSummaryCardStyles } from "./BudgetSummaryCard.styles";
import { AIInsightCard } from "../../ai/AIInsightCard";
import { AIButton } from "../../ai/AIButton";
import { ChartInsightResponse } from "../../../services/api/chartInsightsAPI";

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
            backgroundColor: colors.background.primary,
            borderWidth: isDark ? 1 : 0,
            borderColor: isDark ? colors.border.light : 'transparent',
            shadowColor: isDark ? 'transparent' : '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0 : 0.08,
            shadowRadius: 12,
            elevation: isDark ? 0 : 4,
          },
        ]}
      >
        {/* Warning Alert Banner */}
        {warningLevel && warningMessage && (
          <View
            style={[
              {
                flexDirection: "row",
                alignItems: "flex-start",
                padding: 12,
                borderRadius: 12,
                marginBottom: 16,
                gap: 12,
                backgroundColor:
                  warningLevel === "critical"
                    ? `${colors.error.main}15`
                    : warningLevel === "warning"
                      ? `${colors.error.main}10`
                      : `${colors.warning.main}10`,
              },
            ]}
          >
            <Ionicons
              name={warningLevel === "critical" ? "alert-circle" : "warning"}
              size={24}
              color={
                warningLevel === "critical" || warningLevel === "warning"
                  ? colors.error.main
                  : colors.warning.main
              }
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color:
                    warningLevel === "critical" || warningLevel === "warning"
                      ? colors.error.main
                      : colors.warning.main,
                  marginBottom: 4,
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
                  fontSize: 13,
                  lineHeight: 18,
                  color: colors.text.secondary,
                }}
              >
                {warningMessage}
              </Text>
            </View>
          </View>
        )}

        {/* Header with AI Button */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <Text
            style={[styles.simpleBudgetTitle, { color: colors.text.primary, marginBottom: 0 }]}
          >
            {dayjs(selectedMonth).format("MMMM YYYY")} Budget
          </Text>

          {/* AI Insight Button - Premium Feature - Hidden when insight is active */}
          {isPro && totalBudget > 0 && !showAIInsight && (
            <AIButton
              onPress={handleAIButtonPress}
              loading={aiInsightLoading}
              active={false}
              label="Ask AI"
            />
          )}
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
              {/* Background Ring */}
              <Circle
                cx={120}
                cy={120}
                r={100}
                fill="none"
                stroke={isDark ? 'rgba(255, 255, 255, 0.08)' : colors.gray[200]}
                strokeWidth={24}
              />

              {/* Progress Ring with Rounded Caps */}
              {monthlySpentPercentage > 0 && (
                <>
                  {/* Shadow Ring for Over-Budget Effect */}
                  {monthlySpentPercentage > 100 && (
                    <AnimatedCircle
                      cx={120}
                      cy={120}
                      r={100}
                      fill="none"
                      stroke={colors.error[300]}
                      strokeWidth={24}
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 100}`}
                      strokeDashoffset={animatedProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [2 * Math.PI * 100, 0],
                      })}
                      transform={`rotate(-90 120 120)`}
                      opacity={0.3}
                    />
                  )}

                  {/* Main Progress Ring */}
                  <AnimatedCircle
                    cx={120}
                    cy={120}
                    r={100}
                    fill="none"
                    stroke={
                      monthlyOverBudget
                        ? colors.error.main
                        : colors.primary.main
                    }
                    strokeWidth={24}
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
                      stroke={colors.error.main}
                      strokeWidth={24}
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
                  backgroundColor: colors.background.primary,
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
                      ? colors.error.main
                      : colors.primary.main,
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
                    color: colors.text.secondary,
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
                        ? colors.error.main
                        : colors.text.primary,
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
                styles.budgetCardPrimary,
                {
                  backgroundColor: isDark ? colors.background.secondary : colors.background.primary,
                  borderWidth: 1,
                  borderColor: isDark ? colors.border.light : colors.gray[200],
                },
              ]}
            >
              <Text
                style={[
                  styles.budgetCardAmount,
                  { color: colors.text.primary },
                ]}
              >
                {formatAmount(monthlyTotalSpent, currency)}
              </Text>
              <Text
                style={[
                  styles.budgetCardLabel,
                  { color: colors.text.secondary },
                ]}
              >
                This Month Spent
              </Text>
            </View>

            <View
              style={[
                styles.budgetCard,
                styles.budgetCardSecondary,
                {
                  backgroundColor: isDark ? colors.background.secondary : colors.background.primary,
                  borderWidth: 1,
                  borderColor: isDark ? colors.border.light : colors.gray[200],
                },
              ]}
            >
              <Text
                style={[
                  styles.budgetCardAmount,
                  { color: colors.text.primary },
                ]}
              >
                {formatAmount(totalBudget, currency)}
              </Text>
              <Text
                style={[
                  styles.budgetCardLabel,
                  { color: colors.text.secondary },
                ]}
              >
                Monthly Budget
              </Text>
            </View>
          </View>

          {/* Bottom Row */}
          <View style={styles.budgetRow}>
            <View
              style={[
                styles.budgetCard,
                styles.budgetCardAccent,
                {
                  backgroundColor: isDark ? colors.background.secondary : colors.background.primary,
                  borderWidth: 1,
                  borderColor: isDark ? colors.border.light : colors.gray[200],
                },
              ]}
            >
              <Text
                style={[
                  styles.budgetCardAmount,
                  { color: colors.primary.main },
                ]}
              >
                {formatAmount(averageSpendPerDay, currency)}
              </Text>
              <Text
                style={[
                  styles.budgetCardLabel,
                  { color: colors.text.secondary },
                ]}
              >
                Average Per Day
              </Text>
            </View>

            <View
              style={[
                styles.budgetCard,
                styles.budgetCardWarning,
                {
                  backgroundColor: isDark ? colors.background.secondary : colors.background.primary,
                  borderWidth: 1,
                  borderColor: isDark ? colors.border.light : colors.gray[200],
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
                      if (percentage > 100) return colors.error.main;
                      if (percentage > 80) return colors.warning.main;
                      return colors.success.main;
                    })(),
                  },
                ]}
              >
                {formatAmount(predictedMonthlySpend, currency)}
              </Text>
              <Text
                style={[
                  styles.budgetCardLabel,
                  { color: colors.text.secondary },
                ]}
              >
                Expected Total
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
