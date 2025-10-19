import React from "react";
import { View, Text, Animated, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import dayjs from "dayjs";
import { useTheme } from "../../../contexts/ThemeContext";
import { budgetSummaryCardStyles } from "./BudgetSummaryCard.styles";

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
}) => {
  const { colors } = useTheme();
  const styles = budgetSummaryCardStyles;

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
          { backgroundColor: colors.background.primary },
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
                    ? `${colors.error[500]}15`
                    : warningLevel === "warning"
                      ? `${colors.error[500]}10`
                      : `${colors.warning[500]}10`,
              },
            ]}
          >
            <Ionicons
              name={warningLevel === "critical" ? "alert-circle" : "warning"}
              size={24}
              color={
                warningLevel === "critical" || warningLevel === "warning"
                  ? colors.error[500]
                  : colors.warning[500]
              }
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color:
                    warningLevel === "critical" || warningLevel === "warning"
                      ? colors.error[500]
                      : colors.warning[500],
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

        <Text
          style={[styles.simpleBudgetTitle, { color: colors.text.primary }]}
        >
          {dayjs(selectedMonth).format("MMMM YYYY")} Budget
        </Text>

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
            <Svg width={200} height={200} style={{ position: "absolute" }}>
              {/* Background Ring */}
              <Circle
                cx={100}
                cy={100}
                r={88}
                fill="none"
                stroke={colors.background.secondary}
                strokeWidth={24}
              />

              {/* Progress Ring with Rounded Caps */}
              {monthlySpentPercentage > 0 && (
                <>
                  {/* Shadow Ring for Over-Budget Effect */}
                  {monthlySpentPercentage > 100 && (
                    <AnimatedCircle
                      cx={100}
                      cy={100}
                      r={88}
                      fill="none"
                      stroke={colors.error[300]}
                      strokeWidth={24}
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 88}`}
                      strokeDashoffset={animatedProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [2 * Math.PI * 88, 0],
                      })}
                      transform={`rotate(-90 100 100)`}
                      opacity={0.3}
                    />
                  )}

                  {/* Main Progress Ring */}
                  <AnimatedCircle
                    cx={100}
                    cy={100}
                    r={88}
                    fill="none"
                    stroke={
                      monthlyOverBudget
                        ? colors.error[500]
                        : colors.primary[500]
                    }
                    strokeWidth={24}
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 88}`}
                    strokeDashoffset={animatedProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [2 * Math.PI * 88, 2 * Math.PI * 88 * (1 - Math.min(100, monthlySpentPercentage) / 100)],
                    })}
                    transform={`rotate(-90 100 100)`}
                  />

                  {/* Over-Budget Second Ring */}
                  {monthlySpentPercentage > 100 && (
                    <AnimatedCircle
                      cx={100}
                      cy={100}
                      r={88}
                      fill="none"
                      stroke={colors.error[500]}
                      strokeWidth={24}
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 88}`}
                      strokeDashoffset={animatedProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [
                          2 * Math.PI * 88,
                          2 *
                            Math.PI *
                            88 *
                            (1 - (monthlySpentPercentage - 100) / 100),
                        ],
                      })}
                      transform={`rotate(-90 100 100)`}
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
                      ? colors.error[500]
                      : colors.primary[500],
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
                        ? colors.error[500]
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
                { backgroundColor: colors.background.secondary },
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
                { backgroundColor: colors.background.secondary },
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
                { backgroundColor: colors.background.secondary },
              ]}
            >
              <Text
                style={[
                  styles.budgetCardAmount,
                  { color: colors.primary[500] },
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
                { backgroundColor: colors.background.secondary },
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
                      if (percentage > 100) return colors.error[500];
                      if (percentage > 80) return colors.warning[500];
                      return colors.success[500];
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
        </View>
      </View>
    </View>
  );
};
