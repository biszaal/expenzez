import React from 'react';
import { View, Text, Animated } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { styles } from './BudgetCenter.styles';

interface BudgetCenterProps {
  monthlySpentPercentage: number;
  monthlyOverBudget: boolean;
  displayLeftToSpend: number;
  totalBudget: number;
  animatedProgress: Animated.Value;
  formatAmount: (amount: number, currency: string) => string;
  currency: string;
}

export const BudgetCenter: React.FC<BudgetCenterProps> = ({
  monthlySpentPercentage,
  monthlyOverBudget,
  displayLeftToSpend,
  totalBudget,
  animatedProgress,
  formatAmount,
  currency,
}) => {
  const { colors } = useTheme();

  return (
    <Animated.View style={[
      styles.donutCenter, 
      { 
        backgroundColor: colors.background.primary,
        opacity: animatedProgress.interpolate({
          inputRange: [0, 0.1, 1],
          outputRange: [0.8, 1, 1]
        })
      }
    ]}>
      <Animated.Text style={[
        styles.donutCenterPercentage, 
        { 
          color: monthlyOverBudget ? colors.error[500] : colors.primary[500],
          opacity: animatedProgress.interpolate({
            inputRange: [0, 0.2, 1],
            outputRange: [0, 1, 1]
          })
        }
      ]}>
        {Math.round(Math.min(100, monthlySpentPercentage))}%
      </Animated.Text>
      
      <Animated.Text style={[
        styles.donutCenterLabel, 
        { 
          color: colors.text.secondary,
          opacity: animatedProgress.interpolate({
            inputRange: [0, 0.3, 1],
            outputRange: [0, 1, 1]
          })
        }
      ]}>
        of budget
      </Animated.Text>
      
      <Animated.Text style={[
        styles.donutCenterAmount, 
        { 
          color: monthlyOverBudget ? colors.error[500] : colors.success[500],
          opacity: animatedProgress.interpolate({
            inputRange: [0, 0.4, 1],
            outputRange: [0, 1, 1]
          })
        }
      ]}>
        {monthlyOverBudget ? '+' : ''}{formatAmount(Math.abs(displayLeftToSpend), currency)}
      </Animated.Text>
      
      <Animated.Text style={[
        styles.donutCenterSubLabel, 
        { 
          color: colors.text.tertiary,
          opacity: animatedProgress.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 1, 1]
          })
        }
      ]}>
        {monthlyOverBudget ? 'over budget' : (totalBudget > 0 ? 'left to spend' : 'no budget set')}
      </Animated.Text>
    </Animated.View>
  );
};

