import React from 'react';
import { View, Text, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import dayjs from 'dayjs';
import { useTheme } from '../../../contexts/ThemeContext';
import { budgetSummaryCardStyles } from './BudgetSummaryCard.styles';

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
  animatedProgress
}) => {
  const { colors } = useTheme();
  const styles = budgetSummaryCardStyles;

  return (
    <View style={styles.simpleBudgetContainer}>
      <View style={[styles.simpleBudgetCard, { backgroundColor: colors.background.primary }]}>
        <Text style={[styles.simpleBudgetTitle, { color: colors.text.primary }]}>
          {dayjs(selectedMonth).format("MMMM YYYY")} Budget
        </Text>
        
        {/* Spending Metrics 2x2 Grid Layout */}
        <View style={styles.budgetGridContainer}>
          {/* Top Row */}
          <View style={styles.budgetRow}>
            <View style={[styles.budgetCard, styles.budgetCardPrimary]}>
              <Text style={[styles.budgetCardAmount, { color: colors.text.primary }]}>
                {formatAmount(monthlyTotalSpent, currency)}
              </Text>
              <Text style={[styles.budgetCardLabel, { color: colors.text.secondary }]}>
                This Month Spent
              </Text>
            </View>
            
            <View style={[styles.budgetCard, styles.budgetCardSecondary]}>
              <Text style={[styles.budgetCardAmount, { color: colors.text.primary }]}>
                {formatAmount(totalBudget, currency)}
              </Text>
              <Text style={[styles.budgetCardLabel, { color: colors.text.secondary }]}>
                Monthly Budget
              </Text>
            </View>
          </View>

          {/* Bottom Row */}
          <View style={styles.budgetRow}>
            <View style={[styles.budgetCard, styles.budgetCardAccent]}>
              <Text style={[styles.budgetCardAmount, { color: colors.primary[500] }]}>
                {formatAmount(averageSpendPerDay, currency)}
              </Text>
              <Text style={[styles.budgetCardLabel, { color: colors.text.secondary }]}>
                Average Per Day
              </Text>
            </View>
            
            <View style={[styles.budgetCard, styles.budgetCardWarning]}>
              <Text style={[styles.budgetCardAmount, { 
                color: (() => {
                  if (!currentMonth) return colors.text.primary;
                  if (totalBudget === 0) return colors.text.primary;
                  
                  const percentage = (predictedMonthlySpend / totalBudget) * 100;
                  if (percentage > 100) return colors.error[500];
                  if (percentage > 80) return colors.warning[500];
                  return colors.success[500];
                })()
              }]}>
                {formatAmount(predictedMonthlySpend, currency)}
              </Text>
              <Text style={[styles.budgetCardLabel, { color: colors.text.secondary }]}>
                {currentMonth ? 'Predicted Monthly' : 'Monthly Total'}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Animated SVG Donut Chart */}
        <Animated.View style={[styles.donutChartContainer, {
          transform: [{ scale: animatedScale }]
        }]}>
          <View style={styles.donutChart}>
            <Svg width={200} height={200} style={{ position: 'absolute' }}>
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
                <AnimatedCircle
                  cx={100}
                  cy={100}
                  r={88}
                  fill="none"
                  stroke={monthlyOverBudget ? colors.error[500] : colors.primary[500]}
                  strokeWidth={24}
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 88}`}
                  strokeDashoffset={animatedProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [2 * Math.PI * 88, 0] // Simplified: from full circle to no offset
                  })}
                  transform={`rotate(-90 100 100)`}
                />
              )}
            </Svg>
            
            {/* Center Content with Fade Animation */}
            <Animated.View style={[styles.donutCenter, { 
              backgroundColor: colors.background.primary,
              opacity: animatedProgress.interpolate({
                inputRange: [0, 0.1, 1],
                outputRange: [0.8, 1, 1]
              })
            }]}>
              <Animated.Text style={[styles.donutCenterPercentage, { 
                color: monthlyOverBudget ? colors.error[500] : colors.primary[500],
                opacity: animatedProgress.interpolate({
                  inputRange: [0, 0.2, 1],
                  outputRange: [0.7, 1, 1]
                })
              }]}>
                {Math.round(monthlySpentPercentage)}%
              </Animated.Text>
              <Animated.Text style={[styles.donutCenterLabel, { 
                color: colors.text.secondary,
                opacity: animatedProgress.interpolate({
                  inputRange: [0, 0.3, 1],
                  outputRange: [0.6, 1, 1]
                })
              }]}>
                USED
              </Animated.Text>
              <Animated.Text style={[styles.donutCenterAmount, { 
                color: displayLeftToSpend < 0 ? colors.error[500] : colors.text.primary,
                opacity: animatedProgress.interpolate({
                  inputRange: [0, 0.4, 1],
                  outputRange: [0.5, 1, 1]
                })
              }]}>
                {displayLeftToSpend < 0 
                  ? `Over ${formatAmount(Math.abs(displayLeftToSpend), currency)}`
                  : `${formatAmount(displayLeftToSpend, currency)} left`
                }
              </Animated.Text>
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    </View>
  );
};