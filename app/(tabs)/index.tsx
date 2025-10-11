import React, { useEffect, useState } from "react";
import {
  ScrollView,
  RefreshControl,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from 'expo-secure-store';
import dayjs from "dayjs";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from "../../contexts/ThemeContext";
import { useSecurity } from "../../contexts/SecurityContext";
import { useSubscription } from "../../contexts/SubscriptionContext";
import { useNotifications } from "../../contexts/NotificationContext";
import { useAuth } from "../auth/AuthContext";
import { useRouter } from "expo-router";
import { PremiumUpgradeCard } from "../../components/premium/PremiumUpgradeCard";
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
import { EnhancedBalanceCard } from "../../components/home/EnhancedBalanceCard";
import { EnhancedQuickActions } from "../../components/home/EnhancedQuickActions";
import { EnhancedFinancialOverview } from "../../components/home/EnhancedFinancialOverview";

const { width } = Dimensions.get('window');

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
  const router = useRouter();

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

      // 📱 MANUAL INPUT MODE: Load balance and recent transactions
      console.log("📱 MANUAL INPUT MODE: Loading balance summary and recent transactions...");

      // Try to fetch balance summary first
      let balanceSummary;
      let useFallbackBalance = false;

      try {
        balanceSummary = await balanceAPI.getSummary({ useCache: true });
        console.log("✅ Balance summary loaded from API:", balanceSummary);
      } catch (error: any) {
        console.warn("⚠️ Balance summary endpoint not available (will deploy soon), using fallback calculation");
        useFallbackBalance = true;
        balanceSummary = { balance: 0, totalCredit: 0, totalDebit: 0, transactionCount: 0, firstTransactionDate: null, lastTransactionDate: null, monthsWithData: [] };
      }

      // Fetch transactions (always needed for display and fallback calculation)
      const transactionResponse = await transactionAPI.getTransactions({
        startDate: dayjs().subtract(6, 'months').startOf('month').format('YYYY-MM-DD'),
        endDate: dayjs().endOf('month').format('YYYY-MM-DD'),
        limit: 1000, // Load more for fallback balance calculation
        useCache: true
      }).catch((error) => {
        console.error("❌ Error loading transactions:", error);
        return { transactions: [], summary: { totalAmount: 0, creditTotal: 0, debitTotal: 0, count: 0 } };
      });

      console.log("✅ Transactions loaded:", transactionResponse.transactions?.length || 0);

      // Create empty accounts array for manual mode
      setAccounts([]);

      // Calculate balance
      let finalBalance = balanceSummary.balance;

      if (useFallbackBalance && transactionResponse.transactions && transactionResponse.transactions.length > 0) {
        // Fallback: Calculate balance client-side from all loaded transactions
        finalBalance = (transactionResponse.transactions as any[]).reduce((sum: number, tx: any): number => {
          const amount = parseFloat(tx.amount) || 0;
          return sum + amount;
        }, 0);
        console.log(`✅ Balance calculated client-side (fallback): ${finalBalance} from ${transactionResponse.transactions.length} transactions`);
      } else {
        console.log(`✅ Balance from server summary: ${finalBalance}`);
      }

      setTotalBalance(finalBalance);

      const transactionsData = {
        success: true,
        transactions: transactionResponse.transactions || []
      };

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
        {/* Enhanced Header Section */}
        <View style={styles.enhancedHeaderSection}>
          <HomeHeader />
          
          {/* Welcome Message with Time-based Greeting */}
          <View style={styles.welcomeSection}>
            <Text style={[styles.welcomeText, { color: colors.text.primary }]}>
              {user?.name ? `Welcome back, ${user.name.split(" ")[0]}!` : `Good ${getTimeOfDay().toLowerCase()}`}
            </Text>
            <Text style={[styles.welcomeSubtext, { color: colors.text.secondary }]}>
              Here's your financial overview
            </Text>
          </View>
        </View>

        {/* Enhanced Balance Card */}
        <EnhancedBalanceCard
            totalBalance={totalBalance}
            getTimeOfDay={getTimeOfDay}
            onRefresh={handleRefreshBalance}
            isRefreshing={balanceRefreshing}
          />

        {/* Enhanced Quick Actions */}
        <EnhancedQuickActions />

        {/* Enhanced Financial Overview */}
        <EnhancedFinancialOverview
          thisMonthSpent={thisMonthSpent}
          userBudget={userBudget}
        />

        {/* Enhanced Transactions Section */}
        <View style={styles.enhancedTransactionsSection}>
          <View style={styles.transactionsHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Recent Transactions</Text>
            <TouchableOpacity 
              style={[styles.viewAllButton, { backgroundColor: colors.primary[500] }]}
              onPress={() => router.push("/transactions")}
            >
              <Text style={styles.viewAllButtonText}>View All</Text>
              <Ionicons name="arrow-forward" size={16} color="white" />
            </TouchableOpacity>
          </View>
          
          <View style={[styles.transactionsCard, { backgroundColor: colors.background.secondary }]}>
            {transactions.slice(0, 5).map((tx, idx) => (
              <View key={tx.id} style={[
                styles.transactionItem,
                idx < 4 && { borderBottomWidth: 1, borderBottomColor: colors.background.primary }
              ]}>
                <View style={[styles.transactionIcon, { 
                  backgroundColor: tx.amount >= 0 ? colors.success[100] : colors.error[100] 
                }]}>
                  <Ionicons
                    name={tx.amount >= 0 ? "arrow-up-circle" : "arrow-down-circle"}
                    size={24}
                    color={tx.amount >= 0 ? colors.success[600] : colors.error[600]}
                  />
                </View>
                <View style={styles.transactionContent}>
                  <Text style={[styles.transactionTitle, { color: colors.text.primary }]} numberOfLines={1}>
                    {tx.description}
                  </Text>
                  <Text style={[styles.transactionDate, { color: colors.text.secondary }]}>
                    {new Date(tx.date).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={[styles.transactionAmount, {
                  color: tx.amount >= 0 ? colors.success[600] : colors.error[600]
                }]}>
                  £{Math.abs(tx.amount).toFixed(2)}
                </Text>
              </View>
            ))}
            
            {transactions.length === 0 && (
              <View style={styles.emptyState}>
                <View style={[styles.emptyIcon, { backgroundColor: colors.background.primary }]}>
                  <Ionicons name="receipt-outline" size={32} color={colors.text.tertiary} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
                  No transactions yet
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.text.secondary }]}>
                  Add your first expense to get started
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Contextual Cards Section */}
        <View style={styles.contextualSection}>
          {unreadCount > 0 && <NotificationCard />}
          {!isPremium && showPremiumCard && <PremiumUpgradeCard />}
          <UpcomingBillsCard />
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
    marginBottom: SPACING.xl,
  },
  
  // Enhanced Header Section
  enhancedHeaderSection: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  welcomeSection: {
    marginTop: 16,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  welcomeSubtext: {
    fontSize: 16,
    fontWeight: '400',
  },
  
  // Enhanced Balance Section
  enhancedBalanceSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  balanceGradientCard: {
    borderRadius: 20,
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  balanceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  balanceCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  balanceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  balanceCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  balanceCardSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  balanceCardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  balanceActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceAmountContainer: {
    marginBottom: 16,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: 'white',
    marginBottom: 8,
  },
  balanceChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceChangeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  balanceChangeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 4,
  },
  balanceChangeLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  balanceDecoration1: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  balanceDecoration2: {
    position: 'absolute',
    bottom: -30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  
  // Enhanced Quick Actions Section
  enhancedQuickActionsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: (width - 64) / 2,
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
  },
  quickActionGradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginTop: 8,
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  
  // Enhanced Overview Section
  enhancedOverviewSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  overviewCard: {
    borderRadius: 16,
    padding: 20,
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overviewStat: {
    flex: 1,
  },
  overviewStatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  overviewStatLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  overviewStatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  overviewStatBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    marginLeft: 2,
  },
  overviewStatValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  overviewProgressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  overviewProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  overviewDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  
  // Enhanced Transactions Section
  enhancedTransactionsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  viewAllButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  transactionsCard: {
    borderRadius: 16,
    padding: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionContent: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  
  // Contextual Section
  contextualSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
});