import React, { useEffect, useState } from "react";
import {
  ScrollView,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { bankingAPI, budgetAPI } from "../../services/api";
import { SPACING } from "../../constants/Colors";
import { APP_STRINGS } from "../../constants/strings";
import { TabLoadingScreen } from "../../components/ui";
import { 
  saveBalanceToCache, 
  loadBalanceFromCache, 
  shouldUseCachedBalance,
  formatCacheAge,
  clearBalanceCache,
  CachedBalanceData 
} from "../../utils/balanceCache";
import {
  HomeHeader,
  BalanceCard,
  QuickActions,
  MonthlyOverview,
  TransactionsList,
  AIAssistantCard,
  ConnectedBanks
} from "../../components/home";

interface Account {
  id: string;
  name: string;
  institution: string | { name: string; logo?: string };
  balance: number;
  currency: string;
  type: string;
}

interface BankAccount {
  accountId: string;
  bankName: string;
  bankLogo?: string;
  accountType: string;
  accountNumber: string;
  sortCode?: string;
  balance: number;
  currency: string;
  connectedAt: number;
  lastSyncAt: number;
  isActive: boolean;
  status: 'connected' | 'expired' | 'disconnected';
  isExpired: boolean;
  errorMessage?: string;
  lastErrorAt?: number;
}

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  description: string;
  date: string;
  category?: string;
}

// Helper function for dynamic greeting
const getTimeOfDay = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return APP_STRINGS.GREETING_MORNING;
  if (hour < 17) return APP_STRINGS.GREETING_AFTERNOON;
  return APP_STRINGS.GREETING_EVENING;
};

// Helper function to display proper account types
const getDisplayAccountType = (accountType: string | undefined): string => {
  if (!accountType) return 'Current Account';
  
  const type = accountType.toLowerCase();
  
  // Map various account type formats to display names
  if (type.includes('credit') || type.includes('card')) {
    return 'Credit Card';
  } else if (type.includes('saving') || type.includes('saver')) {
    return 'Savings Account';
  } else if (type.includes('current') || type.includes('checking') || type.includes('transaction')) {
    return 'Current Account';
  } else if (type.includes('business') || type.includes('commercial')) {
    return 'Business Account';
  } else if (type.includes('joint')) {
    return 'Joint Account';
  } else if (type.includes('isa') || type.includes('individual savings')) {
    return 'ISA Account';
  } else {
    // Capitalize first letter of each word for unknown types
    return accountType.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }
};

// Helper function to format update timestamp for display
const formatUpdateTimestamp = (timestamp: string | null): string => {
  if (!timestamp) return 'Never updated';
  
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 1) {
      return 'Just updated';
    } else if (diffMinutes < 60) {
      return `Updated ${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `Updated ${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `Updated ${diffDays}d ago`;
    } else {
      return `Updated ${date.toLocaleDateString()}`;
    }
  } catch (error) {
    return 'Update time unknown';
  }
};

