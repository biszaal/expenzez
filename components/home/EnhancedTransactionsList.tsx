import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  description: string;
  date: string;
  category?: string;
  type?: "debit" | "credit";
}

interface EnhancedTransactionsListProps {
  transactions: Transaction[];
  onViewAll?: () => void;
}

export const EnhancedTransactionsList: React.FC<
  EnhancedTransactionsListProps
> = ({ transactions, onViewAll }) => {
  const { colors } = useTheme();
  const router = useRouter();

  // Early return if colors is not available
  if (!colors) {
    return null;
  }

  const getTransactionIcon = (amount: number, category?: string) => {
    if (amount >= 0) {
      return "arrow-up-circle";
    }

    // Category-based icons for expenses
    switch (category?.toLowerCase()) {
      case "food":
      case "dining":
        return "restaurant";
      case "transport":
      case "travel":
        return "car";
      case "shopping":
        return "bag";
      case "entertainment":
        return "game-controller";
      case "bills":
      case "utilities":
        return "receipt";
      case "health":
      case "medical":
        return "medical";
      default:
        return "arrow-down-circle";
    }
  };

  const getTransactionColor = (amount: number) => {
    return amount >= 0 ? colors.success[600] : colors.error[600];
  };

  const getTransactionBgColor = (amount: number) => {
    return amount >= 0 ? colors.success[100] : colors.error[100];
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          Recent Transactions
        </Text>
        <TouchableOpacity
          style={[
            styles.viewAllButton,
            { backgroundColor: colors.primary.main },
          ]}
          onPress={() => router.push("/transactions")}
          activeOpacity={0.7}
        >
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="arrow-forward" size={16} color="white" />
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.transactionsCard,
          { backgroundColor: colors.background.secondary },
        ]}
      >
        {transactions.length > 0 ? (
          transactions.slice(0, 5).map((tx, idx) => (
            <View
              key={tx.id}
              style={[
                styles.transactionItem,
                idx < 4 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border.light,
                },
              ]}
            >
              <View
                style={[
                  styles.transactionIcon,
                  { backgroundColor: getTransactionBgColor(tx.amount) },
                ]}
              >
                <Ionicons
                  name={getTransactionIcon(tx.amount, tx.category) as any}
                  size={20}
                  color={getTransactionColor(tx.amount)}
                />
              </View>

              <View style={styles.transactionContent}>
                <Text
                  style={[
                    styles.transactionTitle,
                    { color: colors.text.primary },
                  ]}
                  numberOfLines={1}
                >
                  {tx.description}
                </Text>
                <View style={styles.transactionMeta}>
                  <Text
                    style={[
                      styles.transactionDate,
                      { color: colors.text.secondary },
                    ]}
                  >
                    {new Date(tx.date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </Text>
                  {tx.category && (
                    <Text
                      style={[
                        styles.transactionCategory,
                        { color: colors.text.tertiary },
                      ]}
                    >
                      • {tx.category}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.transactionAmount}>
                <Text
                  style={[
                    styles.amountText,
                    { color: getTransactionColor(tx.amount) },
                  ]}
                >
                  {tx.amount >= 0 ? "+" : ""}£{Math.abs(tx.amount).toFixed(2)}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: colors.background.primary },
              ]}
            >
              <Ionicons
                name="receipt-outline"
                size={32}
                color={colors.text.tertiary}
              />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
              No transactions yet
            </Text>
            <Text
              style={[styles.emptySubtitle, { color: colors.text.secondary }]}
            >
              Add your first expense to get started
            </Text>
            <TouchableOpacity
              style={[
                styles.addButton,
                { backgroundColor: colors.primary.main },
              ]}
              onPress={() => router.push("/add-transaction")}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.addButtonText}>Add Transaction</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = {
  container: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  header: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700" as const,
  },
  viewAllButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "white",
  },
  transactionsCard: {
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  transactionItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingVertical: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    marginRight: 12,
  },
  transactionContent: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    marginBottom: 4,
  },
  transactionMeta: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
  },
  transactionDate: {
    fontSize: 12,
    fontWeight: "500" as const,
  },
  transactionCategory: {
    fontSize: 12,
    fontWeight: "500" as const,
  },
  transactionAmount: {
    alignItems: "flex-end" as const,
  },
  amountText: {
    fontSize: 16,
    fontWeight: "700" as const,
  },
  emptyState: {
    alignItems: "center" as const,
    paddingVertical: 32,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center" as const,
    marginBottom: 20,
  },
  addButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "white",
  },
};
