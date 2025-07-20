import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SectionList,
  FlatList,
  ScrollView,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../app/auth/AuthContext";
import { spacing, borderRadius, shadows } from "../../constants/theme";
import { bankingAPI } from "../../services/api";
import { formatCurrency } from "../../utils/formatters";
import dayjs from "dayjs";

// Transaction type
type Transaction = {
  id: string;
  amount: number;
  currency: string;
  description: string;
  date: string;
  category?: string;
  accountId?: string;
  [key: string]: any;
};

// Account type
type Account = {
  id: string;
  name: string;
  institution: string | { name: string; logo?: string };
  balance: number;
  currency: string;
  type: string;
};

// Helper to get unique years and months from transactions
function getAvailableYearsMonths(transactions: Transaction[]) {
  const years = new Set<string>();
  const monthsByYear: Record<string, Set<string>> = {};
  transactions.forEach((txn) => {
    if (!txn.date) return;
    const date = dayjs(txn.date);
    const year = date.format("YYYY");
    const month = date.format("MMMM");
    years.add(year);
    if (!monthsByYear[year]) monthsByYear[year] = new Set();
    monthsByYear[year].add(month);
  });
  const yearsArr = Array.from(years).sort((a, b) => b.localeCompare(a));
  const monthsArr = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return { years: yearsArr, monthsByYear, monthsArr };
}