export default function HomePage() {
  const { colors } = useTheme();
  
  const styles = createStyles(colors);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [connectedBanks, setConnectedBanks] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [thisMonthSpent, setThisMonthSpent] = useState(0);
  const [userBudget, setUserBudget] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshingTransactions, setRefreshingTransactions] = useState(false);
  const [refreshingBanks, setRefreshingBanks] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [hasExpiredBanks, setHasExpiredBanks] = useState(false);
  const [usingCachedBalance, setUsingCachedBalance] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [cachedBalanceData, setCachedBalanceData] = useState<CachedBalanceData | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      setWarning(null);

      console.log("=== STARTING DATA FETCH ===");

      // Check authentication first
      const accessToken = await AsyncStorage.getItem("accessToken");
      if (!accessToken) {
        setWarning(APP_STRINGS.HOME.LOGIN_WARNING);
        setLoading(false);
        return;
      }

      // Test if there are any transactions in the database
      // Removed testTransactions call as it does not exist

      // 🚀 PERFORMANCE: Fetch connected banks, accounts and transactions in parallel
      console.log("🚀 PERFORMANCE: Fetching connected banks, accounts and transactions in parallel...");
      
      const [connectedBanksData, transactionsData] = await Promise.all([
        bankingAPI.getAccountsUnified().catch(err => {
          console.error("❌ Error fetching connected banks:", err);
          // Try fallback to cached data
          return bankingAPI.getCachedBankData().catch(fallbackErr => {
            console.error("❌ Error fetching cached bank data:", fallbackErr);
            return { banks: [] };
          });
        }),
        bankingAPI.getAllTransactions(100).catch(err => {
          console.error("❌ Error fetching transactions:", err);
          return { transactions: [] };
        })
      ]);
      
      console.log("✅ Parallel fetch completed:", { connectedBanksData, transactionsData });

      // Handle connected banks
      const banks = (connectedBanksData as any).banks || (connectedBanksData as any).connections || (connectedBanksData as any).data?.accounts || [];
      console.log("🏦 Connected banks data:", banks);
      
      // Transform banks to BankAccount format if needed
      const transformedBanks = banks.map((bank: any) => ({
        accountId: bank.accountId,
        bankName: bank.bankName,
        bankLogo: bank.bankLogo,
        accountType: bank.accountType,
        accountNumber: bank.accountNumber,
        sortCode: bank.sortCode,
        balance: bank.balance || 0,
        currency: bank.currency || 'GBP',
        connectedAt: bank.connectedAt,
        lastSyncAt: bank.lastSyncAt,
        isActive: bank.isActive,
        status: bank.status || (bank.isExpired ? 'expired' : 'connected'),
        isExpired: bank.isExpired || bank.status === 'expired',
        errorMessage: bank.errorMessage,
        lastErrorAt: bank.lastErrorAt,
      }));
      
      setConnectedBanks(transformedBanks);
      
      // Check if any banks are expired
      const expiredBanks = transformedBanks.filter(bank => bank.isExpired);
      setHasExpiredBanks(expiredBanks.length > 0);
      console.log(`🔍 Found ${expiredBanks.length} expired banks out of ${transformedBanks.length} total`);

      // Convert connected banks to accounts format for compatibility
      const accounts = transformedBanks.map((bank: BankAccount) => ({
        id: bank.accountId,
        name: bank.bankName,
        institution: { name: bank.bankName, logo: bank.bankLogo },
        balance: bank.balance || 0,
        currency: bank.currency || 'GBP',
        type: bank.accountType || 'TRANSACTION',
      }));
      setAccounts(accounts);
      
      // Calculate total balance with caching support
      let total = 0;
      let useCached = false;
      
      if (transformedBanks.length > 0) {
        // Check if we should use cached balance (all banks expired)
        const shouldUseCache = shouldUseCachedBalance(transformedBanks);
        
        if (shouldUseCache) {
          console.log('🔄 All banks expired, checking for cached balance...');
          const cachedData = await loadBalanceFromCache();
          
          if (cachedData) {
            total = cachedData.totalBalance;
            setCachedBalanceData(cachedData);
            setUsingCachedBalance(true);
            useCached = true;
            console.log(`💾 Using cached balance: ${total} (cached ${formatCacheAge(cachedData.cachedAt)})`);
          } else {
            // No cached data, calculate from expired banks (will show 0 or last known balance)
            total = transformedBanks.reduce((sum: number, bank: BankAccount) => {
              return sum + (bank.balance || 0);
            }, 0);
            console.log(`⚠️ No cached balance available, using current: ${total}`);
          }
        } else {
          // Normal calculation for active banks
          total = transformedBanks.reduce((sum: number, bank: BankAccount) => {
            return sum + (bank.balance || 0);
          }, 0);
          
          // Save to cache for future use
          const bankBalances = transformedBanks.map(bank => ({
            accountId: bank.accountId,
            bankName: bank.bankName,
            balance: bank.balance || 0,
            currency: bank.currency || 'GBP',
            lastSyncAt: bank.lastSyncAt || Date.now(),
          }));
          
          await saveBalanceToCache(total, bankBalances);
          setUsingCachedBalance(false);
          setCachedBalanceData(null);
          console.log(`✅ Fresh balance calculated and cached: ${total}`);
        }
      } else {
        // Fallback to accounts data
        total = accounts.reduce((sum: number, account: Account) => {
          return sum + (account.balance || 0);
        }, 0);
        setUsingCachedBalance(false);
        setCachedBalanceData(null);
      }
      
      setTotalBalance(total);
      console.log(`✅ Total balance: ${total} (cached: ${useCached})`);

      // Handle transactions
      let allTransactions: Transaction[] = [];
      if (transactionsData.transactions && transactionsData.transactions.length > 0) {
        console.log("[Home] Sample transaction data:", transactionsData.transactions.slice(0, 2));
        allTransactions = transactionsData.transactions.map((tx: any) => ({
          id: tx.transactionId || tx.id,
          // Apply correct sign based on transaction type
          amount: tx.type === 'debit' ? -(Math.abs(parseFloat(tx.amount) || 0)) : Math.abs(parseFloat(tx.amount) || 0),
          currency: tx.currency || APP_STRINGS.COMMON.GBP,
          description: tx.description || tx.merchant || APP_STRINGS.COMMON.TRANSACTION,
          date: tx.date || tx.timestamp || new Date().toISOString(),
          category: tx.category || APP_STRINGS.COMMON.OTHER,
        }));
        
        // Sort by date (most recent first)
        allTransactions.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        
        console.log(`✅ PERFORMANCE: Loaded ${allTransactions.length} transactions efficiently`);
      } else {
        console.log("📭 No transactions found in database");
      }
      
      setTransactions(allTransactions);
      
      // Check if user needs to connect banks
      if (transformedBanks.length === 0 && accounts.length === 0) {
        console.log("⚠️ No banks or accounts found - user needs to connect banks");
        setWarning("No bank accounts connected. Please connect your bank account to see your financial data.");
      } else if (hasExpiredBanks) {
        console.log("⚠️ Some banks have expired - user should reconnect");
        setWarning("Some bank connections have expired. Please reconnect to sync fresh data.");
      }

      // Calculate this month's spending
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();

      const thisMonthTransactions = allTransactions.filter((transaction) => {
        const transactionDate = new Date(transaction.date);
        return (
          transactionDate.getMonth() === thisMonth &&
          transactionDate.getFullYear() === thisYear &&
          transaction.amount < 0
        );
      });

      const spent = thisMonthTransactions.reduce((sum, transaction) => {
        return sum + Math.abs(transaction.amount);
      }, 0);
      setThisMonthSpent(spent);
      console.log("This month spent:", spent);

      // Fetch budget preferences from database
      try {
        const budgetPreferences = await budgetAPI.getBudgetPreferences();
        setUserBudget(budgetPreferences.monthlyBudget);
        console.log("✅ Budget preferences loaded:", budgetPreferences.monthlyBudget);
      } catch (budgetError) {
        console.error("❌ Error fetching budget preferences:", budgetError);
        // Keep the current value if fetch fails
      }

      console.log("=== DATA FETCH COMPLETE ===");
    } catch (error: any) {
      console.error("Error fetching data:", error);

      // Handle different types of errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        setWarning("Please log in to view your financial data");
      } else if (
        error.code === "ECONNABORTED" ||
        error.message?.includes("timeout")
      ) {
        setWarning(
          "Connection timeout. Please check your internet connection and try again."
        );
      } else if (error.response?.status === 429) {
        setWarning("Rate limit exceeded. Please try again later.");
      } else {
        setWarning("Unable to load financial data. Please try refreshing.");
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const onRefreshTransactions = async () => {
    try {
      setRefreshingTransactions(true);
      setError(null);
      console.log("[HomePage] Manual transaction refresh triggered");
      
      // Call the refresh API endpoint
      const response = await bankingAPI.refreshTransactions();
      console.log("[HomePage] Refresh response:", response);
      
      // Show success message briefly
      if (response.stats) {
        const { totalTransactionsSynced, successfulAccounts } = response.stats;
        console.log(`[HomePage] Synced ${totalTransactionsSynced} transactions from ${successfulAccounts} accounts`);
      }
      
      // Refresh the page data to show new transactions
      await fetchData();
      
    } catch (error: any) {
      console.error("[HomePage] Transaction refresh failed:", error);
      setError(error.response?.data?.message || "Failed to refresh transactions. Please try again.");
    } finally {
      setRefreshingTransactions(false);
    }
  };

  const handleRefreshBanks = async () => {
    setRefreshingBanks(true);
    setError(null);
    setWarning(null);
    
    try {
      console.log("🔄 [HomePage] Starting fresh bank data sync via backend...");
      
      // Step 1: Trigger backend refresh that calls Nordigen/GoCardless and saves to DynamoDB
      console.log("🔄 [HomePage] Calling backend refresh API...");
      const refreshResponse = await bankingAPI.refreshTransactions();
      console.log("✅ [HomePage] Backend refresh successful:", refreshResponse);
      
      // Step 2: Check connection status to detect expired tokens
      try {
        console.log("🔄 [HomePage] Checking bank connection status...");
        const statusResponse = await bankingAPI.checkBankConnectionStatus();
        console.log("✅ [HomePage] Connection status:", statusResponse);
        
        if ((statusResponse as any).expiredConnections && (statusResponse as any).expiredConnections.length > 0) {
          const expiredBankNames = (statusResponse as any).expiredConnections.map((conn: any) => conn.bankName).join(', ');
          setWarning(`Bank connections expired: ${expiredBankNames}. Please reconnect to continue syncing.`);
          setHasExpiredBanks(true);
        } else {
          setHasExpiredBanks(false);
        }
      } catch (statusError) {
        console.log("⚠️ [HomePage] Connection status check failed:", statusError);
        // Don't fail the whole refresh if status check fails
      }
      
      // Step 3: Refresh our local UI with the fresh data from DynamoDB
      console.log("🔄 [HomePage] Refreshing local UI with fresh data...");
      await fetchData();
      
      // Step 4: Set timestamp to indicate successful refresh
      setLastUpdated(new Date().toISOString());
      
      // Check if refresh succeeded or if all tokens are expired
      if (refreshResponse.stats) {
        const { totalTransactionsSynced, successfulAccounts, failedAccounts } = refreshResponse.stats;
        
        if (successfulAccounts === 0 && failedAccounts > 0) {
          // All accounts failed - likely due to expired tokens
          console.log("⚠️ [HomePage] All bank connections failed - tokens likely expired");
          setWarning("All bank connections have expired. Please reconnect your banks to get fresh transaction data.");
          setHasExpiredBanks(true);
        } else if (successfulAccounts > 0) {
          console.log(`✅ [HomePage] Successfully synced ${totalTransactionsSynced} transactions from ${successfulAccounts} accounts via Nordigen/GoCardless`);
          
          if (failedAccounts > 0) {
            setWarning(`Some bank connections have expired (${failedAccounts} failed, ${successfulAccounts} successful). Consider reconnecting failed banks.`);
            setHasExpiredBanks(true);
          } else {
            setHasExpiredBanks(false);
          }
        }
      }
      
      console.log("✅ [HomePage] Bank refresh completed!");
      
    } catch (error: any) {
      console.error("❌ [HomePage] Bank refresh failed:", error);
      
      if (error.response?.status === 401 || error.message?.includes('expired') || error.message?.includes('token')) {
        setError("Bank connections have expired. Please reconnect your banks to get fresh data from Nordigen/GoCardless.");
        setHasExpiredBanks(true);
      } else if (error.response?.status === 429) {
        setError("Rate limit reached. Please try again in a few minutes.");
      } else if (error.response?.status === 404) {
        console.log("ℹ️ [HomePage] Refresh API not available - trying fallback...");
        try {
          // Fallback: just refresh local data
          await fetchData();
          setLastUpdated(new Date().toISOString());
          console.log("✅ [HomePage] Refreshed with available data");
        } catch (fetchError) {
          setError("Unable to refresh data. Please check your connection.");
        }
      } else {
        setError("Unable to refresh bank data. Please try again later.");
      }
    } finally {
      setRefreshingBanks(false);
    }
  };

  useEffect(() => {
    // Check if a bank was just connected and trigger refresh
    const checkBankConnected = async () => {
      const bankConnected = await AsyncStorage.getItem("bankConnected");
      if (bankConnected === APP_STRINGS.COMMON.TRUE) {
        console.log("[HomePage] Bank was just connected, refreshing data...");
        await fetchData();
        await AsyncStorage.removeItem("bankConnected");
      } else {
        fetchData();
      }
    };
    checkBankConnected();
  }, []);

  const percentUsed = userBudget ? (thisMonthSpent / userBudget) * 100 : 0;
  const recentTransactions = transactions.slice(0, 5);


  if (loading) {
    return <TabLoadingScreen message="Loading your financial overview..." />;
  }

  // Helper to get bank name and logo
  const getBankName = (institution: any) =>
    typeof institution === "object" && institution !== null
      ? institution.name
      : institution;
  const getBankLogo = (institution: any) =>
    typeof institution === "object" && institution !== null
      ? institution.logo
      : undefined;

  return (
    <SafeAreaView style={styles.container}>
      <HomeHeader />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: SPACING.xxl }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <BalanceCard 
          totalBalance={totalBalance}
          usingCachedBalance={usingCachedBalance}
          cachedBalanceData={cachedBalanceData}
          getTimeOfDay={getTimeOfDay}
        />

        <QuickActions />

        <MonthlyOverview 
          thisMonthSpent={thisMonthSpent}
          userBudget={userBudget}
        />

        <TransactionsList 
          transactions={transactions}
          refreshingTransactions={refreshingTransactions}
          onRefreshTransactions={onRefreshTransactions}
        />

        <AIAssistantCard />

        <ConnectedBanks 
          connectedBanks={connectedBanks}
          accounts={accounts}
          totalBalance={totalBalance}
          error={error}
          warning={warning}
          hasExpiredBanks={hasExpiredBanks}
          setError={setError}
          getDisplayAccountType={getDisplayAccountType}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
});
