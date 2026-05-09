import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { styles } from './BudgetOverview.styles';
import { fontFamily } from '../../../constants/theme';

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
    if (percentage > 100) return colors.rose[500];
    if (percentage > 80) return colors.amber[500];
    return colors.lime[500];
  };

  const tileBg = "rgba(40,20,80,0.03)";

  return (
    <View style={styles.budgetCards}>
      {/* Top Row */}
      <View style={styles.budgetRow}>
        <View
          style={[
            styles.budgetCard,
            { backgroundColor: tileBg, borderColor: colors.border.medium },
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
            { backgroundColor: tileBg, borderColor: colors.border.medium },
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
            { backgroundColor: tileBg, borderColor: colors.border.medium },
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
            { backgroundColor: tileBg, borderColor: colors.border.medium },
          ]}
        >
          <Text
            style={[
              styles.budgetCardAmount,
              { color: getPredictedColor(), fontFamily: fontFamily.monoMedium },
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
            {currentMonth ? "PREDICTED MONTHLY" : "MONTHLY TOTAL"}
          </Text>
        </View>
      </View>
    </View>
  );
};

