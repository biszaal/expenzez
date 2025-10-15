import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState, useMemo } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  RefreshControl,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useAlert } from "../../hooks/useAlert";
import { spacing, borderRadius, shadows } from "../../constants/theme";
import { useAuthGuard } from "../../hooks/useAuthGuard";
import { EmptyState } from "../../components/ui/EmptyState";
import { TransactionSkeleton } from "../../components/ui/SkeletonLoader";
import { transactionAPI } from "../../services/api/transactionAPI";
import { getMerchantInfo } from "../../services/merchantService";
import MonthFilter from "../../components/ui/MonthFilter";
import dayjs from "dayjs";

interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  timestamp?: string;
  merchant: string;
  category?: string;
  accountId: string;
  bankName: string;
  type: "debit" | "credit";
  originalAmount: number;
  accountType?: string;
  isPending?: boolean;
}

interface GroupedTransaction {
  date: string;
  transactions: Transaction[];
}

export default function TransactionsScreen() {
  const router = useRouter();
  const { merchant } = useLocalSearchParams<{ merchant?: string }>();
  const { isLoggedIn } = useAuth();
  const { isLoggedIn: authLoggedIn, checkingBank } = useAuthGuard(
    undefined,
    true
  );
  const { colors } = useTheme();
  const { showSuccess, showError } = useAlert();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>(""); // Empty = show all
  const [lastUpdated, setLastUpdated] = useState(dayjs().format("HH:mm"));

  const fetchTransactions = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      // Always fetch last 12 months to have all months available in filter
      const startDate = dayjs()
        .subtract(12, "months")
        .startOf("month")
        .format("YYYY-MM-DD");
      const endDate = dayjs().endOf("month").format("YYYY-MM-DD");
      const limit = 2400; // ~200 per month for 12 months

      console.log(
        `[Transactions] Fetching last 12 months (${startDate} to ${endDate})...`
      );

      const transactionsResponse = await transactionAPI.getTransactions({
        startDate,
        endDate,
        limit,
      });
      console.log(`[Transactions] API Response:`, transactionsResponse);

      if (
        transactionsResponse?.transactions &&
        transactionsResponse.transactions.length > 0
      ) {
        const formattedTransactions: Transaction[] =
          transactionsResponse.transactions.map((tx: any) => {
            console.log(`[Transactions] Processing transaction:`, tx);

            // Get the original amount (should be positive) - ensure it's a number
            const originalAmount = Math.abs(
              Number(tx.originalAmount || tx.amount || 0)
            );

            // Determine transaction type from amount
            const rawAmount = tx.amount || 0;
            let transactionType = tx.type;
            if (!transactionType) {
              transactionType = rawAmount < 0 ? "debit" : "credit";
            }

            const formatted = {
              id:
                tx.id ||
                tx.transactionId ||
                `tx_${Date.now()}_${Math.random()}`,
              amount: rawAmount,
              description: tx.description || "Unknown Transaction",
              date: tx.date || new Date().toISOString(),
              timestamp: tx.date || new Date().toISOString(),
              merchant: tx.merchant || tx.description || "Manual Entry",
              category: tx.category || "General",
              accountId: tx.accountId || "manual",
              bankName: tx.bankName || "Manual Entry",
              type: transactionType,
              originalAmount: originalAmount,
              accountType: tx.accountType || "Manual Account",
              isPending: tx.isPending || false,
            };

            console.log(`[Transactions] Formatted transaction:`, formatted);
            return formatted;
          });

        console.log(
          `[Transactions] Setting ${formattedTransactions.length} formatted transactions`
        );
        setTransactions(formattedTransactions);
        setLastUpdated(dayjs().format("HH:mm"));

        if (showRefresh) {
          showSuccess(`Loaded ${formattedTransactions.length} transactions`);
        }
      } else {
        setTransactions([]);
        if (showRefresh) {
          showError("No transaction data available");
        }
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      showError("Failed to load transactions");
      setTransactions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    fetchTransactions(true);
  };

  useEffect(() => {
    console.log("Transactions", transactions);
    if (!authLoggedIn) {
      router.replace("/auth/Login");
    }
  }, [authLoggedIn, checkingBank]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchTransactions();
    }
  }, [isLoggedIn]); // Only fetch on login, filter client-side when month changes

  useEffect(() => {
    if (merchant) {
      setSearchQuery(decodeURIComponent(merchant));
    }
  }, [merchant]);

  // Auto-select the most recent month when transactions are loaded - but don't auto-filter
  useEffect(() => {
    console.log(
      `[Transactions] useEffect triggered - selectedMonth: ${selectedMonth}, transactions: ${transactions.length}`
    );

    if (transactions.length > 0) {
      console.log(
        `[Transactions] Sample transactions:`,
        transactions.slice(0, 5).map((tx) => ({
          date: tx.date,
          timestamp: tx.timestamp,
          description: tx.description,
        }))
      );

      // Test date parsing for specific dates like the ones in DynamoDB
      console.log(`[Transactions] Testing date parsing:`);
      console.log(`  2025-08-22 → ${dayjs("2025-08-22").format("YYYY-MM")}`);
      console.log(
        `  2025-08-23T10:30:14.816Z → ${dayjs("2025-08-23T10:30:14.816Z").format("YYYY-MM")}`
      );
      console.log(`  Current date → ${dayjs().format("YYYY-MM")}`);
    }

    // Don't auto-select a month - show all transactions by default
    // Users can manually select a month to filter if needed
    if (!selectedMonth && transactions.length > 0) {
      const monthsSet = new Set<string>();
      transactions.forEach((tx) => {
        const month = dayjs(tx.date || tx.timestamp).format("YYYY-MM");
        monthsSet.add(month);
      });
      const sortedMonths = Array.from(monthsSet).sort().reverse();
      console.log(
        `[Transactions] Available months found (but not auto-selecting):`,
        sortedMonths
      );

      // Don't auto-select any month - let users see all transactions
      // setSelectedMonth("");  // Keep empty to show all
    }
  }, [transactions]);

  // Generate available months from transactions
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    transactions.forEach((tx) => {
      const month = dayjs(tx.date || tx.timestamp).format("YYYY-MM");
      monthsSet.add(month);
    });

    console.log(
      `[Transactions] Available months for filter:`,
      Array.from(monthsSet).sort().reverse()
    );

    // Show more months since user has 975 transactions
    const months = Array.from(monthsSet).sort().reverse().slice(0, 12);
    return months.map((month) => ({
      key: month,
      label: dayjs(month).format("MMM YY"),
      isActive: true,
    }));
  }, [transactions]);

  // Filter and group transactions
  const { filteredTransactions, pendingTransactions } = useMemo(() => {
    let filtered = transactions;
    console.log(
      `[Transactions] Starting filter with ${transactions.length} transactions, selectedMonth: ${selectedMonth}`
    );

    if (transactions.length > 0) {
      console.log(
        `[Transactions] Sample transaction dates:`,
        transactions.slice(0, 3).map((tx) => ({
          description: tx.description,
          date: tx.date,
          timestamp: tx.timestamp,
          parsedMonth: dayjs(tx.date || tx.timestamp).format("YYYY-MM"),
        }))
      );
    }

    // Month filter - only apply if selectedMonth is set and not empty
    if (selectedMonth && selectedMonth.trim() !== "") {
      console.log(`[Transactions] Applying month filter for: ${selectedMonth}`);
      const beforeFilterCount = filtered.length;
      filtered = filtered.filter((tx) => {
        const txMonth = dayjs(tx.date || tx.timestamp).format("YYYY-MM");
        const matches = txMonth === selectedMonth;
        return matches;
      });
      console.log(
        `[Transactions] Month filter: ${beforeFilterCount} → ${filtered.length} transactions`
      );
    } else {
      console.log(
        `[Transactions] No month filter applied, showing all ${transactions.length} transactions`
      );
    }

    console.log(
      `[Transactions] After month filter: ${filtered.length} transactions (selectedMonth: "${selectedMonth}")`
    );

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (tx) =>
          tx.description.toLowerCase().includes(query) ||
          tx.merchant.toLowerCase().includes(query) ||
          tx.bankName?.toLowerCase().includes(query)
      );
    }

    // Separate pending and completed transactions
    const pending = filtered.filter((tx) => tx.isPending);
    const completed = filtered.filter((tx) => !tx.isPending);

    return {
      filteredTransactions: completed.sort(
        (a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf()
      ),
      pendingTransactions: pending.sort(
        (a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf()
      ),
    };
  }, [transactions, selectedMonth, searchQuery]);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: GroupedTransaction[] = [];
    const dateGroups = new Map<string, Transaction[]>();

    filteredTransactions.forEach((tx) => {
      const dateKey = dayjs(tx.date).format("YYYY-MM-DD");
      if (!dateGroups.has(dateKey)) {
        dateGroups.set(dateKey, []);
      }
      dateGroups.get(dateKey)!.push(tx);
    });

    dateGroups.forEach((txs, date) => {
      groups.push({
        date,
        transactions: txs,
      });
    });

    return groups.sort(
      (a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf()
    );
  }, [filteredTransactions]);

  const formatDateHeader = (date: string) => {
    return dayjs(date).format("ddd DD MMM");
  };

  const getMerchantLogo = (description: string) => {
    const merchantInfo = getMerchantInfo(description);
    return merchantInfo.logo;
  };

  const getBankIcon = (accountType: string) => {
    if (accountType?.toLowerCase().includes("credit")) {
      return "💳";
    }
    return "🏦";
  };

  if (!authLoggedIn || checkingBank) {
    return null;
  }

  // Show skeleton loader during initial load
  if (loading && transactions.length === 0) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: colors.background.primary },
        ]}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={[
              styles.backButton,
              { backgroundColor: colors.background.secondary },
            ]}
            onPress={() => router.back()}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={colors.primary[500]}
            />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
              ALL TRANSACTIONS
            </Text>
          </View>
          <View style={styles.menuButton} />
        </View>
        <ScrollView style={styles.scrollView}>
          {[1, 2, 3, 4, 5].map((i) => (
            <TransactionSkeleton key={i} />
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (transactions.length === 0 && !loading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: colors.background.primary },
        ]}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={[
              styles.backButton,
              { backgroundColor: colors.background.secondary },
            ]}
            onPress={() => router.back()}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={colors.primary[500]}
            />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
              ALL TRANSACTIONS
            </Text>
          </View>
          <View style={styles.menuButton} />
        </View>

        <EmptyState
          type="transactions"
          onAction={() => router.push("/add-transaction")}
          secondaryActionLabel="Import CSV"
          onSecondaryAction={() => router.push("/import-csv")}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary[500]]}
            tintColor={colors.primary[500]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[
              styles.backButton,
              { backgroundColor: colors.background.secondary },
            ]}
            onPress={() => router.back()}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={colors.primary[500]}
            />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
              ALL TRANSACTIONS
            </Text>
            <Text
              style={[styles.headerSubtitle, { color: colors.text.secondary }]}
            >
              Updated today, {lastUpdated}
            </Text>
          </View>

          <TouchableOpacity style={styles.menuButton}>
            <Ionicons
              name="ellipsis-horizontal"
              size={24}
              color={colors.text.secondary}
            />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchSection}>
          <View
            style={[
              styles.searchContainer,
              { backgroundColor: colors.background.secondary },
            ]}
          >
            <Ionicons
              name="search-outline"
              size={20}
              color={colors.text.tertiary}
            />
            <TextInput
              style={[styles.searchInput, { color: colors.text.primary }]}
              placeholder="Search"
              placeholderTextColor={colors.text.tertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Month Filter */}
        {availableMonths.length > 0 && (
          <MonthFilter
            selectedMonth={selectedMonth}
            onMonthSelect={setSelectedMonth}
            availableMonths={availableMonths}
          />
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text
              style={[styles.loadingText, { color: colors.text.secondary }]}
            >
              Loading transactions...
            </Text>
          </View>
        ) : (
          <View style={styles.transactionsContainer}>
            {/* Pending Transactions */}
            {pendingTransactions.length > 0 && (
              <View style={styles.pendingSection}>
                <View style={styles.pendingHeader}>
                  <Text
                    style={[
                      styles.pendingTitle,
                      { color: colors.text.primary },
                    ]}
                  >
                    Pending
                  </Text>
                  <Text
                    style={[
                      styles.pendingAmount,
                      { color: colors.text.primary },
                    ]}
                  >
                    £
                    {pendingTransactions
                      .reduce((sum, tx) => sum + Math.abs(tx.originalAmount), 0)
                      .toFixed(2)}
                  </Text>
                </View>

                {pendingTransactions.map((transaction) => (
                  <View
                    key={transaction.id}
                    style={[
                      styles.transactionCard,
                      { backgroundColor: colors.background.secondary },
                    ]}
                  >
                    <View style={styles.merchantLogo}>
                      <Text style={styles.logoText}>
                        {getMerchantLogo(transaction.description)}
                      </Text>
                    </View>

                    <View style={styles.transactionDetails}>
                      <Text
                        style={[
                          styles.merchantName,
                          { color: colors.text.primary },
                        ]}
                      >
                        {getMerchantInfo(transaction.description).name}
                      </Text>
                      <View style={styles.accountInfo}>
                        <Text
                          style={[
                            styles.accountType,
                            { color: colors.text.secondary },
                          ]}
                        >
                          {transaction.accountType}
                        </Text>
                        <Text style={styles.bankIcon}>
                          {getBankIcon(transaction.accountType || "")}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.amountContainer}>
                      <Text
                        style={[
                          styles.amount,
                          {
                            color:
                              transaction.type === "credit"
                                ? colors.success[500]
                                : colors.text.primary,
                          },
                        ]}
                      >
                        {transaction.type === "credit" ? "+" : ""}£
                        {Math.abs(transaction.originalAmount).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Grouped Transactions */}
            {groupedTransactions.map((group) => (
              <View key={group.date} style={styles.dateGroup}>
                <Text
                  style={[styles.dateHeader, { color: colors.text.secondary }]}
                >
                  {formatDateHeader(group.date)}
                </Text>
                <Text
                  style={[styles.dateAmount, { color: colors.text.secondary }]}
                >
                  £
                  {group.transactions
                    .reduce((sum, tx) => sum + Math.abs(tx.originalAmount), 0)
                    .toFixed(2)}
                </Text>

                {group.transactions.map((transaction) => (
                  <View
                    key={transaction.id}
                    style={[
                      styles.transactionCard,
                      { backgroundColor: colors.background.secondary },
                    ]}
                  >
                    <View style={styles.merchantLogo}>
                      <Text style={styles.logoText}>
                        {getMerchantLogo(transaction.description)}
                      </Text>
                    </View>

                    <View style={styles.transactionDetails}>
                      <Text
                        style={[
                          styles.merchantName,
                          { color: colors.text.primary },
                        ]}
                      >
                        {getMerchantInfo(transaction.description).name}
                      </Text>
                      <View style={styles.accountInfo}>
                        <Text
                          style={[
                            styles.accountType,
                            { color: colors.text.secondary },
                          ]}
                        >
                          {transaction.accountType}
                        </Text>
                        <Text style={styles.bankIcon}>
                          {getBankIcon(transaction.accountType || "")}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.amountContainer}>
                      <Text
                        style={[
                          styles.amount,
                          {
                            color:
                              transaction.type === "credit"
                                ? colors.success[500]
                                : colors.text.primary,
                          },
                        ]}
                      >
                        {transaction.type === "credit" ? "+" : ""}£
                        {Math.abs(transaction.originalAmount).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ))}

            {/* Empty State */}
            {groupedTransactions.length === 0 &&
              pendingTransactions.length === 0 && (
                <EmptyState
                  type="transactions"
                  title={searchQuery ? "No matches found" : "No transactions"}
                  description={
                    searchQuery
                      ? "Try adjusting your search or filter criteria"
                      : "No transactions for this period"
                  }
                />
              )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing["2xl"],
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  menuButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  // Search
  searchSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius["2xl"],
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: spacing.xs,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing["3xl"],
  },
  loadingText: {
    fontSize: 16,
  },

  // Transactions
  transactionsContainer: {
    paddingHorizontal: spacing.lg,
  },

  // Pending Section
  pendingSection: {
    marginBottom: spacing.xl,
  },
  pendingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  pendingTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  pendingAmount: {
    fontSize: 16,
    fontWeight: "600",
  },

  // Date Groups
  dateGroup: {
    marginBottom: spacing.lg,
  },
  dateHeader: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  dateAmount: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    textAlign: "right",
    marginTop: -22,
  },

  // Transaction Cards
  transactionCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  merchantLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  logoText: {
    fontSize: 20,
  },
  transactionDetails: {
    flex: 1,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  accountInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  accountType: {
    fontSize: 14,
  },
  bankIcon: {
    fontSize: 14,
  },
  amountContainer: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: 16,
    fontWeight: "700",
  },

  // Empty States
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  connectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius["2xl"],
    gap: spacing.sm,
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  emptyTransactions: {
    alignItems: "center",
    paddingVertical: spacing["3xl"],
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: spacing.md,
  },
});
