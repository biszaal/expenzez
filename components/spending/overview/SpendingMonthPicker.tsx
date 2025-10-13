import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useTheme } from "../../../contexts/ThemeContext";
import { spendingMonthPickerStyles } from "./SpendingMonthPicker.styles";

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
  months,
}) => {
  const { colors } = useTheme();
  const styles = spendingMonthPickerStyles;

  // Group months by year
  const monthsByYear = months.reduce(
    (acc, monthObj) => {
      const year = monthObj.value.substring(0, 4); // Extract year from YYYY-MM format
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(monthObj);
      return acc;
    },
    {} as Record<string, typeof months>
  );

  return (
    <View style={styles.premiumMonthPickerContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.premiumMonthPickerContent}
      >
        {Object.entries(monthsByYear)
          .sort(([yearA], [yearB]) => parseInt(yearB) - parseInt(yearA)) // Sort years descending
          .map(([year, yearMonths]) => (
            <React.Fragment key={year}>
              {yearMonths.map((monthObj) => (
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
                    {monthObj.name.split(" ")[0]}{" "}
                    {/* Show only month name, not year */}
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
              {/* Year label at the end of each year */}
              <View style={styles.yearLabel}>
                <Text
                  style={[
                    styles.yearLabelText,
                    { color: colors.text.secondary },
                  ]}
                >
                  {year}
                </Text>
              </View>
            </React.Fragment>
          ))}
      </ScrollView>
    </View>
  );
};
