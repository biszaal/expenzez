import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import {
  spacing,
  borderRadius,
  typography,
  shadows,
} from "../../constants/theme";
import { bankingAPI } from "../../services/api";
import { formatCurrency } from "../../utils/formatters";
import BankLogo from "../../components/ui/BankLogo";

const SCREEN_WIDTH = Dimensions.get("window").width;

interface BankAccount {
  id: string;
  name: string;
  bank: string;
  balance: number;
  currency: string;
  accountNumber: string;
}

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  description: string;
  date: string;
  [key: string]: any;
}

export default function HomeScreen() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { colors, shadows } = useTheme();

  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) return;
    const fetchData = async () => {
      setLoading(true);
      setWarning(null);
      setError(null);
      try {
        const accountsRes = await bankingAPI.getAccounts();
        console.log("Fetched accounts:", accountsRes);
        if (accountsRes.warning) setWarning(accountsRes.warning);
        const accountsData: BankAccount[] = accountsRes.accounts || [];
        setAccounts(accountsData);
        // Fetch transactions for all accounts
        let allTxns: Transaction[] = [];
        for (const acc of accountsData) {
          const txnsRes = await bankingAPI.getTransactions(acc.id);
          console.log(`Transactions for account ${acc.id}:`, txnsRes);
          if (txnsRes.transactions) {
            const normalized = txnsRes.transactions.map(
              (tx: any, idx: number) => ({
                id: tx.id || tx.transactionId || `${acc.id}-${idx}`,
                amount: Number(tx.amount || tx.transactionAmount?.amount || 0),
                currency:
                  tx.currency || tx.transactionAmount?.currency || "GBP",
                description:
                  tx.description || tx.remittanceInformationUnstructured || "",
                date: tx.date || tx.bookingDate || "",
                ...tx,
              })
            );
            allTxns = allTxns.concat(normalized);
          }
        }
        allTxns.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setTransactions(allTxns);
      } catch (e: any) {
        console.error("Error fetching accounts or transactions:", e);
        if (e?.response?.data?.message) setError(e.response.data.message);
        else setError("Failed to load bank data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isLoggedIn]);

  // Calculate total balance
  const totalBalance = accounts.reduce(
    (sum, acc) => sum + (acc.balance || 0),
    0
  );
  // Get up to 5 most recent transactions
  const recentTransactions = transactions.slice(0, 5);

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/auth/Login");
    }
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return null;
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background.secondary },
      ]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            { backgroundColor: colors.background.primary },
          ]}
        >
          <View style={styles.headerContent}>
            <View>
              <Text
                style={[styles.headerTitle, { color: colors.text.primary }]}
              >
                Good morning, Bishal
              </Text>
              <Text
                style={[
                  styles.headerSubtitle,
                  { color: colors.text.secondary },
                ]}
              >
                Let&apos;s check your finances
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.headerButton,
                { backgroundColor: colors.background.secondary },
                shadows.md,
              ]}
            >
              <Ionicons
                name="notifications-outline"
                size={20}
                color={colors.gray[700]}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCardWrapper}>
          <LinearGradient
            colors={[colors.primary[500], "#8B5CF6"]}
            style={[styles.balanceCard, shadows.lg]}
          >
            <View style={styles.balanceCardHeader}>
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <TouchableOpacity>
                <Ionicons name="eye-outline" size={20} color="white" />
              </TouchableOpacity>
            </View>
            <Text style={styles.balanceValue}>
              {formatCurrency(totalBalance)}
            </Text>
            <View style={styles.balanceChangeRow}>
              <View style={styles.balanceChangeBadge}>
                <Text style={styles.balanceChangeText}>+12.5%</Text>
              </View>
              <Text style={styles.balanceChangeLabel}>from last month</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Add Bank Card */}
        <View style={styles.addBankCardWrapper}>
          <LinearGradient
            colors={["#FEF3C7", "#FDE68A"]}
            style={[styles.addBankCard, shadows.lg]}
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
                onPress={() => router.push("/banks/connect" as any)}
              >
                <Text style={styles.addBankButtonText}>Connect</Text>
                <Ionicons name="chevron-forward" size={16} color="#D97706" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionWrapper}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Quick Actions
          </Text>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={[
                styles.quickActionCard,
                {
                  marginRight: spacing.md,
                  backgroundColor: colors.background.primary,
                  borderColor: colors.border.light,
                },
                shadows.sm,
              ]}
            >
              <View
                style={[
                  styles.quickActionIcon,
                  { backgroundColor: colors.primary[100] },
                ]}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={24}
                  color={colors.primary[500]}
                />
              </View>
              <Text
                style={[
                  styles.quickActionLabel,
                  { color: colors.text.primary },
                ]}
              >
                Add Expense
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.quickActionCard,
                {
                  marginLeft: spacing.md,
                  backgroundColor: colors.background.primary,
                  borderColor: colors.border.light,
                },
                shadows.sm,
              ]}
              onPress={() => router.push("/banks/connect" as any)}
            >
              <View
                style={[
                  styles.quickActionIcon,
                  { backgroundColor: colors.secondary[100] },
                ]}
              >
                <Ionicons
                  name="card-outline"
                  size={24}
                  color={colors.secondary[600]}
                />
              </View>
              <Text
                style={[
                  styles.quickActionLabel,
                  { color: colors.text.primary },
                ]}
              >
                Connect Bank
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Spending Overview */}
        <View style={styles.sectionWrapper}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              This Month
            </Text>
            <TouchableOpacity>
              <Text
                style={[styles.sectionLink, { color: colors.primary[500] }]}
              >
                View All
              </Text>
            </TouchableOpacity>
          </View>
          <View
            style={[
              styles.overviewCard,
              {
                backgroundColor: colors.background.primary,
                borderColor: colors.border.light,
              },
              shadows.sm,
            ]}
          >
            <View style={styles.overviewRow}>
              <View>
                <Text
                  style={[
                    styles.overviewLabel,
                    { color: colors.text.secondary },
                  ]}
                >
                  Spent
                </Text>
                <Text
                  style={[styles.overviewValue, { color: colors.text.primary }]}
                >
                  £1,247.80
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text
                  style={[
                    styles.overviewLabel,
                    { color: colors.text.secondary },
                  ]}
                >
                  Budget
                </Text>
                <Text
                  style={[styles.overviewValue, { color: colors.text.primary }]}
                >
                  £2,000
                </Text>
              </View>
            </View>
            {/* Progress Bar */}
            <View style={styles.progressBarWrapper}>
              <View style={styles.progressBarRow}>
                <Text
                  style={[
                    styles.progressBarLabel,
                    { color: colors.text.secondary },
                  ]}
                >
                  62% used
                </Text>
                <Text
                  style={[
                    styles.progressBarLabel,
                    { color: colors.text.secondary },
                  ]}
                >
                  £752.20 left
                </Text>
              </View>
              <View
                style={[
                  styles.progressBarBg,
                  { backgroundColor: colors.gray[200] },
                ]}
              >
                <LinearGradient
                  colors={[colors.primary[500], "#8B5CF6"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressBarFill, { width: "62%" }]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.sectionWrapper}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Recent Transactions
            </Text>
            <TouchableOpacity>
              <Text
                style={[styles.sectionLink, { color: colors.primary[500] }]}
              >
                See All
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.transactionsList}>
            {loading ? (
              <ActivityIndicator size="small" color={colors.primary[500]} />
            ) : recentTransactions.length === 0 ? (
              <Text style={{ color: colors.text.secondary }}>
                No transactions found.
              </Text>
            ) : (
              recentTransactions.map((txn, idx) => (
                <View
                  key={txn.id || idx}
                  style={[
                    styles.transactionItem,
                    {
                      backgroundColor: colors.background.primary,
                      borderColor: colors.border.light,
                    },
                    shadows.sm,
                  ]}
                >
                  <View
                    style={[
                      styles.transactionIcon,
                      {
                        backgroundColor:
                          txn.amount < 0
                            ? colors.error[100]
                            : colors.success[100],
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
                        txn.amount < 0 ? colors.error[500] : colors.success[500]
                      }
                    />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text
                      style={[
                        styles.transactionTitle,
                        { color: colors.text.primary },
                      ]}
                    >
                      {txn.description || txn.name || "Transaction"}
                    </Text>
                    <Text
                      style={[
                        styles.transactionSubtitle,
                        { color: colors.text.secondary },
                      ]}
                    >
                      {txn.date ? new Date(txn.date).toLocaleString() : ""}
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
                            ? colors.error[600]
                            : colors.success[600],
                      },
                    ]}
                  >
                    {formatCurrency(txn.amount)}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Categories */}
        <View style={styles.sectionWrapper}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Top Categories
          </Text>
          <View style={styles.categoriesRow}>
            <View
              style={[
                styles.categoryCard,
                {
                  marginRight: spacing.md,
                  backgroundColor: colors.background.primary,
                  borderColor: colors.border.light,
                },
                shadows.sm,
              ]}
            >
              <View
                style={[
                  styles.categoryIcon,
                  { backgroundColor: colors.error[100] },
                ]}
              >
                <Ionicons
                  name="restaurant-outline"
                  size={24}
                  color={colors.error[500]}
                />
              </View>
              <Text
                style={[styles.categoryLabel, { color: colors.text.primary }]}
              >
                Food
              </Text>
              <Text
                style={[
                  styles.categoryAmount,
                  { color: colors.text.secondary },
                ]}
              >
                £320
              </Text>
            </View>
            <View
              style={[
                styles.categoryCard,
                {
                  marginHorizontal: spacing.sm,
                  backgroundColor: colors.background.primary,
                  borderColor: colors.border.light,
                },
                shadows.sm,
              ]}
            >
              <View
                style={[
                  styles.categoryIcon,
                  { backgroundColor: colors.primary[100] },
                ]}
              >
                <Ionicons
                  name="car-outline"
                  size={24}
                  color={colors.primary[500]}
                />
              </View>
              <Text
                style={[styles.categoryLabel, { color: colors.text.primary }]}
              >
                Transport
              </Text>
              <Text
                style={[
                  styles.categoryAmount,
                  { color: colors.text.secondary },
                ]}
              >
                £180
              </Text>
            </View>
            <View
              style={[
                styles.categoryCard,
                {
                  marginLeft: spacing.md,
                  backgroundColor: colors.background.primary,
                  borderColor: colors.border.light,
                },
                shadows.sm,
              ]}
            >
              <View
                style={[
                  styles.categoryIcon,
                  { backgroundColor: colors.primary[100] },
                ]}
              >
                <Ionicons
                  name="shirt-outline"
                  size={24}
                  color={colors.primary[400]}
                />
              </View>
              <Text
                style={[styles.categoryLabel, { color: colors.text.primary }]}
              >
                Shopping
              </Text>
              <Text
                style={[
                  styles.categoryAmount,
                  { color: colors.text.secondary },
                ]}
              >
                £150
              </Text>
            </View>
          </View>
        </View>

        {/* Net Worth (Total Balance) already shown */}
        {/* Show warning or error if present */}
        {warning && (
          <View
            style={{
              backgroundColor: colors.warning[100] || "#FEF3C7",
              padding: 12,
              borderRadius: 8,
              marginVertical: 8,
            }}
          >
            <Text
              style={{
                color: colors.warning[700] || "#B45309",
                fontWeight: "600",
              }}
            >
              {warning}
            </Text>
          </View>
        )}
        {error && (
          <View
            style={{
              backgroundColor: colors.error[100] || "#FEE2E2",
              padding: 12,
              borderRadius: 8,
              marginVertical: 8,
            }}
          >
            <Text
              style={{
                color: colors.error[700] || "#B91C1C",
                fontWeight: "600",
              }}
            >
              {error}
            </Text>
          </View>
        )}
        {/* Connected Banks List */}
        {accounts.length > 0 && (
          <View style={{ marginVertical: 16 }}>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text.primary, marginBottom: 8 },
              ]}
            >
              Connected Banks
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ paddingBottom: 8 }}
            >
              {accounts.map((account, idx) => (
                <View
                  key={account.id || idx}
                  style={{
                    marginRight: 16,
                    backgroundColor: colors.background.primary,
                    borderRadius: 16,
                    padding: 16,
                    alignItems: "center",
                    minWidth: 140,
                    borderWidth: 1,
                    borderColor: colors.border.light,
                    shadowColor: colors.gray[900],
                    shadowOpacity: 0.08,
                    shadowRadius: 4,
                    shadowOffset: { width: 0, height: 2 },
                  }}
                >
                  <BankLogo
                    bankName={account.bank}
                    size="large"
                    showName={true}
                  />
                  <Text
                    style={{
                      fontWeight: "700",
                      fontSize: 16,
                      color: colors.text.primary,
                      marginTop: 8,
                    }}
                    numberOfLines={1}
                  >
                    {account.name || account.bank}
                  </Text>
                  <Text
                    style={{ color: colors.text.secondary, fontSize: 13 }}
                    numberOfLines={1}
                  >
                    {account.accountNumber}
                  </Text>
                  <Text
                    style={{
                      fontWeight: "700",
                      fontSize: 18,
                      color: colors.primary[500],
                      marginTop: 4,
                    }}
                  >
                    {formatCurrency(account.balance)}
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing["2xl"],
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: typography.fontSizes["2xl"],
    fontWeight: "700" as const,
  },
  headerSubtitle: {
    fontSize: typography.fontSizes.base,
    marginTop: spacing.xs,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  balanceCardWrapper: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  balanceCard: {
    borderRadius: borderRadius["3xl"],
    padding: spacing.lg,
  },
  balanceCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: typography.fontSizes.sm,
    fontWeight: "500" as const,
  },
  balanceValue: {
    color: "white",
    fontSize: typography.fontSizes["3xl"],
    fontWeight: "700" as const,
    marginBottom: spacing.sm,
  },
  balanceChangeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  balanceChangeBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
  },
  balanceChangeText: {
    color: "white",
    fontSize: typography.fontSizes.xs,
    fontWeight: "600" as const,
  },
  balanceChangeLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: typography.fontSizes.sm,
  },
  addBankCardWrapper: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  addBankCard: {
    borderRadius: borderRadius["3xl"],
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "#FCD34D",
  },
  addBankCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  addBankCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  addBankIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
    ...shadows.sm,
  },
  addBankTextContainer: {
    flex: 1,
  },
  addBankTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: "700" as const,
    color: "#92400E",
    marginBottom: spacing.xs,
  },
  addBankSubtitle: {
    fontSize: typography.fontSizes.sm,
    color: "#A16207",
    lineHeight: typography.fontSizes.sm * 1.4,
  },
  addBankButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    ...shadows.md,
    borderWidth: 1,
    borderColor: "#FCD34D",
  },
  addBankButtonText: {
    color: "#D97706",
    fontWeight: "600" as const,
    fontSize: typography.fontSizes.sm,
    marginRight: spacing.xs,
  },
  sectionWrapper: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: "700" as const,
    marginBottom: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  sectionLink: {
    fontWeight: "600" as const,
    fontSize: typography.fontSizes.sm,
  },
  quickActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quickActionCard: {
    borderRadius: borderRadius["2xl"],
    padding: spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    flex: 1,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  quickActionLabel: {
    fontWeight: "500" as const,
    fontSize: typography.fontSizes.sm,
  },
  overviewCard: {
    borderRadius: borderRadius["2xl"],
    padding: spacing.lg,
    borderWidth: 1,
  },
  overviewRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  overviewLabel: {
    fontSize: typography.fontSizes.sm,
  },
  overviewValue: {
    fontSize: typography.fontSizes["2xl"],
    fontWeight: "700" as const,
  },
  progressBarWrapper: {
    marginBottom: spacing.md,
  },
  progressBarRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  progressBarLabel: {
    fontSize: typography.fontSizes.sm,
  },
  progressBarBg: {
    borderRadius: borderRadius.full,
    height: 12,
    overflow: "hidden",
  },
  progressBarFill: {
    height: 12,
    borderRadius: borderRadius.full,
  },
  transactionsList: {
    gap: spacing.md,
  },
  transactionItem: {
    borderRadius: borderRadius["2xl"],
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  transactionInfo: {
    flex: 1,
    minWidth: 0,
  },
  transactionTitle: {
    fontWeight: "500" as const,
    fontSize: typography.fontSizes.base,
  },
  transactionSubtitle: {
    fontSize: typography.fontSizes.sm,
  },
  transactionAmountNegative: {
    fontWeight: "600" as const,
    fontSize: typography.fontSizes.base,
  },
  transactionAmountPositive: {
    fontWeight: "600" as const,
    fontSize: typography.fontSizes.base,
  },
  categoriesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  categoryCard: {
    borderRadius: borderRadius["2xl"],
    padding: spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    flex: 1,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  categoryLabel: {
    fontWeight: "500" as const,
    fontSize: typography.fontSizes.sm,
  },
  categoryAmount: {
    fontSize: typography.fontSizes.xs,
    marginTop: spacing.xs,
  },
});
