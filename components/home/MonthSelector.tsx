import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface MonthSelectorProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({
  selectedMonth,
  onMonthChange,
}) => {
  const { colors } = useTheme();

  // Generate last 12 months
  const generateMonths = () => {
    const months = [];
    const now = new Date();

    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const displayName = date.toLocaleDateString('en-GB', {
        month: 'short',
        year: 'numeric'
      });
      months.push({ value: monthStr, label: displayName });
    }

    return months;
  };

  const months = generateMonths();

  const navigateMonth = (direction: 'prev' | 'next') => {
    const currentIndex = months.findIndex(m => m.value === selectedMonth);
    let newIndex;

    if (direction === 'prev') {
      newIndex = Math.min(currentIndex + 1, months.length - 1);
    } else {
      newIndex = Math.max(currentIndex - 1, 0);
    }

    if (newIndex !== currentIndex) {
      onMonthChange(months[newIndex].value);
    }
  };

  const selectedMonthData = months.find(m => m.value === selectedMonth);

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background.primary,
      marginHorizontal: 20,
      marginBottom: 16,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      shadowColor: colors.primary.main,
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 2,
    }}>
      {/* Previous Month Button */}
      <TouchableOpacity
        onPress={() => navigateMonth('prev')}
        style={{
          padding: 8,
          borderRadius: 8,
          backgroundColor: colors.background.secondary,
        }}
        disabled={months.findIndex(m => m.value === selectedMonth) === months.length - 1}
      >
        <Ionicons
          name="chevron-back"
          size={20}
          color={
            months.findIndex(m => m.value === selectedMonth) === months.length - 1
              ? colors.text.secondary
              : colors.text.primary
          }
        />
      </TouchableOpacity>

      {/* Current Month Display */}
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Text style={{
          fontSize: 18,
          fontWeight: '600',
          color: colors.text.primary,
        }}>
          {selectedMonthData?.label}
        </Text>
        <Text style={{
          fontSize: 12,
          color: colors.text.secondary,
          marginTop: 2,
        }}>
          Tap arrows to change month
        </Text>
      </View>

      {/* Next Month Button */}
      <TouchableOpacity
        onPress={() => navigateMonth('next')}
        style={{
          padding: 8,
          borderRadius: 8,
          backgroundColor: colors.background.secondary,
        }}
        disabled={months.findIndex(m => m.value === selectedMonth) === 0}
      >
        <Ionicons
          name="chevron-forward"
          size={20}
          color={
            months.findIndex(m => m.value === selectedMonth) === 0
              ? colors.text.secondary
              : colors.text.primary
          }
        />
      </TouchableOpacity>
    </View>
  );
};