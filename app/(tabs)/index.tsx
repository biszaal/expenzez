import React, { useEffect, useState } from "react";
import { ScrollView, RefreshControl, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import dayjs from "dayjs";
import { useTheme } from "../../contexts/ThemeContext";
import { useSecurity } from "../../contexts/SecurityContext";
import { useNotifications } from "../../contexts/NotificationContext";
import { useAuth } from "../auth/AuthContext";
import { budgetAPI } from "../../services/api";
import { transactionAPI } from "../../services/api/transactionAPI";
import { balanceAPI } from "../../services/api/balanceAPI";
import { Alert } from "react-native";
import { SPACING } from "../../constants/Colors";
import { APP_STRINGS } from "../../constants/strings";
import { TabLoadingScreen } from "../../components/ui";
import { DashboardSkeleton } from "../../components/ui/SkeletonLoader";
import {
  HomeHeader,
  BalanceCard,
  QuickActions,
  TransactionsList,
  UpcomingBillsCard,
  NotificationCard,
} from "../../components/home";
import { CompactSpendingSummary } from "../../components/home/CompactSpendingSummary";
import { CompactBudgetStatus } from "../../components/home/CompactBudgetStatus";
import { api } from "../../services/config/apiClient";
import { TransactionService } from "../../services/transactionService";
import { UpgradeBanner } from "../../components/premium/UpgradeBanner";

interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  timestamp?: string;
  merchant: string;
  category?: string;
  accountId: string;
  type: "debit" | "credit";
  originalAmount: number;
  accountType?: string;
  isPending?: boolean;
  currency: string;
}

interface Account {
  id: string;
  name: string;
  institution: string | { name: string; logo?: string };
  balance: number;
  currency: string;
  type: string;
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const { isLocked } = useSecurity();
  const router = useRouter();
  // Subscription features removed - all users have free access
  const { unreadCount } = useNotifications();
  const { isLoggedIn, user } = useAuth();

  // Core data state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);

  // Enhanced balance tracking
  const [manualBalance, setManualBalance] = useState<number | null>(null);
  const [isManualBalance, setIsManualBalance] = useState(false);

  // UI state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [balanceRefreshing, setBalanceRefreshing] = useState(false);

  // Security and user preferences
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [showPremiumCard, setShowPremiumCard] = useState(true);

