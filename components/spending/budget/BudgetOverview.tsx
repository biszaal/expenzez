import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { styles } from './BudgetOverview.styles';

interface BudgetOverviewProps {
  monthlyTotalSpent: number;
  totalBudget: number;
  averageSpendPerDay: number;
  predictedMonthlySpend: number;
  currentMonth: boolean;
  formatAmount: (amount: number, currency: string) => string;
  currency: string;
}

export const BudgetOverview: React.FC<BudgetOverviewProps> = ({
  monthlyTotalSpent,
  totalBudget,
  averageSpendPerDay,
  predictedMonthlySpend,
  currentMonth,
  formatAmount,
  currency,
}) => {
  const { colors } = useTheme();

  const getPredictedColor = () => {
    if (!currentMonth) return colors.text.primary;
    if (totalBudget === 0) return colors.text.primary;
    
    const percentage = (predictedMonthlySpend / totalBudget) * 100;
    if (percentage > 100) return colors.error.main;    // Red: Over budget
    if (percentage > 80) return colors.warning.main;   // Orange: Warning zone (80-100%)
    return colors.success.main;                       // Green: Safe zone (<80%)
  };

  return (
    <View style={styles.budgetCards}>
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
          <Text style={[styles.budgetCardAmount, { color: colors.primary.main }]}>
            {formatAmount(averageSpendPerDay, currency)}
          </Text>
          <Text style={[styles.budgetCardLabel, { color: colors.text.secondary }]}>
            Average Per Day
          </Text>
        </View>
        
        <View style={[styles.budgetCard, styles.budgetCardWarning]}>
          <Text style={[styles.budgetCardAmount, { color: getPredictedColor() }]}>
            {formatAmount(predictedMonthlySpend, currency)}
          </Text>
          <Text style={[styles.budgetCardLabel, { color: colors.text.secondary }]}>
            {currentMonth ? 'Predicted Monthly' : 'Monthly Total'}
          </Text>
        </View>
      </View>
    </View>
  );
};

