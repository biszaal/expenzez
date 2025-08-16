import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  Animated,
  Easing,
  Pressable,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import {
  spacing,
  borderRadius,
  shadows,
  typography,
} from "../../constants/theme";
import { bankingAPI } from "../../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import dayjs from "dayjs";
import { View as RNView } from "react-native";
import { useAuthGuard } from "../../hooks/useAuthGuard";
import { LineChart } from "react-native-chart-kit";
import Svg, {
  Circle,
  Path,
  Text as SvgText,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  G,
} from "react-native-svg";

// Create animated SVG components
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
import { FontAwesome5 } from "@expo/vector-icons";
// REMOVE: import { VictoryPie } from "victory-native";

const { width } = Dimensions.get("window");

// Donut chart constants
const DONUT_SIZE = 180;
const STROKE_WIDTH = 18;
const RADIUS = (DONUT_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Helper to render category icon
const renderCategoryIcon = (icon: string, color: string) => {
  switch (icon) {
    case "bus-clock":
      return (
        <MaterialCommunityIcons name="bus-clock" size={24} color={color} />
      );
    case "food-apple-outline":
      return (
        <MaterialCommunityIcons
          name="food-apple-outline"
          size={24}
          color={color}
        />
      );
    case "game-controller-outline":
      return (
        <MaterialCommunityIcons
          name={"game-controller-outline" as any}
          size={24}
          color={color}
        />
      );
    case "flash-outline":
      return <Ionicons name="flash-outline" size={24} color={color} />;
    case "bag-outline":
      return <Ionicons name="bag-outline" size={24} color={color} />;
    case "fitness-outline":
      return <Ionicons name="fitness-outline" size={24} color={color} />;
    default:
      return <Ionicons name="pricetag-outline" size={24} color={color} />;
  }
};

export default function SpendingPage() {
  const router = useRouter();
  const { isLoggedIn, hasBank, checkingBank } = useAuthGuard(undefined, true);
  const { colors } = useTheme();
  const AnimatedCircle = Animated.createAnimatedComponent(Circle);
  const animatedProgress = React.useRef(new Animated.Value(0)).current;
  const animatedScale = React.useRef(new Animated.Value(0.9)).current;
  const [selectedTab, setSelectedTab] = useState<"summary" | "categories">(
    "summary"
  );
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [months, setMonths] = useState<any[]>([]);
  const [totalBudget, setTotalBudget] = useState<number>(0);
  const [totalSpent, setTotalSpent] = useState<number>(0);
  const [leftToSpend, setLeftToSpend] = useState<number>(0);
  const [profile, setProfile] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState<string>("GBP");
  // Add state for merchant/category tab
  const [spendingTab, setSpendingTab] = useState<"categories" | "merchants">(
    "categories"
  );
  // Add sort state
  const [sortBy, setSortBy] = useState<"spend" | "name" | "count">("spend");
  const [customBudget, setCustomBudget] = useState<number | null>(null); // Add this if you want to support custom budgets in the future

  // Generate months dynamically from available transaction data
  const generateMonthsFromTransactions = (transactions: any[]) => {
    const monthSet = new Set<string>();

    transactions.forEach((tx) => {
      if (tx.date) {
        const monthKey = dayjs(tx.date).format("YYYY-MM");
        monthSet.add(monthKey);
      }
    });

    // Convert to array and sort
    const months = Array.from(monthSet)
      .sort()
      .map((monthKey) => {
        const date = dayjs(monthKey);
        return {
          id: monthKey,
          name: date.format("MMM YYYY"),
          value: monthKey,
        };
      });

    // If no transactions, add current month
    if (months.length === 0) {
      const currentMonth = dayjs().format("YYYY-MM");
      months.push({
        id: currentMonth,
        name: dayjs().format("MMM YYYY"),
        value: currentMonth,
      });
    }

    return months;
  };

  // Generate categories dynamically from transaction data with stored budgets
  const generateCategoriesFromTransactions = async (transactions: any[]) => {
    const categoryMap = new Map<
      string,
      { count: number; totalSpent: number }
    >();

    transactions.forEach((tx) => {
      if (tx.amount < 0) {
        // Only expenses
        const category = tx.category || "Other";
        const existing = categoryMap.get(category) || {
          count: 0,
          totalSpent: 0,
        };
        categoryMap.set(category, {
          count: existing.count + 1,
          totalSpent: existing.totalSpent + Math.abs(tx.amount),
        });
      }
    });

    // Load stored budgets
    const storedCategoryBudgets = await AsyncStorage.getItem("categoryBudgets");
    const parsedStoredBudgets = storedCategoryBudgets
      ? JSON.parse(storedCategoryBudgets)
      : {};

    // Load main budget or use default
    const storedMainBudget = await AsyncStorage.getItem("mainBudget");
    const mainBudget = parseFloat(storedMainBudget || "2000");

    // Convert to category objects with stored or default budgets
    const categories = Array.from(categoryMap.entries()).map(
      ([name, data], index) => {
        const categoryId = name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();

        // Use stored budget if available, otherwise use default £2000 divided by number of categories
        const storedBudget = parsedStoredBudgets[categoryId];
        const defaultBudget =
          storedBudget !== undefined
            ? storedBudget
            : categoryMap.size > 0
              ? Math.floor(mainBudget / categoryMap.size)
              : 200;

        return {
          id: categoryId,
          name,
          icon: getCategoryIcon(name),
          color: getCategoryColor(name, index),
          defaultBudget: defaultBudget,
          spent: 0, // Will be calculated per month
        };
      }
    );

    // If no transactions yet, create a default "Other" category with full budget
    if (categories.length === 0) {
      categories.push({
        id: "other",
        name: "Other",
        icon: getCategoryIcon("Other"),
        color: getCategoryColor("Other", 0),
        defaultBudget: mainBudget,
        spent: 0,
      });
    }

    return categories;
  };

  // Dynamic icon mapping based on category name
  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (
      name.includes("food") ||
      name.includes("dining") ||
      name.includes("restaurant")
    )
      return "food-apple-outline";
    if (
      name.includes("transport") ||
      name.includes("travel") ||
      name.includes("uber") ||
      name.includes("taxi")
    )
      return "bus-clock";
    if (
      name.includes("shop") ||
      name.includes("retail") ||
      name.includes("amazon")
    )
      return "bag-outline";
    if (
      name.includes("entertainment") ||
      name.includes("game") ||
      name.includes("movie")
    )
      return "game-controller-outline";
    if (
      name.includes("bill") ||
      name.includes("utility") ||
      name.includes("electric") ||
      name.includes("gas")
    )
      return "flash-outline";
    if (
      name.includes("health") ||
      name.includes("fitness") ||
      name.includes("gym") ||
      name.includes("medical")
    )
      return "fitness-outline";
    return "pricetag-outline";
  };

  // Dynamic color assignment
  const getCategoryColor = (categoryName: string, index: number) => {
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#FECA57",
      "#FF9FF3",
      "#95A5A6",
      "#F8B500",
      "#6C5CE7",
      "#A29BFE",
    ];
    return colors[index % colors.length];
  };

  // Get currency from transactions (use first transaction's currency or default)
  const getCurrency = (transactions: any[]) => {
    if (transactions.length > 0) {
      return transactions[0].currency || "GBP";
    }
    return "GBP";
  };

  // Format currency dynamically
  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  // Calculate cumulative daily spending for chart (moved before hooks to maintain order)
  const dailySpendingData = React.useMemo(() => {
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
    const currentMonth = today.format("YYYY-MM");
    
    // For current month, show up to today's date for fair comparison
    // For past months, show the full month since the month is complete
    const todayDate = today.date();
    const isCurrentMonth = selectedMonth === currentMonth;
    
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

    // Debug log for chart data verification
    console.log('Chart Data Debug:', {
      selectedMonth,
      maxDay,
      currentMonthDataLimit,
      todayDate: dayjs().date(),
      isCurrentMonth,
      dataLength: data.length,
      prevMonthDataLength: prevMonthData.length,
      maxPrevValue: Math.max(...prevMonthData),
      maxCurrentValue: Math.max(...data),
      prevMonthSpendingTotal: Object.values(previousMonthSpending).reduce((a, b) => a + b, 0)
    });

    return { labels, data, prevMonthData };
  }, [transactions, selectedMonth]);

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/auth/Login");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 🚀 PERFORMANCE: Fetch connection status and transactions in parallel
        const [connectionStatusData, transactionsData] = await Promise.all([
          bankingAPI.checkBankConnectionStatus().catch((err) => {
            console.log(
              "Could not check connection status, proceeding with transaction fetch"
            );
            return { hasExpiredTokens: false };
          }),
          bankingAPI.getAllTransactions().catch((err) => {
            console.error("❌ Error fetching transactions:", err);
            return { transactions: [] };
          }),
        ]);

        if (connectionStatusData.hasExpiredTokens) {
          console.log("Expired tokens detected in spending tab");
          // Still use cached data if available
        }

        let allTransactions: any[] = [];
        if (
          transactionsData.transactions &&
          Array.isArray(transactionsData.transactions)
        ) {
          // Transform transactions to our format
          allTransactions = transactionsData.transactions.map(
            (tx: any, idx: number) => ({
              id: tx.transactionId || tx.id || `tx-${idx}`,
              amount:
                tx.type === "debit"
                  ? -Math.abs(Number(tx.amount || 0))
                  : Math.abs(Number(tx.amount || 0)),
              currency: tx.currency || "GBP",
              description: tx.description || "Transaction",
              date: tx.date || tx.createdAt || new Date().toISOString(),
              category: tx.category || "Other",
              accountId: tx.accountId,
              accountName: tx.accountName || "Unknown Account",
              type: tx.type,
              merchant: tx.merchant,
            })
          );
        }

        setTransactions(allTransactions);

        // Set currency from transaction data
        const transactionCurrency = getCurrency(allTransactions);
        setCurrency(transactionCurrency);

        // Generate months dynamically from transaction data
        const monthsArr = generateMonthsFromTransactions(allTransactions);
        setMonths(monthsArr);

        // Set most recent month as selected
        const mostRecentMonth =
          monthsArr.length > 0
            ? monthsArr[monthsArr.length - 1].value
            : dayjs().format("YYYY-MM");
        setSelectedMonth(mostRecentMonth);

        // Generate categories dynamically from transaction data with stored budgets
        const dynamicCategories =
          await generateCategoriesFromTransactions(allTransactions);
        setCategoryData(dynamicCategories);

        // Calculate totals from dynamic categories
        const totalBudget = dynamicCategories.reduce(
          (sum, cat) => sum + cat.defaultBudget,
          0
        );
        const totalSpent = dynamicCategories.reduce(
          (sum, cat) => sum + cat.spent,
          0
        );

        setTotalBudget(totalBudget);
        setTotalSpent(totalSpent);
        setLeftToSpend(totalBudget - totalSpent);
      } catch (error: any) {
        console.error("[Spending] Error:", error.message);
        setError("Failed to load spending data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isLoggedIn, router]);

  const spentPercentage =
    totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const overBudget = totalSpent > totalBudget;

  React.useEffect(() => {
    // Reset animations and start fresh
    animatedProgress.setValue(0);
    animatedScale.setValue(0.9);
    
    // Add a small delay to create a better visual effect
    setTimeout(() => {
      // Parallel animations for smooth effect
      Animated.parallel([
        Animated.timing(animatedProgress, {
          toValue: 1,
          duration: 1500, // Faster duration while keeping smoothness
          useNativeDriver: false,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1), // Material Design easing
        }),
        Animated.sequence([
          Animated.timing(animatedScale, {
            toValue: 1.05,
            duration: 200,
            useNativeDriver: false,
            easing: Easing.out(Easing.ease),
          }),
          Animated.timing(animatedScale, {
            toValue: 0.98,
            duration: 150,
            useNativeDriver: false,
            easing: Easing.ease,
          }),
          Animated.timing(animatedScale, {
            toValue: 1,
            duration: 250,
            useNativeDriver: false,
            easing: Easing.out(Easing.ease),
          }),
        ]),
      ]).start();
    }, 200); // Shorter delay before animation starts
  }, [monthlySpentPercentage, monthlyOverBudget, selectedMonth]);
  const animatedStrokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  // All hooks above, then early return
  if (!isLoggedIn || checkingBank) {
    return null;
  }

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: colors.background.secondary },
        ]}
      >
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text
            style={{
              color: colors.text.primary,
              fontSize: 18,
              marginBottom: 16,
            }}
          >
            Loading spending data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: colors.background.secondary },
        ]}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 32,
          }}
        >
          <Text
            style={{
              color: colors.error[500],
              fontSize: 18,
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            {error}
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: colors.primary[500],
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8,
            }}
            onPress={() => {
              setError(null);
              // Re-trigger useEffect by toggling a state
            }}
          >
            <Text style={{ color: "#FFF", fontWeight: "600" }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Filter transactions for selected month
  const filteredTransactions = transactions.filter((tx) => {
    if (!tx.date) return false;
    const txDate = dayjs(tx.date);
    const selectedDate = dayjs(selectedMonth);
    return txDate.format("YYYY-MM") === selectedMonth;
  });

  // Calculate spending for selected month only
  const monthlySpentByCategory: Record<string, number> = {};
  filteredTransactions.forEach((txn) => {
    if (txn.amount < 0) {
      const category = txn.category || "Other";
      monthlySpentByCategory[category] =
        (monthlySpentByCategory[category] || 0) + Math.abs(txn.amount);
    }
  });

  const monthlyTotalSpent = Object.values(monthlySpentByCategory).reduce(
    (sum, amount) => sum + amount,
    0
  );

  // Calculate previous month comparison
  const selectedMonthIndex = months.findIndex((m) => m.value === selectedMonth);
  const prevMonth =
    selectedMonthIndex > 0 ? months[selectedMonthIndex - 1] : null;
  const prevMonthSpent = (() => {
    if (!prevMonth) return 0;
    const prevMonthTxns = transactions.filter((tx) => {
      if (!tx.date) return false;
      return dayjs(tx.date).format("YYYY-MM") === prevMonth.value;
    });
    return prevMonthTxns.reduce(
      (sum, tx) => (tx.amount < 0 ? sum + Math.abs(tx.amount) : sum),
      0
    );
  })();

  const diff = monthlyTotalSpent - prevMonthSpent;
  const diffLabel =
    diff >= 0
      ? `▲ ${formatAmount(Math.abs(diff), currency)}`
      : `▼ ${formatAmount(Math.abs(diff), currency)}`;
  const diffColor = diff >= 0 ? colors.error[500] : colors.success[500];

  // Update category data with monthly spending for display
  const monthlyCategoryData = categoryData.map((cat) => ({
    ...cat,
    monthlySpent: monthlySpentByCategory[cat.name] || 0,
  }));

  // Sort logic for categories and merchants (use monthly spending)
  const sortedCategoryData = [...monthlyCategoryData].sort((a, b) => {
    if (sortBy === "spend")
      return (b.monthlySpent || 0) - (a.monthlySpent || 0);
    if (sortBy === "name") return a.name.localeCompare(b.name);
    return 0;
  });

  // Use monthly totals for budget calculations
  const monthlySpentPercentage =
    totalBudget > 0 ? (monthlyTotalSpent / totalBudget) * 100 : 0;
  const monthlyOverBudget = monthlyTotalSpent > totalBudget;
  const donutProgress = monthlyOverBudget ? 100 : monthlySpentPercentage;
  const donutColor = monthlyOverBudget
    ? colors.error[500]
    : colors.primary[500];

  // Calculate what to show for leftToSpend (use monthly data)
  let displayLeftToSpend = totalBudget - monthlyTotalSpent;

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
              >
                <Feather name="info" size={20} color={colors.primary[500]} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Premium Tab Switch */}
        <View style={styles.premiumTabContainer}>
          <View
            style={[
              styles.premiumTabSwitch,
              { backgroundColor: colors.background.primary },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.premiumTabButton,
                {
                  backgroundColor:
                    selectedTab === "summary"
                      ? colors.primary[500]
                      : "transparent",
                },
              ]}
              onPress={() => setSelectedTab("summary")}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.premiumTabIcon,
                  {
                    backgroundColor:
                      selectedTab === "summary"
                        ? `${colors.text.inverse}25`
                        : `${colors.primary[500]}15`,
                  },
                ]}
              >
                <Ionicons
                  name="wallet"
                  size={20}
                  color={
                    selectedTab === "summary"
                      ? colors.text.inverse
                      : colors.primary[500]
                  }
                />
              </View>
              <Text
                style={[
                  styles.premiumTabText,
                  {
                    color:
                      selectedTab === "summary"
                        ? colors.text.inverse
                        : colors.primary[500],
                  },
                ]}
              >
                Budget
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.premiumTabButton,
                {
                  backgroundColor:
                    selectedTab === "categories"
                      ? colors.primary[500]
                      : "transparent",
                },
              ]}
              onPress={() => setSelectedTab("categories")}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.premiumTabIcon,
                  {
                    backgroundColor:
                      selectedTab === "categories"
                        ? `${colors.text.inverse}25`
                        : `${colors.primary[500]}15`,
                  },
                ]}
              >
                <Ionicons
                  name="analytics"
                  size={20}
                  color={
                    selectedTab === "categories"
                      ? colors.text.inverse
                      : colors.primary[500]
                  }
                />
              </View>
              <Text
                style={[
                  styles.premiumTabText,
                  {
                    color:
                      selectedTab === "categories"
                        ? colors.text.inverse
                        : colors.primary[500],
                  },
                ]}
              >
                Spending
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Premium Month Picker */}
        <View style={styles.premiumMonthPickerContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.premiumMonthPickerContent}
          >
            {months.map((monthObj) => (
              <TouchableOpacity
                key={monthObj.id}
                style={[
                  styles.premiumMonthButton,
                  {
                    backgroundColor:
                      selectedMonth === monthObj.value
                        ? colors.primary[500]
                        : colors.background.primary,
                    borderColor:
                      selectedMonth === monthObj.value
                        ? colors.primary[500]
                        : colors.border.light,
                  },
                ]}
                onPress={() => setSelectedMonth(monthObj.value)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.premiumMonthButtonText,
                    {
                      color:
                        selectedMonth === monthObj.value
                          ? colors.text.inverse
                          : colors.text.primary,
                      fontWeight:
                        selectedMonth === monthObj.value ? "700" : "600",
                    },
                  ]}
                >
                  {monthObj.name}
                </Text>
                {selectedMonth === monthObj.value && (
                  <View
                    style={[
                      styles.premiumMonthIndicator,
                      { backgroundColor: colors.text.inverse },
                    ]}
                  />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Simple Budget Overview */}
        {selectedTab === "summary" && (
          <View style={styles.simpleBudgetContainer}>
            <View style={[styles.simpleBudgetCard, { backgroundColor: colors.background.primary }]}>
              <Text style={[styles.simpleBudgetTitle, { color: colors.text.primary }]}>
                {dayjs(selectedMonth).format("MMMM YYYY")} Budget
              </Text>
              
              <View style={styles.simpleBudgetStats}>
                <View style={styles.simpleBudgetStat}>
                  <Text style={[styles.simpleBudgetAmount, { color: colors.text.primary }]}>
                    {formatAmount(monthlyTotalSpent, currency)}
                  </Text>
                  <Text style={[styles.simpleBudgetLabel, { color: colors.text.secondary }]}>
                    Spent
                  </Text>
                </View>
                
                <View style={styles.simpleBudgetStat}>
                  <Text style={[styles.simpleBudgetAmount, { color: colors.text.primary }]}>
                    {formatAmount(totalBudget, currency)}
                  </Text>
                  <Text style={[styles.simpleBudgetLabel, { color: colors.text.secondary }]}>
                    Budget
                  </Text>
                </View>
              </View>
              
              {/* Animated SVG Donut Chart */}
              <Animated.View style={[styles.donutChartContainer, {
                transform: [{ scale: animatedScale }]
              }]}>
                <View style={styles.donutChart}>
                  <Svg width={200} height={200} style={{ position: 'absolute' }}>
                    {/* Background Ring */}
                    <Circle
                      cx={100}
                      cy={100}
                      r={88}
                      fill="none"
                      stroke={colors.background.secondary}
                      strokeWidth={24}
                    />
                    
                    {/* Progress Ring with Rounded Caps */}
                    {monthlySpentPercentage > 0 && (
                      <AnimatedCircle
                        cx={100}
                        cy={100}
                        r={88}
                        fill="none"
                        stroke={monthlyOverBudget ? colors.error[500] : colors.primary[500]}
                        strokeWidth={24}
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 88}`}
                        strokeDashoffset={animatedProgress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [2 * Math.PI * 88, 2 * Math.PI * 88 * (1 - Math.min(100, monthlySpentPercentage) / 100)]
                        })}
                        transform={`rotate(-90 100 100)`}
                      />
                    )}
                  </Svg>
                  
                  {/* Center Content with Fade Animation */}
                  <Animated.View style={[styles.donutCenter, { 
                    backgroundColor: colors.background.primary,
                    opacity: animatedProgress.interpolate({
                      inputRange: [0, 0.1, 1],
                      outputRange: [0.8, 1, 1]
                    })
                  }]}>
                    <Animated.Text style={[styles.donutCenterPercentage, { 
                      color: monthlyOverBudget ? colors.error[500] : colors.primary[500],
                      opacity: animatedProgress.interpolate({
                        inputRange: [0, 0.2, 1],
                        outputRange: [0.7, 1, 1]
                      })
                    }]}>
                      {Math.round(monthlySpentPercentage)}%
                    </Animated.Text>
                    <Animated.Text style={[styles.donutCenterLabel, { 
                      color: colors.text.secondary,
                      opacity: animatedProgress.interpolate({
                        inputRange: [0, 0.3, 1],
                        outputRange: [0.6, 1, 1]
                      })
                    }]}>
                      USED
                    </Animated.Text>
                    <Animated.Text style={[styles.donutCenterAmount, { 
                      color: displayLeftToSpend < 0 ? colors.error[500] : colors.text.primary,
                      opacity: animatedProgress.interpolate({
                        inputRange: [0, 0.4, 1],
                        outputRange: [0.5, 1, 1]
                      })
                    }]}>
                      {displayLeftToSpend < 0 
                        ? `Over ${formatAmount(Math.abs(displayLeftToSpend), currency)}`
                        : `${formatAmount(displayLeftToSpend, currency)} left`
                      }
                    </Animated.Text>
                  </Animated.View>
                </View>
              </Animated.View>
            </View>
          </View>
        )}

        {/* Premium Spending Analytics Card */}
        {selectedTab === "categories" && (
          <View style={styles.premiumSpendingCardWrapper}>
            <View
              style={[
                styles.premiumSpendingCard,
                { backgroundColor: colors.background.primary },
              ]}
            >
              {/* Analytics Header */}
              <View style={styles.premiumSpendingHeader}>
                <View style={styles.premiumSpendingHeaderLeft}>
                  <View
                    style={[
                      styles.premiumAnalyticsIcon,
                      { backgroundColor: "#4ECDC4" },
                    ]}
                  >
                    <Ionicons name="analytics" size={24} color="white" />
                  </View>
                  <View style={styles.premiumSpendingHeaderText}>
                    <Text
                      style={[
                        styles.premiumSpendingTitle,
                        { color: colors.text.primary },
                      ]}
                    >
                      {dayjs(selectedMonth).format("MMMM")} Analytics
                    </Text>
                    <Text
                      style={[
                        styles.premiumSpendingSubtitle,
                        { color: colors.text.secondary },
                      ]}
                    >
                      Spending overview
                    </Text>
                  </View>
                </View>
              </View>

              {/* Spending Stats */}
              <View style={styles.premiumSpendingStatsRow}>
                <View style={styles.premiumSpendingStat}>
                  <Text
                    style={[
                      styles.premiumSpendingStatValue,
                      { color: colors.text.primary },
                    ]}
                  >
                    {formatAmount(monthlyTotalSpent, currency)}
                  </Text>
                  <Text
                    style={[
                      styles.premiumSpendingStatLabel,
                      { color: colors.text.secondary },
                    ]}
                  >
                    Total Spent
                  </Text>
                </View>

                {prevMonth && (
                  <View style={styles.premiumSpendingComparison}>
                    <View
                      style={[
                        styles.premiumComparisonBadge,
                        { backgroundColor: diff >= 0 ? "#FEF2F2" : "#F0FDF4" },
                      ]}
                    >
                      <Ionicons
                        name={diff >= 0 ? "trending-up" : "trending-down"}
                        size={16}
                        color={diff >= 0 ? "#EF4444" : "#10B981"}
                      />
                      <Text
                        style={[
                          styles.premiumComparisonText,
                          { color: diff >= 0 ? "#EF4444" : "#10B981" },
                        ]}
                      >
                        {Math.abs(diff).toFixed(0)}%
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.premiumComparisonLabel,
                        { color: colors.text.secondary },
                      ]}
                    >
                      vs. {prevMonth.name}
                    </Text>
                  </View>
                )}
              </View>

              {/* Premium Custom Chart Section */}
              <View style={styles.premiumChartSection}>
                {dailySpendingData.data.some((value) => value > 0) ? (
                  <View
                    style={[
                      styles.premiumCustomChartContainer,
                      { backgroundColor: colors.background.primary },
                    ]}
                  >

                    {/* Chart Legend */}
                    <View style={styles.chartLegendContainer}>
                      <View style={styles.chartLegendItem}>
                        <View style={[styles.chartLegendDot, { backgroundColor: monthlyOverBudget ? colors.error[500] : colors.primary[500] }]} />
                        <Text style={[styles.chartLegendText, { color: colors.text.primary }]}>
                          {dayjs(selectedMonth).format('MMM YYYY')}
                        </Text>
                      </View>
                      {dailySpendingData.prevMonthData && dailySpendingData.prevMonthData.length > 0 && (
                        <View style={styles.chartLegendItem}>
                          <View style={[styles.chartLegendDot, { backgroundColor: 'rgba(156, 163, 175, 1)' }]} />
                          <Text style={[styles.chartLegendText, { color: colors.text.secondary }]}>
                            {dayjs(selectedMonth).subtract(1, 'month').format('MMM YYYY')}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Current Day Value Display */}
                    <View style={styles.currentValueContainer}>
                      <Text style={[styles.currentValue, { color: colors.success[500] }]}>
                        £{dailySpendingData.data[dailySpendingData.data.length - 1]?.toFixed(2) || '0.00'}
                      </Text>
                      <View style={styles.currentValueMeta}>
                        <Ionicons name="arrow-down" size={16} color={colors.success[500]} />
                        <Text style={[styles.currentValueLabel, { color: colors.text.secondary }]}>
                          vs. {dayjs().date()} {dayjs(selectedMonth).subtract(1, 'month').format('MMM')}
                        </Text>
                      </View>
                    </View>

                    {/* Enhanced Comparison Chart */}
                    <View
                      style={[
                        styles.enhancedChartContainer,
                        {
                          backgroundColor: colors.background.primary,
                          ...shadows.sm,
                        },
                      ]}
                    >
                      {/* Progressive Line Drawing Animation */}
                      <View style={styles.animatedChartWrapper}>
                        {/* Background static chart (hidden) */}
                        <View style={{ position: 'absolute', opacity: 0 }}>
                        <LineChart
                        data={{
                          labels: dailySpendingData.labels.slice(0, dailySpendingData.data.length),
                          datasets: [
                            {
                              data: dailySpendingData.data,
                              color: (opacity = 1) =>
                                monthlyOverBudget 
                                  ? `rgba(239, 68, 68, ${opacity})` // Red gradient for over budget
                                  : `rgba(99, 102, 241, ${opacity})`, // Purple gradient for within budget
                              strokeWidth: 4,
                              withShadow: true,
                              withDots: false,
                            },
                            // Previous month data (trimmed to match current month length for comparison)
                            ...(dailySpendingData.prevMonthData && dailySpendingData.prevMonthData.length > 0
                              ? [
                                  {
                                    data: dailySpendingData.prevMonthData.slice(0, dailySpendingData.data.length),
                                    color: (opacity = 1) =>
                                      `rgba(156, 163, 175, ${Math.min(1, opacity + 0.3)})`, // Darker gray line for previous month
                                    strokeWidth: 3,
                                    withDots: false,
                                    withShadow: false,
                                  },
                                ]
                              : []),
                          ],
                        }}
                        fromZero={false}
                        yAxisInterval={1}
                        showGrid={false}
                        showHorizontalLines={false}
                        showVerticalLines={false}
                        width={width}
                        height={200}
                        yAxisLabel=""
                        yAxisSuffix=""
                        withHorizontalLines={false}
                        withVerticalLines={false}
                        withInnerLines={false}
                        chartConfig={{
                          backgroundColor: "transparent",
                          backgroundGradientFrom: colors.background.primary,
                          backgroundGradientTo: colors.background.primary,
                          backgroundGradientFromOpacity: 0,
                          backgroundGradientToOpacity: 0,
                          fillShadowGradient: monthlyOverBudget ? colors.error[500] : colors.primary[500],
                          fillShadowGradientFrom: monthlyOverBudget ? colors.error[500] : colors.primary[500],
                          fillShadowGradientTo: monthlyOverBudget ? colors.error[100] : colors.primary[100],
                          fillShadowGradientFromOpacity: 0.1,
                          fillShadowGradientToOpacity: 0,
                          decimalPlaces: 0,
                          color: (opacity = 1) => "transparent",
                          labelColor: (opacity = 1) => "transparent",
                          style: {
                            borderRadius: 20,
                          },
                          propsForDots: {
                            r: "4",
                            strokeWidth: "3",
                            stroke: "white",
                            fill: monthlyOverBudget ? colors.error[500] : colors.primary[500],
                            fillOpacity: 1,
                          },
                          propsForBackgroundLines: {
                            stroke: "transparent",
                            strokeWidth: 0,
                          },
                          propsForLabels: {
                            fontSize: 0,
                          },
                          formatYLabel: () => "",
                          yAxisMin: () => 0,
                          yAxisMax: () => {
                            const allData = [
                              ...dailySpendingData.data,
                              ...(dailySpendingData.prevMonthData || [])
                            ];
                            const maxValue = Math.max(...allData);
                            // Force a reasonable scale that makes both lines visible
                            return Math.max(1000, maxValue * 1.1);
                          },
                        }}
                        style={{
                          marginVertical: 8,
                          borderRadius: 16,
                          marginHorizontal: 0,
                        }}
                        withDots={false}
                        withShadow={false}
                        withInnerLines={false}
                        withOuterLines={false}
                        withVerticalLines={false}
                        withHorizontalLines={false}
                        segments={0}
                        bezier
                        renderDotContent={({ x, y, index, indexData }) => {
                          // Show dot on the last data point (current day for current month)
                          if (index === dailySpendingData.data.length - 1) {
                            return (
                              <Animated.View key={index} style={{
                                position: 'absolute',
                                top: y - 10,
                                left: x - 10,
                                width: 20,
                                height: 20,
                                borderRadius: 10,
                                backgroundColor: monthlyOverBudget ? colors.error[500] : colors.primary[500],
                                borderWidth: 4,
                                borderColor: '#FFFFFF',
                                zIndex: 10,
                                transform: [
                                  {
                                    scale: animatedProgress.interpolate({
                                      inputRange: [0, 0.7, 1],
                                      outputRange: [0, 1.2, 1]
                                    })
                                  }
                                ],
                                shadowColor: monthlyOverBudget ? colors.error[500] : colors.primary[500],
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.3,
                                shadowRadius: 4,
                                elevation: 5
                              }} />
                            );
                          }
                          return null;
                        }}
                      />
                        </View>
                        
                        {/* Animated mask that reveals chart from left to right */}
                        <View style={styles.chartMaskContainer}>
                          <Animated.View style={[
                            styles.chartRevealMask,
                            {
                              width: animatedProgress.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0%', '100%']
                              })
                            }
                          ]}>
                            <LineChart
                              data={{
                                labels: dailySpendingData.labels.slice(0, dailySpendingData.data.length),
                                datasets: [
                                  {
                                    data: dailySpendingData.data,
                                    color: (opacity = 1) =>
                                      monthlyOverBudget 
                                        ? `rgba(239, 68, 68, ${opacity})` 
                                        : `rgba(99, 102, 241, ${opacity})`,
                                    strokeWidth: 4,
                                    withShadow: true,
                                    withDots: false,
                                  },
                                  // Previous month data (trimmed to match current month length for comparison)
                                  ...(dailySpendingData.prevMonthData && dailySpendingData.prevMonthData.length > 0
                                    ? [
                                        {
                                          data: dailySpendingData.prevMonthData.slice(0, dailySpendingData.data.length),
                                          color: (opacity = 1) =>
                                            `rgba(156, 163, 175, ${Math.min(1, opacity + 0.3)})`,
                                          strokeWidth: 3,
                                          withDots: false,
                                          withShadow: false,
                                        },
                                      ]
                                    : []),
                                ],
                              }}
                              fromZero={false}
                              yAxisInterval={1}
                              showGrid={false}
                              showHorizontalLines={false}
                              showVerticalLines={false}
                              width={width}
                              height={200}
                              yAxisLabel=""
                              yAxisSuffix=""
                              withHorizontalLines={false}
                              withVerticalLines={false}
                              withInnerLines={false}
                              chartConfig={{
                                backgroundColor: "transparent",
                                backgroundGradientFrom: colors.background.primary,
                                backgroundGradientTo: colors.background.primary,
                                backgroundGradientFromOpacity: 0,
                                backgroundGradientToOpacity: 0,
                                fillShadowGradient: monthlyOverBudget ? colors.error[500] : colors.primary[500],
                                fillShadowGradientFrom: monthlyOverBudget ? colors.error[500] : colors.primary[500],
                                fillShadowGradientTo: monthlyOverBudget ? colors.error[100] : colors.primary[100],
                                fillShadowGradientFromOpacity: 0.1,
                                fillShadowGradientToOpacity: 0,
                                decimalPlaces: 0,
                                color: (opacity = 1) => "transparent",
                                labelColor: (opacity = 1) => colors.text.secondary,
                                style: {
                                  borderRadius: 20,
                                },
                                propsForDots: {
                                  r: "4",
                                  strokeWidth: "3",
                                  stroke: "white",
                                  fill: monthlyOverBudget ? colors.error[500] : colors.primary[500],
                                  fillOpacity: 1,
                                },
                                propsForBackgroundLines: {
                                  stroke: "transparent",
                                  strokeWidth: 0,
                                },
                                propsForLabels: {
                                  fontSize: 12,
                                  fontWeight: "500",
                                },
                                formatYLabel: () => "",
                                yAxisMin: () => 0,
                                yAxisMax: () => {
                                  const allData = [
                                    ...dailySpendingData.data,
                                    ...(dailySpendingData.prevMonthData || [])
                                  ];
                                  const maxValue = Math.max(...allData);
                                  // Force a reasonable scale that makes both lines visible
                                  return Math.max(1000, maxValue * 1.1);
                                },
                              }}
                              style={{
                                marginVertical: 8,
                                borderRadius: 16,
                                marginHorizontal: 0,
                              }}
                              withDots={false}
                              withShadow={false}
                              withInnerLines={false}
                              withOuterLines={false}
                              withVerticalLines={false}
                              withHorizontalLines={false}
                              segments={0}
                              bezier
                              renderDotContent={({ x, y, index, indexData }) => {
                                // Show dot on the last data point (current day for current month)
                                if (index === dailySpendingData.data.length - 1) {
                                  return (
                                    <Animated.View key={index} style={{
                                      position: 'absolute',
                                      top: y - 10,
                                      left: x - 10,
                                      width: 20,
                                      height: 20,
                                      borderRadius: 10,
                                      backgroundColor: monthlyOverBudget ? colors.error[500] : colors.primary[500],
                                      borderWidth: 4,
                                      borderColor: '#FFFFFF',
                                      zIndex: 10,
                                      transform: [
                                        {
                                          scale: animatedProgress.interpolate({
                                            inputRange: [0, 0.7, 1],
                                            outputRange: [0, 1.2, 1]
                                          })
                                        }
                                      ],
                                      shadowColor: monthlyOverBudget ? colors.error[500] : colors.primary[500],
                                      shadowOffset: { width: 0, height: 2 },
                                      shadowOpacity: 0.3,
                                      shadowRadius: 4,
                                      elevation: 5
                                    }} />
                                  );
                                }
                                return null;
                              }}
                            />
                          </Animated.View>
                        </View>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.premiumEmptyChart,
                      { backgroundColor: colors.background.secondary },
                    ]}
                  >
                    <View
                      style={[
                        styles.premiumEmptyChartIcon,
                        { backgroundColor: "#4ECDC4" },
                      ]}
                    >
                      <Ionicons name="trending-up" size={32} color="white" />
                    </View>
                    <Text
                      style={[
                        styles.premiumEmptyChartTitle,
                        { color: colors.text.primary },
                      ]}
                    >
                      No spending data
                    </Text>
                    <Text
                      style={[
                        styles.premiumEmptyChartSubtitle,
                        { color: colors.text.secondary },
                      ]}
                    >
                      Start spending to see your analytics
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Categories Tab */}
        {selectedTab === "categories" && (
          <>
            {/* Premium Category/Merchant Switcher */}
            <View style={styles.premiumCategoryTabContainer}>
              <View
                style={[
                  styles.premiumCategoryTabSwitch,
                  { backgroundColor: colors.background.primary },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.premiumCategoryTabButton,
                    {
                      backgroundColor:
                        spendingTab === "categories"
                          ? colors.primary[500]
                          : "transparent",
                    },
                  ]}
                  onPress={() => setSpendingTab("categories")}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="grid"
                    size={18}
                    color={
                      spendingTab === "categories"
                        ? colors.text.inverse
                        : colors.primary[500]
                    }
                  />
                  <Text
                    style={[
                      styles.premiumCategoryTabText,
                      {
                        color:
                          spendingTab === "categories"
                            ? colors.text.inverse
                            : colors.primary[500],
                      },
                    ]}
                  >
                    Categories
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.premiumCategoryTabButton,
                    {
                      backgroundColor:
                        spendingTab === "merchants"
                          ? colors.primary[500]
                          : "transparent",
                    },
                  ]}
                  onPress={() => setSpendingTab("merchants")}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="storefront"
                    size={18}
                    color={
                      spendingTab === "merchants"
                        ? colors.text.inverse
                        : colors.primary[500]
                    }
                  />
                  <Text
                    style={[
                      styles.premiumCategoryTabText,
                      {
                        color:
                          spendingTab === "merchants"
                            ? colors.text.inverse
                            : colors.primary[500],
                      },
                    ]}
                  >
                    Merchants
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Premium Controls Row */}
            <View style={styles.premiumControlsContainer}>
              <View style={styles.premiumSortContainer}>
                <Text
                  style={[
                    styles.premiumSortLabel,
                    { color: colors.text.secondary },
                  ]}
                >
                  Sort by:
                </Text>
                <View style={styles.premiumSortButtons}>
                  <TouchableOpacity
                    style={[
                      styles.premiumSortButton,
                      {
                        backgroundColor:
                          sortBy === "spend"
                            ? colors.primary[500]
                            : colors.background.secondary,
                      },
                    ]}
                    onPress={() => setSortBy("spend")}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.premiumSortButtonText,
                        {
                          color:
                            sortBy === "spend"
                              ? colors.text.inverse
                              : colors.text.primary,
                        },
                      ]}
                    >
                      Spend
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.premiumSortButton,
                      {
                        backgroundColor:
                          sortBy === "name"
                            ? colors.primary[500]
                            : colors.background.secondary,
                      },
                    ]}
                    onPress={() => setSortBy("name")}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.premiumSortButtonText,
                        {
                          color:
                            sortBy === "name"
                              ? colors.text.inverse
                              : colors.text.primary,
                        },
                      ]}
                    >
                      Name
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.premiumEditBudgetsButton,
                  { backgroundColor: colors.primary[500] },
                ]}
                onPress={() => router.push("/budgets/edit")}
                activeOpacity={0.8}
              >
                <Ionicons name="create" size={16} color={colors.text.inverse} />
                <Text
                  style={[
                    styles.premiumEditBudgetsText,
                    { color: colors.text.inverse },
                  ]}
                >
                  Edit Budgets
                </Text>
              </TouchableOpacity>
            </View>

            {/* Categories List */}
            {spendingTab === "categories" && (
              <View style={styles.categoriesTabWrapper}>
                {sortedCategoryData.length === 0 ? (
                  <View style={{ alignItems: "center", marginTop: 48 }}>
                    <FontAwesome5
                      name="inbox"
                      size={48}
                      color={colors.gray[400]}
                    />
                    <Text
                      style={{
                        color: colors.text.secondary,
                        fontSize: 18,
                        marginTop: 12,
                      }}
                    >
                      No spending categories found.
                    </Text>
                    <Text
                      style={{
                        color: colors.text.tertiary,
                        fontSize: 14,
                        marginTop: 4,
                      }}
                    >
                      Add a new expense to start tracking your spending.
                    </Text>
                  </View>
                ) : (
                  sortedCategoryData.map((category) => {
                    const budget = category.defaultBudget || 0;
                    const spent = category.monthlySpent || 0;
                    const left = Math.max(0, budget - spent);
                    const percent =
                      budget > 0
                        ? Math.min(100, Math.round((spent / budget) * 100))
                        : 0;
                    const overBudget = spent > budget;
                    // Count transactions for this category in selected month
                    const txnCount = filteredTransactions.filter(
                      (tx) => tx.category === category.name
                    ).length;
                    return (
                      <Pressable
                        key={category.id}
                        style={({ pressed }) => [
                          {
                            transform: [{ scale: pressed ? 0.98 : 1 }],
                            shadowColor: colors.primary[500],
                            shadowOpacity: pressed ? 0.15 : 0.08,
                            shadowRadius: 12,
                            elevation: pressed ? 4 : 2,
                          },
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`Edit budget for ${category.name}`}
                        onPress={() => {
                          /* TODO: open edit budget modal */
                        }}
                      >
                        <LinearGradient
                          colors={[
                            colors.background.primary,
                            colors.background.primary,
                          ]}
                          style={[
                            styles.categoryCard,
                            { borderColor: colors.border.light },
                            overBudget && {
                              borderColor: colors.error[400],
                              backgroundColor: "#FEF2F2",
                            },
                            { marginBottom: 16 },
                          ]}
                        >
                          <View style={styles.categoryCardHeader}>
                            <View style={styles.categoryCardHeaderLeft}>
                              <View
                                style={[
                                  styles.categoryIconBg,
                                  { backgroundColor: category.color + "22" },
                                ]}
                              >
                                {renderCategoryIcon(
                                  category.icon,
                                  category.color
                                )}
                              </View>
                              <View>
                                <Text
                                  style={[
                                    styles.categoryName,
                                    { color: colors.text.primary },
                                  ]}
                                >
                                  {category.name}
                                </Text>
                                <Text
                                  style={[
                                    styles.categoryBudget,
                                    { color: colors.text.secondary },
                                  ]}
                                >
                                  Budget: {formatAmount(budget, currency)}
                                </Text>
                                <Text
                                  style={{
                                    color: colors.text.tertiary,
                                    fontSize: 13,
                                  }}
                                >
                                  {txnCount} Transactions
                                </Text>
                              </View>
                            </View>
                            <View style={styles.categoryCardHeaderRight}>
                              <Text
                                style={[
                                  styles.categorySpent,
                                  {
                                    color: overBudget
                                      ? colors.error[600]
                                      : colors.text.primary,
                                  },
                                ]}
                              >
                                {formatAmount(spent, currency)}
                              </Text>
                              <Text
                                style={[
                                  styles.categoryPercent,
                                  { color: colors.text.secondary },
                                ]}
                              >
                                {percent}%
                              </Text>
                              {overBudget && (
                                <View
                                  style={{
                                    backgroundColor: colors.error[100],
                                    borderRadius: 8,
                                    paddingHorizontal: 8,
                                    paddingVertical: 2,
                                  }}
                                >
                                  <Text
                                    style={{
                                      color: colors.error[600],
                                      fontWeight: "bold",
                                      fontSize: 12,
                                    }}
                                  >
                                    Over
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                          {/* Progress Bar */}
                          <View
                            style={[
                              styles.categoryProgressBarBg,
                              {
                                backgroundColor: colors.background.secondary,
                                borderRadius: 8,
                                height: 10,
                                marginTop: 8,
                              },
                            ]}
                          >
                            <Animated.View
                              style={{
                                width: new Animated.Value(percent).interpolate({
                                  inputRange: [0, 100],
                                  outputRange: ["0%", "100%"],
                                }),
                                borderRadius: 8,
                                height: 10,
                                backgroundColor: category.color,
                              }}
                            />
                          </View>
                          <View
                            style={{
                              flexDirection: "row",
                              justifyContent: "space-between",
                              marginTop: 4,
                            }}
                          >
                            <Text
                              style={{
                                color: colors.text.tertiary,
                                fontSize: 13,
                              }}
                            >
                              Left: {formatAmount(left, currency)}
                            </Text>
                            {overBudget && (
                              <Text
                                style={{
                                  color: colors.error[600],
                                  fontSize: 13,
                                }}
                              >
                                Overspent by{" "}
                                {formatAmount(Math.abs(left), currency)}
                              </Text>
                            )}
                          </View>
                        </LinearGradient>
                      </Pressable>
                    );
                  })
                )}
              </View>
            )}

            {/* Merchants List */}
            {spendingTab === "merchants" && (
              <View style={styles.categoriesTabWrapper}>
                {/* Group transactions by merchant */}
                {(() => {
                  const merchantMap: Record<
                    string,
                    { count: number; total: number }
                  > = {};
                  filteredTransactions.forEach((tx) => {
                    if (tx.amount < 0) {
                      // Only count expenses
                      const merchant = tx.description || tx.merchant || "Other";
                      if (!merchantMap[merchant])
                        merchantMap[merchant] = { count: 0, total: 0 };
                      merchantMap[merchant].count += 1;
                      merchantMap[merchant].total += Math.abs(tx.amount);
                    }
                  });
                  const merchantList = Object.entries(merchantMap).sort(
                    (a, b) => b[1].total - a[1].total
                  );
                  if (merchantList.length === 0) {
                    return (
                      <View style={{ alignItems: "center", marginTop: 48 }}>
                        <FontAwesome5
                          name="store"
                          size={48}
                          color={colors.gray[400]}
                        />
                        <Text
                          style={{
                            color: colors.text.secondary,
                            fontSize: 18,
                            marginTop: 12,
                          }}
                        >
                          No merchant data found.
                        </Text>
                        <Text
                          style={{
                            color: colors.text.tertiary,
                            fontSize: 14,
                            marginTop: 4,
                          }}
                        >
                          Start spending to see merchants here.
                        </Text>
                      </View>
                    );
                  }
                  return merchantList.map(([merchant, data]) => (
                    <Pressable
                      key={String(merchant)}
                      style={({ pressed }) => [
                        {
                          transform: [{ scale: pressed ? 0.98 : 1 }],
                          shadowColor: colors.primary[500],
                          shadowOpacity: pressed ? 0.15 : 0.08,
                          shadowRadius: 12,
                          elevation: pressed ? 4 : 2,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Add transaction for ${merchant}`}
                      onPress={() => {
                        /* TODO: open add transaction modal */
                      }}
                    >
                      <LinearGradient
                        colors={[
                          colors.background.primary,
                          colors.background.primary,
                        ]}
                        style={[
                          styles.categoryCard,
                          {
                            borderColor: colors.border.light,
                            marginBottom: 16,
                          },
                        ]}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          {/* Avatar with icon or first letter */}
                          <View
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 16,
                              backgroundColor: colors.primary[500] + "22",
                              alignItems: "center",
                              justifyContent: "center",
                              marginRight: 12,
                            }}
                          >
                            <FontAwesome5
                              name="store"
                              size={18}
                              color={colors.primary[500]}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                color: colors.text.primary,
                                fontWeight: "600",
                                fontSize: 16,
                              }}
                              numberOfLines={1}
                            >
                              {String(merchant)}
                            </Text>
                            <Text
                              style={{
                                color: colors.text.tertiary,
                                fontSize: 13,
                              }}
                              numberOfLines={1}
                            >
                              {`${data.count} ${data.count === 1 ? "visit" : "visits"} • Spent at`}
                            </Text>
                          </View>
                          <Text
                            style={{
                              color: colors.primary[500],
                              fontWeight: "bold",
                              fontSize: 18,
                              marginLeft: 8,
                            }}
                          >
                            {formatAmount(data.total, currency)}
                          </Text>
                        </View>
                        {/* Add Transaction button */}
                        <Pressable
                          style={{
                            marginTop: 8,
                            alignSelf: "flex-end",
                            backgroundColor: colors.primary[500],
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            paddingVertical: 4,
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={`Add transaction for ${merchant}`}
                          onPress={() => {
                            /* TODO: open add transaction modal */
                          }}
                        >
                          <Text style={{ color: "#FFF", fontWeight: "600" }}>
                            Add Transaction
                          </Text>
                        </Pressable>
                      </LinearGradient>
                    </Pressable>
                  ));
                })()}
              </View>
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
  // Simple Header Styles
  simpleHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  simpleTitle: {
    fontSize: 24,
    fontWeight: "700",
  },
  // Simple Tab Styles
  simpleTabContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  simpleTabSwitch: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
  },
  simpleTabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 8,
  },
  simpleTabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  // Simple Month Styles
  simpleMonthContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  simpleMonthButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 8,
    minWidth: 80,
    alignItems: "center",
  },
  simpleMonthText: {
    fontSize: 14,
    fontWeight: "600",
  },
  // Simple Budget Styles
  simpleBudgetContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  simpleBudgetCard: {
    borderRadius: 20,
    padding: 20,
  },
  simpleBudgetTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  simpleBudgetStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  simpleBudgetStat: {
    alignItems: "center",
  },
  simpleBudgetAmount: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  simpleBudgetLabel: {
    fontSize: 14,
  },
  simpleProgressContainer: {
    marginTop: 8,
  },
  simpleProgressBg: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  simpleProgressFill: {
    height: 8,
    borderRadius: 4,
  },
  simpleProgressText: {
    fontSize: 12,
    textAlign: "center",
  },
  // Animated Donut Chart Styles
  donutChartContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 8,
  },
  donutChart: {
    width: 200,
    height: 200,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  donutRing: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 24,
  },
  donutBackground: {
    borderColor: "rgba(0,0,0,0.08)",
  },
  donutForeground: {
    borderColor: "transparent",
  },
  donutCenter: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    ...shadows.lg,
  },
  donutCenterPercentage: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -1,
    lineHeight: 36,
  },
  donutCenterLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
    opacity: 0.6,
  },
  donutCenterAmount: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: -0.3,
    textAlign: "center",
    paddingHorizontal: 12,
  },
  // Animated Chart Styles
  animatedChartWrapper: {
    position: "relative",
    marginVertical: 8,
  },
  chartMaskContainer: {
    position: "relative",
    overflow: "hidden",
  },
  chartRevealMask: {
    overflow: "hidden",
    height: 200,
  },
  // Premium Header Styles
  premiumHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
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
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  premiumBrandAccent: {
    width: 4,
    height: 24,
    borderRadius: 2,
    marginLeft: 8,
  },
  premiumHeaderRight: {
    alignItems: "flex-end",
  },
  premiumHeaderSubtitle: {
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.8,
  },
  premiumHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.md,
  },
  // Premium Tab Styles
  premiumTabContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  premiumTabSwitch: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 4,
    ...shadows.md,
  },
  premiumTabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  premiumTabIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  premiumTabText: {
    fontSize: 16,
    fontWeight: "700",
  },
  // Premium Month Picker Styles
  premiumMonthPickerContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  premiumMonthPickerContent: {
    gap: 12,
    paddingRight: spacing.lg,
  },
  premiumMonthButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 100,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    ...shadows.sm,
  },
  premiumMonthButtonText: {
    fontSize: 15,
  },
  premiumMonthIndicator: {
    position: "absolute",
    bottom: 2,
    width: 24,
    height: 3,
    borderRadius: 2,
  },
  // Premium Budget Card Styles
  premiumBudgetCardWrapper: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  premiumBudgetCard: {
    borderRadius: 24,
    padding: 24,
    ...shadows.lg,
  },
  premiumBudgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  premiumBudgetHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  premiumBudgetIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    ...shadows.sm,
  },
  premiumBudgetHeaderText: {
    justifyContent: "center",
  },
  premiumBudgetTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 2,
  },
  premiumBudgetSubtitle: {
    fontSize: 14,
  },
  premiumSettingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  premiumBudgetStats: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  premiumBudgetStat: {
    flex: 1,
    alignItems: "center",
    position: "relative",
  },
  premiumBudgetStatValue: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 4,
  },
  premiumBudgetStatLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  premiumBudgetStatIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  premiumBudgetStatDivider: {
    width: 1,
    height: 60,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 20,
  },
  premiumDonutSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  premiumDonutChartContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: DONUT_SIZE,
    height: DONUT_SIZE,
    position: "relative",
  },
  premiumDonutCenter: {
    position: "absolute",
    width: DONUT_SIZE,
    height: DONUT_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  premiumDonutCenterAmount: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 4,
  },
  premiumDonutCenterLabel: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  premiumLegendsContainer: {
    marginLeft: 32,
    justifyContent: "center",
  },
  premiumLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  premiumLegendDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  premiumLegendText: {
    fontSize: 16,
    fontWeight: "600",
  },
  // Premium Spending Analytics Card Styles
  premiumSpendingCardWrapper: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  premiumSpendingCard: {
    borderRadius: 24,
    padding: 28,
    ...shadows.lg,
  },
  premiumSpendingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  premiumSpendingHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  premiumAnalyticsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    ...shadows.sm,
  },
  premiumSpendingHeaderText: {
    justifyContent: "center",
  },
  premiumSpendingTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 2,
  },
  premiumSpendingSubtitle: {
    fontSize: 14,
  },
  premiumPersonalizeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 2,
  },
  premiumPersonalizeText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  premiumSpendingStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  premiumSpendingStat: {
    flex: 1,
  },
  premiumSpendingStatValue: {
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 4,
  },
  premiumSpendingStatLabel: {
    fontSize: 16,
  },
  premiumSpendingComparison: {
    alignItems: "flex-end",
  },
  premiumComparisonBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 4,
  },
  premiumComparisonText: {
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 4,
  },
  premiumComparisonLabel: {
    fontSize: 12,
  },
  premiumChartSection: {
    marginTop: 4,
  },
  premiumChartContainer: {
    borderRadius: 16,
    padding: 16,
    overflow: "hidden",
  },
  premiumEmptyChart: {
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    padding: 32,
  },
  premiumEmptyChartIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    ...shadows.md,
  },
  premiumEmptyChartTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  premiumEmptyChartSubtitle: {
    fontSize: 14,
    textAlign: "center",
  },
  // Premium Category Tab Styles
  premiumCategoryTabContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  premiumCategoryTabSwitch: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 4,
    ...shadows.sm,
  },
  premiumCategoryTabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  premiumCategoryTabText: {
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 6,
  },
  // Premium Controls Styles
  premiumControlsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  premiumSortContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  premiumSortLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginRight: 12,
  },
  premiumSortButtons: {
    flexDirection: "row",
    gap: 8,
  },
  premiumSortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  premiumSortButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  premiumEditBudgetsButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    ...shadows.sm,
  },
  premiumEditBudgetsText: {
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 6,
  },
  tabSwitchWrapper: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: borderRadius["4xl"],
    padding: spacing.xs,
    ...shadows.lg,
    borderWidth: 1,
  },
  tabSwitchRow: {
    flexDirection: "row",
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  tabButtonText: {
    fontWeight: "600" as const,
    fontSize: typography.fontSizes.sm,
    marginLeft: spacing.sm,
  },
  monthPicker: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  monthButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    marginRight: spacing.xs,
    borderWidth: 1,
  },
  monthButtonText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: "600" as const,
  },
  mainCardWrapper: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  mainCard: {
    padding: spacing.xl,
    borderRadius: borderRadius["4xl"],
    borderWidth: 1,
    ...shadows.lg,
  },
  mainCardLabel: {
    fontSize: typography.fontSizes.lg,
    fontWeight: "600" as const,
    marginBottom: spacing.md,
  },
  mainCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  mainCardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  walletIconBg: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  mainCardAmount: {
    fontSize: typography.fontSizes["2xl"],
    fontWeight: "700" as const,
  },
  mainCardAmountLabel: {
    fontSize: typography.fontSizes.sm,
    marginLeft: spacing.xs,
  },
  donutChartRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  donutChartWrapper: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 70,
    ...shadows.md,
  },
  donutChartOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  donutChartInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  donutChartCenterAmount: {
    fontSize: typography.fontSizes["2xl"],
    fontWeight: "700" as const,
  },
  donutChartCenterLabelText: {
    fontSize: typography.fontSizes.sm,
    marginTop: spacing.xs,
  },
  progressRing: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  progressFill: {
    width: "100%",
    height: "100%",
    borderRadius: 70,
    borderWidth: 10,
    transformOrigin: "center",
  },
  donutChartLegends: {
    marginLeft: spacing.lg,
    justifyContent: "center",
  },
  donutChartLegendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  donutChartLegendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  donutChartLegendLabel: {
    fontSize: typography.fontSizes.sm,
    fontWeight: "600" as const,
  },
  categoriesTabWrapper: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  categoryCard: {
    padding: spacing.lg,
    borderRadius: borderRadius["4xl"],
    borderWidth: 1,
    marginBottom: spacing.md,
    ...shadows.lg,
  },
  categoryCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  categoryCardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryIconBg: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  categoryName: {
    fontSize: typography.fontSizes.lg,
    fontWeight: "600" as const,
  },
  categoryBudget: {
    fontSize: typography.fontSizes.sm,
    marginTop: spacing.xs,
  },
  categoryCardHeaderRight: {
    alignItems: "flex-end",
  },
  categorySpent: {
    fontSize: typography.fontSizes.lg,
    fontWeight: "700" as const,
  },
  categoryPercent: {
    fontSize: typography.fontSizes.sm,
    marginTop: spacing.xs,
  },
  categoryProgressBarBg: {
    height: 8,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
  },
  categoryProgressBarFill: {
    height: "100%",
    borderRadius: borderRadius.full,
  },
  // Premium Chart Styles
  premiumCustomChartContainer: {
    borderRadius: 20,
    padding: 0, // Remove all padding for edge-to-edge
    marginHorizontal: 0, // Remove horizontal margins
    marginBottom: spacing.lg,
    ...shadows.md,
    overflow: "hidden",
  },
  premiumChartTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  premiumChartTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  premiumChartLegend: {
    flexDirection: "row",
    gap: 16,
  },
  premiumChartLegendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  premiumChartLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  premiumChartLegendText: {
    fontSize: 12,
    fontWeight: "500",
  },
  premiumChartStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(229, 231, 235, 0.5)",
  },
  premiumChartStat: {
    alignItems: "center",
  },
  premiumChartStatLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  premiumChartStatValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  
  // Chart Legend Styles
  chartLegendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 24,
  },
  chartLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chartLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chartLegendText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Current Value Display Styles
  currentValueContainer: {
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 8,
    paddingHorizontal: 16, // Add horizontal padding only to the value display
  },
  currentValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  currentValueMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  currentValueLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Custom Chart Styles
  customChartContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  chartArea: {
    position: "relative",
  },
  modernChartArea: {
    position: "relative",
    paddingTop: 8,
    paddingBottom: 16,
  },
  xAxisLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingHorizontal: 40,
  },
  xAxisLabel: {
    fontSize: 11,
    textAlign: "center",
  },
  modernXAxisLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingHorizontal: 50,
  },
  xAxisLabelContainer: {
    alignItems: "center",
  },
  modernXAxisLabel: {
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 4,
  },
  xAxisDot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    opacity: 0.5,
  },
  // Minimalistic Chart Styles
  minimalistChartContainer: {
    marginTop: 20,
    marginBottom: 16,
  },
  minimalistChartArea: {
    position: "relative",
    paddingTop: 8,
    paddingBottom: 8,
  },
  minimalXAxis: {
    marginTop: 12,
    paddingHorizontal: 40,
  },
  axisLine: {
    height: 1,
    width: "100%",
    opacity: 0.1,
    marginBottom: 8,
  },
  minimalXAxisLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  minimalXAxisLabel: {
    fontSize: 10,
    fontWeight: "400",
    opacity: 0.7,
  },
  // Ultra Minimalistic Chart Styles
  ultraMinimalChartContainer: {
    marginTop: 24,
    marginBottom: 20,
  },
  ultraMinimalChartArea: {
    position: "relative",
    paddingTop: 4,
    paddingBottom: 4,
  },
  ultraMinimalXAxis: {
    marginTop: 16,
    paddingHorizontal: 35,
  },
  ultraMinimalXAxisLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  ultraMinimalXAxisLabel: {
    fontSize: 9,
    fontWeight: "300",
    opacity: 0.5,
    letterSpacing: 0.3,
  },
  // Full Width Chart Styles
  fullWidthChartContainer: {
    marginTop: 16,
    marginBottom: 12,
    marginHorizontal: 0,
  },
  fullWidthXAxis: {
    marginTop: 12,
    paddingHorizontal: 30,
  },
  fullWidthXAxisLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  fullWidthXAxisLabel: {
    fontSize: 10,
    fontWeight: "400",
    opacity: 0.6,
    letterSpacing: 0.2,
  },
  // Optimized Chart Styles
  optimizedChartContainer: {
    marginTop: 12,
    marginBottom: 8,
    marginHorizontal: 0,
  },
  optimizedXAxis: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingHorizontal: 25,
  },
  optimizedXAxisLabel: {
    fontSize: 10,
    fontWeight: "400",
    opacity: 0.7,
  },
  // Comparison Chart Styles
  comparisonChartContainer: {
    marginTop: 12,
    marginBottom: 8,
    marginHorizontal: 0,
  },
  comparisonXAxis: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingHorizontal: 25,
  },
  comparisonXAxisLabel: {
    fontSize: 10,
    fontWeight: "400",
    opacity: 0.7,
  },
  // Enhanced Chart Styles
  enhancedChartContainer: {
    marginTop: 8,
    marginBottom: 12,
    marginHorizontal: 0,
    borderRadius: 16,
    padding: 0,
    paddingHorizontal: 0,
    overflow: "hidden",
  },
  chartLegendRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    marginBottom: 12,
  },
  chartLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chartLegendLine: {
    width: 16,
    height: 3,
    borderRadius: 2,
  },
  chartLegendDash: {
    width: 16,
    height: 2,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 1,
  },
  chartLegendText: {
    fontSize: 11,
    fontWeight: "500",
  },
  enhancedXAxis: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingHorizontal: 5,
  },
  enhancedXAxisLabel: {
    fontSize: 10,
    fontWeight: "400",
    opacity: 0.7,
  },
});