  // Current month for calculations (no longer user-selectable)
  const currentMonth = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  })();

  // Load user's budget from database
  const loadUserBudget = async () => {
    try {
      const budgetPreferences = await budgetAPI.getBudgetPreferences();
      if (budgetPreferences.monthlySpendingLimit) {
        setUserBudget(budgetPreferences.monthlySpendingLimit);
      }
    } catch (error) {
      console.error("Error loading user budget from database:", error);
      // Keep default budget if database fails
    }
  };

  // Load manual balance from database
  const loadManualBalance = async () => {
    try {
      const response = await api.get("/profile");
      const profile = response.data?.profile ?? response.data;

      if (profile) {
        // Only set manual balance and mode, don't override totalBalance
        // The balance will be set from the API response in loadData()
        if (
          profile.manualBalance !== null &&
          profile.manualBalance !== undefined
        ) {
          setManualBalance(profile.manualBalance);
        }
        if (profile.isManualBalance !== undefined) {
          setIsManualBalance(Boolean(profile.isManualBalance));
        }
      }
    } catch (error) {
      console.error("Error loading manual balance:", error);
    }
  };

  // Save manual balance to database
  const saveManualBalance = async (balance: number) => {
    try {
      console.log("🔍 [saveManualBalance] Setting manual balance:", balance);
      const response = await api.put("/profile", {
        manualBalance: balance,
        isManualBalance: true,
      });

      const profile = response.data?.profile ?? response.data;
      console.log("🔍 [saveManualBalance] Profile response:", {
        manualBalance: profile?.manualBalance,
        isManualBalance: profile?.isManualBalance,
        cachedBalance: profile?.cachedBalance,
      });

      setManualBalance(profile?.manualBalance ?? balance);
      setIsManualBalance(profile?.isManualBalance ?? true);

      await balanceAPI.invalidateCache().catch(() => {});
      return true;
    } catch (error) {
      console.error("Error saving manual balance:", error);
      return false;
    }
  };

  // Clear manual balance (use calculated balance)
  const clearManualBalance = async () => {
    try {
      const response = await api.put("/profile", {
        isManualBalance: false,
      });

      const profile = response.data?.profile ?? response.data;
      setManualBalance(profile?.manualBalance ?? null);
      setIsManualBalance(Boolean(profile?.isManualBalance));

      await balanceAPI.invalidateCache().catch(() => {});
      return true;
    } catch (error) {
      console.error("Error clearing manual balance:", error);
      return false;
    }
  };

  // Get current display balance (manual or calculated)
  const getDisplayBalance = () => {
    const displayBalance =
      isManualBalance && manualBalance !== null ? manualBalance : totalBalance;

    console.log("🔍 [getDisplayBalance] Debug:", {
      isManualBalance,
      manualBalance,
      totalBalance,
      displayBalance,
    });

    return displayBalance;
  };

  // Load data function
  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        setError(null);
        setWarning(null);

        // Invalidate all caches when refreshing
        try {
          await balanceAPI.invalidateCache();
          console.log("🔄 [Home] Balance cache invalidated");

          // Also clear any local storage caches
          await AsyncStorage.removeItem("transaction_cache");
          await AsyncStorage.removeItem("balance_cache");
          console.log("🔄 [Home] Local caches cleared");
        } catch (error) {
          console.warn("⚠️ [Home] Failed to invalidate caches:", error);
        }
      } else {
        setLoading(true);
        setFetchingData(true);
      }

      // Check authentication first
      const accessToken = await SecureStore.getItemAsync("accessToken", {
        keychainService: "expenzez-tokens",
      });
      if (!accessToken) {
        setWarning(APP_STRINGS.HOME.LOGIN_WARNING);
        setLoading(false);
        setFetchingData(false);
        return;
      }

      // 📱 MANUAL INPUT MODE: Load balance and recent transactions
      console.log(
        "📱 MANUAL INPUT MODE: Loading balance summary and recent transactions..."
      );

      // Try to fetch balance summary first
      let balanceSummary;
      let useFallbackBalance = false;

      try {
        balanceSummary = await balanceAPI.getSummary({
          useCache: !isRefresh,
          forceRefresh: isRefresh,
        });
        console.log("✅ Balance summary loaded from API:", balanceSummary);
      } catch (error: any) {
        console.warn(
          "⚠️ Balance summary endpoint not available (will deploy soon), using fallback calculation"
        );
        useFallbackBalance = true;
        balanceSummary = {
          balance: 0,
          totalCredit: 0,
          totalDebit: 0,
          transactionCount: 0,
          firstTransactionDate: null,
          lastTransactionDate: null,
          monthsWithData: [],
        };
      }

      // Fetch transactions (always needed for display and fallback calculation)
      // Force fresh data by adding timestamp to bypass any caching
      console.log("🔄 [Home] Fetching transactions with force refresh...");
      const transactionResponse = await transactionAPI
        .getTransactions({
          startDate: dayjs()
            .subtract(6, "months")
            .startOf("month")
            .format("YYYY-MM-DD"),
          endDate: dayjs().endOf("month").format("YYYY-MM-DD"),
          limit: 1000, // Load more for fallback balance calculation
        })
        .catch((error) => {
          console.error("❌ Error loading transactions:", error);
          return {
            transactions: [],
            summary: {
              totalAmount: 0,
              creditTotal: 0,
              debitTotal: 0,
              count: 0,
            },
          };
        });

      console.log(
        "✅ Transactions loaded:",
        transactionResponse.transactions?.length || 0
      );

      // Create empty accounts array for manual mode
      setAccounts([]);

      // Calculate balance
      let finalBalance = balanceSummary.balance;

      if (
        useFallbackBalance &&
        transactionResponse.transactions &&
        transactionResponse.transactions.length > 0
      ) {
        // Fallback: Calculate balance client-side from all loaded transactions
        const transactions = transactionResponse.transactions.map(
          (tx: any) => ({
            id: tx.id || `tx_${Date.now()}`,
            amount: parseFloat(tx.amount) || 0,
            type: tx.type || (tx.amount < 0 ? "debit" : "credit"),
            category: tx.category || "General",
            description: tx.description || "Transaction",
            date: tx.date || new Date().toISOString(),
          })
        );

        finalBalance = TransactionService.calculateBalance(transactions);
        console.log(
          `✅ Balance calculated client-side (fallback): ${finalBalance} from ${transactionResponse.transactions.length} transactions`
        );
      } else {
        console.log(`✅ Balance from server summary: ${finalBalance}`);
      }

      // Set the appropriate balance based on user's balance mode
      if (isManualBalance) {
        setManualBalance(finalBalance);
        console.log(`✅ Manual balance updated: ${finalBalance}`);
        console.log("🔍 [Balance Update] State values:", {
          isManualBalance,
          finalBalance,
          currentManualBalance: manualBalance,
          currentTotalBalance: totalBalance,
        });
      } else {
        setTotalBalance(finalBalance);
        console.log(`✅ Calculated balance updated: ${finalBalance}`);
        console.log("🔍 [Balance Update] State values:", {
          isManualBalance,
          finalBalance,
          currentManualBalance: manualBalance,
          currentTotalBalance: totalBalance,
        });
      }

      console.log("💰 [Home] Financial summary:", {
        totalBalance: finalBalance,
        transactionCount: (transactionResponse.transactions || []).length,
      });

      const transactionsData = {
        success: true,
        transactions: transactionResponse.transactions || [],
      };

      // Handle transactions
      let allTransactions: Transaction[] = [];
      if (
        transactionsData.success &&
        transactionsData.transactions &&
        transactionsData.transactions.length > 0
      ) {
        console.log(
          "[Home] Sample transaction data:",
          transactionsData.transactions.slice(0, 2)
        );
        allTransactions = transactionsData.transactions.map(
          (tx: any, index: number) => ({
            id:
              tx.id ||
              `tx_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
            amount: tx.amount || 0,
            description: tx.description || "Unknown Transaction",
            date: tx.date || new Date().toISOString(),
            timestamp: tx.date || new Date().toISOString(),
            merchant: tx.merchant || tx.description || "Manual Entry",
            category: tx.category || "General",
            accountId: tx.accountId || "manual",
            type: tx.type || (tx.amount < 0 ? "debit" : "credit"),
            originalAmount: Math.abs(tx.amount || 0),
            accountType: tx.accountType || "Manual Account",
            isPending: tx.isPending || false,
            currency: tx.currency || "GBP",
          })
        );
      }

      // Sort by date (newest first)
      allTransactions.sort((a, b) => {
        const dateA = new Date(a.date || a.timestamp || 0).getTime();
        const dateB = new Date(b.date || b.timestamp || 0).getTime();
        return dateB - dateA;
      });

      setTransactions(allTransactions);
      console.log(`📱 Set ${allTransactions.length} transactions for display`);

      // Debug: Log recent transactions to help identify new ones
      const recentTransactions = allTransactions.slice(0, 5);
      console.log(
        "📱 Recent transactions loaded:",
        recentTransactions.map((tx) => ({
          id: tx.id,
          date: tx.date,
          amount: tx.amount,
          type: tx.type,
          description: tx.description,
          month: tx.date ? dayjs(tx.date).format("YYYY-MM") : "no-date",
        }))
      );

      // Debug: Check for transactions added today
      const today = dayjs().format("YYYY-MM-DD");
      const todayTransactions = allTransactions.filter(
        (tx) => tx.date && dayjs(tx.date).format("YYYY-MM-DD") === today
      );
      console.log(
        `📱 Transactions added today (${today}):`,
        todayTransactions.length,
        todayTransactions.map((tx) => ({
          id: tx.id,
          description: tx.description,
          amount: tx.amount,
          type: tx.type,
        }))
      );

      // Debug: Check balance calculation
      console.log("💰 Balance calculation debug:", {
        serverBalance: finalBalance,
        transactionCount: allTransactions.length,
        totalFromTransactions: allTransactions.reduce(
          (sum, tx) => sum + (tx.amount || 0),
          0
        ),
        useFallbackBalance,
        balanceSummary: balanceSummary,
      });

      // Load user's budget and manual balance
      await loadUserBudget();
      await loadManualBalance();

      // Clear any existing warnings since we successfully loaded data
      if (allTransactions.length > 0) {
        setWarning(null);
      } else {
        setWarning(
          "No transactions found. Add expenses manually or import CSV data to get started."
        );
      }
    } catch (error) {
      console.error("❌ Error loading data:", error);
      setError("Failed to load transaction data. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setFetchingData(false);
      setIsFirstLoad(false);
    }
  };

  // Refresh data function
  const refreshData = async () => {
    console.log("🔄 [HomePage] Manual refresh triggered");
    await loadData(true);
  };

  // Force refresh function for when transactions are updated
  const forceRefresh = async () => {
    console.log("🔄 [Home] Force refresh triggered - clearing all caches");

    // Clear all possible caches
    try {
      await balanceAPI.invalidateCache();
      await AsyncStorage.removeItem("transaction_cache");
      await AsyncStorage.removeItem("balance_cache");
      await AsyncStorage.removeItem("user_preferences");
      console.log("🔄 [Home] All caches cleared");
    } catch (error) {
      console.warn("⚠️ [Home] Error clearing caches:", error);
    }

    // Force reload with no cache to get latest data from database
    await loadData(true);
  };

  // Handle balance refresh (manual refresh button)
  const handleRefreshBalance = async () => {
    try {
      setBalanceRefreshing(true);
      console.log("🔄 [HomePage] Manual balance refresh triggered");

      // For now, just reload the data since backend endpoint isn't deployed yet
      await loadData(true);

      Alert.alert(
        "Balance Refreshed",
        "Balance updated successfully from transactions.",
        [{ text: "OK" }]
      );
    } catch (error: any) {
      console.error("❌ Balance refresh error:", error);
      Alert.alert(
        "Refresh Failed",
        "Failed to refresh balance. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setBalanceRefreshing(false);
    }
  };

  // Initial load
  // Clear data when user logs out or changes
  useEffect(() => {
    if (!isLoggedIn || !user) {
      // Clear all user-specific data
      setTransactions([]);
      setAccounts([]);
      setTotalBalance(0);
      setError(null);
      setWarning(null);
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    if (!isLocked && isLoggedIn) {
      loadData();
    }
  }, [isLocked, isLoggedIn]);

  // Refresh data when screen comes into focus (to catch new transactions)
  useFocusEffect(
    React.useCallback(() => {
      if (isLoggedIn && !isLocked) {
        console.log(
          "🔄 [Home] Screen focused - checking for new transactions and refreshing data"
        );
        // First check for new transactions from AsyncStorage
        checkForNewTransaction();
        // Then use force refresh to clear all caches and get latest data
        forceRefresh();
      }
    }, [isLoggedIn, isLocked])
  );

  // Check for new transactions when screen comes into focus
  const checkForNewTransaction = async () => {
    try {
      console.log("💰 [Home] Refreshing data from database...");
      // Force refresh data from database to get latest transactions and balance
      await forceRefresh();
    } catch (error) {
      console.error("💰 [Home] Error refreshing data:", error);
    }
  };

  // Helper functions for data transformations
  const getBankName = (institution: any) =>
    typeof institution === "object" && institution !== null
      ? institution.name
      : institution || "Manual Entry";

  const getBankLogo = (institution: any) =>
    typeof institution === "object" && institution !== null
      ? institution.logo
      : undefined;

  const getDisplayAccountType = (accountType: string | undefined) => {
    return accountType || "Manual Account";
  };

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Morning";
    if (hour < 17) return "Afternoon";
    return "Evening";
  };

  // Calculate spending for current month (only expenses)
  const calculateCurrentMonthSpent = () => {
    const currentMonthTransactions = transactions.filter((tx) => {
      if (!tx.date) return false;
      const txDate = dayjs(tx.date);
      const isCurrentMonth = txDate.format("YYYY-MM") === currentMonth;
      const isExpense = tx.type === "debit" || tx.amount < 0;
      return isCurrentMonth && isExpense;
    });

    const currentMonthTotal = currentMonthTransactions.reduce(
      (sum, tx) => sum + Math.abs(tx.amount),
      0
    );

    return currentMonthTotal;
  };

  const thisMonthSpent = calculateCurrentMonthSpent();

  // Fallback: If current month has no spending, show the most recent month's spending
  const getDisplaySpending = () => {
    if (thisMonthSpent > 0) {
      return thisMonthSpent;
    }

    // Find the most recent month with transactions
    const monthsWithSpending = transactions
      .filter((tx) => tx.date && (tx.type === "debit" || tx.amount < 0))
      .reduce(
        (acc, tx) => {
          const month = dayjs(tx.date).format("YYYY-MM");
          if (!acc[month]) {
            acc[month] = 0;
          }
          acc[month] += Math.abs(tx.amount);
          return acc;
        },
        {} as Record<string, number>
      );

    const sortedMonths = Object.entries(monthsWithSpending).sort(([a], [b]) =>
      b.localeCompare(a)
    );

    if (sortedMonths.length > 0) {
      const [mostRecentMonth, amount] = sortedMonths[0];
      console.log(
        `📊 [Home] No spending in current month (${currentMonth}), showing most recent month (${mostRecentMonth}): £${amount}`
      );
      return amount;
    }

    return 0;
  };

  const displaySpending = getDisplaySpending();
  const [userBudget, setUserBudget] = useState(2000); // Default budget - will be loaded from user preferences

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: colors.background.primary },
        ]}
      >
        <DashboardSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshData}
            colors={[colors.primary.main]}
            tintColor={colors.primary.main}
          />
        }
      >
        {/* Core Dashboard Section */}
        <View style={styles.section}>
          <HomeHeader />
          <BalanceCard
            totalBalance={getDisplayBalance()}
            isManualBalance={isManualBalance}
            onEditBalance={saveManualBalance}
            onClearManualBalance={clearManualBalance}
            getTimeOfDay={getTimeOfDay}
            onRefresh={handleRefreshBalance}
            isRefreshing={balanceRefreshing}
          />
          <QuickActions />
        </View>

        {/* Alerts & Action Items Section */}
        <View style={styles.section}>
          {/* Show notifications only if there are unread notifications */}
          {unreadCount > 0 && <NotificationCard />}

          {/* Upgrade Banner - Subtle reminder for premium features */}
          <UpgradeBanner
            variant="subtle"
            message="Upgrade to Premium for unlimited budgets & advanced features"
            actionLabel="Upgrade"
          />
        </View>

        {/* Spending Overview Section */}
        <View style={styles.section}>
          <CompactSpendingSummary onViewAll={() => router.push("/spending")} />
        </View>

        {/* Budget Status Section */}
        <View style={styles.section}>
          <CompactBudgetStatus onViewAll={() => router.push("/budgets")} />
        </View>

        {/* Upcoming Bills Section */}
        <View style={styles.section}>
          <UpcomingBillsCard />
        </View>

        {/* Transactions Section */}
        <View style={styles.section}>
          <TransactionsList
            transactions={transactions}
            refreshingTransactions={fetchingData}
            onRefreshTransactions={forceRefresh}
          />
        </View>
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
  section: {
    marginBottom: SPACING.md, // Compact spacing between sections
  },
});
