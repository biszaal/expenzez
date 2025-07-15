import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../contexts/ThemeContext";
import { spacing, borderRadius, shadows } from "../../constants/theme";
import { bankingAPI } from "../../services/api";
import { formatCurrency } from "../../utils/formatters";

export default function TransactionsPage() {
  const router = useRouter();
  const { colors } = useTheme();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const accountsRes = await bankingAPI.getAccounts();
        const accounts = accountsRes.accounts || [];
        let allTxns = [];
        for (const acc of accounts) {
          const txnsRes = await bankingAPI.getTransactions(acc.id);
          if (txnsRes.transactions) {
            allTxns = allTxns.concat(txnsRes.transactions);
          }
        }
        // Sort by date descending
        allTxns.sort((a, b) => new Date(b.date) - new Date(a.date));
        setTransactions(allTxns);
      } catch (e) {
        // Optionally handle error
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: colors.background.secondary },
      ]}
    >
      <View
        style={[
          styles.topBar,
          { backgroundColor: colors.background.secondary },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.backButton,
            { backgroundColor: colors.background.primary },
            shadows.sm,
          ]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={26} color={colors.primary[500]} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: colors.text.primary }]}>
          Transactions
        </Text>
        <View style={{ width: 32 }} />
      </View>
      <View
        style={[
          styles.content,
          { backgroundColor: colors.background.secondary },
        ]}
      >
        <View
          style={[
            styles.transactionCard,
            { backgroundColor: colors.background.primary },
            shadows.md,
          ]}
        >
          <View style={styles.transactionHeader}>
            <Ionicons
              name="card-outline"
              size={24}
              color={colors.primary[500]}
            />
            <Text
              style={[styles.transactionTitle, { color: colors.text.primary }]}
            >
              Recent Transactions
            </Text>
          </View>
          <View style={styles.transactionList}>
            {loading ? (
              <ActivityIndicator size="small" color={colors.primary[500]} />
            ) : transactions.length === 0 ? (
              <Text style={{ color: colors.text.secondary }}>
                No transactions found.
              </Text>
            ) : (
              transactions.map((txn, idx) => (
                <View
                  key={txn.id || idx}
                  style={[
                    styles.transactionItem,
                    { borderBottomColor: colors.border.light },
                  ]}
                >
                  <View style={styles.transactionInfo}>
                    <Text
                      style={[
                        styles.transactionName,
                        { color: colors.text.primary },
                      ]}
                    >
                      {txn.description || txn.name || "Transaction"}
                    </Text>
                    <Text
                      style={[
                        styles.transactionDate,
                        { color: colors.text.secondary },
                      ]}
                    >
                      {txn.date ? new Date(txn.date).toLocaleString() : ""}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.transactionAmount,
                      {
                        color:
                          txn.amount < 0
                            ? colors.error[500]
                            : colors.success[500],
                      },
                    ]}
                  >
                    {formatCurrency(txn.amount)}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 32,
    paddingBottom: 16,
    paddingHorizontal: 14,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  topBarTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  transactionCard: {
    borderRadius: 16,
    padding: 20,
  },
  transactionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  transactionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 12,
  },
  transactionList: {
    gap: 16,
  },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 14,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "600",
  },
});
