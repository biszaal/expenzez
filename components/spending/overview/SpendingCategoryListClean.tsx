import React from "react";
import { View, Text } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { useTheme } from "../../../contexts/ThemeContext";
import { getMerchantInfo } from "../../../services/merchantService";
import { spendingCategoryListStyles } from "./SpendingCategoryList.styles";
import { SpendingItemCard } from "../shared/SpendingItemCard";

interface CategoryData {
  id: string;
  name: string;
  icon: string;
  color: string;
  defaultBudget?: number;
  monthlySpent?: number;
}

interface Transaction {
  category: string;
  [key: string]: any;
}

interface SpendingCategoryListCleanProps {
  sortedCategoryData: CategoryData[];
  filteredTransactions: Transaction[];
  formatAmount: (amount: number, currency: string) => string;
  currency: string;
  onCategoryPress?: (category: CategoryData) => void;
}

export const SpendingCategoryListClean: React.FC<
  SpendingCategoryListCleanProps
> = ({
  sortedCategoryData,
  filteredTransactions,
  formatAmount,
  currency,
  onCategoryPress,
}) => {
  const { colors } = useTheme();
  const styles = spendingCategoryListStyles;

  // Calculate total spending across all categories
  const totalSpending = sortedCategoryData.reduce(
    (sum, cat) => sum + (cat.monthlySpent || 0),
    0
  );

  // Debug logging to help identify the issue
  React.useEffect(() => {
    console.log("🐛 [SpendingCategoryListClean] Debug info:", {
      categoryDataLength: sortedCategoryData.length,
      transactionsLength: filteredTransactions.length,
      categoriesWithSpending: sortedCategoryData.filter(
        (c) => (c.monthlySpent || 0) > 0
      ),
      sampleCategory: sortedCategoryData[0],
      sampleTransaction: filteredTransactions[0],
    });
  }, [sortedCategoryData, filteredTransactions]);

  if (sortedCategoryData.length === 0) {
    return (
      <View style={styles.categoriesTabWrapper}>
        <View style={styles.emptyStateContainer}>
          <FontAwesome5 name="inbox" size={48} color={colors.gray[400]} />
          <Text
            style={[styles.emptyStateTitle, { color: colors.text.secondary }]}
          >
            No spending categories found.
          </Text>
          <Text
            style={[styles.emptyStateSubtitle, { color: colors.text.tertiary }]}
          >
            Add a new expense to start tracking your spending.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.categoriesTabWrapper}>
      {sortedCategoryData.map((category) => {
        return (
          <SpendingItemCard
            key={category.id}
            item={category}
            totalSpending={totalSpending}
            formatAmount={formatAmount}
            currency={currency}
            onItemPress={onCategoryPress}
            showBudget={true}
            showCategory={false}
          />
        );
      })}
    </View>
  );
};
