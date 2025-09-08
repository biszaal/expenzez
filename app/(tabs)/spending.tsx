import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../contexts/ThemeContext";
import { TabLoadingScreen } from "../../components/ui";
import { spacing } from "../../constants/theme";
import { bankingAPI, budgetAPI } from "../../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import dayjs from "dayjs";
import { useAuthGuard } from "../../hooks/useAuthGuard";
import { ChartData, ChartDataPoint } from "../../components/charts";
import { 
  SpendingTabSwitch,
  SpendingMonthPicker,
  BudgetSummaryCard,
  SpendingAnalyticsSection,
  CategoryMerchantSwitch,
  SpendingCategoryList
} from "../../components/spending";
import { useRouter } from "expo-router";

export default function SpendingPage() {
  const { isLoggedIn, hasBank, checkingBank } = useAuthGuard(undefined, true);
  const { colors } = useTheme();
  const router = useRouter();

  // State Management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>("summary");
  const [spendingTab, setSpendingTab] = useState<string>("categories");
  const [selectedMonth, setSelectedMonth] = useState<string>(dayjs().format("YYYY-MM"));
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Animation values
  const animatedProgress = useMemo(() => new Animated.Value(0), []);
  const animatedScale = useMemo(() => new Animated.Value(0.9), []);

  // Monthly data calculation
  const monthlyData = useMemo(() => {
    const monthlyTransactions = transactions.filter((txn) => {
      if (!txn.date) return false;
      const txDate = dayjs(txn.date);
      return txDate.format("YYYY-MM") === selectedMonth;
    });

    const monthlySpentByCategory: Record<string, number> = {};
    console.log(`[Spending] Processing ${monthlyTransactions.length} monthly transactions`);
    monthlyTransactions.forEach((txn, index) => {
      const category = txn.category || "Other";
      if (index < 3) { // Log first 3 transactions for debugging
        console.log(`[Spending] Transaction ${index}: amount=${txn.amount}, type=${txn.type}, category=${category}, isExpense=${txn.type === 'debit'}`);
      }
      // Only count debit transactions (money going out) as expenses
      if (txn.type === 'debit') {
        monthlySpentByCategory[category] =
          (monthlySpentByCategory[category] || 0) + Math.abs(txn.amount);
      }
    });
    
    console.log(`[Spending] Monthly spending by category:`, monthlySpentByCategory);

    const monthlyTotalSpent = Object.values(monthlySpentByCategory).reduce(
      (sum, amount) => sum + amount,
      0
    );

    return {
      monthlyTransactions,
      monthlySpentByCategory,
      monthlyTotalSpent,
    };
  }, [transactions, selectedMonth]);

  // Budget calculations
  const totalBudget = categoryData.reduce((sum, cat) => sum + (cat.defaultBudget || 0), 0);
  const monthlySpentPercentage = totalBudget > 0 ? (monthlyData.monthlyTotalSpent / totalBudget) * 100 : 0;
  const monthlyOverBudget = monthlyData.monthlyTotalSpent > totalBudget;

  // Spending metrics calculation
  const currentDate = dayjs();
  const selectedDate = dayjs(selectedMonth);
  const currentMonth = selectedDate.isSame(currentDate, 'month');
  const dayOfMonth = Math.max(currentDate.date(), 1);
  const daysInMonth = selectedDate.daysInMonth();

  const averageSpendPerDay = currentMonth && dayOfMonth > 0 
    ? monthlyData.monthlyTotalSpent / dayOfMonth 
    : monthlyData.monthlyTotalSpent / daysInMonth;

  const predictedMonthlySpend = currentMonth 
    ? averageSpendPerDay * daysInMonth 
    : monthlyData.monthlyTotalSpent;

  const displayLeftToSpend = totalBudget - monthlyData.monthlyTotalSpent;

  // Month selection options - only show months that have data
  const months = useMemo(() => {
    const monthsArray = [];
    
    if (transactions.length === 0) {
      // No transactions - only show current month
      const currentMonth = dayjs();
      monthsArray.push({
        id: 0,
        name: currentMonth.format('MMM YYYY'),
        value: currentMonth.format('YYYY-MM')
      });
    } else {
      // Get unique months from transactions
      const monthsWithData = new Set<string>();
      
      transactions.forEach(transaction => {
        if (transaction.date) {
          const txMonth = dayjs(transaction.date).format('YYYY-MM');
          monthsWithData.add(txMonth);
        }
      });
      
      // Convert to array and sort (newest first)
      const sortedMonths = Array.from(monthsWithData).sort((a, b) => b.localeCompare(a));
      
      // Create month objects
      sortedMonths.forEach((monthValue, index) => {
        const month = dayjs(monthValue);
        monthsArray.push({
          id: index,
          name: month.format('MMM YYYY'),
          value: monthValue
        });
      });
      
      // Always ensure current month is included (in case no transactions this month)
      const currentMonthValue = dayjs().format('YYYY-MM');
      const hasCurrentMonth = monthsArray.some(m => m.value === currentMonthValue);
      
      if (!hasCurrentMonth) {
        const currentMonth = dayjs();
        monthsArray.unshift({
          id: monthsArray.length,
          name: currentMonth.format('MMM YYYY'),
          value: currentMonthValue
        });
      }
    }
    
    return monthsArray;
  }, [transactions]);

  // Calculate cumulative daily spending for chart (original implementation)
  const dailySpendingData = useMemo(() => {
    const currentMonthSpending: { [date: string]: number } = {};
    const previousMonthSpending: { [date: string]: number } = {};

    // Get current month transactions
    const currentTransactions = transactions.filter((tx) => {
      if (!tx.date) return false;
      const txDate = dayjs(tx.date);
      return txDate.format("YYYY-MM") === selectedMonth;
    });

    // Get previous month transactions
    const prevMonth = dayjs(selectedMonth)
      .subtract(1, "month")
      .format("YYYY-MM");
    const previousTransactions = transactions.filter((tx) => {
      if (!tx.date) return false;
      const txDate = dayjs(tx.date);
      return txDate.format("YYYY-MM") === prevMonth;
    });

    // Process current month spending by day
    currentTransactions.forEach((tx) => {
      // Only count debit transactions (money going out) as expenses
      if (tx.type === 'debit' && tx.date) {
        const day = dayjs(tx.date).format("DD");
        currentMonthSpending[day] =
          (currentMonthSpending[day] || 0) + Math.abs(tx.amount);
      }
    });

    // Process previous month spending by day
    previousTransactions.forEach((tx) => {
      // Only count debit transactions (money going out) as expenses
      if (tx.type === 'debit' && tx.date) {
        const day = dayjs(tx.date).format("DD");
        previousMonthSpending[day] =
          (previousMonthSpending[day] || 0) + Math.abs(tx.amount);
      }
    });

    // Get days in selected month
    const selectedDate = dayjs(selectedMonth);
    const daysInMonth = selectedDate.daysInMonth();
    const today = dayjs();
    const currentMonthStr = today.format("YYYY-MM");
    
    // For current month, show up to today's date for fair comparison
    // For past months, show the full month since the month is complete
    const todayDate = today.date();
    const isCurrentMonth = selectedMonth === currentMonthStr;
    
    // Show full month for comparison, but limit current month data to today
    let maxDay = daysInMonth; // Always show full month range
    let currentMonthDataLimit = isCurrentMonth ? todayDate : daysInMonth;

    // Create arrays for chart with cumulative data
    const labels: string[] = [];
    const data: number[] = [];
    const prevMonthData: number[] = [];
    let currentCumulative = 0;
    let prevCumulative = 0;

    // For previous month, calculate cumulative for ALL days first (to get complete picture)
    const prevMonthDaysInMonth = dayjs(prevMonth).daysInMonth();
    let fullPrevCumulative = 0;
    const fullPrevMonthData: number[] = [];
    
    for (let i = 1; i <= prevMonthDaysInMonth; i++) {
      const dayStr = i.toString().padStart(2, "0");
      const prevDaySpending = previousMonthSpending[dayStr] || 0;
      fullPrevCumulative += prevDaySpending;
      fullPrevMonthData.push(fullPrevCumulative);
    }

    // Build labels for full month with key dates
    for (let i = 1; i <= maxDay; i++) {
      const dayStr = i.toString().padStart(2, "0");
      
      // Show formatted dates at key positions
      if (i === 1) {
        labels.push(`1 ${selectedDate.format('MMM')}`);
      } else if (i === Math.floor(maxDay / 2)) {
        labels.push(`${i} ${selectedDate.format('MMM')}`);
      } else if (isCurrentMonth && i === todayDate) {
        labels.push(`${todayDate} ${selectedDate.format('MMM')}`);
      } else if (i === maxDay) {
        labels.push(`${maxDay} ${selectedDate.format('MMM')}`);
      } else {
        labels.push('');
      }
    }

    // Build current month data (only up to today if current month)
    for (let i = 1; i <= currentMonthDataLimit; i++) {
      const dayStr = i.toString().padStart(2, "0");
      const currentDaySpending = currentMonthSpending[dayStr] || 0;
      currentCumulative += currentDaySpending;
      data.push(currentCumulative);
    }

    // Build previous month data (always full month)
    for (let i = 1; i <= maxDay; i++) {
      const prevDataPoint = fullPrevMonthData[i - 1] || 0;
      prevMonthData.push(prevDataPoint);
    }


    return { labels, data, prevMonthData };
  }, [transactions, selectedMonth]);

  // Convert daily spending data to our chart format
  const chartData: ChartData = useMemo(() => {
    return {
      labels: dailySpendingData.labels,
      values: dailySpendingData.data,
      dataPoints: dailySpendingData.data.map((value, index) => ({
        value,
        label: dailySpendingData.labels[index] || `${index + 1}`,
        date: dayjs(selectedMonth).add(index, 'day').format('YYYY-MM-DD'),
        x: 0, // Will be calculated by the chart component
        y: 0, // Will be calculated by the chart component
      })),
    };
  }, [dailySpendingData, selectedMonth]);

  // Format amount helper
  const formatAmount = (amount: number, currency = "GBP") => {
    const formatter = new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    return formatter.format(amount);
  };

  // Data fetching
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Always load categories first (works without bank connections)
      const categoriesResponse = await generateCategoriesFromTransactions();
      setCategoryData(categoriesResponse);

      // Try to fetch transactions (may fail if no bank connections)
      try {
        const transactionsResponse = await bankingAPI.getAllTransactions();
        
        if (transactionsResponse && transactionsResponse.transactions) {
          setTransactions(transactionsResponse.transactions);
          console.log("✅ [Spending] Loaded transactions:", transactionsResponse.transactions.length);
        } else {
          setTransactions([]);
          console.log("ℹ️ [Spending] No transactions available");
        }
      } catch (transactionError) {
        // Don't treat missing transactions as an error - user might have no bank connections
        console.warn("⚠️ [Spending] Could not fetch transactions:", transactionError);
        setTransactions([]);
      }

    } catch (err: any) {
      console.error("❌ [Spending] Error fetching spending data:", err);
      // Only set error for critical failures (like categories not loading)
      const errorMessage = err?.message || "Unable to load spending data";
      setError(`${errorMessage}. Please check your connection and try again.`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Generate categories from transactions
  const generateCategoriesFromTransactions = async () => {
    try {
      // Fetch budget preferences from database
      let categoryBudgets = {};
      try {
        const budgetPreferences = await budgetAPI.getBudgetPreferences();
        categoryBudgets = budgetPreferences?.categoryBudgets || {};
        console.log("✅ Category budgets loaded from database:", categoryBudgets);
      } catch (budgetError) {
        console.error("❌ Error fetching budget preferences:", budgetError);
        // Fallback to AsyncStorage if database fails
        try {
          const storedCategoryBudgets = await AsyncStorage.getItem("categoryBudgets");
          categoryBudgets = storedCategoryBudgets ? JSON.parse(storedCategoryBudgets) : {};
        } catch (storageError) {
          console.error("❌ Error reading from AsyncStorage:", storageError);
          categoryBudgets = {};
        }
      }

      const categoryMap = new Map();

      // Add default categories
      const defaultCategories = [
        { name: "Food & Dining", icon: "restaurant", color: "#FF6B6B" },
        { name: "Shopping", icon: "bag", color: "#4ECDC4" },
        { name: "Transport", icon: "car", color: "#45B7D1" },
        { name: "Entertainment", icon: "game-controller", color: "#96CEB4" },
        { name: "Bills & Utilities", icon: "flash", color: "#FFEAA7" },
        { name: "Health & Fitness", icon: "fitness", color: "#DDA0DD" },
      ];

      defaultCategories.forEach((cat, index) => {
        categoryMap.set(cat.name, {
          id: `category-${index}`,
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          defaultBudget: categoryBudgets[cat.name] || 500,
        });
      });

      // Add "Other" category
      categoryMap.set("Other", {
        id: "category-other",
        name: "Other",
        icon: "Other",
        color: "#95A5A6",
        defaultBudget: categoryBudgets["Other"] || 100,
      });

      return Array.from(categoryMap.values());
    } catch (error) {
      console.error("Error generating categories:", error);
      return [];
    }
  };

  // Category data with monthly spending
  const sortedCategoryData = useMemo(() => {
    return categoryData.map((cat) => ({
      ...cat,
      monthlySpent: monthlyData.monthlySpentByCategory[cat.name] || 0,
    })).sort((a, b) => (b.monthlySpent || 0) - (a.monthlySpent || 0));
  }, [categoryData, monthlyData.monthlySpentByCategory]);

  // Point selection handler
  const handlePointSelect = React.useCallback((point: ChartDataPoint) => {
    console.log('Selected point:', point);
  }, []);

  // Animation effects
  useEffect(() => {
    Animated.parallel([
      Animated.timing(animatedProgress, {
        toValue: Math.min(monthlySpentPercentage / 100, 1), // Cap at 1 (100%) to prevent double rotation
        duration: 1500,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: false,
      }),
      Animated.timing(animatedScale, {
        toValue: 1,
        duration: 800,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
        useNativeDriver: true,
      }),
    ]).start();
  }, [monthlySpentPercentage]);

  // Initial data fetch
  useEffect(() => {
    if (isLoggedIn) {
      // Always fetch data when logged in, regardless of bank connection status
      fetchData();
    }
  }, [isLoggedIn]);

  // Loading state - only show loading during actual data fetch, not during bank check
  if (loading && checkingBank) {
    return <TabLoadingScreen message="Loading spending data..." />;
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.secondary }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={64} color={colors.error[500]} style={styles.errorIcon} />
          <Text style={[styles.errorTitle, { color: colors.text.primary }]}>
            Something went wrong
          </Text>
          <Text style={[styles.errorText, { color: colors.text.secondary }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary[500] }]}
            onPress={fetchData}
          >
            <Ionicons name="refresh" size={20} color="white" style={styles.retryButtonIcon} />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Premium Header */}
        <View style={[styles.premiumHeader, { backgroundColor: colors.background.secondary }]}>
          <View style={styles.premiumHeaderContent}>
            <View style={styles.premiumBrandSection}>
              <Text style={[styles.premiumHeaderTitle, { color: colors.text.primary }]}>
                Spending
              </Text>
              <View style={[styles.premiumBrandAccent, { backgroundColor: colors.primary[500] }]} />
            </View>
            <View style={styles.premiumHeaderRight}>
              <Text style={[styles.premiumHeaderSubtitle, { color: colors.text.secondary }]}>
                {`Updated ${dayjs().format("HH:mm")}`}
              </Text>
              <TouchableOpacity
                style={[styles.premiumHeaderButton, { backgroundColor: colors.background.primary }]}
                activeOpacity={0.8}
              >
                <Ionicons name="information-circle" size={20} color={colors.primary[500]} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Tab Switch */}
        <SpendingTabSwitch
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
        />

        {/* Month Picker */}
        <SpendingMonthPicker
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          months={months}
        />

        {/* Empty State - No Transactions */}
        {transactions.length === 0 && !hasBank && (
          <View style={[styles.emptyStateContainer, { backgroundColor: colors.background.primary }]}>
            <View style={styles.emptyStateContent}>
              <Ionicons 
                name="card-outline" 
                size={64} 
                color={colors.text.secondary} 
                style={styles.emptyStateIcon}
              />
              <Text style={[styles.emptyStateTitle, { color: colors.text.primary }]}>
                Connect Your Bank Account
              </Text>
              <Text style={[styles.emptyStateDescription, { color: colors.text.secondary }]}>
                Connect your bank account to start tracking your spending and see detailed insights about your financial habits.
              </Text>
              <TouchableOpacity
                style={[styles.emptyStateButton, { backgroundColor: colors.primary[500] }]}
                onPress={() => router.push('/banks/connect' as any)}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={20} color="white" style={styles.emptyStateButtonIcon} />
                <Text style={styles.emptyStateButtonText}>Connect Bank Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Empty State - No Transactions for This Month */}
        {transactions.length === 0 && hasBank && (
          <View style={[styles.emptyStateContainer, { backgroundColor: colors.background.primary }]}>
            <View style={styles.emptyStateContent}>
              <Ionicons 
                name="receipt-outline" 
                size={64} 
                color={colors.text.secondary} 
                style={styles.emptyStateIcon}
              />
              <Text style={[styles.emptyStateTitle, { color: colors.text.primary }]}>
                No Spending Data
              </Text>
              <Text style={[styles.emptyStateDescription, { color: colors.text.secondary }]}>
                You don&apos;t have any transactions for {selectedMonth}. Try selecting a different month or wait for new transactions to sync.
              </Text>
              <TouchableOpacity
                style={[styles.emptyStateButton, { backgroundColor: colors.primary[500] }]}
                onPress={fetchData}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={20} color="white" style={styles.emptyStateButtonIcon} />
                <Text style={styles.emptyStateButtonText}>Refresh Data</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Budget Summary Card */}
        {selectedTab === "summary" && transactions.length > 0 && (
          <BudgetSummaryCard
            selectedMonth={selectedMonth}
            monthlyTotalSpent={monthlyData.monthlyTotalSpent}
            totalBudget={totalBudget}
            averageSpendPerDay={averageSpendPerDay}
            predictedMonthlySpend={predictedMonthlySpend}
            displayLeftToSpend={displayLeftToSpend}
            monthlySpentPercentage={monthlySpentPercentage}
            monthlyOverBudget={monthlyOverBudget}
            currentMonth={currentMonth}
            formatAmount={formatAmount}
            currency="GBP"
            animatedScale={animatedScale}
            animatedProgress={animatedProgress}
          />
        )}

        {/* Analytics Section */}
        {selectedTab === "categories" && transactions.length > 0 && (
          <>
            <SpendingAnalyticsSection
              selectedMonth={selectedMonth}
              chartData={chartData}
              hasTransactions={monthlyData.monthlyTransactions.length > 0}
              monthlyOverBudget={monthlyOverBudget}
              dailySpendingData={dailySpendingData}
              onPointSelect={handlePointSelect}
            />

            {/* Category/Merchant Switch */}
            <CategoryMerchantSwitch
              spendingTab={spendingTab}
              setSpendingTab={setSpendingTab}
            />

            {/* Category List */}
            {spendingTab === "categories" && (
              <SpendingCategoryList
                sortedCategoryData={sortedCategoryData}
                filteredTransactions={monthlyData.monthlyTransactions}
                formatAmount={formatAmount}
                currency="GBP"
                onCategoryPress={(category) => {
                  console.log('Category pressed:', category.name);
                }}
              />
            )}
          </>
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
    paddingBottom: spacing['2xl'],
  },
  
  // Header Styles
  premiumHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  premiumHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  premiumBrandSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumHeaderTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginRight: spacing.sm,
  },
  premiumBrandAccent: {
    width: 4,
    height: 20,
    borderRadius: 2,
  },
  premiumHeaderRight: {
    alignItems: 'flex-end',
  },
  premiumHeaderSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  premiumHeaderButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  // Empty State Styles
  emptyStateContainer: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.lg,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyStateContent: {
    alignItems: 'center',
    maxWidth: 280,
  },
  emptyStateIcon: {
    marginBottom: spacing.lg,
    opacity: 0.6,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emptyStateButtonIcon: {
    marginRight: spacing.sm,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },

  // Error Styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorIcon: {
    marginBottom: spacing.lg,
    opacity: 0.8,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
    maxWidth: 280,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  retryButtonIcon: {
    marginRight: spacing.sm,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});