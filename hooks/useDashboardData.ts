import { useState, useRef, useCallback, useEffect } from "react";
import { DeviceEventEmitter } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import dayjs from "dayjs";
import { balanceAPI } from "../services/api/balanceAPI";
import {
  transactionAPI,
  Transaction,
  TRANSACTIONS_CHANGED_EVENT,
} from "../services/api/transactionAPI";
import { TransactionService } from "../services/transactionService";
import { useAuth } from "../app/auth/AuthContext";
import { APP_STRINGS } from "../constants/strings";
import { updateWidgets } from "../services/widget";

// On focus, Home goes back to the server at most this often. In between it only
// refetches after a transaction mutation (TRANSACTIONS_CHANGED_EVENT).
const FOCUS_REFRESH_INTERVAL_MS = 60_000;

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
  const isFirstLoadRef = useRef(true);

  // When the last server fetch happened, and whether a transaction was created,
  // edited or deleted since — together they decide if a focus refresh is needed.
  const lastServerFetchAtRef = useRef(0);
  const transactionsChangedRef = useRef(false);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      TRANSACTIONS_CHANGED_EVENT,
      () => {
        transactionsChangedRef.current = true;
      }
    );
    return () => subscription.remove();
  }, []);

  // Load data function. A refresh bypasses the cache; a silent refresh does so
  // in the background — no spinner, and a failure keeps what's on screen.
  const loadData = useCallback(async (
    isRefresh = false,
    { silent = false }: { silent?: boolean } = {}
  ) => {
    try {
      if (isRefresh) {
        if (!silent) setRefreshing(true);
        setError(null);
        setWarning(null);
      } else {
        setLoading(true);
        setFetchingData(true);
      }

      // Drop manual balance adjustments so the dashboard reflects server data.
      await AsyncStorage.removeItem("manual_transactions").catch(() => {});

      // Check authentication first
      const accessToken = await SecureStore.getItemAsync("accessToken", {
        keychainService: "expenzez-tokens",
      });
      if (!accessToken) {
        setWarning(APP_STRINGS.HOME.LOGIN_WARNING);
        setLoading(false);
        setFetchingData(false);
        updateWidgets({ loggedIn: false }, { force: true });
        return;
      }

      // 📱 MANUAL INPUT MODE: Load balance and recent transactions
      console.log(
        "📱 MANUAL INPUT MODE: Loading balance summary and recent transactions..."
      );

      // Balance summary and transactions are independent — fetch them in parallel.
      const balancePromise = balanceAPI
        .getSummary({
          useCache: !isRefresh,
          forceRefresh: isRefresh,
        })
        .catch(() => {
          console.warn(
            "⚠️ Balance summary endpoint not available (will deploy soon), using fallback calculation"
          );
          return null;
        });

      // Fetch transactions (always needed for display and fallback calculation)
      // Use same fetch params as All Transactions page to ensure consistency
      // Backend sorts by transactionId (UUID), not date, so we need high limit
      console.log("🔄 [Home] Fetching transactions...");
      const transactionsPromise = transactionAPI
        .getTransactions({
          limit: 1800, // Same as All Transactions page (6 months × 300)
          // Cached for instant paint on navigation; pull-to-refresh bypasses it.
          useCache: !isRefresh,
        })
        .catch((error) => {
          // A failed background refresh must not blank the dashboard.
          if (silent) throw error;
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

      const [summary, transactionResponse] = await Promise.all([
        balancePromise,
        transactionsPromise,
      ]);
      if (isRefresh) lastServerFetchAtRef.current = Date.now();

      const useFallbackBalance = summary === null;
      const balanceSummary = summary ?? {
        balance: 0,
        totalCredit: 0,
        totalDebit: 0,
        transactionCount: 0,
        firstTransactionDate: null,
        lastTransactionDate: null,
        monthsWithData: [],
      };

      console.log(
        "✅ Transactions loaded:",
        transactionResponse.transactions?.length || 0,
        "Most recent:",
        transactionResponse.transactions?.[0]?.date || "N/A",
        transactionResponse.transactions?.[0]?.description?.substring(0, 20) || "N/A"
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

      // Log sorted transactions for debugging
      if (allTransactions.length > 0) {
        console.log("📊 [Home] After sorting, first 5 transactions:",
          allTransactions.slice(0, 5).map(t => ({
            date: t.date,
            desc: t.description?.substring(0, 15)
          }))
        );
      }

      setTransactions(allTransactions);
      
      // Clear any existing warnings since we successfully loaded data
      if (allTransactions.length > 0) {
        setWarning(null);
      } else {
        setWarning(
          "No transactions found. Add expenses manually or import CSV data to get started."
        );
      }

      // Refresh home-screen widgets with the freshly loaded balance/spend.
      updateWidgets({
        loggedIn: true,
        balance: finalBalance,
        transactions: allTransactions,
      });
    } catch (error) {
      console.error("❌ Error loading data:", error);
      if (!silent) setError("Failed to load transaction data. Please try again.");
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

  // Called when Home gains focus. The first call paints from the cache; later
  // calls refresh silently from the server, and only when the data is stale or
  // a transaction changed. Resolves true when it went to the server.
  const refreshOnFocus = useCallback(async (): Promise<boolean> => {
    if (isRefreshingRef.current) return false;

    try {
      isRefreshingRef.current = true;

      if (isFirstLoadRef.current) {
        isFirstLoadRef.current = false;
        await loadData(false);
        return false;
      }

      const stale =
        Date.now() - lastServerFetchAtRef.current > FOCUS_REFRESH_INTERVAL_MS;
      if (!stale && !transactionsChangedRef.current) return false;

      transactionsChangedRef.current = false;
      await loadData(true, { silent: true });
      return true;
    } finally {
      isRefreshingRef.current = false;
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
    refreshOnFocus,
    handleRefreshBalance,
    setTransactions, // Exposed for optimistic updates if needed
    setTotalBalance,
  };
};
