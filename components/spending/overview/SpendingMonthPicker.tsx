import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { spendingMonthPickerStyles } from './SpendingMonthPicker.styles';

interface MonthObject {
  id: number;
  name: string;
  value: string;
}

interface SpendingMonthPickerProps {
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  months: MonthObject[];
}

export const SpendingMonthPicker: React.FC<SpendingMonthPickerProps> = ({
  selectedMonth,
  setSelectedMonth,
  months
}) => {
  const { colors } = useTheme();
  const styles = spendingMonthPickerStyles;

  return (
    <View style={styles.premiumMonthPickerContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.premiumMonthPickerContent}
      >
        {months.map((monthObj) => (
          <TouchableOpacity
            key={monthObj.id}
            style={[
              styles.premiumMonthButton,
              {
                backgroundColor:
                  selectedMonth === monthObj.value
                    ? colors.primary[500]
                    : colors.background.primary,
                borderColor:
                  selectedMonth === monthObj.value
                    ? colors.primary[500]
                    : colors.border.light,
              },
            ]}
            onPress={() => setSelectedMonth(monthObj.value)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.premiumMonthButtonText,
                {
                  color:
                    selectedMonth === monthObj.value
                      ? colors.text.inverse
                      : colors.text.primary,
                  fontWeight:
                    selectedMonth === monthObj.value ? "700" : "600",
                },
              ]}
            >
              {monthObj.name}
            </Text>
            {selectedMonth === monthObj.value && (
              <View
                style={[
                  styles.premiumMonthIndicator,
                  { backgroundColor: colors.text.inverse },
                ]}
              />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};