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
import MonthFilter from "../../components/ui/MonthFilter";
import { MerchantLogo } from "../../components/ui/MerchantLogo";
import EditTransactionModal from "../../components/EditTransactionModal";
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
  const [allLoadedTransactions, setAllLoadedTransactions] = useState<Transaction[]>([]); // Cache all loaded transactions
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>(dayjs().format("YYYY-MM")); // Default to current month
  const [lastUpdated, setLastUpdated] = useState(dayjs().format("HH:mm"));
  const [loadMoreMonths, setLoadMoreMonths] = useState(false); // Tracks if user wants more months

  // Edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);

  // Spending summary modal state
  const [summaryModalVisible, setSummaryModalVisible] = useState(false);

  // Calculate spending summary
  const getSpendingSummary = () => {
    const totalSpending = transactions
      .filter((t) => t.type === "debit")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const totalIncome = transactions
      .filter((t) => t.type === "credit")
      .reduce((sum, t) => sum + t.amount, 0);

    const netFlow = totalIncome - totalSpending;

    // Group by category
    const categorySpending = transactions
      .filter((t) => t.type === "debit")
      .reduce(
        (acc, t) => {
          const category = t.category || "Uncategorized";
          acc[category] = (acc[category] || 0) + Math.abs(t.amount);
          return acc;
        },
        {} as Record<string, number>
      );

    const topCategories = Object.entries(categorySpending)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return {
      totalSpending,
      totalIncome,
      netFlow,
      transactionCount: transactions.length,
      topCategories,
      avgTransaction:
        transactions.length > 0
          ? totalSpending /
            transactions.filter((t) => t.type === "debit").length
          : 0,
    };
  };

  const fetchTransactions = async (showRefresh = false, monthsToFetch = 1) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      // Fetch only specified months to reduce initial load
      const startDate = dayjs()
        .subtract(monthsToFetch - 1, "months")
        .startOf("month")
        .format("YYYY-MM-DD");
      const endDate = dayjs().endOf("month").format("YYYY-MM-DD");
      const limit = monthsToFetch * 300; // ~300 per month

      console.log(
        `[Transactions] Fetching ${monthsToFetch} month(s) (${startDate} to ${endDate})...`
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

            return formatted;
          });

        console.log(
          `[Transactions] Loaded ${formattedTransactions.length} transactions`
        );

        // Merge with previously loaded transactions to build full cache
        const merged = [...allLoadedTransactions, ...formattedTransactions];
        const uniqueTransactions = Array.from(
          new Map(merged.map(tx => [tx.id, tx])).values()
        );

        setAllLoadedTransactions(uniqueTransactions);

        // Filter to show selected month or all if in "load more" mode
        const toDisplay = loadMoreMonths
          ? uniqueTransactions
          : uniqueTransactions.filter(tx => {
              const txMonth = dayjs(tx.date || tx.timestamp).format("YYYY-MM");
              return selectedMonth ? txMonth === selectedMonth : true;
            });

        setTransactions(toDisplay);
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
    // When refreshing, fetch 3 months to populate more cache
    fetchTransactions(true, 3);
  };

  // Helper function to load all months (when user clicks "Load More" or similar)
  const loadAllMonths = async () => {
    setLoadMoreMonths(true);
    // Fetch 12 months worth of data
    await fetchTransactions(false, 12);
  };

  // Handle edit transaction
  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setEditModalVisible(true);
  };

  // Handle save transaction
  const handleSaveTransaction = async (
    transactionId: string,
    updates: Partial<Transaction>
  ) => {
    try {
      await transactionAPI.updateTransaction(transactionId, updates);

      // Update the local state
      setTransactions((prevTransactions) =>
        prevTransactions.map((tx) =>
          tx.id === transactionId ? { ...tx, ...updates } : tx
        )
      );

      showSuccess("Transaction updated successfully");
      setEditModalVisible(false);
    } catch (error) {
      console.error("Error updating transaction:", error);
      showError("Failed to update transaction");
      throw error;
    }
  };

  // Handle delete transaction
  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      await transactionAPI.deleteTransaction(transactionId);

      // Remove from local state
      setTransactions((prevTransactions) =>
        prevTransactions.filter((tx) => tx.id !== transactionId)
      );

      showSuccess("Transaction deleted successfully");
      setEditModalVisible(false);
    } catch (error) {
      console.error("Error deleting transaction:", error);
      showError("Failed to delete transaction");
      throw error;
    }
  };

  useEffect(() => {
    console.log("Transactions", transactions);
    if (!authLoggedIn) {
      router.replace("/auth/login");
    }
  }, [authLoggedIn, checkingBank]);

  useEffect(() => {
    if (isLoggedIn) {
      // Fetch 6 months on initial load to populate month filter and improve UX
      // This is still much faster than loading all 12 months
      fetchTransactions(false, 6);
    }
  }, [isLoggedIn]); // Only fetch on login, filter client-side when month changes

  useEffect(() => {
    if (merchant) {
      setSearchQuery(decodeURIComponent(merchant));
    }
  }, [merchant]);

  // Handle month selection - fetch more months if needed or filter from cache
  useEffect(() => {
    if (selectedMonth && allLoadedTransactions.length > 0) {
      const monthTransactions = allLoadedTransactions.filter(tx => {
        const txMonth = dayjs(tx.date || tx.timestamp).format("YYYY-MM");
        return txMonth === selectedMonth;
      });

      if (monthTransactions.length > 0) {
        // Already have data for this month
        setTransactions(monthTransactions);
      } else {
        // Need to fetch this month
        const monthIndex = dayjs(selectedMonth).diff(dayjs().startOf("month"), "month", true);
        const monthsToFetch = Math.abs(Math.ceil(monthIndex)) + 1;
        console.log(`[Transactions] Selected month not loaded, fetching ${monthsToFetch} months...`);
        fetchTransactions(false, monthsToFetch);
      }
    }
  }, [selectedMonth]);

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

  // Generate available months from ALL loaded transactions (cache), not just filtered view
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();

    // Always include current month
    const currentMonth = dayjs().format("YYYY-MM");
    monthsSet.add(currentMonth);

    // Use allLoadedTransactions to show all months that have been fetched
    allLoadedTransactions.forEach((tx) => {
      const month = dayjs(tx.date || tx.timestamp).format("YYYY-MM");
      monthsSet.add(month);
    });

    console.log(
      `[Transactions] Available months for filter:`,
      Array.from(monthsSet).sort().reverse()
    );

    // Show all available months sorted by most recent first
    const months = Array.from(monthsSet).sort().reverse();
    return months.map((month) => ({
      key: month,
      label: dayjs(month).format("MMMM"), // Full month name for clarity
      isActive: true,
    }));
  }, [allLoadedTransactions]);

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
              color={colors.primary.main}
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

  // Remove this block - we want to show the month picker even when there are no transactions
  // if (transactions.length === 0 && !loading) {
  //   return empty state
  // }

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
            colors={[colors.primary.main]}
            tintColor={colors.primary.main}
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
              color={colors.primary.main}
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

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setSummaryModalVisible(true)}
          >
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
                  <TouchableOpacity
                    key={transaction.id}
                    style={[
                      styles.transactionCard,
                      { backgroundColor: colors.background.secondary },
                    ]}
                    onPress={() => handleEditTransaction(transaction)}
                  >
                    <MerchantLogo
                      merchant={transaction.merchant}
                      description={transaction.description}
                      category={transaction.category}
                      size={52}
                      style={{ marginRight: spacing.md }}
                    />

                    <View style={styles.transactionDetails}>
                      <Text
                        style={[
                          styles.merchantName,
                          { color: colors.text.primary },
                        ]}
                      >
                        {transaction.merchant}
                      </Text>
                      <Text
                        style={[
                          styles.categoryLabel,
                          { color: colors.text.tertiary },
                        ]}
                      >
                        {transaction.category || 'General'}
                      </Text>
                    </View>

                    <View style={styles.amountContainer}>
                      <Text
                        style={[
                          styles.amount,
                          {
                            color:
                              transaction.type === "credit"
                                ? colors.success.main
                                : colors.error.main,
                          },
                        ]}
                      >
                        {transaction.type === "credit" ? "+" : "-"}£
                        {Math.abs(transaction.originalAmount).toFixed(2)}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={colors.text.tertiary}
                        style={styles.chevronIcon}
                      />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Grouped Transactions */}
            {groupedTransactions.map((group) => (
              <View key={group.date} style={styles.dateGroup}>
                <View style={styles.dateHeaderContainer}>
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
                </View>

                {group.transactions.map((transaction) => (
                  <TouchableOpacity
                    key={transaction.id}
                    style={[
                      styles.transactionCard,
                      { backgroundColor: colors.background.secondary },
                    ]}
                    onPress={() => handleEditTransaction(transaction)}
                  >
                    <MerchantLogo
                      merchant={transaction.merchant}
                      description={transaction.description}
                      category={transaction.category}
                      size={52}
                      style={{ marginRight: spacing.md }}
                    />

                    <View style={styles.transactionDetails}>
                      <Text
                        style={[
                          styles.merchantName,
                          { color: colors.text.primary },
                        ]}
                      >
                        {transaction.merchant}
                      </Text>
                      <Text
                        style={[
                          styles.categoryLabel,
                          { color: colors.text.tertiary },
                        ]}
                      >
                        {transaction.category || 'General'}
                      </Text>
                    </View>

                    <View style={styles.amountContainer}>
                      <Text
                        style={[
                          styles.amount,
                          {
                            color:
                              transaction.type === "credit"
                                ? colors.success.main
                                : colors.error.main,
                          },
                        ]}
                      >
                        {transaction.type === "credit" ? "+" : "-"}£
                        {Math.abs(transaction.originalAmount).toFixed(2)}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={colors.text.tertiary}
                        style={styles.chevronIcon}
                      />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))}

            {/* Empty State */}
            {groupedTransactions.length === 0 &&
              pendingTransactions.length === 0 && (
                <EmptyState
                  type="transactions"
                  title={searchQuery ? "No matches found" : "No transactions yet"}
                  description={
                    searchQuery
                      ? "Try adjusting your search or filter criteria"
                      : selectedMonth
                      ? `No transactions for ${dayjs(selectedMonth).format("MMMM YYYY")}`
                      : "No transactions for this period"
                  }
                />
              )}
          </View>
        )}
      </ScrollView>

      {/* Edit Transaction Modal */}
      <EditTransactionModal
        visible={editModalVisible}
        transaction={selectedTransaction}
        onClose={() => {
          setEditModalVisible(false);
          setSelectedTransaction(null);
        }}
        onSave={handleSaveTransaction}
        onDelete={handleDeleteTransaction}
      />

      {/* Spending Summary Modal */}
      {summaryModalVisible && (
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.summaryModal,
              { backgroundColor: colors.background.primary },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                📊 Spending Summary
              </Text>
              <TouchableOpacity
                onPress={() => setSummaryModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={colors.text.secondary}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.summaryContent}>
              {(() => {
                const summary = getSpendingSummary();
                return (
                  <>
                    {/* Key Metrics */}
                    <View style={styles.summarySection}>
                      <Text
                        style={[
                          styles.sectionTitle,
                          { color: colors.text.primary },
                        ]}
                      >
                        💰 Financial Overview
                      </Text>
                      <View style={styles.metricRow}>
                        <Text
                          style={[
                            styles.metricLabel,
                            { color: colors.text.secondary },
                          ]}
                        >
                          Total Spending:
                        </Text>
                        <Text
                          style={[
                            styles.metricValue,
                            { color: colors.text.primary },
                          ]}
                        >
                          £{summary.totalSpending.toFixed(2)}
                        </Text>
                      </View>
                      <View style={styles.metricRow}>
                        <Text
                          style={[
                            styles.metricLabel,
                            { color: colors.text.secondary },
                          ]}
                        >
                          Total Income:
                        </Text>
                        <Text
                          style={[
                            styles.metricValue,
                            { color: colors.text.primary },
                          ]}
                        >
                          £{summary.totalIncome.toFixed(2)}
                        </Text>
                      </View>
                      <View style={styles.metricRow}>
                        <Text
                          style={[
                            styles.metricLabel,
                            { color: colors.text.secondary },
                          ]}
                        >
                          Net Flow:
                        </Text>
                        <Text
                          style={[
                            styles.metricValue,
                            {
                              color:
                                summary.netFlow >= 0
                                  ? colors.success.main
                                  : colors.error.main,
                            },
                          ]}
                        >
                          {summary.netFlow >= 0 ? "+" : ""}£
                          {summary.netFlow.toFixed(2)}
                        </Text>
                      </View>
                      <View style={styles.metricRow}>
                        <Text
                          style={[
                            styles.metricLabel,
                            { color: colors.text.secondary },
                          ]}
                        >
                          Transactions:
                        </Text>
                        <Text
                          style={[
                            styles.metricValue,
                            { color: colors.text.primary },
                          ]}
                        >
                          {summary.transactionCount}
                        </Text>
                      </View>
                      <View style={styles.metricRow}>
                        <Text
                          style={[
                            styles.metricLabel,
                            { color: colors.text.secondary },
                          ]}
                        >
                          Avg Transaction:
                        </Text>
                        <Text
                          style={[
                            styles.metricValue,
                            { color: colors.text.primary },
                          ]}
                        >
                          £{summary.avgTransaction.toFixed(2)}
                        </Text>
                      </View>
                    </View>

                    {/* Top Categories */}
                    {summary.topCategories.length > 0 && (
                      <View style={styles.summarySection}>
                        <Text
                          style={[
                            styles.sectionTitle,
                            { color: colors.text.primary },
                          ]}
                        >
                          🏆 Top Spending Categories
                        </Text>
                        {summary.topCategories.map(
                          ([category, amount], index) => (
                            <View key={category} style={styles.categoryRow}>
                              <View style={styles.categoryInfo}>
                                <Text
                                  style={[
                                    styles.categoryName,
                                    { color: colors.text.primary },
                                  ]}
                                >
                                  {index + 1}. {category}
                                </Text>
                                <Text
                                  style={[
                                    styles.categoryAmount,
                                    { color: colors.text.secondary },
                                  ]}
                                >
                                  £{amount.toFixed(2)}
                                </Text>
                              </View>
                              <View
                                style={[
                                  styles.categoryBar,
                                  {
                                    backgroundColor:
                                      colors.background.secondary,
                                  },
                                ]}
                              >
                                <View
                                  style={[
                                    styles.categoryBarFill,
                                    {
                                      backgroundColor: colors.primary.main,
                                      width: `${(amount / summary.totalSpending) * 100}%`,
                                    },
                                  ]}
                                />
                              </View>
                            </View>
                          )
                        )}
                      </View>
                    )}
                  </>
                );
              })()}
            </ScrollView>
          </View>
        </View>
      )}
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
    marginBottom: spacing.xl,
  },
  dateHeaderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  dateHeader: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dateAmount: {
    fontSize: 13,
    fontWeight: "600",
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
  categoryLabel: {
    fontSize: 13,
    marginTop: 2,
  },
  transactionDetails: {
    flex: 1,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  amountContainer: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: 16,
    fontWeight: "700",
  },
  chevronIcon: {
    marginTop: spacing.xs,
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

  // Spending Summary Modal Styles
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  summaryModal: {
    width: "90%",
    maxHeight: "80%",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 4,
  },
  summaryContent: {
    maxHeight: 400,
  },
  summarySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  metricLabel: {
    fontSize: 16,
    flex: 1,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  categoryRow: {
    marginBottom: 12,
  },
  categoryInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: "600",
  },
  categoryBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  categoryBarFill: {
    height: "100%",
    borderRadius: 3,
  },
});
