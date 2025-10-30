import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { styles } from './SpendingHeader.styles';

interface SpendingHeaderProps {
  selectedMonth: string;
  currentMonth: boolean;
  formatAmount: (amount: number, currency: string) => string;
  monthlyTotalSpent: number;
  prevMonthSpent: number;
  currency: string;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onInfoPress: () => void;
}

export const SpendingHeader: React.FC<SpendingHeaderProps> = ({
  selectedMonth,
  currentMonth,
  formatAmount,
  monthlyTotalSpent,
  prevMonthSpent,
  currency,
  onPreviousMonth,
  onNextMonth,
  onInfoPress,
}) => {
  const { colors } = useTheme();

  const diff = monthlyTotalSpent - prevMonthSpent;
  const diffLabel = diff >= 0
    ? `▲ ${formatAmount(Math.abs(diff), currency)}`
    : `▼ ${formatAmount(Math.abs(diff), currency)}`;
  const diffColor = diff >= 0 ? colors.error.main : colors.success.main;

  return (
    <View style={[styles.premiumHeader, { backgroundColor: colors.background.secondary }]}>
      <View style={styles.premiumHeaderContent}>
        <View style={styles.premiumBrandSection}>
          <View style={styles.premiumTitleRow}>
            <TouchableOpacity
              onPress={onPreviousMonth}
              style={styles.navButton}
            >
              <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            
            <View style={styles.monthSelector}>
              <Text style={[styles.premiumTitle, { color: colors.text.primary }]}>
                {new Date(selectedMonth).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
                {currentMonth && (
                  <Text style={[styles.currentIndicator, { color: colors.primary.main }]}>
                    {" "}• Current
                  </Text>
                )}
              </Text>
            </View>
            
            <TouchableOpacity
              onPress={onNextMonth}
              style={styles.navButton}
              disabled={currentMonth}
            >
              <Ionicons 
                name="chevron-forward" 
                size={24} 
                color={currentMonth ? colors.text.tertiary : colors.text.primary} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={onInfoPress} style={styles.infoButton}>
              <Ionicons name="information-circle-outline" size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.spendingOverview}>
            <Text style={[styles.totalSpent, { color: colors.text.primary }]}>
              {formatAmount(monthlyTotalSpent, currency)}
            </Text>
            <Text style={[styles.comparison, { color: diffColor }]}>
              {diffLabel} vs. previous month
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

