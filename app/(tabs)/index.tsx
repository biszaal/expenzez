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
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../auth/AuthContext";
import { bankingAPI } from "../../services/api";
import { COLORS, SPACING, SHADOWS } from "../../constants/Colors";
import BankLogo from "../../components/ui/BankLogo";

const SCREEN_WIDTH = Dimensions.get("window").width;

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
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [thisMonthSpent, setThisMonthSpent] = useState(0);
  const [userBudget, setUserBudget] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
      try {
        const testResult = await bankingAPI.testTransactions();
        console.log("Test transactions result:", testResult);
      } catch (error) {
        console.log("Test transactions failed:", error);
      }

      // Fetch accounts
      const accountsData = await bankingAPI.getAccounts();
      console.log("Fetched accounts:", accountsData);
      setAccounts(accountsData.accounts || []);

      // Calculate total balance
      const total =
        accountsData.accounts?.reduce((sum: number, account: Account) => {
          return sum + (account.balance || 0);
        }, 0) || 0;
      setTotalBalance(total);
      console.log("Total balance calculated:", total);

      // Fetch transactions for all accounts
      let allTransactions: Transaction[] = [];
      console.log(
        "Fetching transactions for accounts:",
        accountsData.accounts?.length || 0
      );

      if (accountsData.accounts && accountsData.accounts.length > 0) {
        for (const account of accountsData.accounts) {
          try {
            console.log(
              `Fetching transactions for account: ${account.id} (${account.name})`
            );
            const transactionsData = await bankingAPI.getTransactions(
              account.id
            );
            console.log(
              `Raw transactions data for ${account.id}:`,
              transactionsData
            );

            if (
              transactionsData.transactions?.booked &&
              transactionsData.transactions.booked.length > 0
            ) {
              console.log(
                `Found ${transactionsData.transactions.booked.length} transactions for account ${account.id}`
              );
              const normalized = transactionsData.transactions.booked.map(
                (tx: any, idx: number) => {
                  const normalizedTx = {
                    id: tx.id || tx.transactionId || `${account.id}-${idx}`,
                    amount: Number(
                      tx.amount || tx.transactionAmount?.amount || 0
                    ),
                    currency:
                      tx.currency || tx.transactionAmount?.currency || "GBP",
                    description:
                      tx.description ||
                      tx.remittanceInformationUnstructured ||
                      "Transaction",
                    date: tx.date || tx.bookingDate || new Date().toISOString(),
                    category: tx.category || "Other",
                  };
                  console.log(`Normalized transaction ${idx}:`, normalizedTx);
                  return normalizedTx;
                }
              );
              allTransactions = [...allTransactions, ...normalized];
            } else {
              console.log(`No transactions found for account ${account.id}`);
              console.log(
                `Transactions data structure:`,
                transactionsData.transactions
              );
            }
          } catch (error) {
            console.error(
              `Failed to fetch transactions for account ${account.id}:`,
              error
            );
            // Continue with other accounts even if one fails
          }
        }
      } else {
        console.log("No accounts found, skipping transaction fetch");
      }

      // Sort transactions by date (most recent first)
      allTransactions.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      console.log(`Total transactions loaded: ${allTransactions.length}`);
      console.log("All transactions:", allTransactions);

      // If no transactions found, add some sample data for testing
      if (allTransactions.length === 0) {
        console.log("No transactions found, adding sample data for testing");
        const sampleTransactions = [
          {
            id: "sample-1",
            amount: -45.5,
            currency: "GBP",
            description: "Grocery Store",
            date: new Date().toISOString(),
            category: "Food & Dining",
          },
          {
            id: "sample-2",
            amount: -120.0,
            currency: "GBP",
            description: "Gas Station",
            date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            category: "Transportation",
          },
          {
            id: "sample-3",
            amount: 2500.0,
            currency: "GBP",
            description: "Salary Payment",
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            category: "Income",
          },
        ];
        allTransactions = sampleTransactions;
        console.log("Added sample transactions:", sampleTransactions);
      }

      setTransactions(allTransactions);

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

  useEffect(() => {
    fetchData();
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
          <ActivityIndicator size="large" color={COLORS.primary.main} />
          <Text style={styles.loadingText}>
            Loading your financial overview...
          </Text>
          <Text style={styles.loadingSubtext}>This may take a few moments</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>
                Good morning, {user?.name || "User"}
              </Text>
              <Text style={styles.headerSubtitle}>
                Let&apos;s check your finances
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.headerButton, SHADOWS.md]}
              onPress={() => router.push("/notifications")}
            >
              <Ionicons
                name="notifications-outline"
                size={20}
                color={COLORS.text.secondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCardWrapper}>
          <LinearGradient
            colors={[COLORS.primary.main, "#8B5CF6"]}
            style={[styles.balanceCard, SHADOWS.lg]}
          >
            <View style={styles.balanceCardHeader}>
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <TouchableOpacity>
                <Ionicons name="eye-outline" size={20} color="white" />
              </TouchableOpacity>
            </View>
            <Text style={styles.balanceValue}>
              £{totalBalance > 0 ? totalBalance.toLocaleString() : "0"}
            </Text>
            <View style={styles.balanceChangeRow}>
              <View style={styles.balanceChangeBadge}>
                <Text style={styles.balanceChangeText}>
                  {totalBalance > 0 ? "+12.5%" : "0%"}
                </Text>
              </View>
              <Text style={styles.balanceChangeLabel}>
                {totalBalance > 0 ? "from last month" : "no change"}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Add Bank Card */}
        <View style={styles.addBankCardWrapper}>
          <LinearGradient
            colors={["#FEF3C7", "#FDE68A"]}
            style={[styles.addBankCard, SHADOWS.lg]}
          >
            <View style={styles.addBankCardContent}>
              <View style={styles.addBankCardLeft}>
                <View style={styles.addBankIconContainer}>
                  <MaterialCommunityIcons
                    name="bank-plus"
                    size={24}
                    color="#D97706"
                  />
                </View>
                <View style={styles.addBankTextContainer}>
                  <Text style={styles.addBankTitle}>Connect Your Bank</Text>
                  <Text style={styles.addBankSubtitle}>
                    Link accounts for real-time data
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.addBankButton}
                onPress={() => router.push("/banks/connect")}
              >
                <Text style={styles.addBankButtonText}>Connect</Text>
                <Ionicons name="chevron-forward" size={16} color="#D97706" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionWrapper}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={[styles.quickActionCard, SHADOWS.sm]}
              onPress={() => router.push("/expenses/add")}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons
                  name="add-circle-outline"
                  size={24}
                  color={COLORS.primary.main}
                />
              </View>
              <Text style={styles.quickActionLabel}>Add Expense</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickActionCard, SHADOWS.sm]}
              onPress={() => router.push("/banks/connect")}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons
                  name="card-outline"
                  size={24}
                  color={COLORS.secondary.main}
                />
              </View>
              <Text style={styles.quickActionLabel}>Connect Bank</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Spending Overview */}
        <View style={styles.sectionWrapper}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>This Month</Text>
            <TouchableOpacity>
              <Text style={styles.sectionLink}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.overviewCard, SHADOWS.sm]}>
            <View style={styles.overviewRow}>
              <View>
                <Text style={styles.overviewLabel}>Spent</Text>
                <Text style={styles.overviewValue}>
                  £{thisMonthSpent > 0 ? thisMonthSpent.toLocaleString() : "0"}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.overviewLabel}>Budget</Text>
                <Text style={styles.overviewValue}>
                  £
                  {userBudget && userBudget > 0
                    ? userBudget.toLocaleString()
                    : "0"}
                </Text>
              </View>
            </View>
            {/* Progress Bar */}
            <View style={styles.progressBarWrapper}>
              <View style={styles.progressBarRow}>
                <Text style={styles.progressBarLabel}>
                  {percentUsed.toFixed(0)}% used
                </Text>
                <Text style={styles.progressBarLabel}>
                  £{userBudget ? (userBudget - thisMonthSpent).toFixed(0) : "0"}{" "}
                  left
                </Text>
              </View>
              <View style={styles.progressBarBg}>
                <LinearGradient
                  colors={[COLORS.primary.main, "#8B5CF6"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.min(percentUsed, 100)}%` },
                  ]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.sectionWrapper}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => router.push("/transactions")}>
              <Text style={styles.sectionLink}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.transactionsList}>
            {loading ? (
              <View style={styles.loadingTransactionsContainer}>
                <ActivityIndicator size="small" color={COLORS.primary.main} />
                <Text style={styles.loadingTransactionsText}>
                  Loading transactions...
                </Text>
              </View>
            ) : transactions.length === 0 ? (
              <View style={styles.emptyTransactionsContainer}>
                <Ionicons
                  name="receipt-outline"
                  size={48}
                  color={COLORS.text.secondary}
                />
                <Text style={styles.emptyText}>No transactions found</Text>
                <Text style={styles.emptySubtext}>
                  {accounts.length > 0
                    ? "Your accounts are connected but no recent transactions are available. Sample data is shown for demonstration."
                    : "Connect your bank to see your real transactions"}
                </Text>
                {accounts.length === 0 && (
                  <TouchableOpacity
                    style={styles.connectBankButton}
                    onPress={() => router.push("/banks/connect")}
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={16}
                      color={COLORS.primary.main}
                    />
                    <Text style={styles.connectBankText}>Connect Bank</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              transactions.slice(0, 5).map((txn, idx) => (
                <View
                  key={txn.id || idx}
                  style={[styles.transactionItem, SHADOWS.sm]}
                >
                  <View
                    style={[
                      styles.transactionIcon,
                      {
                        backgroundColor:
                          txn.amount < 0
                            ? COLORS.error.light
                            : COLORS.success.light,
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        txn.amount < 0
                          ? "arrow-down-outline"
                          : "arrow-up-outline"
                      }
                      size={20}
                      color={
                        txn.amount < 0 ? COLORS.error.main : COLORS.success.main
                      }
                    />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionTitle} numberOfLines={1}>
                      {txn.description || "Transaction"}
                    </Text>
                    <Text style={styles.transactionSubtitle}>
                      {txn.date
                        ? new Date(txn.date).toLocaleDateString()
                        : "Recent"}
                    </Text>
                  </View>
                  <Text
                    style={[
                      txn.amount < 0
                        ? styles.transactionAmountNegative
                        : styles.transactionAmountPositive,
                      {
                        color:
                          txn.amount < 0
                            ? COLORS.error.main
                            : COLORS.success.main,
                      },
                    ]}
                  >
                    {txn.amount < 0 ? "-" : "+"}£
                    {Math.abs(txn.amount).toFixed(2)}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>

        {/* AI Assistant */}
        <View style={styles.sectionWrapper}>
          <Text style={styles.sectionTitle}>AI Assistant</Text>
          <TouchableOpacity
            style={[styles.aiAssistantCard, SHADOWS.lg]}
            onPress={() => router.push("/ai-assistant")}
          >
            <LinearGradient
              colors={[COLORS.primary.main, "#8B5CF6"]}
              style={styles.aiAssistantGradient}
            >
              <View style={styles.aiAssistantContent}>
                <View style={styles.aiAssistantLeft}>
                  <View style={styles.aiAssistantIcon}>
                    <Ionicons
                      name="chatbubble-ellipses"
                      size={24}
                      color="white"
                    />
                  </View>
                  <View style={styles.aiAssistantText}>
                    <Text style={styles.aiAssistantTitle}>Ask Your AI</Text>
                    <Text style={styles.aiAssistantSubtitle}>
                      Get insights about your spending
                    </Text>
                  </View>
                </View>
                <View style={styles.aiAssistantButton}>
                  <Ionicons name="chevron-forward" size={20} color="white" />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Show warning if present */}
        {warning && (
          <View style={styles.warningContainer}>
            <View style={styles.warningContent}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color="#F59E0B"
              />
              <Text style={styles.warningText}>{warning}</Text>
            </View>
            <TouchableOpacity
              style={styles.warningDismiss}
              onPress={() => setWarning(null)}
            >
              <Ionicons name="close" size={16} color="#F59E0B" />
            </TouchableOpacity>
          </View>
        )}

        {/* Connected Banks List */}
        {accounts.length > 0 && (
          <View style={styles.sectionWrapper}>
            <Text style={styles.sectionTitle}>Connected Banks</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.banksScrollView}
            >
              {accounts.map((account, idx) => (
                <View key={account.id || idx} style={styles.bankCard}>
                  <BankLogo
                    bankName={
                      typeof account.institution === "string"
                        ? account.institution
                        : account.institution?.name || "Bank"
                    }
                    size="large"
                    showName={true}
                  />
                  <Text style={styles.bankCardTitle} numberOfLines={1}>
                    {account.name ||
                      (typeof account.institution === "string"
                        ? account.institution
                        : account.institution?.name) ||
                      "Account"}
                  </Text>
                  <Text style={styles.bankCardSubtitle} numberOfLines={1}>
                    {account.type}
                  </Text>
                  <Text style={styles.bankCardBalance}>
                    £{(account.balance || 0).toFixed(2)}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
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
    backgroundColor: COLORS.background.primary,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  loadingSubtext: {
    marginTop: SPACING.sm,
    fontSize: 14,
    color: COLORS.text.tertiary,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
    backgroundColor: COLORS.background.primary,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  balanceCardWrapper: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  balanceCard: {
    backgroundColor: COLORS.background.primary,
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
    color: COLORS.text.secondary,
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
    backgroundColor: COLORS.success.light,
    borderRadius: 10,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    marginRight: SPACING.xs,
  },
  balanceChangeText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.success.main,
  },
  balanceChangeLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  addBankCardWrapper: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  addBankCard: {
    backgroundColor: COLORS.background.primary,
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
    backgroundColor: COLORS.background.tertiary,
    justifyContent: "center",
    alignItems: "center",
  },
  addBankTextContainer: {
    marginLeft: SPACING.sm,
  },
  addBankTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text.primary,
  },
  addBankSubtitle: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  addBankButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  addBankButtonText: {
    fontSize: 14,
    color: COLORS.primary.main,
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
    color: COLORS.text.primary,
  },
  sectionLink: {
    fontSize: 14,
    color: COLORS.primary.main,
  },
  quickActionsRow: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
    borderRadius: SPACING.lg,
    padding: SPACING.lg,
    alignItems: "center",
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.background.tertiary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  quickActionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text.primary,
    textAlign: "center",
    marginBottom: SPACING.xs,
  },
  overviewCard: {
    backgroundColor: COLORS.background.primary,
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
    color: COLORS.text.secondary,
  },
  overviewValue: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text.primary,
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
    color: COLORS.text.secondary,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: COLORS.background.tertiary,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  transactionsList: {
    backgroundColor: COLORS.background.primary,
    borderRadius: SPACING.lg,
    padding: SPACING.md,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background.secondary,
  },
  transactionIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.background.tertiary,
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
    color: COLORS.text.primary,
    fontWeight: "500",
  },
  transactionSubtitle: {
    fontSize: 12,
    color: COLORS.text.tertiary,
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
    color: COLORS.error.main,
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
    backgroundColor: COLORS.background.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.background.secondary,
  },
  bankCardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text.primary,
    marginTop: SPACING.sm,
    textAlign: "center",
  },
  bankCardSubtitle: {
    fontSize: 12,
    color: COLORS.text.tertiary,
    marginTop: SPACING.xs,
    textAlign: "center",
  },
  bankCardBalance: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text.primary,
    marginTop: SPACING.sm,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: "center",
    marginTop: SPACING.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.text.tertiary,
    marginTop: SPACING.xs,
    textAlign: "center",
  },
  emptyTransactionsContainer: {
    alignItems: "center",
    paddingVertical: SPACING.lg,
  },
  aiAssistantCard: {
    backgroundColor: COLORS.background.primary,
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
    backgroundColor: COLORS.background.tertiary,
    justifyContent: "center",
    alignItems: "center",
  },
  aiAssistantText: {
    marginLeft: SPACING.sm,
  },
  aiAssistantTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text.primary,
  },
  aiAssistantSubtitle: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  aiAssistantButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background.primary,
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
    color: COLORS.text.secondary,
  },
  refreshTransactionsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.background.primary,
    borderRadius: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary.main,
  },
  refreshTransactionsText: {
    marginLeft: SPACING.xs,
    fontSize: 14,
    color: COLORS.primary.main,
    fontWeight: "500",
  },
  connectBankButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary.main,
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
});
