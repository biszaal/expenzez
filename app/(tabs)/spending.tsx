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
import { bankingAPI } from "../../services/api";
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

export default function SpendingPage() {
  const { isLoggedIn, hasBank, checkingBank } = useAuthGuard(undefined, true);
  const { colors } = useTheme();

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
    monthlyTransactions.forEach((txn) => {
      const category = txn.category || "Other";
      if (txn.amount < 0) {
        monthlySpentByCategory[category] =
          (monthlySpentByCategory[category] || 0) + Math.abs(txn.amount);
      }
    });

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

  // Month selection options
  const months = useMemo(() => {
    const monthsArray = [];
    for (let i = 11; i >= 0; i--) {
      const month = dayjs().subtract(i, 'month');
      monthsArray.push({
        id: i,
        name: month.format('MMM YYYY'),
        value: month.format('YYYY-MM')
      });
    }
    return monthsArray;
  }, []);

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
      if (tx.amount < 0 && tx.date) {
        const day = dayjs(tx.date).format("DD");
        currentMonthSpending[day] =
          (currentMonthSpending[day] || 0) + Math.abs(tx.amount);
      }
    });

    // Process previous month spending by day
    previousTransactions.forEach((tx) => {
      if (tx.amount < 0 && tx.date) {
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

      const [transactionsResponse, categoriesResponse] = await Promise.all([
        bankingAPI.getAllTransactions(),
        generateCategoriesFromTransactions(),
      ]);

      if (transactionsResponse?.transactions) {
        setTransactions(transactionsResponse.transactions);
      } else {
        setTransactions([]);
      }
      setCategoryData(categoriesResponse);

    } catch (err: any) {
      console.error("Error fetching spending data:", err);
      setError(err.message || "Failed to load spending data");
    } finally {
      setLoading(false);
    }
  }, []);

  // Generate categories from transactions
  const generateCategoriesFromTransactions = async () => {
    try {
      const storedCategoryBudgets = await AsyncStorage.getItem("categoryBudgets");
      const parsedStoredBudgets = storedCategoryBudgets
        ? JSON.parse(storedCategoryBudgets)
        : {};

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
          defaultBudget: parsedStoredBudgets[cat.name] || 500,
        });
      });

      // Add "Other" category
      categoryMap.set("Other", {
        id: "category-other",
        name: "Other",
        icon: "Other",
        color: "#95A5A6",
        defaultBudget: parsedStoredBudgets["Other"] || 200,
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
        toValue: monthlySpentPercentage / 100,
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
    if (isLoggedIn && hasBank) {
      fetchData();
    }
  }, [isLoggedIn, hasBank]);

  // Loading state
  if (loading || checkingBank) {
    return <TabLoadingScreen message="Loading spending data..." />;
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.secondary }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error[500] }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary[500] }]}
            onPress={fetchData}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
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

        {/* Budget Summary Card */}
        {selectedTab === "summary" && (
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
        {selectedTab === "categories" && (
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

  // Error Styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});