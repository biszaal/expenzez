import React, { useEffect, useState } from "react";
import { ScrollView, RefreshControl, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
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
  MonthlyOverview,
  TransactionsList,
  UpcomingBillsCard,
  NotificationCard,
} from "../../components/home";
import { AIBriefCard } from "../../components/alerts/AIBriefCard";
import { ProactiveAlertsList } from "../../components/alerts/ProactiveAlertsList";

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
      const token = await SecureStore.getItemAsync("accessToken", {
        keychainService: "expenzez-tokens",
      });
      if (!token) {
        console.error("No access token found for manual balance");
        return;
      }

      const response = await fetch(
        "https://jvgwbst4og.execute-api.eu-west-2.amazonaws.com/profile",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (
          data.profile &&
          data.profile.manualBalance !== null &&
          data.profile.manualBalance !== undefined
        ) {
          setManualBalance(data.profile.manualBalance);
          setIsManualBalance(data.profile.isManualBalance || false);
        }
      } else {
        console.error("💰 [Home] Failed to load profile:", response.status);
      }
    } catch (error) {
      console.error("Error loading manual balance:", error);
    }
  };

  // Save manual balance to database
  const saveManualBalance = async (balance: number) => {
    try {
      const token = await SecureStore.getItemAsync("accessToken", {
        keychainService: "expenzez-tokens",
      });
      if (!token) {
        console.error("No access token found");
        return false;
      }

      const response = await fetch(
        "https://jvgwbst4og.execute-api.eu-west-2.amazonaws.com/profile",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            manualBalance: balance,
            isManualBalance: true,
          }),
        }
      );

      if (response.ok) {
        try {
          const data = await response.json();
          setManualBalance(balance);
          setIsManualBalance(true);
          return true;
        } catch (parseError) {
          console.error("💰 [Home] JSON parse error:", parseError);
          return false;
        }
      } else {
        try {
          const errorData = await response.json();
          console.error("💰 [Home] Manual balance save failed:", errorData);
          return false;
        } catch (parseError) {
          console.error(
            "💰 [Home] Error response JSON parse error:",
            parseError
          );
          return false;
        }
      }
    } catch (error) {
      console.error("Error saving manual balance:", error);
      return false;
    }
  };

  // Clear manual balance (use calculated balance)
  const clearManualBalance = async () => {
    try {
      const token = await SecureStore.getItemAsync("accessToken", {
        keychainService: "expenzez-tokens",
      });
      if (!token) {
        console.error("No access token found for clearing manual balance");
        return false;
      }

      const response = await fetch(
        "https://jvgwbst4og.execute-api.eu-west-2.amazonaws.com/profile",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isManualBalance: false,
          }),
        }
      );

      console.log(
        "💰 [Home] Clear manual balance API response:",
        response.status
      );

      if (response.ok) {
        try {
          const data = await response.json();
          console.log("💰 [Home] Manual balance cleared successfully:");
          setManualBalance(null);
          setIsManualBalance(false);
          return true;
        } catch (parseError) {
          console.error(
            "💰 [Home] Clear balance JSON parse error:",
            parseError
          );
          console.log(
            "💰 [Home] Clear balance response text:",
            await response.text()
          );
          // Still clear the local state even if JSON parsing fails
          setManualBalance(null);
          setIsManualBalance(false);
          return true;
        }
      } else {
        try {
          const errorData = await response.json();
          console.error("💰 [Home] Clear manual balance failed:", errorData);
          return false;
        } catch (parseError) {
          console.error(
            "💰 [Home] Clear balance error response JSON parse error:",
            parseError
          );
          const errorText = await response.text();
          console.error(
            "💰 [Home] Clear balance error response text:",
            errorText
          );
          return false;
        }
      }
    } catch (error) {
      console.error("Error clearing manual balance:", error);
      return false;
    }
  };

  // Update balance when transaction is added
  const updateBalanceOnTransaction = (transaction: Transaction) => {
    console.log("💰 [Home] Updating balance for new transaction:", {
      amount: transaction.amount,
      type: transaction.type,
      description: transaction.description,
    });

    // Update balance based on current mode
    if (isManualBalance && manualBalance !== null) {
      // Update manual balance
      const newManualBalance = manualBalance + transaction.amount;
      setManualBalance(newManualBalance);
      console.log("💰 [Home] Manual balance updated:", {
        oldBalance: manualBalance,
        newBalance: newManualBalance,
        transactionAmount: transaction.amount,
      });

      // Save the updated manual balance to database
      saveManualBalance(newManualBalance);
    } else {
      // Update calculated balance
      const newBalance = totalBalance + transaction.amount;
      setTotalBalance(newBalance);
      console.log("💰 [Home] Calculated balance updated:", {
        oldBalance: totalBalance,
        newBalance: newBalance,
        transactionAmount: transaction.amount,
      });
    }
  };

  // Get current display balance (manual or calculated)
  const getDisplayBalance = () => {
    return isManualBalance && manualBalance !== null
      ? manualBalance
      : totalBalance;
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
        balanceSummary = await balanceAPI.getSummary({ useCache: true });
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
          // Add timestamp to force fresh data
          _timestamp: Date.now(),
          _forceRefresh: true, // Additional flag to force server refresh
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
        finalBalance = (transactionResponse.transactions as any[]).reduce(
          (sum: number, tx: any): number => {
            const amount = parseFloat(tx.amount) || 0;
            return sum + amount;
          },
          0
        );
        console.log(
          `✅ Balance calculated client-side (fallback): ${finalBalance} from ${transactionResponse.transactions.length} transactions`
        );
      } else {
        console.log(`✅ Balance from server summary: ${finalBalance}`);
      }

      setTotalBalance(finalBalance);

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
        allTransactions = transactionsData.transactions.map((tx: any) => ({
          id: tx.id || `tx_${Date.now()}_${Math.random()}`,
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
        }));
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

    // Force reload with no cache
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
      console.log("💰 [Home] Checking AsyncStorage for new transactions...");
      const newTransactionData = await AsyncStorage.getItem("newTransaction");
      console.log(
        "💰 [Home] AsyncStorage data:",
        newTransactionData ? "Found data" : "No data"
      );

      if (newTransactionData) {
        const newTransaction = JSON.parse(newTransactionData);
        console.log(
          "💰 [Home] Found new transaction in storage:",
          newTransaction
        );

        // Add to local transactions list immediately
        setTransactions((prev) => {
          console.log(
            "💰 [Home] Adding transaction to list. Previous count:",
            prev.length
          );
          const newList = [newTransaction, ...prev];
          console.log("💰 [Home] New list count:", newList.length);
          return newList;
        });

        // Update balance immediately
        updateBalanceOnTransaction(newTransaction);

        // Clear the storage
        await AsyncStorage.removeItem("newTransaction");

        console.log(
          "💰 [Home] New transaction added to local state and storage cleared"
        );
      } else {
        console.log("💰 [Home] No new transactions found in AsyncStorage");
      }
    } catch (error) {
      console.error("💰 [Home] Error processing new transaction:", error);
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
            colors={[colors.primary[500]]}
            tintColor={colors.primary[500]}
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

        {/* Contextual Cards Section */}
        <View style={styles.section}>
          {/* Show notifications only if there are unread notifications */}
          {unreadCount > 0 && <NotificationCard />}

          {/* Premium features removed - all users have free access */}

          {/* AI Daily Brief - Phase 2B */}
          <AIBriefCard onRefresh={forceRefresh} />

          {/* Proactive Alerts - Phase 2B (show max 3 on home screen) */}
          <ProactiveAlertsList
            maxItems={3}
            showHeader={true}
            onViewAll={() => {
              // TODO: Navigate to alerts screen
              console.log("Navigate to all alerts");
            }}
          />

          <UpcomingBillsCard />
        </View>

        {/* Financial Overview Section */}
        <View style={styles.section}>
          <MonthlyOverview
            thisMonthSpent={displaySpending}
            userBudget={userBudget}
          />
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
    marginBottom: SPACING.xl, // Add larger spacing between sections
  },
});
