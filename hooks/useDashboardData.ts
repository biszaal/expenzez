import { useState, useRef, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import dayjs from "dayjs";
import { balanceAPI } from "../services/api/balanceAPI";
import { transactionAPI, Transaction } from "../services/api/transactionAPI";
import { TransactionService } from "../services/transactionService";
import { useAuth } from "../app/auth/AuthContext";
import { APP_STRINGS } from "../constants/strings";

interface Account {
  id: string;
  name: string;
  institution: string | { name: string; logo?: string };
  balance: number;
  currency: string;
  type: string;
}

export const useDashboardData = () => {
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
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // Prevent infinite loop - track if refresh is in progress
  const isRefreshingRef = useRef(false);

  // Load data function
  const loadData = useCallback(async (isRefresh = false) => {
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
          limit: 50, // Reduced from 1000 for better performance
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

      // Set calculated balance
      setTotalBalance(finalBalance);
      console.log(`✅ Balance updated: ${finalBalance}`);

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
        const dateA = new Date(a.date || 0).getTime();
        const dateB = new Date(b.date || 0).getTime();
        return dateB - dateA;
      });

      setTransactions(allTransactions);
      
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
  }, []);

  // Refresh data function
  const refreshData = async () => {
    console.log("🔄 [HomePage] Manual refresh triggered");
    await loadData(true);
  };

  // Force refresh function for when transactions are updated
  const forceRefresh = useCallback(async () => {
    // Prevent concurrent refreshes
    if (isRefreshingRef.current) {
      console.log("🔄 [Home] Refresh already in progress, skipping...");
      return;
    }

    try {
      isRefreshingRef.current = true;
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
    } finally {
      // Reset the flag after a delay to prevent rapid re-triggers
      setTimeout(() => {
        isRefreshingRef.current = false;
      }, 1000);
    }
  }, [loadData]);

  // Handle balance refresh (manual refresh button)
  const handleRefreshBalance = async () => {
    try {
      setBalanceRefreshing(true);
      console.log("🔄 [HomePage] Manual balance refresh triggered");

      // For now, just reload the data since backend endpoint isn't deployed yet
      await loadData(true);
      return true;
    } catch (error: any) {
      console.error("❌ Balance refresh error:", error);
      return false;
    } finally {
      setBalanceRefreshing(false);
    }
  };

  // Initial load effect
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

  return {
    transactions,
    accounts,
    totalBalance,
    loading,
    refreshing,
    fetchingData,
    error,
    warning,
    balanceRefreshing,
    isFirstLoad,
    loadData,
    refreshData,
    forceRefresh,
    handleRefreshBalance,
    setTransactions, // Exposed for optimistic updates if needed
    setTotalBalance,
  };
};