export default function TransactionsPage() {
  const router = useRouter();
  const { colors } = useTheme();
  const { isLoggedIn, logout } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("=== FETCHING TRANSACTIONS DATA ===");

      console.log("User is logged in, attempting to fetch accounts");

      // Fetch accounts
      const accountsData = await bankingAPI.getAccounts();
      console.log("Fetched accounts:", accountsData);
      setAccounts(accountsData.accounts || []);

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
                (tx: any, idx: number) => ({
                  id: tx.transactionId || `${account.id}-${idx}`,
                  amount: Number(tx.transactionAmount?.amount || 0),
                  currency: tx.transactionAmount?.currency || "GBP",
                  description:
                    tx.remittanceInformationUnstructured || "Transaction",
                  date: tx.bookingDate || new Date().toISOString(),
                  category: tx.category || "Other",
                  accountId: account.id,
                  accountName: account.name,
                  institution: account.institution,
                })
              );
              allTransactions = [...allTransactions, ...normalized];
            } else {
              console.log(`No transactions found for account ${account.id}`);
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
        console.log("No accounts found, adding sample data");
        // Add sample data for testing
        const sampleTransactions = [
          {
            id: "sample-1",
            amount: -45.5,
            currency: "GBP",
            description: "Grocery Store",
            date: new Date().toISOString(),
            category: "Food & Dining",
            accountId: "sample-account",
            accountName: "Sample Bank",
            institution: "Sample Bank",
          },
          {
            id: "sample-2",
            amount: -120.0,
            currency: "GBP",
            description: "Gas Station",
            date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            category: "Transportation",
            accountId: "sample-account",
            accountName: "Sample Bank",
            institution: "Sample Bank",
          },
          {
            id: "sample-3",
            amount: 2500.0,
            currency: "GBP",
            description: "Salary Payment",
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            category: "Income",
            accountId: "sample-account",
            accountName: "Sample Bank",
            institution: "Sample Bank",
          },
        ];
        allTransactions = sampleTransactions;
      }

      // Sort transactions by date (most recent first)
      allTransactions.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      console.log(`Total transactions loaded: ${allTransactions.length}`);
      setTransactions(allTransactions);

      // Set default selected year and month to most recent
      if (allTransactions.length > 0) {
        const mostRecent = dayjs(allTransactions[0].date);
        setSelectedYear(mostRecent.format("YYYY"));
        setSelectedMonth(mostRecent.format("MMMM"));
      }

      console.log("=== TRANSACTIONS DATA FETCH COMPLETE ===");
    } catch (error: any) {
      console.error("Error fetching transactions data:", error);

      // Handle authentication errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        setError("Authentication failed. Please log in again.");
        // Clear auth data and logout
        await logout();
      } else {
        setError("Failed to load transactions. Please try again.");
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
    if (!isLoggedIn) {
      setError("Please log in to view transactions");
      setLoading(false);
      return;
    }
    fetchData();
  }, [isLoggedIn]);

  // Get available years and months
  const { years, monthsByYear, monthsArr } =
    getAvailableYearsMonths(transactions);

  // Filtered transactions for selected year/month
  const filteredTransactions = transactions.filter((txn) => {
    if (!txn.date) return false;
    const date = dayjs(txn.date);
    return (
      date.format("YYYY") === selectedYear &&
      date.format("MMMM") === selectedMonth
    );
  });

  // Group filtered transactions by day
  const groupedByDay = React.useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filteredTransactions.forEach((txn) => {
      const date = txn.date ? dayjs(txn.date) : null;
      if (!date) return;
      const key = date.format("YYYY-MM-DD");
      if (!groups[key]) groups[key] = [];
      groups[key].push(txn);
    });
    // Sort keys descending (most recent day first)
    const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));
    return sortedKeys.map((key) => ({
      title: dayjs(key).format("D MMMM YYYY"),
      data: groups[key].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    }));
  }, [filteredTransactions]);

  // Calculate summary statistics for selected period
  const summaryStats = React.useMemo(() => {
    const income = filteredTransactions
      .filter((txn) => txn.amount > 0)
      .reduce((sum, txn) => sum + txn.amount, 0);

    const expenses = filteredTransactions
      .filter((txn) => txn.amount < 0)
      .reduce((sum, txn) => sum + Math.abs(txn.amount), 0);

    const netAmount = income - expenses;

    return {
      totalTransactions: filteredTransactions.length,
      income,
      expenses,
      netAmount,
    };
  }, [filteredTransactions]);

  const horizontalPadding = 16;

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: colors.background.secondary },
      ]}
    >
      <View
        style={[
          styles.topBar,
          { backgroundColor: colors.background.secondary },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.backButton,
            { backgroundColor: colors.background.primary },
            shadows.sm,
          ]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={26} color={colors.primary[500]} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: colors.text.primary }]}>
          Transactions
        </Text>
        <View style={{ width: 32 }} />
      </View>
      {/* Month & Year Picker */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 18,
          marginTop: 10,
          paddingHorizontal: 12,
          paddingVertical: 6,
        }}
      >
        {/* Year Picker */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginRight: 12 }}
        >
          {years.map((year) => (
            <TouchableOpacity
              key={year}
              style={{
                backgroundColor:
                  year === selectedYear
                    ? colors.primary[500]
                    : colors.background.primary,
                borderRadius: 999,
                paddingHorizontal: 20,
                paddingVertical: 10,
                marginRight: 8,
                borderWidth: 1,
                borderColor:
                  year === selectedYear
                    ? colors.primary[500]
                    : colors.border.light,
              }}
              onPress={() => {
                setSelectedYear(year);
                // Set month to first available for this year if current month not available
                if (!monthsByYear[year]?.has(selectedMonth)) {
                  setSelectedMonth(
                    Array.from(monthsByYear[year] || [])[0] || ""
                  );
                }
              }}
            >
              <Text
                style={{
                  color: year === selectedYear ? "#FFF" : colors.primary[500],
                  fontWeight: "700",
                  fontSize: 16,
                }}
              >
                {year}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {/* Month Picker */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {monthsArr.map((month) =>
            monthsByYear[selectedYear]?.has(month) ? (
              <TouchableOpacity
                key={month}
                style={{
                  backgroundColor:
                    month === selectedMonth
                      ? colors.primary[500]
                      : colors.background.primary,
                  borderRadius: 999,
                  paddingHorizontal: 18,
                  paddingVertical: 10,
                  marginRight: 8,
                  borderWidth: 1,
                  borderColor:
                    month === selectedMonth
                      ? colors.primary[500]
                      : colors.border.light,
                }}
                onPress={() => setSelectedMonth(month)}
              >
                <Text
                  style={{
                    color:
                      month === selectedMonth ? "#FFF" : colors.primary[500],
                    fontWeight: "600",
                    fontSize: 16,
                  }}
                >
                  {month}
                </Text>
              </TouchableOpacity>
            ) : null
          )}
        </ScrollView>
      </View>

      {/* Summary Statistics */}
      {filteredTransactions.length > 0 && (
        <View
          style={[
            styles.summaryContainer,
            {
              backgroundColor: colors.background.primary,
              borderColor: colors.border.light,
            },
          ]}
        >
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text
                style={[styles.summaryLabel, { color: colors.text.secondary }]}
              >
                Total Transactions
              </Text>
              <Text
                style={[styles.summaryValue, { color: colors.text.primary }]}
              >
                {summaryStats.totalTransactions}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text
                style={[styles.summaryLabel, { color: colors.text.secondary }]}
              >
                Income
              </Text>
              <Text
                style={[styles.summaryValue, { color: colors.success[500] }]}
              >
                {formatCurrency(summaryStats.income)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text
                style={[styles.summaryLabel, { color: colors.text.secondary }]}
              >
                Expenses
              </Text>
              <Text style={[styles.summaryValue, { color: colors.error[500] }]}>
                {formatCurrency(summaryStats.expenses)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text
                style={[styles.summaryLabel, { color: colors.text.secondary }]}
              >
                Net
              </Text>
              <Text
                style={[
                  styles.summaryValue,
                  {
                    color:
                      summaryStats.netAmount >= 0
                        ? colors.success[500]
                        : colors.error[500],
                  },
                ]}
              >
                {formatCurrency(summaryStats.netAmount)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Transactions List - SectionList for grouped by day */}
      <View
        style={[
          styles.content,
          {
            backgroundColor: colors.background.secondary,
            paddingHorizontal: horizontalPadding,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary[500]} />
        ) : groupedByDay.length === 0 ? (
          <Text
            style={{
              color: colors.text.secondary,
              textAlign: "center",
              marginTop: 32,
            }}
          >
            No transactions found for this period.
          </Text>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.text.secondary }]}>
              {error}
            </Text>
            {(error.includes("Authentication failed") || !isLoggedIn) && (
              <TouchableOpacity
                style={[
                  styles.loginButton,
                  { backgroundColor: colors.primary[500] },
                ]}
                onPress={() => router.push("/auth/Login")}
              >
                <Text style={[styles.loginButtonText, { color: "#FFF" }]}>
                  Log In
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <SectionList
            sections={groupedByDay}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingBottom: 32,
              paddingHorizontal: horizontalPadding,
            }}
            renderSectionHeader={({ section: { title } }) => (
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: colors.primary[500],
                  marginTop: 18,
                  marginBottom: 6,
                  paddingHorizontal: 2,
                }}
              >
                {title}
              </Text>
            )}
            renderItem={({ item: txn }) => (
              <View
                style={[
                  styles.transactionItem,
                  {
                    borderBottomColor: colors.border.light,
                    paddingHorizontal: 2,
                  },
                ]}
              >
                <View style={styles.transactionInfo}>
                  <View style={styles.transactionHeader}>
                    <Text
                      style={[
                        styles.transactionName,
                        { color: colors.text.primary },
                      ]}
                      numberOfLines={2}
                    >
                      {txn.description || txn.name || "Transaction"}
                    </Text>
                    <Text
                      style={[
                        styles.transactionAmount,
                        {
                          color:
                            txn.amount < 0
                              ? colors.error[500]
                              : colors.success[500],
                        },
                      ]}
                    >
                      {formatCurrency(txn.amount)}
                    </Text>
                  </View>

                  <View style={styles.transactionDetails}>
                    {txn.category && (
                      <View style={styles.categoryContainer}>
                        <Ionicons
                          name="pricetag-outline"
                          size={12}
                          color={colors.text.secondary}
                        />
                        <Text
                          style={[
                            styles.categoryText,
                            { color: colors.text.secondary },
                          ]}
                        >
                          {txn.category}
                        </Text>
                      </View>
                    )}

                    {txn.accountName && (
                      <View style={styles.accountContainer}>
                        <Ionicons
                          name="card-outline"
                          size={12}
                          color={colors.text.secondary}
                        />
                        <Text
                          style={[
                            styles.accountText,
                            { color: colors.text.secondary },
                          ]}
                        >
                          {txn.accountName}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text
                    style={[
                      styles.transactionDate,
                      { color: colors.text.secondary },
                    ]}
                  >
                    {txn.date
                      ? dayjs(txn.date).format("MMM D, YYYY [at] h:mm A")
                      : ""}
                  </Text>
                </View>
              </View>
            )}
            stickySectionHeadersEnabled={false}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary[500]]}
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 32,
    paddingBottom: 16,
    paddingHorizontal: 14,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  topBarTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  transactionCard: {
    borderRadius: 16,
    padding: 20,
  },
  transactionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  transactionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 12,
  },
  transactionList: {
    gap: 16,
  },
  transactionItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 12,
  },
  transactionDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 8,
  },
  categoryContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "500",
  },
  accountContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  accountText: {
    fontSize: 12,
    fontWeight: "500",
  },
  transactionDate: {
    fontSize: 12,
    fontWeight: "400",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "700",
  },
  summaryContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryItem: {
    alignItems: "center",
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
  },
  loginButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
