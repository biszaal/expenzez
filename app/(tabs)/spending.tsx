import { Ionicons } from "@expo/vector-icons";
import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { budgetAPI } from "../../services/api";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  Animated,
  Easing,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../contexts/ThemeContext";
// import { useSubscription } from "../../contexts/SubscriptionContext"; // Removed unused import
import { SpendingSkeleton } from "../../components/ui/SkeletonLoader";
import { spacing } from "../../constants/theme";
import { balanceAPI } from "../../services/api/balanceAPI";
import { useXP } from "../../hooks/useXP";
import { transactionAPI } from "../../services/api/transactionAPI";
import { getMerchantInfo } from "../../services/merchantService";
import dayjs from "dayjs";
import { useAuthGuard } from "../../hooks/useAuthGuard";
import { ChartData, ChartDataPoint } from "../../components/charts";
import { processTransactionExpense } from "../../utils/expenseDetection";
import { clearAllCache } from "../../services/config/apiCache";
import { PerformanceMonitor } from "../../utils/performanceOptimizations";
import {
  SpendingTabSwitch,
  SpendingMonthPicker,
  BudgetSummaryCard,
  SpendingAnalyticsSection,
  CategoryMerchantSwitch,
  SpendingCategoryListClean,
  SpendingMerchantList,
} from "../../components/spending";
import { useRouter } from "expo-router";

