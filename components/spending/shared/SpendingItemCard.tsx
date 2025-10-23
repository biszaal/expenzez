import React from "react";
import { View, Text, Pressable } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { useTheme } from "../../../contexts/ThemeContext";
import { CategoryIcon } from "../utils/CategoryIcon";
import { getMerchantInfo } from "../../../services/merchantService";
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
  const left = budget - spent;
  const percent = budget > 0 ? (spent / budget) * 100 : 0;
  const overBudget = spent > budget;
  const percentageOfTotal =
    totalSpending > 0 ? (spent / totalSpending) * 100 : 0;

  // Simulate trend (in reality, this would compare to previous month)
  const getTrend = () => {
    if (spent === 0) return { direction: "flat", percentage: 0 };
    const trendValue = (spent % 100) / 10; // 0-10%
    if (percentageOfTotal > 25)
      return { direction: "up", percentage: trendValue };
    if (percentageOfTotal > 15)
      return { direction: "down", percentage: trendValue };
    return { direction: "flat", percentage: 0 };
  };

  const trend = getTrend();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.itemCardPressable,
        {
          transform: [{ scale: pressed ? 0.98 : 1 }],
          shadowColor: colors.primary[500],
          shadowOpacity: pressed ? 0.15 : 0.08,
          shadowRadius: 12,
          elevation: pressed ? 4 : 2,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${item.name}`}
      onPress={() => onItemPress?.(item)}
    >
      <View
        style={[
          styles.itemCard,
          { backgroundColor: colors.background.secondary },
          overBudget && {
            backgroundColor: "#FEF2F2",
          },
        ]}
      >
        <View style={styles.itemCardHeader}>
          <View style={styles.itemCardHeaderLeft}>
            <View
              style={[
                styles.itemIconBg,
                { backgroundColor: colors.primary[100] },
              ]}
            >
              {showCategory ? (
                // For merchants, display emoji directly
                <Text style={{ fontSize: 20 }}>{item.icon}</Text>
              ) : (
                // For categories, use CategoryIcon component
                <CategoryIcon
                  iconName={item.icon}
                  categoryName={item.name}
                  color={colors.primary[600]}
                  size={20}
                />
              )}
            </View>
            <View style={styles.itemCardHeaderContent}>
              <View style={styles.itemCardHeaderTop}>
                <Text
                  style={[styles.itemCardTitle, { color: colors.text.primary }]}
                >
                  {item.name}
                </Text>
                <Text
                  style={[
                    styles.itemCardAmount,
                    {
                      color: overBudget
                        ? colors.error[500]
                        : colors.text.primary,
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
                      { color: colors.text.secondary },
                    ]}
                  >
                    {spent > 0 ? "1 transaction" : "No spending this month"}
                  </Text>
                  {spent > 0 && trend.direction !== "flat" && (
                    <View style={styles.trendContainer}>
                      <FontAwesome5
                        name={
                          trend.direction === "up" ? "arrow-up" : "arrow-down"
                        }
                        size={10}
                        color={
                          trend.direction === "up"
                            ? colors.error[500]
                            : colors.success[500]
                        }
                      />
                      <Text
                        style={[
                          styles.trendText,
                          {
                            color:
                              trend.direction === "up"
                                ? colors.error[500]
                                : colors.success[500],
                          },
                        ]}
                      >
                        {Math.round(trend.percentage)}%
                      </Text>
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    styles.itemCardBudget,
                    { color: colors.text.secondary },
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
                    ? colors.error[500]
                    : percent > 80
                      ? colors.warning[500]
                      : colors.success[500],
                },
              ]}
            >
              {Math.round(percentageOfTotal)}%
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        {spent > 0 && (
          <View style={styles.itemCardProgress}>
            <View
              style={[
                styles.itemCardProgressTrack,
                { backgroundColor: colors.background.secondary },
              ]}
            >
              <View
                style={[
                  styles.itemCardProgressBar,
                  {
                    width: `${Math.min(percentageOfTotal, 100)}%`,
                    backgroundColor: colors.primary[500],
                  },
                ]}
              />
            </View>
            <View style={styles.progressInfo}>
              <Text
                style={[styles.progressText, { color: colors.primary[600] }]}
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
