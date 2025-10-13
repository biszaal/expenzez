import React from "react";
import { View, Text } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { useTheme } from "../../../contexts/ThemeContext";
import { spendingCategoryListStyles } from "./SpendingCategoryList.styles";
import { SpendingItemCard } from "../shared/SpendingItemCard";

interface MerchantData {
  id: string;
  name: string;
  icon: string;
  color: string;
  monthlySpent?: number;
  category?: string;
}

interface Transaction {
  description?: string;
  merchant?: string;
  amount: number;
  [key: string]: any;
}

interface SpendingMerchantListProps {
  sortedMerchantData: MerchantData[];
  filteredTransactions: Transaction[];
  formatAmount: (amount: number, currency?: string) => string;
  currency: string;
  onMerchantPress?: (merchant: MerchantData) => void;
}

export const SpendingMerchantList: React.FC<SpendingMerchantListProps> = ({
  sortedMerchantData,
  filteredTransactions,
  formatAmount,
  currency,
  onMerchantPress,
}) => {
  const { colors } = useTheme();
  const styles = spendingCategoryListStyles;

  // Calculate total spending across all merchants
  const totalSpending = sortedMerchantData.reduce(
    (sum, m) => sum + (m.monthlySpent || 0),
    0
  );

  if (sortedMerchantData.length === 0) {
    return (
      <View style={styles.categoriesTabWrapper}>
        <View style={styles.emptyStateContainer}>
          <FontAwesome5 name="inbox" size={48} color={colors.gray[400]} />
          <Text
            style={[styles.emptyStateTitle, { color: colors.text.secondary }]}
          >
            No merchants found.
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
      {sortedMerchantData.map((merchant) => {
        return (
          <SpendingItemCard
            key={merchant.id}
            item={merchant}
            totalSpending={totalSpending}
            formatAmount={formatAmount}
            currency={currency}
            onItemPress={onMerchantPress}
            showBudget={false}
            showCategory={true}
          />
        );
      })}
    </View>
  );
};