export default function SpendingPage() {
  const { isLoggedIn, hasBank, checkingBank } = useAuthGuard(undefined, true);
  const { colors } = useTheme();
  const { awardXPSilently } = useXP();
  const router = useRouter();

  // State Management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>("summary");
  const [spendingTab, setSpendingTab] = useState<string>("categories");
  const [selectedMonth, setSelectedMonth] = useState<string>(
    dayjs().format("YYYY-MM")
  );
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);

  // Animation values
  const animatedProgress = useMemo(() => new Animated.Value(0), []);
  const animatedScale = useMemo(() => new Animated.Value(0.9), []);

  // Ref to prevent multiple simultaneous fetchData calls
  const fetchingRef = useRef(false);

  // Ref to prevent multiple simultaneous category updates
  const updatingCategoriesRef = useRef(false);

  // Ref to track if XP has been awarded for this session
  const xpAwardedRef = useRef(false);

  // Ref to track last processed data to prevent unnecessary updates
  const lastProcessedDataRef = useRef<string>("");

  // Info button handler
  const handleInfoPress = () => {
    // Show spending insights modal
    Alert.alert(
      "Spending Insights",
      "This page shows your spending breakdown by categories and merchants. Use the month picker to view different months, and switch between categories and merchants to see detailed spending patterns.\n\n• Categories: See spending by expense type\n• Merchants: See spending by store/company\n• Analytics: View spending trends and patterns\n• Budget: Track your monthly budget progress",
      [
        {
          text: "Got it",
          style: "default",
        },
        {
          text: "More Help",
          style: "default",
          onPress: () => router.push("/help"),
        },
      ]
    );
  };

  // Filter transactions for selected month (memoized separately for better performance)
  const monthlyTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      if (!txn.date) return false;
      const txDate = dayjs(txn.date);
      return txDate.format("YYYY-MM") === selectedMonth;
    });
  }, [transactions, selectedMonth]);

  // Monthly data calculation - OPTIMIZED with performance monitoring
  const monthlyData = useMemo(() => {
    const stopTiming = PerformanceMonitor.startTiming(
      "monthly-data-calculation"
    );

    const monthlySpentByCategory: Record<string, number> = {};
    const monthlySpentByMerchant: Record<string, number> = {};

    // Only process if we have transactions
    if (monthlyTransactions.length === 0) {
      stopTiming();
      return {
        categoryData: [],
        merchantData: [],
        totalSpent: 0,
        averageTransaction: 0,
      };
    }

    console.log(
      `[Spending] Processing ${monthlyTransactions.length} monthly transactions`
    );

    // OPTIMIZATION: Process transactions in batches to prevent UI blocking
    const BATCH_SIZE = 50;
    const batches = [];
    for (let i = 0; i < monthlyTransactions.length; i += BATCH_SIZE) {
      batches.push(monthlyTransactions.slice(i, i + BATCH_SIZE));
    }

    // Process each batch
    batches.forEach((batch, batchIndex) => {
      batch.forEach((txn, index) => {
        const category = txn.category || "Other";
        const merchantInfo = getMerchantInfo(
          txn.description || txn.merchant || "Unknown Merchant"
        );
        const merchantName = merchantInfo.name;

        // Use centralized expense detection logic
        const expenseDetection = processTransactionExpense(
          txn,
          index,
          index < 3
        ); // Only log first 3 transactions
        const { isExpense } = expenseDetection;

        if (isExpense) {
          const expenseAmount = Math.abs(txn.amount);
          monthlySpentByCategory[category] =
            (monthlySpentByCategory[category] || 0) + expenseAmount;
          monthlySpentByMerchant[merchantName] =
            (monthlySpentByMerchant[merchantName] || 0) + expenseAmount;
        }
      });
    });

    console.log(
      `[Spending] Monthly spending by category:`,
      monthlySpentByCategory
    );
    console.log(
      `[Spending] Monthly spending by merchant:`,
      monthlySpentByMerchant
    );

    // Debug: Show all unique categories found in transactions
    const allCategories = Array.from(
      new Set(monthlyTransactions.map((tx) => tx.category || "Other"))
    );
    console.log(
      "🐛 [Spending] All unique categories in transactions:",
      allCategories
    );

    // Debug: Show expense vs income breakdown
    const expenseTransactions = monthlyTransactions.filter((tx) => {
      const category = tx.category || "Other";
      const isIncomeCategory =
        category.toLowerCase().includes("income") ||
        category.toLowerCase().includes("salary") ||
        category.toLowerCase().includes("refund");
      const categoryLower = category.toLowerCase();
      const isExpenseCategory =
        !isIncomeCategory &&
        // Exact matches
        (category === "Food & Dining" ||
          category === "Shopping" ||
          category === "Transport" ||
          category === "Entertainment" ||
          category === "Bills & Utilities" ||
          category === "Health & Fitness" ||
          category === "Other" ||
          // Flexible matches for common variations
          categoryLower.includes("food") ||
          categoryLower.includes("dining") ||
          categoryLower.includes("restaurant") ||
          categoryLower.includes("shop") ||
          categoryLower.includes("retail") ||
          categoryLower.includes("transport") ||
          categoryLower.includes("travel") ||
          categoryLower.includes("taxi") ||
          categoryLower.includes("uber") ||
          categoryLower.includes("entertainment") ||
          categoryLower.includes("movie") ||
          categoryLower.includes("game") ||
          categoryLower.includes("bill") ||
          categoryLower.includes("utilities") ||
          categoryLower.includes("utility") ||
          categoryLower.includes("electric") ||
          categoryLower.includes("gas") ||
          categoryLower.includes("health") ||
          categoryLower.includes("fitness") ||
          categoryLower.includes("gym") ||
          categoryLower.includes("medical") ||
          categoryLower.includes("expense") ||
          categoryLower.includes("purchase") ||
          // Catch remaining non-income categories
          (categoryLower !== "income" &&
            categoryLower !== "salary" &&
            categoryLower !== "refund"));
      return (
        tx.type === "debit" ||
        tx.amount < 0 ||
        (tx.amount > 0 && isExpenseCategory)
      );
    });
    console.log(
      "🐛 [Spending] Total expenses detected:",
      expenseTransactions.length,
      "out of",
      monthlyTransactions.length,
      "transactions"
    );

    const monthlyTotalSpent = Object.values(monthlySpentByCategory).reduce(
      (sum, amount) => sum + amount,
      0
    );

    return {
      monthlyTransactions,
      monthlySpentByCategory,
      monthlySpentByMerchant,
      monthlyTotalSpent,
    };
  }, [monthlyTransactions]);

  // Budget state
  const [userBudget, setUserBudget] = useState(2000); // Default budget

  // Load user's budget from database
  const loadUserBudget = async () => {
    try {
      const budgetPreferences = await budgetAPI.getBudgetPreferences();
      if (budgetPreferences.monthlySpendingLimit) {
        setUserBudget(budgetPreferences.monthlySpendingLimit);
      }
    } catch (error) {
      console.error("Error loading user budget from database:", error);
      // Keep default budget if database fails
    }
  };

  // Load budget on component mount
  useEffect(() => {
    loadUserBudget();
  }, []);

  // Budget calculations - use user's budget instead of category defaults
  const totalBudget = userBudget;
  const monthlySpentPercentage =
    totalBudget > 0
      ? ((monthlyData?.monthlyTotalSpent || 0) / totalBudget) * 100
      : 0;
  const monthlyOverBudget = (monthlyData?.monthlyTotalSpent || 0) > totalBudget;

  // Spending metrics calculation
  const currentDate = dayjs();
  const selectedDate = dayjs(selectedMonth);
  const currentMonth = selectedDate.isSame(currentDate, "month");
  const dayOfMonth = Math.max(currentDate.date(), 1);
  const daysInMonth = selectedDate.daysInMonth();

  const averageSpendPerDay =
    currentMonth && dayOfMonth > 0
      ? (monthlyData?.monthlyTotalSpent || 0) / dayOfMonth
      : (monthlyData?.monthlyTotalSpent || 0) / daysInMonth;

  // Always show expected total based on average daily spend
  const predictedMonthlySpend = averageSpendPerDay * daysInMonth;

  const displayLeftToSpend =
    totalBudget - (monthlyData?.monthlyTotalSpent || 0);

  // Month selection options - use available months from balance summary
  const months = useMemo(() => {
    if (availableMonths.length === 0) {
      // No months available yet - show current month
      const currentMonth = dayjs();
      return [
        {
          id: 0,
          name: currentMonth.format("MMM YYYY"),
          value: currentMonth.format("YYYY-MM"),
        },
      ];
    }

    // Convert available months to month objects
    return availableMonths.map((monthValue, index) => {
      const month = dayjs(monthValue);
      return {
        id: index,
        name: month.format("MMM YYYY"),
        value: monthValue,
      };
    });
  }, [availableMonths]);

  // Calculate cumulative daily spending for chart (original implementation)
  const dailySpendingData = useMemo(() => {
    const currentMonthSpending: { [date: string]: number } = {};
    const previousMonthSpending: { [date: string]: number } = {};

    // Use already filtered monthly transactions for better performance
    const currentTransactions = monthlyTransactions;

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
      if (!tx.date) return;

      const category = tx.category || "Other";

      // Use same enhanced expense detection logic as categories
      const isIncomeCategory =
        category.toLowerCase().includes("income") ||
        category.toLowerCase().includes("salary") ||
        category.toLowerCase().includes("refund");

      const categoryLower = category.toLowerCase();
      const isExpenseCategory =
        !isIncomeCategory &&
        // Exact matches
        (category === "Food & Dining" ||
          category === "Shopping" ||
          category === "Transport" ||
          category === "Entertainment" ||
          category === "Bills & Utilities" ||
          category === "Health & Fitness" ||
          category === "Other" ||
          // Flexible matches for common variations
          categoryLower.includes("food") ||
          categoryLower.includes("dining") ||
          categoryLower.includes("restaurant") ||
          categoryLower.includes("shop") ||
          categoryLower.includes("retail") ||
          categoryLower.includes("transport") ||
          categoryLower.includes("travel") ||
          categoryLower.includes("taxi") ||
          categoryLower.includes("uber") ||
          categoryLower.includes("entertainment") ||
          categoryLower.includes("movie") ||
          categoryLower.includes("game") ||
          categoryLower.includes("bill") ||
          categoryLower.includes("utilities") ||
          categoryLower.includes("utility") ||
          categoryLower.includes("electric") ||
          categoryLower.includes("gas") ||
          categoryLower.includes("health") ||
          categoryLower.includes("fitness") ||
          categoryLower.includes("gym") ||
          categoryLower.includes("medical") ||
          categoryLower.includes("expense") ||
          categoryLower.includes("purchase") ||
          // Catch remaining non-income categories
          (categoryLower !== "income" &&
            categoryLower !== "salary" &&
            categoryLower !== "refund"));

      const isExpense =
        tx.type === "debit" ||
        tx.amount < 0 ||
        (tx.amount > 0 && isExpenseCategory);

      if (isExpense) {
        const day = dayjs(tx.date).format("DD");
        currentMonthSpending[day] =
          (currentMonthSpending[day] || 0) + Math.abs(tx.amount);
      }
    });

    // Process previous month spending by day
    previousTransactions.forEach((tx) => {
      if (!tx.date) return;

      const category = tx.category || "Other";

      // Use same enhanced expense detection logic as categories
      const isIncomeCategory =
        category.toLowerCase().includes("income") ||
        category.toLowerCase().includes("salary") ||
        category.toLowerCase().includes("refund");

      const categoryLower = category.toLowerCase();
      const isExpenseCategory =
        !isIncomeCategory &&
        // Exact matches
        (category === "Food & Dining" ||
          category === "Shopping" ||
          category === "Transport" ||
          category === "Entertainment" ||
          category === "Bills & Utilities" ||
          category === "Health & Fitness" ||
          category === "Other" ||
          // Flexible matches for common variations
          categoryLower.includes("food") ||
          categoryLower.includes("dining") ||
          categoryLower.includes("restaurant") ||
          categoryLower.includes("shop") ||
          categoryLower.includes("retail") ||
          categoryLower.includes("transport") ||
          categoryLower.includes("travel") ||
          categoryLower.includes("taxi") ||
          categoryLower.includes("uber") ||
          categoryLower.includes("entertainment") ||
          categoryLower.includes("movie") ||
          categoryLower.includes("game") ||
          categoryLower.includes("bill") ||
          categoryLower.includes("utilities") ||
          categoryLower.includes("utility") ||
          categoryLower.includes("electric") ||
          categoryLower.includes("gas") ||
          categoryLower.includes("health") ||
          categoryLower.includes("fitness") ||
          categoryLower.includes("gym") ||
          categoryLower.includes("medical") ||
          categoryLower.includes("expense") ||
          categoryLower.includes("purchase") ||
          // Catch remaining non-income categories
          (categoryLower !== "income" &&
            categoryLower !== "salary" &&
            categoryLower !== "refund"));

      const isExpense =
        tx.type === "debit" ||
        tx.amount < 0 ||
        (tx.amount > 0 && isExpenseCategory);

      if (isExpense) {
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
      // Show formatted dates at key positions
      if (i === 1) {
        labels.push(`1 ${selectedDate.format("MMM")}`);
      } else if (i === Math.floor(maxDay / 2)) {
        labels.push(`${i} ${selectedDate.format("MMM")}`);
      } else if (isCurrentMonth && i === todayDate) {
        labels.push(`${todayDate} ${selectedDate.format("MMM")}`);
      } else if (i === maxDay) {
        labels.push(`${maxDay} ${selectedDate.format("MMM")}`);
      } else {
        labels.push("");
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
  }, [monthlyTransactions, transactions, selectedMonth]);

  // Convert daily spending data to our chart format
  const chartData: ChartData = useMemo(() => {
    return {
      labels: dailySpendingData.labels,
      values: dailySpendingData.data,
      dataPoints: dailySpendingData.data.map((value, index) => ({
        value,
        label: dailySpendingData.labels[index] || `${index + 1}`,
        date: dayjs(selectedMonth).add(index, "day").format("YYYY-MM-DD"),
        x: 0, // Will be calculated by the chart component
        y: 0, // Will be calculated by the chart component
      })),
      // Add comparison data for previous month
      comparisonData: {
        values: dailySpendingData.prevMonthData,
        dataPoints: dailySpendingData.prevMonthData.map((value, index) => ({
          value,
          label: dailySpendingData.labels[index] || `${index + 1}`,
          date: dayjs(selectedMonth)
            .subtract(1, "month")
            .add(index, "day")
            .format("YYYY-MM-DD"),
          x: 0, // Will be calculated by the chart component
          y: 0, // Will be calculated by the chart component
        })),
        lineColor: "rgba(156, 163, 175, 0.6)",
        strokeWidth: 2,
        opacity: 0.8,
        label: dayjs(selectedMonth).subtract(1, "month").format("MMM"),
      },
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

  // Generate categories from transactions with month-specific budgets
  const generateCategoriesFromTransactions = useCallback(
    async (selectedMonthData?: any) => {
      try {
        // Fetch budget preferences from database
        let categoryBudgets = {};
        try {
          const budgetPreferences = await budgetAPI.getBudgetPreferences();
          categoryBudgets = budgetPreferences?.categoryBudgets || {};
          console.log(
            "✅ Category budgets loaded from database:",
            categoryBudgets
          );

          // Note: XP awarding moved to a separate effect to prevent multiple awards
        } catch (budgetError) {
          console.error("❌ Error fetching budget preferences:", budgetError);
          // Fallback to AsyncStorage if database fails
          try {
            const storedCategoryBudgets =
              await AsyncStorage.getItem("categoryBudgets");
            categoryBudgets = storedCategoryBudgets
              ? JSON.parse(storedCategoryBudgets)
              : {};
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
          // Calculate dynamic budget based on actual spending patterns
          let dynamicBudget = 300; // Default fallback

          if (selectedMonthData?.monthlySpentByCategory) {
            const actualSpending =
              selectedMonthData.monthlySpentByCategory[cat.name] || 0;

            // If user has spending data for this category, suggest budget based on spending
            if (actualSpending > 0) {
              dynamicBudget = Math.max(actualSpending * 1.3, 100); // 30% buffer over actual spending
            } else {
              // No spending in this category - suggest smaller budget
              dynamicBudget = 150;
            }
          }

          categoryMap.set(cat.name, {
            id: `category-${index}`,
            name: cat.name,
            icon: cat.icon,
            color: cat.color,
            defaultBudget:
              categoryBudgets[cat.name] || Math.round(dynamicBudget),
          });
        });

        // Add "Other" category with dynamic budget
        let otherBudget = 200; // Default fallback
        if (selectedMonthData?.monthlySpentByCategory) {
          const actualOtherSpending =
            selectedMonthData.monthlySpentByCategory["Other"] || 0;
          if (actualOtherSpending > 0) {
            otherBudget = Math.max(actualOtherSpending * 1.3, 100);
          } else {
            otherBudget = 100; // Smaller default for "Other" category
          }
        }

        categoryMap.set("Other", {
          id: "category-other",
          name: "Other",
          icon: "Other",
          color: "#95A5A6",
          defaultBudget: categoryBudgets["Other"] || Math.round(otherBudget),
        });

        return Array.from(categoryMap.values());
      } catch (error) {
        console.error("Error generating categories:", error);
        return [];
      }
    },
    [awardXPSilently]
  );

  // Data fetching
  const fetchData = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (fetchingRef.current) {
      console.log("🔄 [Spending] Fetch already in progress, skipping...");
      return;
    }

    try {
      fetchingRef.current = true;
      setLoading(true);
      setError(null);

      // Try to load balance summary to get available months
      let balanceSummary;
      let useTransactionsForMonths = false;

      try {
        balanceSummary = await balanceAPI.getSummary({ useCache: true });
        setAvailableMonths(balanceSummary.monthsWithData);
        console.log(
          "✅ [Spending] Available months from API:",
          balanceSummary.monthsWithData
        );
      } catch {
        console.warn(
          "⚠️ [Spending] Balance summary endpoint not available, will extract months from transactions"
        );
        useTransactionsForMonths = true;
      }

      // Load manual transactions from DynamoDB
      try {
        // Fetch last 12 months to have all months available in month picker
        const startDate = dayjs()
          .subtract(12, "months")
          .startOf("month")
          .format("YYYY-MM-DD");
        const endDate = dayjs().endOf("month").format("YYYY-MM-DD");

        console.log(
          `🔄 [Spending] Fetching last 12 months (${startDate} to ${endDate})...`
        );

        const transactionsResponse = await transactionAPI.getTransactions({
          startDate,
          endDate,
          limit: 2400, // ~200 per month for 12 months
          useCache: true,
        });

        if (transactionsResponse && transactionsResponse.transactions) {
          console.log(
            "✅ [Spending] Loaded manual transactions:",
            transactionsResponse.transactions.length
          );
          console.log(
            "📝 [Spending] Sample transactions:",
            transactionsResponse.transactions.slice(0, 2)
          );
          setTransactions(transactionsResponse.transactions);

          // If balance summary API failed, extract months from transactions
          if (
            useTransactionsForMonths &&
            transactionsResponse.transactions.length > 0
          ) {
            const monthsSet = new Set<string>();
            transactionsResponse.transactions.forEach((tx: any) => {
              if (tx.date) {
                const monthKey = tx.date.substring(0, 7); // YYYY-MM
                monthsSet.add(monthKey);
              }
            });
            const extractedMonths = Array.from(monthsSet).sort().reverse(); // Newest first
            setAvailableMonths(extractedMonths);
            console.log(
              "✅ [Spending] Extracted months from transactions:",
              extractedMonths
            );
          }
        } else {
          console.log(
            "ℹ️ [Spending] No transactions available - response:",
            transactionsResponse
          );
          setTransactions([]);
        }
      } catch (transactionError: any) {
        // Don't treat missing transactions as an error - user might have no bank connections
        console.warn(
          "⚠️ [Spending] Could not fetch transactions:",
          transactionError
        );
        console.warn(
          "⚠️ [Spending] Error details:",
          transactionError?.response?.data || transactionError?.message
        );

        // Don't set UI errors for transaction fetch failures in development
        // if (__DEV__) {
        //   setError(`Transaction fetch failed: ${transactionError?.response?.data?.message || transactionError?.message}`);
        // }

        setTransactions([]);
      }

      // Load categories after transactions (so we have data to work with) - will be updated when month changes
      const categoriesResponse = await generateCategoriesFromTransactions();
      setCategoryData(categoriesResponse);
    } catch (err: any) {
      console.error("❌ [Spending] Error fetching spending data:", err);
      // Only set error for critical failures (like categories not loading)
      const errorMessage = err?.message || "Unable to load spending data";
      setError(`${errorMessage}. Please check your connection and try again.`);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [generateCategoriesFromTransactions]);

  // Helper function to map backend category names to frontend display names
  const mapCategoryName = (backendCategory: string): string => {
    const categoryMapping: Record<string, string> = {
      food: "Food & Dining",
      shopping: "Shopping",
      transport: "Transport",
      entertainment: "Entertainment",
      bills: "Bills & Utilities",
      healthcare: "Healthcare",
      education: "Education",
      travel: "Travel",
      groceries: "Groceries",
      fuel: "Fuel",
      subscriptions: "Subscriptions",
      income: "Income",
      other: "Other",
    };
    return categoryMapping[backendCategory.toLowerCase()] || backendCategory;
  };

  // Category data with monthly spending
  const sortedCategoryData = useMemo(() => {
    const result = categoryData
      .map((cat) => {
        // Calculate spending by looking for both exact match and mapped categories
        let spending = monthlyData?.monthlySpentByCategory?.[cat.name] || 0;

        // Also check for backend category names that map to this frontend category
        Object.entries(monthlyData?.monthlySpentByCategory || {}).forEach(
          ([backendCat, amount]) => {
            if (mapCategoryName(backendCat) === cat.name) {
              spending += amount;
            }
          }
        );

        return {
          ...cat,
          monthlySpent: spending,
        };
      })
      .sort((a, b) => (b.monthlySpent || 0) - (a.monthlySpent || 0));

    // Debug: log category spending data
    console.log("🐛 [Spending] Category spending data:", {
      categoryCount: result.length,
      monthlySpentByCategory: monthlyData?.monthlySpentByCategory,
      sortedCategories: result
        .slice(0, 3)
        .map((c) => ({ name: c.name, spent: c.monthlySpent })),
    });

    return result;
  }, [categoryData, monthlyData?.monthlySpentByCategory]);

  // Award XP once when categories are first loaded (not on every regeneration)
  useEffect(() => {
    if (sortedCategoryData.length > 0 && !xpAwardedRef.current) {
      xpAwardedRef.current = true;
      try {
        awardXPSilently("budget-review");
      } catch (xpError) {
        console.error(
          "[SpendingTab] Error awarding budget review XP:",
          xpError
        );
      }
    }
  }, [sortedCategoryData.length, awardXPSilently]);

  // Debug spending categories data flow
  useEffect(() => {
    console.log("🐛 [Spending] Debug info:", {
      sortedCategoryDataLength: sortedCategoryData.length,
      monthlyTransactionsLength: monthlyData?.monthlyTransactions?.length || 0,
      totalMonthlySpent: monthlyData?.monthlyTotalSpent || 0,
      hasSpendingData: sortedCategoryData.some(
        (c) => (c.monthlySpent || 0) > 0
      ),
      firstCategory: sortedCategoryData[0],
      firstTransaction: monthlyData?.monthlyTransactions?.[0],
    });
  }, [sortedCategoryData, monthlyData]);

  // Merchant data with monthly spending
  const sortedMerchantData = useMemo(() => {
    return Object.entries(monthlyData?.monthlySpentByMerchant || {})
      .map(([merchantName, amount]) => {
        const merchantInfo = getMerchantInfo(merchantName);
        return {
          id: merchantName.toLowerCase().replace(/\s+/g, "-"),
          name: merchantName,
          icon: merchantInfo.logo,
          color: merchantInfo.color || "#6366f1",
          monthlySpent: amount,
          category: merchantInfo.category || "other",
        };
      })
      .sort((a, b) => (b.monthlySpent || 0) - (a.monthlySpent || 0));
  }, [monthlyData?.monthlySpentByMerchant]);

  // Point selection handler
  const handlePointSelect = React.useCallback((point: ChartDataPoint) => {
    console.log("Selected point:", point);
  }, []);

  // Animation effects - with proper reset on month change
  useEffect(() => {
    // Only animate if we have a valid percentage
    if (
      monthlySpentPercentage === undefined ||
      monthlySpentPercentage === null
    ) {
      return;
    }

    // Stop any ongoing animations
    animatedProgress.stopAnimation();
    animatedScale.stopAnimation();

    // Reset to start position
    animatedProgress.setValue(0);
    animatedScale.setValue(0.9);

    // Small delay to ensure reset is complete before starting animation
    const timer = setTimeout(() => {
      // Animate to the correct percentage
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
    }, 50);

    return () => clearTimeout(timer);
  }, [selectedMonth, monthlySpentPercentage]);

  // Regenerate categories with dynamic budgets when month changes
  useEffect(() => {
    if (transactions.length > 0 && !updatingCategoriesRef.current) {
      // Create a hash of the current data to check if it has actually changed
      const currentDataHash = JSON.stringify({
        selectedMonth,
        transactionsLength: transactions.length,
        monthlyDataHash: monthlyData ? JSON.stringify(monthlyData) : null,
      });

      // Only update if data has actually changed
      if (currentDataHash === lastProcessedDataRef.current) {
        return; // No change, skip update
      }

      // Add a small delay to prevent rapid successive calls
      const timeoutId = setTimeout(async () => {
        if (updatingCategoriesRef.current) return; // Double-check

        try {
          updatingCategoriesRef.current = true;
          const categoriesResponse =
            await generateCategoriesFromTransactions(monthlyData);
          setCategoryData(categoriesResponse);
          lastProcessedDataRef.current = currentDataHash; // Update hash after successful update
        } catch (error) {
          console.error("❌ Error updating categories for month:", error);
        } finally {
          updatingCategoriesRef.current = false;
        }
      }, 500); // Increased debounce to 500ms

      return () => {
        clearTimeout(timeoutId);
        updatingCategoriesRef.current = false;
      };
    }
  }, [
    selectedMonth,
    monthlyData,
    generateCategoriesFromTransactions,
    transactions.length,
  ]); // Regenerate when month or monthly data changes

  // Auto-select most recent month with data when transactions are loaded
  useEffect(() => {
    if (transactions.length > 0) {
      // Get the most recent month with transaction data
      const monthsWithData = new Set<string>();
      transactions.forEach((transaction) => {
        if (transaction.date) {
          const txMonth = dayjs(transaction.date).format("YYYY-MM");
          monthsWithData.add(txMonth);
        }
      });

      if (monthsWithData.size > 0) {
        // Sort months (newest first) and select the most recent one
        const sortedMonths = Array.from(monthsWithData).sort((a, b) =>
          b.localeCompare(a)
        );
        const mostRecentMonth = sortedMonths[0];

        // Only change selected month if current selection has no data
        // Auto-switch to most recent month with data if current month is empty
        const currentMonthHasData = monthsWithData.has(selectedMonth);
        if (!currentMonthHasData) {
          setSelectedMonth(mostRecentMonth);
        }
      }
    }
  }, [transactions, selectedMonth]);

  // Initial data fetch
  // Clear data when user logs out
  useEffect(() => {
    if (!isLoggedIn) {
      console.log(
        "🧹 [Spending] User logged out - clearing all spending data..."
      );

      // Clear all user-specific state
      setTransactions([]);
      setCategoryData([]);
      setAvailableMonths([]);
      setError(null);
      setLoading(false);

      // Reset selected month to current month for next login
      setSelectedMonth(dayjs().format("YYYY-MM"));

      // Clear API cache to ensure fresh data for next user
      clearAllCache().catch((error) => {
        console.warn(
          "⚠️ [Spending] Failed to clear API cache on logout:",
          error
        );
      });

      console.log("✅ [Spending] All spending data cleared for logout");
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      // Always fetch data when logged in, regardless of bank connection status
      fetchData();
    }
  }, [isLoggedIn, selectedMonth]);

  // Loading state - show loading during data fetch or bank check
  if (loading || checkingBank) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: colors.background.secondary },
        ]}
      >
        <SpendingSkeleton />
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: colors.background.secondary },
        ]}
      >
        <View style={styles.errorContainer}>
          <Ionicons
            name="warning-outline"
            size={64}
            color={colors.error[500]}
            style={styles.errorIcon}
          />
          <Text style={[styles.errorTitle, { color: colors.text.primary }]}>
            Something went wrong
          </Text>
          <Text style={[styles.errorText, { color: colors.text.secondary }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[
              styles.retryButton,
              { backgroundColor: colors.primary[500] },
            ]}
            onPress={fetchData}
          >
            <Ionicons
              name="refresh"
              size={20}
              color="white"
              style={styles.retryButtonIcon}
            />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
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
        {/* Premium Header */}
        <View
          style={[
            styles.premiumHeader,
            { backgroundColor: colors.background.secondary },
          ]}
        >
          <View style={styles.premiumHeaderContent}>
            <View style={styles.premiumBrandSection}>
              <Text
                style={[
                  styles.premiumHeaderTitle,
                  { color: colors.text.primary },
                ]}
              >
                Spending
              </Text>
              <View
                style={[
                  styles.premiumBrandAccent,
                  { backgroundColor: colors.primary[500] },
                ]}
              />
            </View>
            <View style={styles.premiumHeaderRight}>
              <Text
                style={[
                  styles.premiumHeaderSubtitle,
                  { color: colors.text.secondary },
                ]}
              >
                {`Updated ${dayjs().format("HH:mm")}`}
              </Text>
              <TouchableOpacity
                style={[
                  styles.premiumHeaderButton,
                  { backgroundColor: colors.background.primary },
                ]}
                activeOpacity={0.8}
                onPress={handleInfoPress}
              >
                <Ionicons
                  name="information-circle"
                  size={20}
                  color={colors.primary[500]}
                />
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
        {transactions.length === 0 && (
          <View
            style={[
              styles.emptyStateContainer,
              { backgroundColor: colors.background.primary },
            ]}
          >
            <View style={styles.emptyStateContent}>
              <Ionicons
                name="wallet-outline"
                size={64}
                color={colors.text.secondary}
                style={styles.emptyStateIcon}
              />
              <Text
                style={[styles.emptyStateTitle, { color: colors.text.primary }]}
              >
                No Expenses Yet
              </Text>
              <Text
                style={[
                  styles.emptyStateDescription,
                  { color: colors.text.secondary },
                ]}
              >
                Start tracking your spending by adding expenses manually or
                importing CSV data to see detailed insights about your financial
                habits.
              </Text>
              <TouchableOpacity
                style={[
                  styles.emptyStateButton,
                  { backgroundColor: colors.primary[500] },
                ]}
                onPress={() => router.push("/add-transaction")}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="add"
                  size={20}
                  color="white"
                  style={styles.emptyStateButtonIcon}
                />
                <Text style={styles.emptyStateButtonText}>Add Expense</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Empty State - No Transactions for This Month */}
        {transactions.length === 0 && hasBank && (
          <View
            style={[
              styles.emptyStateContainer,
              { backgroundColor: colors.background.primary },
            ]}
          >
            <View style={styles.emptyStateContent}>
              <Ionicons
                name="receipt-outline"
                size={64}
                color={colors.text.secondary}
                style={styles.emptyStateIcon}
              />
              <Text
                style={[styles.emptyStateTitle, { color: colors.text.primary }]}
              >
                No Spending Data
              </Text>
              <Text
                style={[
                  styles.emptyStateDescription,
                  { color: colors.text.secondary },
                ]}
              >
                You don&apos;t have any transactions for {selectedMonth}. Try
                selecting a different month or wait for new transactions to
                sync.
              </Text>
              <TouchableOpacity
                style={[
                  styles.emptyStateButton,
                  { backgroundColor: colors.primary[500] },
                ]}
                onPress={fetchData}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="refresh"
                  size={20}
                  color="white"
                  style={styles.emptyStateButtonIcon}
                />
                <Text style={styles.emptyStateButtonText}>Refresh Data</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Budget Summary Card */}
        {selectedTab === "summary" && (
          <BudgetSummaryCard
            selectedMonth={selectedMonth}
            monthlyTotalSpent={monthlyData?.monthlyTotalSpent || 0}
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
            {/* All users have free access to analytics */}
            <SpendingAnalyticsSection
              selectedMonth={selectedMonth}
              chartData={chartData}
              hasTransactions={
                (monthlyData?.monthlyTransactions?.length || 0) > 0
              }
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
              <>
                <SpendingCategoryListClean
                  sortedCategoryData={sortedCategoryData}
                  filteredTransactions={monthlyData?.monthlyTransactions || []}
                  formatAmount={formatAmount}
                  currency="GBP"
                  onCategoryPress={(category) => {
                    console.log("Category pressed:", category.name);
                  }}
                />
              </>
            )}

            {/* Merchant List */}
            {spendingTab === "merchants" && (
              <SpendingMerchantList
                sortedMerchantData={sortedMerchantData}
                filteredTransactions={monthlyData?.monthlyTransactions || []}
                formatAmount={formatAmount}
                currency="GBP"
                onMerchantPress={(merchant) => {
                  console.log("Merchant pressed:", merchant.name);
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
    paddingBottom: spacing["2xl"],
  },

  // Header Styles
  premiumHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    marginBottom: spacing.sm,
  },
  premiumHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 40,
  },
  premiumBrandSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  premiumHeaderTitle: {
    fontSize: 28,
    fontWeight: "700",
    marginRight: spacing.sm,
    lineHeight: 36,
  },
  premiumBrandAccent: {
    width: 4,
    height: 20,
    borderRadius: 2,
  },
  premiumHeaderRight: {
    alignItems: "flex-end",
    justifyContent: "flex-start",
  },
  premiumHeaderSubtitle: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: spacing.sm,
    opacity: 0.7,
    lineHeight: 18,
  },
  premiumHeaderButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
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
    alignItems: "center",
  },
  emptyStateContent: {
    alignItems: "center",
    maxWidth: 280,
  },
  emptyStateIcon: {
    marginBottom: spacing.lg,
    opacity: 0.6,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  emptyStateDescription: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  emptyStateButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emptyStateButtonIcon: {
    marginRight: spacing.sm,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },

  // Error Styles
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  errorIcon: {
    marginBottom: spacing.lg,
    opacity: 0.8,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: spacing.xl,
    lineHeight: 22,
    maxWidth: 280,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  retryButtonIcon: {
    marginRight: spacing.sm,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
