import React, { useEffect, useState } from "react";
import {
  ScrollView,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from 'expo-secure-store';
import dayjs from "dayjs";
import { useTheme } from "../../contexts/ThemeContext";
import { useSecurity } from "../../contexts/SecurityContext";
import { useSubscription } from "../../contexts/SubscriptionContext";
import { useNotifications } from "../../contexts/NotificationContext";
import { useAuth } from "../auth/AuthContext";
import { PremiumUpgradeCard } from "../../components/premium/PremiumUpgradeCard";
import { budgetAPI } from "../../services/api";
import { transactionAPI } from "../../services/api/transactionAPI";
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
  const { isPremium } = useSubscription();
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

  // Security and user preferences
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [showPremiumCard, setShowPremiumCard] = useState(true);

  // Current month for calculations (no longer user-selectable)
  const currentMonth = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
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
      const accessToken = await SecureStore.getItemAsync("accessToken", { keychainService: 'expenzez-tokens' });
      if (!accessToken) {
        setWarning(APP_STRINGS.HOME.LOGIN_WARNING);
        setLoading(false);
        setFetchingData(false);
        return;
      }

      // 📱 MANUAL INPUT MODE: Load manual transactions from DynamoDB
      console.log("📱 MANUAL INPUT MODE: Loading manual expense data from DynamoDB...");

      // Load manual transactions from the transaction API (DynamoDB) for recent months
      let transactionsData;
      try {
        // Load last 6 months of transactions to ensure we show data even if current month is empty
        const startDate = dayjs().subtract(6, 'months').startOf('month').format('YYYY-MM-DD');
        const endDate = dayjs().endOf('month').format('YYYY-MM-DD');
        console.log(`🔍 Loading recent transactions (last 6 months: ${startDate} to ${endDate})...`);
        const transactionResponse = await transactionAPI.getTransactions({
          startDate,
          endDate,
          limit: 300 // ~50 per month for 6 months
        });
        transactionsData = {
          success: true,
          transactions: transactionResponse.transactions || []
        };
        console.log("✅ Loaded manual transactions from DynamoDB:", transactionResponse.transactions?.length || 0);
      } catch (error) {
        console.error("❌ Error loading manual transactions:", error);
        transactionsData = { success: false, transactions: [] };
      }

      console.log("✅ Manual mode data loaded:", { transactionsData });

      // Create empty accounts array for manual mode
      setAccounts([]);

      // 📱 MANUAL INPUT MODE: Calculate balance from transaction data
      let total = 0;

      if (transactionsData.success && transactionsData.transactions && transactionsData.transactions.length > 0) {
        // Calculate total balance by summing all transactions (positive = income, negative = expenses)
        total = transactionsData.transactions.reduce((sum: number, tx: any) => {
          const amount = parseFloat(tx.amount) || 0;
          return sum + amount;
        }, 0);

        console.log(`📱 Total balance calculated from ${transactionsData.transactions.length} transactions: ${total}`);
      } else {
        // No transactions - start at 0
        total = 0;
        console.log(`📱 No transaction data available, balance set to 0`);
      }

      setTotalBalance(total);
      console.log(`✅ Total balance set: ${total}`);

      // Handle transactions
      let allTransactions: Transaction[] = [];
      if (transactionsData.success && transactionsData.transactions && transactionsData.transactions.length > 0) {
        console.log("[Home] Sample transaction data:", transactionsData.transactions.slice(0, 2));
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
        setWarning("No transactions found. Add expenses manually or import CSV data to get started.");
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
      .filter(tx => {
        if (!tx.date) return false;
        const txDate = dayjs(tx.date);
        const isCurrentMonth = txDate.format("YYYY-MM") === currentMonth;
        const isExpense = tx.type === 'debit' || tx.amount < 0;
        return isCurrentMonth && isExpense;
      })
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  };

  const thisMonthSpent = calculateCurrentMonthSpent();
  const userBudget = 2000; // Default budget - could be loaded from user preferences

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <DashboardSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
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
          />
          <QuickActions />
        </View>

        {/* Contextual Cards Section */}
        <View style={styles.section}>
          {/* Show notifications only if there are unread notifications */}
          {unreadCount > 0 && <NotificationCard />}

          {/* Show premium upgrade occasionally, not always */}
          {!isPremium && showPremiumCard && <PremiumUpgradeCard />}

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