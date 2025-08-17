import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useNotifications } from "../../contexts/NotificationContext";
import { bankingAPI } from "../../services/api";
import { useDataFetcher, useBatchDataFetcher } from "../../hooks/useDataFetcher";
import { DataTransformers } from "../../utils/dataTransformers";
import { SPACING, SHADOWS } from "../../constants/Colors";
import { APP_STRINGS } from "../../constants/strings";
import { DEEP_LINK_URLS } from "../../constants/config";
import BankLogo from "../../components/ui/BankLogo";
import { Card } from "../../components/ui";
import { 
  saveBalanceToCache, 
  loadBalanceFromCache, 
  shouldUseCachedBalance,
  formatCacheAge,
  clearBalanceCache,
  CachedBalanceData 
} from "../../utils/balanceCache";

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
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { unreadCount } = useNotifications();
  
  // Use theme colors directly - no hardcoded fallbacks
  const safeColors = colors;
  
  const styles = createStyles(safeColors);
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
        bankingAPI.getConnectedBanks().catch(err => {
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
      const banks = connectedBanksData.banks || connectedBanksData.connections || [];
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
        allTransactions = transactionsData.transactions.map((tx: any) => ({
          id: tx.id || tx.transactionId,
          amount: parseFloat(tx.amount) || 0,
          currency: tx.currency || APP_STRINGS.COMMON.GBP,
          description: tx.description || APP_STRINGS.COMMON.TRANSACTION,
          date: tx.date || new Date().toISOString(),
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
      
      // Step 1: Trigger backend refresh that calls TrueLayer and saves to DynamoDB
      console.log("🔄 [HomePage] Calling backend refresh API...");
      const refreshResponse = await bankingAPI.refreshTransactions();
      console.log("✅ [HomePage] Backend refresh successful:", refreshResponse);
      
      // Step 2: Check connection status to detect expired tokens
      try {
        console.log("🔄 [HomePage] Checking bank connection status...");
        const statusResponse = await bankingAPI.checkBankConnectionStatus();
        console.log("✅ [HomePage] Connection status:", statusResponse);
        
        if (statusResponse.expiredConnections && statusResponse.expiredConnections.length > 0) {
          const expiredBankNames = statusResponse.expiredConnections.map(conn => conn.bankName).join(', ');
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
          console.log(`✅ [HomePage] Successfully synced ${totalTransactionsSynced} transactions from ${successfulAccounts} accounts via TrueLayer`);
          
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
        setError("Bank connections have expired. Please reconnect your banks to get fresh data from TrueLayer.");
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
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={safeColors.primary[500]} />
          <Text style={styles.loadingText}>
            {APP_STRINGS.HOME.LOADING_FINANCIAL}
          </Text>
          <Text style={styles.loadingSubtext}>{APP_STRINGS.HOME.LOADING_SUBTEXT}</Text>
        </View>
      </SafeAreaView>
    );
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
      {/* Professional Header */}
      <View style={styles.professionalHeader}>
        <View style={styles.professionalHeaderContent}>
          <View style={styles.professionalBrandSection}>
            <Text style={[styles.professionalHeaderTitle, { color: safeColors.text.primary }]}>
              {APP_STRINGS.APP_NAME}
            </Text>
            <View style={[styles.professionalBrandDot, { backgroundColor: safeColors.primary[500] }]} />
          </View>
          <View style={styles.professionalHeaderRight}>
            <TouchableOpacity
              style={[styles.professionalNotificationButton, { backgroundColor: safeColors.background.primary }]}
              onPress={() => router.push("/notifications")}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={22} color={safeColors.primary[500]} />
              {unreadCount > 0 && (
                <View style={[styles.professionalNotificationBadge, { backgroundColor: '#EF4444' }]}>
                  <Text style={styles.professionalNotificationBadgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount.toString()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: SPACING.xxl }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Professional Balance Card */}
        <View style={styles.professionalBalanceWrapper}>
          <LinearGradient
            colors={['#6366F1', '#8B5CF6', '#A855F7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.professionalBalanceCard, SHADOWS.xl]}
          >
            <View style={styles.professionalBalanceHeader}>
              <View>
                <Text style={styles.professionalGreeting}>
                  {user?.name ? `Hello, ${user.name.split(" ")[0]}` : `Good ${getTimeOfDay().toLowerCase()}`}
                </Text>
                <Text style={styles.professionalBalanceLabel}>
                  Total Balance
                </Text>
              </View>
              <View style={styles.professionalBalanceIcon}>
                <Ionicons name="wallet-outline" size={26} color="white" />
              </View>
            </View>
            
            <View style={styles.professionalBalanceMain}>
              <Text style={styles.professionalBalanceAmount}>
                £{totalBalance.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <View style={styles.professionalBalanceMetrics}>
                <View style={styles.professionalBalanceChange}>
                  <View style={styles.professionalChangeIndicator}>
                    <Ionicons name="trending-up" size={14} color="#10B981" />
                    <Text style={styles.professionalChangeText}>+2.4%</Text>
                  </View>
                  <Text style={styles.professionalChangeLabel}>vs last month</Text>
                </View>
              </View>
            </View>
            
            {usingCachedBalance && cachedBalanceData && (
              <View style={styles.professionalCachedBadge}>
                <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.professionalCachedText}>
                  Cached {formatCacheAge(cachedBalanceData.cachedAt)}
                </Text>
              </View>
            )}
            
            {/* Professional Decorative Elements */}
            <View style={styles.professionalDecoration1} />
            <View style={styles.professionalDecoration2} />
            <View style={styles.professionalDecoration3} />
          </LinearGradient>
        </View>

        {/* Professional Quick Actions */}
        <View style={styles.professionalQuickActionsWrapper}>
          <View style={styles.professionalQuickActionsGrid}>
            <TouchableOpacity
              style={styles.professionalQuickActionCard}
              onPress={() => router.push("/ai-assistant")}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#8B5CF6', '#A855F7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.professionalQuickActionGradient, SHADOWS.lg]}
              >
                <View style={styles.professionalQuickActionIconContainer}>
                  <View style={styles.professionalQuickActionIcon}>
                    <Ionicons name="sparkles" size={24} color="white" />
                  </View>
                </View>
                <View style={styles.professionalQuickActionText}>
                  <Text style={styles.professionalQuickActionTitle}>AI Insights</Text>
                  <Text style={styles.professionalQuickActionSubtitle}>Smart analysis</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.professionalQuickActionCard}
              onPress={() => router.push("/banks")}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#3B82F6', '#2563EB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.professionalQuickActionGradient, SHADOWS.lg]}
              >
                <View style={styles.professionalQuickActionIconContainer}>
                  <View style={styles.professionalQuickActionIcon}>
                    <Ionicons name="card-outline" size={24} color="white" />
                  </View>
                </View>
                <View style={styles.professionalQuickActionText}>
                  <Text style={styles.professionalQuickActionTitle}>My Banks</Text>
                  <Text style={styles.professionalQuickActionSubtitle}>Manage accounts</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.professionalQuickActionCard}
              onPress={() => router.push("/spending")}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.professionalQuickActionGradient, SHADOWS.lg]}
              >
                <View style={styles.professionalQuickActionIconContainer}>
                  <View style={styles.professionalQuickActionIcon}>
                    <Ionicons name="analytics-outline" size={24} color="white" />
                  </View>
                </View>
                <View style={styles.professionalQuickActionText}>
                  <Text style={styles.professionalQuickActionTitle}>Analytics</Text>
                  <Text style={styles.professionalQuickActionSubtitle}>Track spending</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.professionalQuickActionCard}
              onPress={async () => {
                try {
                  const response = await bankingAPI.connectBank();
                  if (response.link) {
                    await WebBrowser.openAuthSessionAsync(
                      response.link,
                      DEEP_LINK_URLS.BANK_CALLBACK
                    );
                  } else {
                    alert("Failed to get bank authentication link");
                  }
                } catch (error) {
                  alert("Failed to start bank connection. Please try again.");
                }
              }}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.professionalQuickActionGradient, SHADOWS.lg]}
              >
                <View style={styles.professionalQuickActionIconContainer}>
                  <View style={styles.professionalQuickActionIcon}>
                    <Ionicons name="add-circle-outline" size={24} color="white" />
                  </View>
                </View>
                <View style={styles.professionalQuickActionText}>
                  <Text style={styles.professionalQuickActionTitle}>Connect</Text>
                  <Text style={styles.professionalQuickActionSubtitle}>Add bank</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Professional Monthly Overview */}
        <View style={styles.professionalMonthlyWrapper}>
          <View style={[styles.professionalMonthlyCard, { backgroundColor: safeColors.background.primary }, SHADOWS.lg]}>
            <View style={styles.professionalMonthlyHeader}>
              <View style={styles.professionalMonthlyHeaderLeft}>
                <View style={[styles.professionalMonthlyIcon, { backgroundColor: safeColors.primary[500] }]}>
                  <Ionicons name="calendar-outline" size={22} color="white" />
                </View>
                <View style={styles.professionalMonthlyHeaderText}>
                  <Text style={[styles.professionalMonthlyTitle, { color: safeColors.text.primary }]}>
                    This Month
                  </Text>
                  <Text style={[styles.professionalMonthlySubtitle, { color: safeColors.text.secondary }]}>
                    Spending overview
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.professionalViewAllButton, { backgroundColor: safeColors.primary[100] }]}
                onPress={() => router.push("/spending")}
                activeOpacity={0.7}
              >
                <Text style={[styles.professionalViewAllText, { color: safeColors.primary[500] }]}>
                  View All
                </Text>
                <Ionicons name="arrow-forward" size={16} color={safeColors.primary[500]} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.professionalMonthlyStats}>
              <View style={styles.professionalMonthlyStat}>
                <View style={styles.professionalMonthlyStatHeader}>
                  <Text style={[styles.professionalMonthlyStatLabel, { color: safeColors.text.secondary }]}>
                    Spent
                  </Text>
                  <View style={styles.professionalStatBadgeNegative}>
                    <Ionicons name="trending-down" size={12} color="#EF4444" />
                    <Text style={styles.professionalStatBadgeNegativeText}>24%</Text>
                  </View>
                </View>
                <Text style={[styles.professionalMonthlyStatValue, { color: safeColors.text.primary }]}>
                  £{thisMonthSpent.toFixed(2)}
                </Text>
                <View style={[styles.professionalMonthlyStatProgress, { backgroundColor: safeColors.background.secondary }]}>
                  <View style={[styles.professionalMonthlyStatProgressFill, { 
                    backgroundColor: '#EF4444',
                    width: userBudget ? `${Math.min(100, (thisMonthSpent / userBudget) * 100)}%` : '25%'
                  }]} />
                </View>
              </View>
              
              <View style={styles.professionalMonthlyStatDivider} />
              
              <View style={styles.professionalMonthlyStat}>
                <View style={styles.professionalMonthlyStatHeader}>
                  <Text style={[styles.professionalMonthlyStatLabel, { color: safeColors.text.secondary }]}>
                    Budget
                  </Text>
                  <View style={styles.professionalStatBadgePositive}>
                    <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                    <Text style={styles.professionalStatBadgePositiveText}>On track</Text>
                  </View>
                </View>
                <Text style={[styles.professionalMonthlyStatValue, { color: safeColors.text.primary }]}>
                  £{(userBudget || 2000).toFixed(2)}
                </Text>
                <View style={[styles.professionalMonthlyStatProgress, { backgroundColor: safeColors.background.secondary }]}>
                  <View style={[styles.professionalMonthlyStatProgressFill, { 
                    backgroundColor: '#10B981',
                    width: '75%'
                  }]} />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Premium Recent Transactions Card */}
        <View style={styles.premiumTransactionsWrapper}>
          <LinearGradient
            colors={[safeColors.background.primary, safeColors.background.secondary]}
            style={[styles.premiumTransactionsCard, SHADOWS.lg]}
          >
            <View style={styles.premiumTransactionsHeader}>
              <View style={styles.premiumTransactionsHeaderLeft}>
                <View style={[styles.premiumTransactionsIcon, { backgroundColor: safeColors.primary[500] }]}>
                  <Ionicons name="receipt" size={20} color="white" />
                </View>
                <View style={styles.premiumTransactionsHeaderText}>
                  <Text style={[styles.premiumTransactionsTitle, { color: safeColors.text.primary }]}>
                    {APP_STRINGS.TRANSACTIONS.RECENT_TRANSACTIONS}
                  </Text>
                  <Text style={[styles.premiumTransactionsSubtitle, { color: safeColors.text.secondary }]}>
                    Latest activity
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.premiumTransactionsRefresh, { backgroundColor: safeColors.primary[500] }]}
                onPress={onRefreshTransactions}
                disabled={refreshingTransactions}
              >
                {refreshingTransactions ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons name="refresh" size={16} color="white" />
                )}
              </TouchableOpacity>
            </View>
            
            <View style={styles.premiumTransactionsList}>
              {transactions.slice(0, 4).map((tx, idx) => (
                <View key={tx.id} style={[
                  styles.premiumTransactionItem,
                  idx < 3 && { borderBottomWidth: 1, borderBottomColor: safeColors.background.secondary }
                ]}>
                  <View style={[styles.premiumTransactionIcon, { 
                    backgroundColor: tx.amount >= 0 ? safeColors.success[100] : safeColors.error[100] 
                  }]}>
                    <Ionicons
                      name={tx.amount >= 0 ? "arrow-up-circle" : "arrow-down-circle"}
                      size={24}
                      color={tx.amount >= 0 ? safeColors.success[600] : safeColors.error[600]}
                    />
                  </View>
                  <View style={styles.premiumTransactionContent}>
                    <Text style={[styles.premiumTransactionTitle, { color: safeColors.text.primary }]} numberOfLines={1}>
                      {tx.description}
                    </Text>
                    <Text style={[styles.premiumTransactionDate, { color: safeColors.text.secondary }]}>
                      {new Date(tx.date).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.premiumTransactionAmountContainer}>
                    <Text style={[styles.premiumTransactionAmount, {
                      color: tx.amount >= 0 ? safeColors.success[600] : safeColors.error[600]
                    }]}>
                      {tx.amount >= 0 ? "+" : ""}£{tx.amount.toFixed(2)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
            
            {transactions.length === 0 && (
              <View style={styles.premiumEmptyState}>
                <View style={[styles.premiumEmptyIcon, { backgroundColor: safeColors.background.secondary }]}>
                  <Ionicons name="receipt-outline" size={32} color={safeColors.text.tertiary} />
                </View>
                <Text style={[styles.premiumEmptyTitle, { color: safeColors.text.primary }]}>
                  No transactions yet
                </Text>
                <Text style={[styles.premiumEmptySubtitle, { color: safeColors.text.secondary }]}>
                  Connect a bank to see your transactions
                </Text>
              </View>
            )}
            
            <TouchableOpacity
              style={[styles.premiumViewAllTransactions, { backgroundColor: safeColors.primary[500] }]}
              onPress={() => router.push("/transactions")}
            >
              <Text style={styles.premiumViewAllTransactionsText}>View All Transactions</Text>
              <Ionicons name="arrow-forward" size={16} color="white" />
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Premium AI Assistant Card */}
        <View style={styles.premiumAIWrapper}>
          <LinearGradient
            colors={['#8B5CF6', '#A855F7', '#C084FC']}
            style={[styles.premiumAICard, SHADOWS.xl]}
          >
            <View style={styles.premiumAIContent}>
              <View style={styles.premiumAILeft}>
                <View style={styles.premiumAIIconContainer}>
                  <Ionicons name="sparkles" size={32} color="white" />
                  <View style={styles.premiumAIGlow} />
                </View>
                <View style={styles.premiumAIText}>
                  <Text style={styles.premiumAITitle}>AI Financial Assistant</Text>
                  <Text style={styles.premiumAISubtitle}>Get personalized insights about your spending</Text>
                  <View style={styles.premiumAIFeatures}>
                    <View style={styles.premiumAIFeature}>
                      <Ionicons name="checkmark-circle" size={14} color="rgba(255,255,255,0.8)" />
                      <Text style={styles.premiumAIFeatureText}>Smart Analysis</Text>
                    </View>
                    <View style={styles.premiumAIFeature}>
                      <Ionicons name="checkmark-circle" size={14} color="rgba(255,255,255,0.8)" />
                      <Text style={styles.premiumAIFeatureText}>Budget Tips</Text>
                    </View>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={styles.premiumAIButton}
                onPress={() => router.push("/ai-assistant")}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                  style={styles.premiumAIButtonGradient}
                >
                  <Text style={styles.premiumAIButtonText}>Ask AI</Text>
                  <Ionicons name="arrow-forward" size={16} color="white" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
            
            {/* Decorative Elements */}
            <View style={styles.premiumAIDecoration1} />
            <View style={styles.premiumAIDecoration2} />
            <View style={styles.premiumAIDecoration3} />
          </LinearGradient>
        </View>

        {/* Simple Connected Banks Card */}
        <Card style={[styles.monthlyCard, { backgroundColor: safeColors.background.primary }] as any}>
          <View style={styles.monthlyHeader}>
            <View>
              <Text style={[styles.monthlyTitle, { color: safeColors.text.primary }]}>
                {APP_STRINGS.BANKS.CONNECTED_BANKS}
              </Text>
              <Text style={[styles.bankCount, { color: safeColors.text.secondary }]}>
                {connectedBanks.length} {connectedBanks.length === 1 ? "bank" : "banks"} connected
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/banks")}>
              <Text style={[styles.viewAllLink, { color: safeColors.primary[500] }]}>
                View All
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Error banner for bank refresh failures */}
          {error && (
            <View style={{
              backgroundColor: '#FFF0F0',
              borderLeftColor: '#FF6B6B',
              borderLeftWidth: 4,
              padding: 12,
              borderRadius: 8,
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center'
            }}>
              <Ionicons name="close-circle" size={20} color="#FF6B6B" />
              <Text style={{ color: '#D32F2F', fontSize: 13, marginLeft: 8, flex: 1 }}>
                {error}
              </Text>
              <TouchableOpacity onPress={() => setError(null)}>
                <Text style={{ color: '#FF6B6B', fontWeight: '600', fontSize: 12 }}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Warning banner for expired banks */}
          {hasExpiredBanks && !error && (
            <View style={{
              backgroundColor: '#FFF4E6',
              borderLeftColor: '#FF8C00',
              borderLeftWidth: 4,
              padding: 12,
              borderRadius: 8,
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center'
            }}>
              <Ionicons name="warning" size={20} color="#FF8C00" />
              <Text style={{ color: '#B8860B', fontSize: 13, marginLeft: 8, flex: 1 }}>
                {warning || "Some banks need reconnection to sync fresh data"}
              </Text>
              <TouchableOpacity onPress={() => router.push("/banks")}>
                <Text style={{ color: '#FF8C00', fontWeight: '600', fontSize: 12 }}>Fix</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Horizontal ScrollView for Bank Cards - Sample Design Style */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: SPACING.sm }}
            style={{ marginHorizontal: -SPACING.lg }}
          >
            {connectedBanks.length === 0 && accounts.length === 0 && (
              <View style={{ width: "100%", alignItems: "center", paddingVertical: SPACING.lg }}>
                <Ionicons name="link-outline" size={48} color={safeColors.text.tertiary} />
                <Text style={{ 
                  color: safeColors.text.secondary, 
                  fontSize: 16, 
                  textAlign: "center",
                  marginTop: 12,
                  marginBottom: 8
                }}>
                  {APP_STRINGS.BANKS.NO_BANKS_CONNECTED}
                </Text>
                <Text style={{ 
                  color: safeColors.text.tertiary, 
                  fontSize: 13, 
                  textAlign: "center",
                  marginBottom: SPACING.md
                }}>
                  {APP_STRINGS.BANKS.CONNECT_TO_GET_STARTED}
                </Text>
                <TouchableOpacity
                  style={{
                    backgroundColor: safeColors.primary[500],
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderRadius: 12,
                    flexDirection: "row",
                    alignItems: "center"
                  }}
                  onPress={async () => {
                    try {
                      const response = await bankingAPI.connectBank();
                      if (response.link) {
                        await WebBrowser.openAuthSessionAsync(
                          response.link,
                          DEEP_LINK_URLS.BANK_CALLBACK
                        );
                      } else {
                        alert("Failed to get bank authentication link");
                      }
                    } catch (error) {
                      alert("Failed to start bank connection. Please try again.");
                    }
                  }}
                >
                  <Ionicons name="add-circle-outline" size={20} color={safeColors.text.inverse} />
                  <Text style={{ 
                    color: safeColors.text.inverse, 
                    fontWeight: "600",
                    marginLeft: 8
                  }}>
                    {APP_STRINGS.QUICK_ACTIONS.CONNECT_BANK}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            
            {/* Sample Design - Large Circular Bank Cards */}
            {connectedBanks.map((bank) => (
              <TouchableOpacity
                key={bank.accountId}
                style={{
                  alignItems: "center",
                  marginHorizontal: SPACING.md,
                  paddingVertical: SPACING.md,
                }}
                onPress={() => router.push("/banks")}
              >
                {/* Large Circular Bank Logo - Matching Sample */}
                <View style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: safeColors.background.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: SPACING.md,
                  ...SHADOWS.md,
                  borderWidth: bank.isExpired ? 3 : 0,
                  borderColor: bank.isExpired ? '#FF6B6B' : 'transparent',
                }}>
                  <BankLogo
                    bankName={bank.bankName}
                    logoUrl={bank.bankLogo}
                    size="large"
                  />
                  
                  {/* Status indicator - top right corner */}
                  <View style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: bank.isExpired ? '#FF6B6B' : '#4CAF50',
                    borderWidth: 3,
                    borderColor: safeColors.background.secondary
                  }} />
                </View>
                
                {/* Bold Balance Amount - Primary Focus */}
                <Text
                  style={{
                    fontWeight: "800",
                    color: bank.isExpired ? '#FF6B6B' : safeColors.text.primary,
                    fontSize: 24,
                    textAlign: 'center',
                    marginBottom: 4,
                    letterSpacing: -0.5,
                  }}
                >
                  £{bank.balance.toFixed(2)}
                </Text>
                
                {/* Account Type Label - Show specific account type */}
                <Text
                  style={{
                    fontWeight: "500",
                    color: safeColors.text.secondary,
                    fontSize: 14,
                    textAlign: 'center',
                    opacity: 0.8,
                  }}
                >
                  {getDisplayAccountType(bank.accountType)}
                </Text>
                
                {bank.isExpired && (
                  <Text style={{ 
                    color: '#FF6B6B', 
                    fontSize: 12, 
                    fontWeight: '700',
                    marginTop: 4,
                    textAlign: 'center',
                  }}>
                    Connection Expired
                  </Text>
                )}
              </TouchableOpacity>
            ))}
            
            {/* Fallback to legacy accounts - Sample Design Style */}
            {connectedBanks.length === 0 && accounts.map((account) => (
              <TouchableOpacity
                key={account.id}
                style={{
                  alignItems: "center",
                  marginHorizontal: SPACING.md,
                  paddingVertical: SPACING.md,
                }}
                onPress={() => router.push("/banks")}
              >
                {/* Large Circular Bank Logo - Matching Sample */}
                <View style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: safeColors.background.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: SPACING.md,
                  ...SHADOWS.md,
                }}>
                  <BankLogo
                    bankName={getBankName(account.institution)}
                    logoUrl={getBankLogo(account.institution)}
                    size="large"
                  />
                </View>
                
                {/* Bold Balance Amount - Primary Focus */}
                <Text
                  style={{
                    fontWeight: "800",
                    color: safeColors.text.primary,
                    fontSize: 24,
                    textAlign: 'center',
                    marginBottom: 4,
                    letterSpacing: -0.5,
                  }}
                >
                  £{account.balance.toFixed(2)}
                </Text>
                
                {/* Account Type Label - Show specific account type */}
                <Text
                  style={{
                    fontWeight: "500",
                    color: safeColors.text.secondary,
                    fontSize: 14,
                    textAlign: 'center',
                    opacity: 0.8,
                  }}
                >
                  {getDisplayAccountType(account.type)}
                </Text>
              </TouchableOpacity>
            ))}
            
            {/* Total Net Worth Card - Matching Sample Design */}
            {(connectedBanks.length > 0 || accounts.length > 0) && (
              <TouchableOpacity
                style={{
                  alignItems: "center",
                  marginHorizontal: SPACING.md,
                  paddingVertical: SPACING.md,
                }}
                onPress={() => router.push("/account")}
              >
                {/* Circular Net Worth Icon */}
                <View style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: safeColors.background.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: SPACING.md,
                  ...SHADOWS.md,
                }}>
                  <Ionicons 
                    name="trending-up" 
                    size={36} 
                    color={safeColors.primary[500]} 
                  />
                </View>
                
                {/* Total Net Worth Amount */}
                <Text
                  style={{
                    fontWeight: "800",
                    color: safeColors.text.primary,
                    fontSize: 24,
                    textAlign: 'center',
                    marginBottom: 4,
                    letterSpacing: -0.5,
                  }}
                >
                  £{totalBalance.toFixed(2)}
                </Text>
                
                {/* Net Worth Label */}
                <Text
                  style={{
                    fontWeight: "500",
                    color: safeColors.text.secondary,
                    fontSize: 14,
                    textAlign: 'center',
                    opacity: 0.8,
                  }}
                >
                  Total Net
                </Text>
                
                <Text
                  style={{
                    fontWeight: "500",
                    color: safeColors.text.secondary,
                    fontSize: 14,
                    textAlign: 'center',
                    opacity: 0.8,
                  }}
                >
                  Worth
                </Text>
              </TouchableOpacity>
            )}
            
            {/* Add Account Button - Matching Sample Design */}
            {(connectedBanks.length > 0 || accounts.length > 0) && (
              <TouchableOpacity
                style={{
                  alignItems: "center",
                  marginHorizontal: SPACING.md,
                  paddingVertical: SPACING.md,
                }}
                onPress={async () => {
                  try {
                    const response = await bankingAPI.connectBank();
                    if (response.link) {
                      await WebBrowser.openAuthSessionAsync(
                        response.link,
                        DEEP_LINK_URLS.BANK_CALLBACK
                      );
                    } else {
                      alert("Failed to get bank authentication link");
                    }
                  } catch (error) {
                    alert("Failed to start bank connection. Please try again.");
                  }
                }}
              >
                {/* Large Circular Plus Icon */}
                <View style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: safeColors.background.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: SPACING.md,
                  borderWidth: 2,
                  borderColor: safeColors.primary[500],
                  borderStyle: 'dashed',
                }}>
                  <Ionicons 
                    name="add" 
                    size={36} 
                    color={safeColors.primary[500]} 
                  />
                </View>
                
                {/* Add Account Text */}
                <Text
                  style={{
                    fontWeight: "600",
                    color: safeColors.primary[500],
                    fontSize: 16,
                    textAlign: 'center',
                    marginBottom: 4,
                  }}
                >
                  Add an
                </Text>
                
                <Text
                  style={{
                    fontWeight: "500",
                    color: safeColors.primary[500],
                    fontSize: 14,
                    textAlign: 'center',
                    opacity: 0.8,
                  }}
                >
                  account
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl, // Add some padding at the bottom for the last section
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 16,
    color: colors.text.secondary,
  },
  loadingSubtext: {
    marginTop: SPACING.sm,
    fontSize: 14,
    color: colors.text.tertiary,
  },
  // Clean Header Styles
  cleanHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: colors.background.secondary,
  },
  cleanTitle: {
    fontSize: 24,
    fontWeight: "700",
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    ...SHADOWS.sm,
  },
  notificationBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationBadgeText: {
    color: colors.text.inverse,
    fontSize: 10,
    fontWeight: "600",
    lineHeight: 16,
  },
  originalHeaderTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  // Simple Balance Card Styles
  balanceWrapper: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  balanceCard: {
    borderRadius: 24,
    padding: 24,
    ...SHADOWS.sm,
  },
  greeting: {
    fontSize: 14,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 4,
  },
  balanceLabel: {
    fontSize: 14,
  },
  cachedIndicator: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  cachedText: {
    fontSize: 11,
  },
  // Clean Quick Actions Styles
  quickActionsWrapper: {
    flexDirection: "row",
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  quickActionItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 16,
    ...SHADOWS.sm,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 8,
  },
  // Simple Monthly Card Styles
  monthlyCard: {
    borderRadius: 20,
    padding: 20,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  } as any,
  monthlyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  monthlyTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  viewAllLink: {
    fontSize: 14,
    fontWeight: "600",
  },
  monthlyStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statColumn: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  // Transaction Row Styles
  transactionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "700",
  },
  // Empty State Styles
  emptyState: {
    alignItems: "center",
    paddingVertical: 16,
  },
  emptyText: {
    fontSize: 14,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
  },
  // AI Assistant Styles
  aiAssistantRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  aiAssistantIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  aiAssistantTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  aiAssistantSubtitle: {
    fontSize: 12,
  },
  // Bank Count Style
  bankCount: {
    fontSize: 12,
    marginTop: 2,
  },
  // Premium Header Styles
  premiumHeader: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  premiumHeaderContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  premiumBrandSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  premiumHeaderTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginRight: 8,
  },
  premiumBrandAccent: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  premiumHeaderRight: {
    alignItems: "flex-end",
  },
  premiumHeaderSubtitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  premiumHeaderButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    ...SHADOWS.sm,
  },
  // Premium Balance Styles
  premiumBalanceWrapper: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  premiumBalanceCard: {
    borderRadius: 28,
    padding: SPACING.xl,
    position: "relative",
    overflow: "hidden",
  },
  premiumBalanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.lg,
  },
  premiumBalanceHeaderLeft: {},
  premiumGreeting: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 4,
  },
  premiumBalanceSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
  },
  premiumBalanceIconContainer: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 12,
    borderRadius: 16,
  },
  premiumBalanceAmountSection: {
    marginBottom: SPACING.md,
  },
  premiumBalanceAmount: {
    fontSize: 36,
    fontWeight: "800",
    color: "white",
    marginBottom: 8,
  },
  premiumBalanceChange: {
    flexDirection: "row",
    alignItems: "center",
  },
  premiumBalanceChangeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16,185,129,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  premiumBalanceChangeText: {
    color: "#10B981",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  premiumBalanceChangeLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
  },
  premiumCachedIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  premiumCachedText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    marginLeft: 4,
  },
  premiumDecorationCircle1: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.05)",
    top: -40,
    right: -40,
  },
  premiumDecorationCircle2: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.08)",
    bottom: -20,
    left: -20,
  },
  // Premium Quick Actions
  premiumQuickActionsWrapper: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  premiumQuickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: SPACING.md,
  },
  premiumQuickActionCard: {
    width: "47%",
  },
  premiumQuickActionGradient: {
    borderRadius: 20,
    padding: SPACING.lg,
    alignItems: "center",
    minHeight: 120,
  },
  premiumQuickActionIcon: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  premiumQuickActionTitle: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  premiumQuickActionSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
  },
  // Premium Monthly Overview
  premiumMonthlyWrapper: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  premiumMonthlyCard: {
    borderRadius: 24,
    padding: SPACING.xl,
  },
  premiumMonthlyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.lg,
  },
  premiumMonthlyHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  premiumMonthlyIcon: {
    padding: 12,
    borderRadius: 16,
    marginRight: SPACING.md,
  },
  premiumMonthlyHeaderText: {},
  premiumMonthlyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
  },
  premiumMonthlySubtitle: {
    fontSize: 13,
  },
  premiumViewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  premiumViewAllText: {
    fontSize: 13,
    fontWeight: "600",
  },
  premiumMonthlyStats: {
    flexDirection: "row",
  },
  premiumMonthlyStat: {
    flex: 1,
  },
  premiumMonthlyStatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  premiumMonthlyStatLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  premiumMonthlyStatBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  premiumMonthlyStatBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  premiumMonthlyStatValue: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
  },
  premiumMonthlyStatProgress: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  premiumMonthlyStatProgressFill: {
    height: 6,
    borderRadius: 3,
  },
  premiumMonthlyStatDivider: {
    width: 1,
    backgroundColor: "rgba(0,0,0,0.1)",
    marginHorizontal: SPACING.lg,
  },
  balanceCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: "700",
    color: colors.text.inverse,
    marginBottom: SPACING.xs,
  },
  balanceChangeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  balanceChangeBadge: {
    backgroundColor: colors.success[100],
    borderRadius: 10,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    marginRight: SPACING.xs,
  },
  balanceChangeText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.success[500],
  },
  balanceChangeLabel: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  addBankCardWrapper: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  addBankCard: {
    backgroundColor: colors.background.primary,
    borderRadius: SPACING.lg,
    padding: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  addBankCardContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  addBankCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  addBankIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.background.tertiary,
    justifyContent: "center",
    alignItems: "center",
  },
  addBankTextContainer: {
    marginLeft: SPACING.sm,
  },
  addBankTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
  },
  addBankSubtitle: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  addBankButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  addBankButtonText: {
    fontSize: 14,
    color: colors.primary[500],
    fontWeight: "500",
    marginRight: SPACING.xs,
  },
  sectionWrapper: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text.primary,
  },
  sectionLink: {
    fontSize: 14,
    color: colors.primary[500],
  },
  quickActionsRow: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: colors.background.primary,
    borderRadius: SPACING.lg,
    padding: SPACING.lg,
    alignItems: "center",
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.background.tertiary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  quickActionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
    textAlign: "center",
    marginBottom: SPACING.xs,
  },
  overviewCard: {
    backgroundColor: colors.background.primary,
    borderRadius: SPACING.lg,
    padding: SPACING.xl,
  },
  overviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  overviewLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  overviewValue: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text.primary,
  },
  progressBarWrapper: {
    marginTop: SPACING.md,
  },
  progressBarRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.xs,
  },
  progressBarLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.background.tertiary,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  transactionsList: {
    backgroundColor: colors.background.primary,
    borderRadius: SPACING.lg,
    padding: SPACING.md,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.secondary,
  },
  transactionIconSmall: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.background.tertiary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.sm,
  },
  transactionInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  transactionTitleSmall: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: "500",
  },
  transactionSubtitle: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: SPACING.xs,
  },
  transactionAmountPositive: {
    fontSize: 16,
    fontWeight: "600",
  },
  transactionAmountNegative: {
    fontSize: 16,
    fontWeight: "600",
  },
  warningContainer: {
    backgroundColor: colors.warning.light || colors.warning[100],
    padding: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderRadius: SPACING.md,
    borderWidth: 1,
    borderColor: colors.warning.main || colors.warning[500],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  warningContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  warningText: {
    fontSize: 14,
    color: colors.warning.dark || colors.warning[700],
    marginLeft: SPACING.sm,
    flex: 1,
  },
  warningDismiss: {
    padding: SPACING.xs,
  },
  errorContainer: {
    backgroundColor: colors.error.light || colors.error[100],
    padding: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderRadius: SPACING.md,
  },
  errorText: {
    fontSize: 14,
    color: colors.error[500],
    textAlign: "center",
  },
  banksScrollView: {
    paddingVertical: SPACING.md,
  },
  bankCard: {
    width: 120,
    height: 100,
    borderRadius: SPACING.lg,
    padding: SPACING.md,
    marginRight: SPACING.md,
    backgroundColor: colors.background.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.background.secondary,
  },
  bankCardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.primary,
    marginTop: SPACING.sm,
    textAlign: "center",
  },
  bankCardSubtitle: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: SPACING.xs,
    textAlign: "center",
  },
  bankCardBalance: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text.primary,
    marginTop: SPACING.sm,
  },
  emptyTextSecondary: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: "center",
    marginTop: SPACING.md,
  },
  emptySubtextSecondary: {
    fontSize: 14,
    color: colors.text.tertiary,
    marginTop: SPACING.xs,
    textAlign: "center",
  },
  emptyTransactionsContainer: {
    alignItems: "center",
    paddingVertical: SPACING.lg,
  },
  aiAssistantCard: {
    backgroundColor: colors.background.primary,
    borderRadius: SPACING.lg,
    padding: SPACING.lg,
    marginTop: SPACING.md,
  },
  aiAssistantGradient: {
    borderRadius: SPACING.lg,
    padding: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  aiAssistantContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  aiAssistantLeft: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  aiAssistantIconSecondary: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.background.tertiary,
    justifyContent: "center",
    alignItems: "center",
  },
  aiAssistantText: {
    marginLeft: SPACING.sm,
  },
  aiAssistantTitleSecondary: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
  },
  aiAssistantSubtitleSecondary: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  aiAssistantButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingTransactionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.md,
  },
  loadingTransactionsText: {
    marginLeft: SPACING.sm,
    fontSize: 14,
    color: colors.text.secondary,
  },
  refreshTransactionsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: colors.background.primary,
    borderRadius: SPACING.md,
    borderWidth: 1,
    borderColor: colors.primary[500],
  },
  refreshTransactionsText: {
    marginLeft: SPACING.xs,
    fontSize: 14,
    color: colors.primary[500],
    fontWeight: "500",
  },
  connectBankButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary[500],
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: SPACING.md,
    marginTop: SPACING.md,
  },
  connectBankText: {
    fontSize: 14,
    color: "white",
    fontWeight: "600",
    marginLeft: SPACING.xs,
  },
  demoBanner: {
    padding: 12,
    margin: SPACING.md,
    borderRadius: 12,
    borderLeftWidth: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  demoBannerText: {
    marginLeft: 8,
    fontSize: 13,
    flex: 1,
  },
  // Premium Transactions Card Styles
  premiumTransactionsWrapper: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  premiumTransactionsCard: {
    borderRadius: 24,
    padding: SPACING.xl,
  },
  premiumTransactionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.lg,
  },
  premiumTransactionsHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  premiumTransactionsIcon: {
    padding: 12,
    borderRadius: 16,
    marginRight: SPACING.md,
  },
  premiumTransactionsHeaderText: {},
  premiumTransactionsTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
  },
  premiumTransactionsSubtitle: {
    fontSize: 13,
  },
  premiumTransactionsRefresh: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  premiumTransactionsList: {
    marginBottom: SPACING.lg,
  },
  premiumTransactionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm,
  },
  premiumTransactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: SPACING.md,
    alignItems: "center",
    justifyContent: "center",
  },
  premiumTransactionContent: {
    flex: 1,
  },
  premiumTransactionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  premiumTransactionDate: {
    fontSize: 12,
  },
  premiumTransactionAmountContainer: {
    alignItems: "flex-end",
  },
  premiumTransactionAmount: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  premiumTransactionCategory: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  premiumTransactionCategoryText: {
    fontSize: 10,
    fontWeight: "600",
  },
  premiumEmptyState: {
    alignItems: "center",
    paddingVertical: SPACING.xl,
  },
  premiumEmptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },
  premiumEmptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  premiumEmptySubtitle: {
    fontSize: 13,
    textAlign: "center",
  },
  premiumViewAllTransactions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.md,
    borderRadius: 16,
    gap: 8,
  },
  premiumViewAllTransactionsText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  // Premium AI Assistant Styles
  premiumAIWrapper: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  premiumAICard: {
    borderRadius: 28,
    padding: SPACING.xl,
    position: "relative",
    overflow: "hidden",
  },
  premiumAIContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  premiumAILeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  premiumAIIconContainer: {
    position: "relative",
    marginRight: SPACING.md,
  },
  premiumAIGlow: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.1)",
    top: -16,
    left: -16,
  },
  premiumAIText: {
    flex: 1,
  },
  premiumAITitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
    marginBottom: 4,
  },
  premiumAISubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    marginBottom: SPACING.sm,
  },
  premiumAIFeatures: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  premiumAIFeature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  premiumAIFeatureText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  premiumAIButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  premiumAIButtonGradient: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  premiumAIButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  premiumAIDecoration1: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.05)",
    top: -30,
    right: -30,
  },
  premiumAIDecoration2: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.08)",
    bottom: -20,
    left: -20,
  },
  premiumAIDecoration3: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.03)",
    top: 50,
    right: 60,
  },
  // Professional Header Styles
  professionalHeader: {
    backgroundColor: colors.background.secondary,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  professionalHeaderContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  professionalBrandSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  professionalHeaderTitle: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.8,
    marginRight: 8,
  },
  professionalBrandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  professionalHeaderRight: {
    alignItems: "flex-end",
  },
  professionalHeaderSubtitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 12,
    textTransform: "capitalize",
  },
  professionalNotificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    ...SHADOWS.md,
  },
  professionalNotificationBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.background.secondary,
  },
  professionalNotificationBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 14,
  },
  // Professional Balance Card Styles
  professionalBalanceWrapper: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  professionalBalanceCard: {
    borderRadius: 32,
    padding: 28,
    position: "relative",
    overflow: "hidden",
  },
  professionalBalanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.lg,
  },
  professionalGreeting: {
    fontSize: 18,
    color: "rgba(255,255,255,0.95)",
    marginBottom: 6,
    fontWeight: "500",
  },
  professionalBalanceLabel: {
    fontSize: 15,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  professionalBalanceIcon: {
    backgroundColor: "rgba(255,255,255,0.15)",
    padding: 14,
    borderRadius: 20,
  },
  professionalBalanceMain: {
    marginBottom: SPACING.md,
  },
  professionalBalanceAmount: {
    fontSize: 42,
    fontWeight: "800",
    color: "white",
    marginBottom: 12,
    letterSpacing: -1,
  },
  professionalBalanceMetrics: {
    flexDirection: "row",
    alignItems: "center",
  },
  professionalBalanceChange: {
    flexDirection: "row",
    alignItems: "center",
  },
  professionalChangeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16,185,129,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 12,
  },
  professionalChangeText: {
    color: "#10B981",
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 4,
  },
  professionalChangeLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    fontWeight: "500",
  },
  professionalCachedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  professionalCachedText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginLeft: 6,
    fontWeight: "500",
  },
  professionalDecoration1: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.03)",
    top: -50,
    right: -50,
  },
  professionalDecoration2: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: -30,
    left: -30,
  },
  professionalDecoration3: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.02)",
    top: 80,
    right: 80,
  },
  // Professional Quick Actions Styles
  professionalQuickActionsWrapper: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  professionalQuickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: SPACING.md,
  },
  professionalQuickActionCard: {
    width: "47%",
  },
  professionalQuickActionGradient: {
    borderRadius: 24,
    padding: 20,
    minHeight: 140,
    justifyContent: "space-between",
  },
  professionalQuickActionIconContainer: {
    alignItems: "flex-start",
    marginBottom: 16,
  },
  professionalQuickActionIcon: {
    backgroundColor: "rgba(255,255,255,0.15)",
    padding: 14,
    borderRadius: 18,
  },
  professionalQuickActionText: {
    alignItems: "flex-start",
  },
  professionalQuickActionTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  professionalQuickActionSubtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "500",
  },
  // Professional Monthly Overview Styles
  professionalMonthlyWrapper: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  professionalMonthlyCard: {
    borderRadius: 24,
    padding: 24,
  },
  professionalMonthlyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  professionalMonthlyHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  professionalMonthlyIcon: {
    padding: 14,
    borderRadius: 18,
    marginRight: 16,
  },
  professionalMonthlyHeaderText: {},
  professionalMonthlyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  professionalMonthlySubtitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  professionalViewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    gap: 6,
  },
  professionalViewAllText: {
    fontSize: 14,
    fontWeight: "600",
  },
  professionalMonthlyStats: {
    flexDirection: "row",
    gap: 20,
  },
  professionalMonthlyStat: {
    flex: 1,
  },
  professionalMonthlyStatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  professionalMonthlyStatLabel: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  professionalStatBadgePositive: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  professionalStatBadgePositiveText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#16A34A",
    textTransform: "uppercase",
  },
  professionalStatBadgeNegative: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  professionalStatBadgeNegativeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#EF4444",
    textTransform: "uppercase",
  },
  professionalMonthlyStatValue: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  professionalMonthlyStatProgress: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  professionalMonthlyStatProgressFill: {
    height: 8,
    borderRadius: 4,
  },
  professionalMonthlyStatDivider: {
    width: 1,
    backgroundColor: "rgba(0,0,0,0.06)",
    marginHorizontal: 4,
  },
  // Professional Pie Chart Budget Styles
  professionalBudgetContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },
  professionalPieChartContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  professionalDonutChart: {
    width: 140,
    height: 140,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  professionalDonutRing: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 16,
  },
  professionalDonutBackground: {
    borderColor: colors.background.secondary,
  },
  professionalDonutForeground: {
    borderColor: "transparent",
  },
  professionalDonutCenter: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.sm,
  },
  professionalDonutCenterPercentage: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.6,
    lineHeight: 28,
  },
  professionalDonutCenterLabel: {
    fontSize: 10,
    fontWeight: "700",
    marginTop: 1,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    opacity: 0.6,
  },
  professionalDonutCenterAmount: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  professionalBudgetStats: {
    flex: 1,
    gap: 16,
  },
  professionalBudgetStat: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  professionalBudgetStatHeader: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  professionalBudgetStatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  professionalBudgetStatLabel: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  professionalBudgetStatValue: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
});
