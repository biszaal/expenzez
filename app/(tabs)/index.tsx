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
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useNotifications } from "../../contexts/NotificationContext";
import { bankingAPI } from "../../services/api";
import { useDataFetcher, useBatchDataFetcher } from "../../hooks/useDataFetcher";
import { DataTransformers } from "../../utils/dataTransformers";
import { SPACING, SHADOWS } from "../../constants/Colors";
import BankLogo from "../../components/ui/BankLogo";
import { Card } from "../../components/ui";

interface Account {
  id: string;
  name: string;
  institution: string | { name: string; logo?: string };
  balance: number;
  currency: string;
  type: string;
}

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  description: string;
  date: string;
  category?: string;
}

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { unreadCount } = useNotifications();
  
  // Fallback colors if theme isn't loaded yet
  const safeColors = colors || {
    background: { primary: "#ffffff", secondary: "#f9fafb", tertiary: "#f3f4f6" },
    text: { primary: "#111827", secondary: "#6b7280", tertiary: "#9ca3af" },
    primary: { 500: "#7c3aed" },
    success: { 100: "#dcfce7", 500: "#10b981" },
    error: { 100: "#fee2e2", 500: "#ef4444" }
  };
  
  const styles = createStyles(safeColors);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [thisMonthSpent, setThisMonthSpent] = useState(0);
  const [userBudget, setUserBudget] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshingTransactions, setRefreshingTransactions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      setWarning(null);

      console.log("=== STARTING DATA FETCH ===");

      // Check authentication first
      const accessToken = await AsyncStorage.getItem("accessToken");
      if (!accessToken) {
        setWarning("Please log in to view your financial data");
        setLoading(false);
        return;
      }

      // Test if there are any transactions in the database
      // Removed testTransactions call as it does not exist

      // 🚀 PERFORMANCE: Fetch accounts and transactions in parallel
      console.log("🚀 PERFORMANCE: Fetching accounts and transactions in parallel...");
      
      const [accountsData, transactionsData] = await Promise.all([
        bankingAPI.getAccounts().catch(err => {
          console.error("❌ Error fetching accounts:", err);
          return { accounts: [] };
        }),
        bankingAPI.getAllTransactions(100).catch(err => {
          console.error("❌ Error fetching transactions:", err);
          return { transactions: [] };
        })
      ]);
      
      console.log("✅ Parallel fetch completed:", { accountsData, transactionsData });

      // Handle accounts
      const accounts = accountsData.accounts || [];
      setAccounts(accounts);
      
      // Calculate total balance efficiently
      const total = accounts.reduce((sum: number, account: Account) => {
        return sum + (account.balance || 0);
      }, 0);
      setTotalBalance(total);
      console.log(`✅ Total balance: ${total}`);

      // Handle transactions
      let allTransactions: Transaction[] = [];
      if (transactionsData.transactions && transactionsData.transactions.length > 0) {
        allTransactions = transactionsData.transactions.map((tx: any) => ({
          id: tx.id || tx.transactionId,
          amount: parseFloat(tx.amount) || 0,
          currency: tx.currency || 'GBP',
          description: tx.description || 'Transaction',
          date: tx.date || new Date().toISOString(),
          category: tx.category || 'Other',
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
      if (accounts.length === 0) {
        console.log("⚠️ No accounts found - user may need to connect banks");
        setWarning("No bank accounts connected. Please connect your bank account to see your financial data.");
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

  useEffect(() => {
    // Check if a bank was just connected and trigger refresh
    const checkBankConnected = async () => {
      const bankConnected = await AsyncStorage.getItem("bankConnected");
      if (bankConnected === "true") {
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

  // Debug logging
  console.log("=== TRANSACTION DEBUG ===");
  console.log("Total transactions in state:", transactions.length);
  console.log("Recent transactions (first 5):", recentTransactions);
  console.log("This month spent:", thisMonthSpent);
  console.log("Accounts count:", accounts.length);
  console.log("========================");

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={safeColors.primary[500]} />
          <Text style={styles.loadingText}>
            Loading your financial overview...
          </Text>
          <Text style={styles.loadingSubtext}>This may take a few moments</Text>
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
      {/* Header with notification icon */}
      <View style={[styles.header, { backgroundColor: safeColors.background.primary }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: safeColors.text.primary }]}>
            Expenzez
          </Text>
          <TouchableOpacity
            style={[styles.notificationButton, { backgroundColor: safeColors.background.secondary }]}
            onPress={() => router.push("/notifications")}
          >
            <Ionicons name="notifications-outline" size={24} color={safeColors.primary[500]} />
            {unreadCount > 0 && (
              <View style={[styles.notificationBadge, { backgroundColor: safeColors.primary[500] }]}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount.toString()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Greeting and Balance Card */}
        <Card
          style={{
            marginBottom: 20,
            borderRadius: 20,
            padding: 24,
            backgroundColor: safeColors.primary[500],
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 22,
              fontWeight: "700",
              marginBottom: 6,
            }}
          >
            Good morning{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </Text>
          <Text style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: 15, marginBottom: 18 }}>
            Let&apos;s check your finances
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 36,
                fontWeight: "bold",
                marginRight: 10,
              }}
            >
              £{totalBalance.toFixed(2)}
            </Text>
            <Ionicons name="eye-outline" size={22} color="#fff" />
          </View>
          <Text style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 14 }}>Total Balance</Text>
        </Card>

        {/* Quick Actions */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              marginRight: 8,
              backgroundColor: safeColors.background.primary,
              borderRadius: 16,
              padding: 18,
              alignItems: "center",
              ...SHADOWS.sm,
            }}
            onPress={() => router.push("/expenses/add")}
          >
            <Ionicons name="add-circle-outline" size={28} color={safeColors.primary[500]} />
            <Text style={{ fontWeight: "600", color: safeColors.text.primary, marginTop: 6 }}>
              Add Expense
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flex: 1,
              marginLeft: 8,
              backgroundColor: safeColors.background.primary,
              borderRadius: 16,
              padding: 18,
              alignItems: "center",
              ...SHADOWS.sm,
            }}
            onPress={async () => {
              try {
                const response = await bankingAPI.connectBank();
                if (response.link) {
                  await WebBrowser.openAuthSessionAsync(
                    response.link,
                    "exp://192.168.1.76:8081/--/banks/callback"
                  );
                } else {
                  alert("Failed to get bank authentication link");
                }
              } catch (error) {
                alert("Failed to start bank connection. Please try again.");
              }
            }}
          >
            <Ionicons name="link-outline" size={28} color={safeColors.primary[500]} />
            <Text style={{ fontWeight: "600", color: safeColors.text.primary, marginTop: 6 }}>
              Connect Bank
            </Text>
          </TouchableOpacity>
        </View>

        {/* This Month Card */}
        <Card
          style={{
            marginBottom: 20,
            borderRadius: 20,
            padding: 20,
            backgroundColor: safeColors.background.primary,
            ...SHADOWS.sm,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", color: safeColors.text.primary }}>
              This Month
            </Text>
            <TouchableOpacity onPress={() => router.push("/spending")}>
              <Text style={{ color: safeColors.primary[500], fontWeight: "600" }}>
                View All
              </Text>
            </TouchableOpacity>
          </View>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <View>
              <Text style={{ color: safeColors.text.secondary, fontSize: 14 }}>Spent</Text>
              <Text style={{ fontSize: 20, fontWeight: "bold", color: safeColors.text.primary }}>
                £{thisMonthSpent.toFixed(2)}
              </Text>
            </View>
            <View>
              <Text style={{ color: safeColors.text.secondary, fontSize: 14 }}>Budget</Text>
              <Text style={{ fontSize: 20, fontWeight: "bold", color: safeColors.text.primary }}>
                £{userBudget?.toFixed(2) || "0"}
              </Text>
            </View>
          </View>
        </Card>

        {/* Recent Transactions Card */}
        <Card
          style={{
            marginBottom: 20,
            borderRadius: 20,
            padding: 20,
            backgroundColor: safeColors.background.primary,
            ...SHADOWS.sm,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", color: safeColors.text.primary }}>
              Recent Transactions
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <TouchableOpacity 
                onPress={onRefreshTransactions}
                disabled={refreshingTransactions}
                style={{ opacity: refreshingTransactions ? 0.6 : 1 }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  {refreshingTransactions ? (
                    <ActivityIndicator size="small" color={safeColors.primary[500]} />
                  ) : (
                    <Ionicons name="refresh-outline" size={18} color={safeColors.primary[500]} />
                  )}
                  <Text style={{ color: safeColors.primary[500], fontWeight: "600", marginLeft: 4 }}>
                    {refreshingTransactions ? "Syncing..." : "Refresh"}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push("/transactions")}>
                <Text style={{ color: safeColors.primary[500], fontWeight: "600" }}>
                  See All
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          {transactions.slice(0, 4).map((tx, idx) => (
            <View
              key={tx.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: tx.amount >= 0 ? safeColors.success[100] : safeColors.error[100],
                  marginRight: 12,
                }}
              >
                <Ionicons
                  name={
                    tx.amount >= 0 ? "arrow-up-circle" : "arrow-down-circle"
                  }
                  size={22}
                  color={tx.amount >= 0 ? safeColors.success[500] : safeColors.error[500]}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontWeight: "600", color: safeColors.text.primary, fontSize: 15 }}
                  numberOfLines={1}
                >
                  {tx.description}
                </Text>
                <Text style={{ color: safeColors.text.secondary, fontSize: 13, marginTop: 2 }}>
                  {new Date(tx.date).toLocaleDateString()}
                </Text>
              </View>
              <Text
                style={{
                  fontWeight: "700",
                  fontSize: 15,
                  color: tx.amount >= 0 ? safeColors.success[500] : safeColors.error[500],
                  marginLeft: 8,
                }}
              >
                {tx.amount >= 0 ? "+" : "-"}£{Math.abs(tx.amount).toFixed(2)}
              </Text>
            </View>
          ))}
          {transactions.length === 0 && (
            <View style={{ alignItems: "center", marginTop: 20 }}>
              <Text
                style={{
                  color: safeColors.text.secondary,
                  fontSize: 15,
                  textAlign: "center",
                  marginBottom: 10,
                }}
              >
                No recent transactions found.
              </Text>
              {accounts.length === 0 && (
                <Text
                  style={{
                    color: safeColors.primary[500],
                    fontSize: 13,
                    textAlign: "center",
                    fontStyle: "italic",
                  }}
                >
                  🔄 Connect a demo bank above to see sample transactions
                </Text>
              )}
            </View>
          )}
        </Card>

        {/* AI Assistant Card */}
        <Card
          style={{
            marginBottom: 20,
            borderRadius: 20,
            padding: 20,
            backgroundColor: safeColors.background.primary,
            ...SHADOWS.sm,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: safeColors.primary[500],
                alignItems: "center",
                justifyContent: "center",
                marginRight: 14,
              }}
            >
              <Ionicons name="chatbubbles-outline" size={24} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontWeight: "700", fontSize: 16, color: safeColors.primary[500] }}
              >
                Ask Your AI
              </Text>
              <Text style={{ color: safeColors.primary[500], fontSize: 13, marginTop: 2 }}>
                Get insights about your spending
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/ai-assistant")}
              style={{ marginLeft: 10 }}
            >
              <Ionicons name="arrow-forward-circle" size={28} color={safeColors.primary[500]} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Connected Banks Card */}
        <Card
          style={{
            borderRadius: 20,
            padding: 20,
            backgroundColor: safeColors.background.primary,
            ...SHADOWS.sm,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: safeColors.text.primary,
              marginBottom: 12,
            }}
          >
            Connected Banks
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {accounts.length === 0 && (
              <View style={{ width: "100%", alignItems: "center", paddingVertical: 20 }}>
                <Ionicons name="link-outline" size={48} color={safeColors.text.tertiary} />
                <Text style={{ 
                  color: safeColors.text.secondary, 
                  fontSize: 16, 
                  textAlign: "center",
                  marginTop: 12,
                  marginBottom: 8
                }}>
                  No banks connected
                </Text>
                <Text style={{ 
                  color: safeColors.text.tertiary, 
                  fontSize: 13, 
                  textAlign: "center",
                  marginBottom: 16
                }}>
                  Demo mode connections reset automatically
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
                          "exp://192.168.1.76:8081/--/banks/callback"
                        );
                      } else {
                        alert("Failed to get bank authentication link");
                      }
                    } catch (error) {
                      alert("Failed to start bank connection. Please try again.");
                    }
                  }}
                >
                  <Ionicons name="add-circle-outline" size={20} color="#fff" />
                  <Text style={{ 
                    color: "#fff", 
                    fontWeight: "600",
                    marginLeft: 8
                  }}>
                    Connect Demo Bank
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            {accounts.map((account) => (
              <View
                key={account.id}
                style={{
                  width: 140,
                  marginRight: 16,
                  marginBottom: 16,
                  backgroundColor: safeColors.background.tertiary,
                  borderRadius: 16,
                  padding: 14,
                  alignItems: "center",
                  ...SHADOWS.sm,
                }}
              >
                <BankLogo
                  bankName={getBankName(account.institution)}
                  logoUrl={getBankLogo(account.institution)}
                  size="large"
                />
                <Text
                  style={{
                    fontWeight: "600",
                    color: safeColors.text.primary,
                    fontSize: 15,
                    marginTop: 6,
                  }}
                  numberOfLines={1}
                >
                  {getBankName(account.institution)}
                </Text>
                <Text style={{ color: safeColors.text.secondary, fontSize: 13, marginTop: 2 }}>
                  {account.type}
                </Text>
                <Text
                  style={{
                    fontWeight: "700",
                    fontSize: 15,
                    color: safeColors.primary[500],
                    marginTop: 4,
                  }}
                >
                  £{account.balance.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
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
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
    backgroundColor: colors.background.primary,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    ...SHADOWS.sm,
  },
  notificationBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 18,
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
  balanceCardWrapper: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  balanceCard: {
    backgroundColor: colors.background.primary,
    borderRadius: SPACING.lg,
    padding: SPACING.xl,
    alignItems: "center",
  },
  balanceCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  balanceLabel: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: "700",
    color: "white",
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
  transactionIcon: {
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
  transactionTitle: {
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
    backgroundColor: "#FFFBEB",
    padding: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderRadius: SPACING.md,
    borderWidth: 1,
    borderColor: "#FDE68A",
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
    color: "#92400E",
    marginLeft: SPACING.sm,
    flex: 1,
  },
  warningDismiss: {
    padding: SPACING.xs,
  },
  errorContainer: {
    backgroundColor: "#FEF2F2",
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
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: "center",
    marginTop: SPACING.md,
  },
  emptySubtext: {
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
  aiAssistantIcon: {
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
  aiAssistantTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
  },
  aiAssistantSubtitle: {
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
    margin: 16,
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
});
