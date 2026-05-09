import React from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { useTheme } from "../../../contexts/ThemeContext";
import { fontFamily } from "../../../constants/theme";

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

// v1.5 redesign — month chips. Active chip = subtle primary tint with a
// 1-px primary border; inactive = transparent with a hairline border.
// Year labels stay between groups so users can still orient themselves
// across years.
export const SpendingMonthPicker: React.FC<SpendingMonthPickerProps> = ({
  selectedMonth,
  setSelectedMonth,
  months,
}) => {
  const { colors, isDark } = useTheme();

  const monthsByYear = months.reduce(
    (acc, m) => {
      const year = m.value.substring(0, 4);
      if (!acc[year]) acc[year] = [];
      acc[year].push(m);
      return acc;
    },
    {} as Record<string, MonthObject[]>
  );

  const activeBg = isDark
    ? "rgba(157,91,255,0.16)"
    : "rgba(123,63,228,0.10)";

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {Object.entries(monthsByYear)
          .sort(([a], [b]) => parseInt(b) - parseInt(a))
          .map(([year, yearMonths]) => (
            <React.Fragment key={year}>
              {yearMonths.map((m) => {
                const active = selectedMonth === m.value;
                return (
                  <Pressable
                    key={m.id}
                    onPress={() => setSelectedMonth(m.value)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? activeBg : "transparent",
                        borderColor: active
                          ? colors.primary[500]
                          : colors.border.medium,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        {
                          color: active
                            ? colors.text.primary
                            : colors.text.secondary,
                          fontFamily: active
                            ? fontFamily.semibold
                            : fontFamily.medium,
                        },
                      ]}
                    >
                      {m.name.split(" ")[0]}
                    </Text>
                  </Pressable>
                );
              })}
              <View style={styles.yearLabel}>
                <Text
                  style={[
                    styles.yearText,
                    {
                      color: colors.text.tertiary,
                      fontFamily: fontFamily.semibold,
                    },
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

const styles = StyleSheet.create({
  container: {
    paddingTop: 14,
  },
  scrollContent: {
    paddingHorizontal: 22,
    gap: 8,
    alignItems: "center",
  },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: {
    fontSize: 13,
  },
  yearLabel: {
    paddingHorizontal: 8,
    justifyContent: "center",
  },
  yearText: {
    fontSize: 11,
    letterSpacing: 0.6,
  },
});
