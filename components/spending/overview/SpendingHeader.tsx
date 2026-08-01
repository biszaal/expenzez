import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { useTheme } from "../../../contexts/ThemeContext";
import { fontFamily } from "../../../constants/theme";
import { styles } from "./SpendingHeader.styles";

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
  // Money that left the account this month but isn't spending — transfers
  // between the user's own accounts and credit-card bill payments. Shown so
  // the total explains itself instead of just being mysteriously lower.
  excludedTotal?: number;
  excludedCount?: number;
  onExcludedPress?: () => void;
}

// v1.5 redesign — clean two-row header.
//   Row 1: date range (small, dim) + month/year title + chevron buttons
//          on the left, info button on the right.
//   Row 2: large mono total spent + comparison vs previous month chip.
//
// Original arrows + info handlers are preserved unchanged so callers
// don't need to update.
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
  excludedTotal = 0,
  excludedCount = 0,
  onExcludedPress,
}) => {
  const { colors } = useTheme();

  const monthDate = dayjs(selectedMonth);
  const dateRange = `${monthDate.format("D MMM")} – ${monthDate.endOf("month").format("D MMM")}`;
  const monthTitle = monthDate.format("MMMM YYYY");

  const diff = monthlyTotalSpent - prevMonthSpent;
  const diffPositive = diff >= 0;
  const diffMagnitude = formatAmount(Math.abs(diff), currency);

  return (
    <View style={styles.premiumHeader}>
      <View style={styles.premiumHeaderContent}>
        <View style={styles.premiumBrandSection}>
          <Text
            style={[
              styles.dateRange,
              {
                color: colors.text.secondary,
                fontFamily: fontFamily.medium,
              },
            ]}
          >
            {dateRange}
          </Text>
          <View style={styles.premiumTitleRow}>
            <Text
              style={[
                styles.premiumTitle,
                {
                  color: colors.text.primary,
                  fontFamily: fontFamily.semibold,
                },
              ]}
              numberOfLines={1}
            >
              {monthTitle}
            </Text>
            {currentMonth && (
              <View
                style={{
                  backgroundColor: colors.primary[500] + "26",
                  borderRadius: 8,
                }}
              >
                <Text
                  style={[
                    styles.currentIndicator,
                    {
                      color: colors.primary[500],
                      fontFamily: fontFamily.semibold,
                    },
                  ]}
                >
                  CURRENT
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.iconCluster}>
          <Pressable
            onPress={onPreviousMonth}
            style={[
              styles.iconButton,
              {
                backgroundColor: colors.card.background,
                borderColor: colors.border.medium,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Previous month"
          >
            <Ionicons name="chevron-back" size={18} color={colors.text.secondary} />
          </Pressable>
          <Pressable
            onPress={onNextMonth}
            disabled={currentMonth}
            style={[
              styles.iconButton,
              {
                backgroundColor: colors.card.background,
                borderColor: colors.border.medium,
              },
              currentMonth && styles.iconButtonDisabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Next month"
          >
            <Ionicons
              name="chevron-forward"
              size={18}
              color={currentMonth ? colors.text.tertiary : colors.text.secondary}
            />
          </Pressable>
          <Pressable
            onPress={onInfoPress}
            style={[
              styles.iconButton,
              {
                backgroundColor: colors.card.background,
                borderColor: colors.border.medium,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Spending insights"
          >
            <Ionicons name="information-circle-outline" size={18} color={colors.text.secondary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.spendingOverview}>
        <Text
          style={[
            styles.totalSpent,
            {
              color: colors.text.primary,
              fontFamily: fontFamily.monoMedium,
            },
          ]}
        >
          {formatAmount(monthlyTotalSpent, currency)}
        </Text>
        <Text
          style={[
            styles.comparison,
            {
              color: diffPositive ? colors.rose[500] : colors.lime[500],
              fontFamily: fontFamily.medium,
            },
          ]}
        >
          {diffPositive ? "+" : "−"}
          {diffMagnitude} vs last month
        </Text>
        {excludedCount > 0 && (
          <Pressable
            onPress={onExcludedPress}
            disabled={!onExcludedPress}
            accessibilityRole={onExcludedPress ? "button" : undefined}
            accessibilityLabel={`${formatAmount(excludedTotal, currency)} excluded from spending across ${excludedCount} transactions`}
            style={styles.excludedRow}
          >
            <Ionicons
              name="swap-horizontal-outline"
              size={13}
              color={colors.text.tertiary}
            />
            <Text
              style={[
                styles.excludedText,
                { color: colors.text.tertiary, fontFamily: fontFamily.medium },
              ]}
            >
              {formatAmount(excludedTotal, currency)} moved, not spent
              {onExcludedPress ? " ›" : ""}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};
