import React from 'react';
import { View, TouchableOpacity, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, borderRadius } from '../../constants/theme';

interface MonthFilterProps {
  selectedMonth: string;
  onMonthSelect: (month: string) => void;
  availableMonths: { key: string; label: string; isActive: boolean }[];
}

export default function MonthFilter({ selectedMonth, onMonthSelect, availableMonths }: MonthFilterProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {availableMonths.map((month) => (
          <TouchableOpacity
            key={month.key}
            style={[
              styles.monthChip,
              {
                backgroundColor: selectedMonth === month.key 
                  ? colors.primary[500] 
                  : colors.background.secondary,
                borderColor: selectedMonth === month.key 
                  ? colors.primary[500] 
                  : colors.border.light,
              }
            ]}
            onPress={() => onMonthSelect(month.key)}
            disabled={!month.isActive}
          >
            <Text
              style={[
                styles.monthText,
                {
                  color: selectedMonth === month.key 
                    ? 'white' 
                    : month.isActive 
                      ? colors.text.primary 
                      : colors.text.tertiary,
                  fontWeight: selectedMonth === month.key ? '700' : '500'
                }
              ]}
            >
              {month.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  scrollContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  monthChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthText: {
    fontSize: 16,
    textAlign: 'center',
  },
});