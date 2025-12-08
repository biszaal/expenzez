import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { MerchantLogo } from "../ui/MerchantLogo";

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  description: string;
  date: string;
  category?: string;
  type?: "debit" | "credit";
  merchant?: string;
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
              <MerchantLogo
                merchant={tx.merchant || tx.description}
                description={tx.description}
                category={tx.category}
                size={44}
                style={{ marginRight: 12 }}
              />

              <View style={styles.transactionContent}>
                <Text
                  style={[
                    styles.transactionTitle,
                    { color: colors.text.primary },
                  ]}
                  numberOfLines={1}
                >
                  {tx.merchant || tx.description}
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
                    {
                      color:
                        tx.amount >= 0
                          ? colors.success.main
                          : colors.error.main,
                    },
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
