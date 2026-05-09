import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../contexts/ThemeContext";
import { CategoryIcon } from "../utils/CategoryIcon";
import { fontFamily } from "../../../constants/theme";
import { spendingItemCardStyles } from "./SpendingItemCard.styles";

interface SpendingItemData {
  id: string;
  name: string;
  icon: string;
  color: string;
  monthlySpent: number;
  defaultBudget?: number;
  category?: string;
}

interface SpendingItemCardProps {
  item: SpendingItemData;
  totalSpending: number;
  formatAmount: (amount: number, currency: string) => string;
  currency: string;
  onItemPress?: (item: SpendingItemData) => void;
  showBudget?: boolean;
  showCategory?: boolean;
}

// Maps a category name to a colors.category[key] palette. Mirrors the
// home screen's normalizeCategory so categories share visual treatment.
type CategoryKey =
  | "food"
  | "transport"
  | "shopping"
  | "entertainment"
  | "bills"
  | "healthcare"
  | "travel"
  | "groceries"
  | "income";

function categoryKey(name: string): CategoryKey {
  const s = (name || "").toLowerCase();
  if (s.includes("grocer") || s.includes("supermarket")) return "groceries";
  if (s.includes("food") || s.includes("dining") || s.includes("restaurant")) return "food";
  if (s.includes("transport") || s.includes("uber") || s.includes("taxi") || s.includes("rail") || s.includes("travel")) return "transport";
  if (s.includes("shop") || s.includes("amazon") || s.includes("retail")) return "shopping";
  if (s.includes("bill") || s.includes("utility") || s.includes("rent")) return "bills";
  if (s.includes("trip") || s.includes("hotel") || s.includes("flight") || s.includes("airbnb")) return "travel";
  if (s.includes("health") || s.includes("pharma") || s.includes("medic") || s.includes("fitness") || s.includes("gym")) return "healthcare";
  if (s.includes("game") || s.includes("netflix") || s.includes("spotify") || s.includes("entertainment") || s.includes("movie")) return "entertainment";
  if (s.includes("salary") || s.includes("income") || s.includes("refund")) return "income";
  return "shopping";
}

export const SpendingItemCard: React.FC<SpendingItemCardProps> = ({
  item,
  totalSpending,
  formatAmount,
  currency,
  onItemPress,
  showBudget = false,
  showCategory = false,
}) => {
  const { colors } = useTheme();
  const styles = spendingItemCardStyles;

  const spent = item.monthlySpent || 0;
  const budget = item.defaultBudget || 0;
  const percent = budget > 0 ? (spent / budget) * 100 : 0;
  const overBudget = spent > budget && budget > 0;
  const percentageOfTotal =
    totalSpending > 0 ? (spent / totalSpending) * 100 : 0;

  // Trend simulation kept identical to the previous behaviour so the
  // up/down arrow logic doesn't change.
  const getTrend = () => {
    if (spent === 0) return { direction: "flat", percentage: 0 };
    const trendValue = (spent % 100) / 10;
    if (percentageOfTotal > 25) return { direction: "up", percentage: trendValue };
    if (percentageOfTotal > 15) return { direction: "down", percentage: trendValue };
    return { direction: "flat", percentage: 0 };
  };
  const trend = getTrend();

  // Resolve category palette from the new theme tokens.
  const palette =
    colors.category[categoryKey(item.category || item.name)] ?? {
      bg: "rgba(157,91,255,0.18)",
      fg: colors.primary[500],
    };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.itemCardPressable,
        { opacity: pressed ? 0.92 : 1 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${item.name}`}
      onPress={() => onItemPress?.(item)}
    >
      <View
        style={[
          styles.itemCard,
          {
            backgroundColor: colors.card.background,
            borderColor: overBudget
              ? "rgba(255,107,138,0.40)"
              : colors.border.medium,
          },
        ]}
      >
        <View style={styles.itemCardHeader}>
          <View style={styles.itemCardHeaderLeft}>
            <View
              style={[styles.itemIconBg, { backgroundColor: palette.bg }]}
            >
              {showCategory ? (
                <Text style={{ fontSize: 18 }}>{item.icon}</Text>
              ) : (
                <CategoryIcon
                  iconName={item.icon}
                  categoryName={item.name}
                  color={palette.fg}
                  size={18}
                />
              )}
            </View>
            <View style={styles.itemCardHeaderContent}>
              <View style={styles.itemCardHeaderTop}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.itemCardTitle,
                    {
                      color: colors.text.primary,
                      fontFamily: fontFamily.medium,
                    },
                  ]}
                >
                  {item.name}
                </Text>
                <Text
                  style={[
                    styles.itemCardAmount,
                    {
                      color: overBudget ? colors.rose[500] : colors.text.primary,
                      fontFamily: fontFamily.monoMedium,
                    },
                  ]}
                >
                  {formatAmount(spent, currency)}
                </Text>
              </View>
              <View style={styles.itemCardHeaderBottom}>
                <View style={styles.itemCardInfo}>
                  <Text
                    style={[
                      styles.itemCardTransactions,
                      {
                        color: colors.text.tertiary,
                        fontFamily: fontFamily.regular,
                      },
                    ]}
                  >
                    {spent > 0 ? "1 transaction" : "No spending this month"}
                  </Text>
                  {spent > 0 && trend.direction !== "flat" && (
                    <View style={styles.trendContainer}>
                      <Ionicons
                        name={trend.direction === "up" ? "arrow-up" : "arrow-down"}
                        size={10}
                        color={
                          trend.direction === "up"
                            ? colors.rose[500]
                            : colors.lime[500]
                        }
                      />
                      <Text
                        style={[
                          styles.trendText,
                          {
                            color:
                              trend.direction === "up"
                                ? colors.rose[500]
                                : colors.lime[500],
                            fontFamily: fontFamily.semibold,
                          },
                        ]}
                      >
                        {Math.round(trend.percentage)}%
                      </Text>
                    </View>
                  )}
                </View>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.itemCardBudget,
                    {
                      color: colors.text.tertiary,
                      fontFamily: fontFamily.regular,
                    },
                  ]}
                >
                  {showBudget && budget > 0
                    ? `of ${formatAmount(budget, currency)}`
                    : showCategory && item.category
                      ? item.category
                      : "Multiple sources"}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.itemCardHeaderRight}>
            <Text
              style={[
                styles.itemCardPercentage,
                {
                  color: overBudget
                    ? colors.rose[500]
                    : percent > 80
                      ? colors.amber[500]
                      : colors.lime[500],
                  fontFamily: fontFamily.monoSemibold,
                },
              ]}
            >
              {Math.round(percentageOfTotal)}%
            </Text>
          </View>
        </View>

        {spent > 0 && (
          <View style={styles.itemCardProgress}>
            <View
              style={[
                styles.itemCardProgressTrack,
                { backgroundColor: colors.border.light },
              ]}
            >
              <View
                style={[
                  styles.itemCardProgressBar,
                  {
                    width: `${Math.min(percentageOfTotal, 100)}%`,
                    backgroundColor: palette.fg,
                  },
                ]}
              />
            </View>
            <View style={styles.progressInfo}>
              <Text
                style={[
                  styles.progressText,
                  {
                    color: colors.text.tertiary,
                    fontFamily: fontFamily.regular,
                  },
                ]}
              >
                {Math.round(percentageOfTotal)}% of total
              </Text>
            </View>
          </View>
        )}
      </View>
    </Pressable>
  );
};
