import React, { useEffect, useState } from "react";
import { ScrollView, RefreshControl, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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

  // Load data function
  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        setError(null);
        setWarning(null);
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
    return transactions
      .filter((tx) => {
        if (!tx.date) return false;
        const txDate = dayjs(tx.date);
        const isCurrentMonth = txDate.format("YYYY-MM") === currentMonth;
        const isExpense = tx.type === "debit" || tx.amount < 0;
        return isCurrentMonth && isExpense;
      })
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  };

  const thisMonthSpent = calculateCurrentMonthSpent();
  const userBudget = 2000; // Default budget - could be loaded from user preferences

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
            totalBalance={totalBalance}
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

          <UpcomingBillsCard />
        </View>

        {/* Financial Overview Section */}
        <View style={styles.section}>
          <MonthlyOverview
            thisMonthSpent={thisMonthSpent}
            userBudget={userBudget}
          />
        </View>

        {/* Transactions Section */}
        <View style={styles.section}>
          <TransactionsList
            transactions={transactions}
            refreshingTransactions={fetchingData}
            onRefreshTransactions={refreshData}
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
