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
import Svg, { Circle } from "react-native-svg";
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
    
    transactions.forEach(tx => {
      if (tx.date) {
        const monthKey = dayjs(tx.date).format("YYYY-MM");
        monthSet.add(monthKey);
      }
    });

    // Convert to array and sort
    const months = Array.from(monthSet).sort().map(monthKey => {
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
    const categoryMap = new Map<string, { count: number; totalSpent: number }>();
    
    transactions.forEach(tx => {
      if (tx.amount < 0) { // Only expenses
        const category = tx.category || "Other";
        const existing = categoryMap.get(category) || { count: 0, totalSpent: 0 };
        categoryMap.set(category, {
          count: existing.count + 1,
          totalSpent: existing.totalSpent + Math.abs(tx.amount)
        });
      }
    });

    // Load stored budgets
    const storedCategoryBudgets = await AsyncStorage.getItem('categoryBudgets');
    const parsedStoredBudgets = storedCategoryBudgets ? JSON.parse(storedCategoryBudgets) : {};
    
    // Load main budget or use default
    const storedMainBudget = await AsyncStorage.getItem('mainBudget');
    const mainBudget = parseFloat(storedMainBudget || '2000');

    // Convert to category objects with stored or default budgets
    const categories = Array.from(categoryMap.entries()).map(([name, data], index) => {
      const categoryId = name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      
      // Use stored budget if available, otherwise use default £2000 divided by number of categories
      const storedBudget = parsedStoredBudgets[categoryId];
      const defaultBudget = storedBudget !== undefined ? storedBudget : 
                           categoryMap.size > 0 ? Math.floor(mainBudget / categoryMap.size) : 200;
      
      return {
        id: categoryId,
        name,
        icon: getCategoryIcon(name),
        color: getCategoryColor(name, index),
        defaultBudget: defaultBudget,
        spent: 0 // Will be calculated per month
      };
    });

    // If no transactions yet, create a default "Other" category with full budget
    if (categories.length === 0) {
      categories.push({
        id: 'other',
        name: 'Other',
        icon: getCategoryIcon('Other'),
        color: getCategoryColor('Other', 0),
        defaultBudget: mainBudget,
        spent: 0
      });
    }

    return categories;
  };

  // Dynamic icon mapping based on category name
  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('food') || name.includes('dining') || name.includes('restaurant')) return 'food-apple-outline';
    if (name.includes('transport') || name.includes('travel') || name.includes('uber') || name.includes('taxi')) return 'bus-clock';
    if (name.includes('shop') || name.includes('retail') || name.includes('amazon')) return 'bag-outline';
    if (name.includes('entertainment') || name.includes('game') || name.includes('movie')) return 'game-controller-outline';
    if (name.includes('bill') || name.includes('utility') || name.includes('electric') || name.includes('gas')) return 'flash-outline';
    if (name.includes('health') || name.includes('fitness') || name.includes('gym') || name.includes('medical')) return 'fitness-outline';
    return 'pricetag-outline';
  };

  // Dynamic color assignment
  const getCategoryColor = (categoryName: string, index: number) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#95A5A6', '#F8B500', '#6C5CE7', '#A29BFE'];
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
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  // Calculate cumulative daily spending for chart (moved before hooks to maintain order)
  const dailySpendingData = React.useMemo(() => {
    const dailySpending: { [date: string]: number } = {};
    
    const filteredTransactions = transactions.filter((tx) => {
      if (!tx.date) return false;
      const txDate = dayjs(tx.date);
      return txDate.format("YYYY-MM") === selectedMonth;
    });
    
    filteredTransactions.forEach(tx => {
      if (tx.amount < 0 && tx.date) {
        const day = dayjs(tx.date).format('DD');
        dailySpending[day] = (dailySpending[day] || 0) + Math.abs(tx.amount);
      }
    });

    // Get days in selected month
    const selectedDate = dayjs(selectedMonth);
    const daysInMonth = selectedDate.daysInMonth();
    
    // Create arrays for chart with cumulative data
    const labels: string[] = [];
    const data: number[] = [];
    const prevMonthData: number[] = [];
    let cumulativeSpending = 0;
    let prevCumulative = 0;
    
    for (let i = 1; i <= daysInMonth; i++) {
      const dayStr = i.toString().padStart(2, '0');
      labels.push(dayStr);
      
      // Add today's spending to cumulative total
      const todaySpending = dailySpending[dayStr] || 0;
      cumulativeSpending += todaySpending;
      data.push(cumulativeSpending);
      
      // Simulate previous month cumulative data (85% of current month)
      const prevTodaySpending = todaySpending * 0.85;
      prevCumulative += prevTodaySpending;
      prevMonthData.push(prevCumulative);
    }
    
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

        // Check for expired tokens first
        try {
          const connectionStatus = await bankingAPI.checkBankConnectionStatus();
          if (connectionStatus.hasExpiredTokens) {
            console.log("Expired tokens detected in spending tab");
            // Still attempt to fetch transactions, API may have cached data
          }
        } catch (statusError) {
          console.log("Could not check connection status, proceeding with transaction fetch");
        }

        // Fetch all transactions using the centralized API
        const transactionsData = await bankingAPI.getAllTransactions();

        let allTransactions: any[] = [];
        if (transactionsData.transactions && Array.isArray(transactionsData.transactions)) {
          // Transform transactions to our format
          allTransactions = transactionsData.transactions.map((tx: any, idx: number) => ({
            id: tx.transactionId || tx.id || `tx-${idx}`,
            amount: tx.type === 'debit' ? -Math.abs(Number(tx.amount || 0)) : Math.abs(Number(tx.amount || 0)),
            currency: tx.currency || "GBP",
            description: tx.description || "Transaction",
            date: tx.date || tx.createdAt || new Date().toISOString(),
            category: tx.category || "Other",
            accountId: tx.accountId,
            accountName: tx.accountName || "Unknown Account",
            type: tx.type,
            merchant: tx.merchant,
          }));
        }

        setTransactions(allTransactions);

        // Set currency from transaction data
        const transactionCurrency = getCurrency(allTransactions);
        setCurrency(transactionCurrency);

        // Generate months dynamically from transaction data
        const monthsArr = generateMonthsFromTransactions(allTransactions);
        setMonths(monthsArr);
        
        // Set most recent month as selected
        const mostRecentMonth = monthsArr.length > 0 ? monthsArr[monthsArr.length - 1].value : dayjs().format("YYYY-MM");
        setSelectedMonth(mostRecentMonth);

        // Generate categories dynamically from transaction data with stored budgets
        const dynamicCategories = await generateCategoriesFromTransactions(allTransactions);
        setCategoryData(dynamicCategories);

        // Calculate totals from dynamic categories
        const totalBudget = dynamicCategories.reduce((sum, cat) => sum + cat.defaultBudget, 0);
        const totalSpent = dynamicCategories.reduce((sum, cat) => sum + cat.spent, 0);
        
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
    const progress = monthlyOverBudget ? 1 : monthlySpentPercentage / 100;
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [monthlySpentPercentage, monthlyOverBudget]);
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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.secondary }]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colors.text.primary, fontSize: 18, marginBottom: 16 }}>
            Loading spending data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.secondary }]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
          <Text style={{ color: colors.error[500], fontSize: 18, marginBottom: 16, textAlign: 'center' }}>
            {error}
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: colors.primary[500], paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}
            onPress={() => {
              setError(null);
              // Re-trigger useEffect by toggling a state
            }}
          >
            <Text style={{ color: '#FFF', fontWeight: '600' }}>Try Again</Text>
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
      monthlySpentByCategory[category] = (monthlySpentByCategory[category] || 0) + Math.abs(txn.amount);
    }
  });

  const monthlyTotalSpent = Object.values(monthlySpentByCategory).reduce((sum, amount) => sum + amount, 0);

  // Calculate previous month comparison
  const selectedMonthIndex = months.findIndex((m) => m.value === selectedMonth);
  const prevMonth = selectedMonthIndex > 0 ? months[selectedMonthIndex - 1] : null;
  const prevMonthSpent = (() => {
    if (!prevMonth) return 0;
    const prevMonthTxns = transactions.filter((tx) => {
      if (!tx.date) return false;
      return dayjs(tx.date).format("YYYY-MM") === prevMonth.value;
    });
    return prevMonthTxns.reduce((sum, tx) => tx.amount < 0 ? sum + Math.abs(tx.amount) : sum, 0);
  })();

  const diff = monthlyTotalSpent - prevMonthSpent;
  const diffLabel = diff >= 0 
    ? `▲ ${formatAmount(Math.abs(diff), currency)}`
    : `▼ ${formatAmount(Math.abs(diff), currency)}`;
  const diffColor = diff >= 0 ? colors.error[500] : colors.success[500];

  // Update category data with monthly spending for display
  const monthlyCategoryData = categoryData.map(cat => ({
    ...cat,
    monthlySpent: monthlySpentByCategory[cat.name] || 0
  }));

  // Sort logic for categories and merchants (use monthly spending)
  const sortedCategoryData = [...monthlyCategoryData].sort((a, b) => {
    if (sortBy === "spend") return (b.monthlySpent || 0) - (a.monthlySpent || 0);
    if (sortBy === "name") return a.name.localeCompare(b.name);
    return 0;
  });

  // Use monthly totals for budget calculations
  const monthlySpentPercentage = totalBudget > 0 ? (monthlyTotalSpent / totalBudget) * 100 : 0;
  const monthlyOverBudget = monthlyTotalSpent > totalBudget;
  const donutProgress = monthlyOverBudget ? 100 : monthlySpentPercentage;
  const donutColor = monthlyOverBudget ? colors.error[500] : colors.primary[500];

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
        {/* Header */}
        <LinearGradient
          colors={["rgba(59, 130, 246, 0.1)", "rgba(59, 130, 246, 0.05)"]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Text
                style={[
                  styles.headerTitle,
                  {
                    color: colors.text.primary,
                    fontSize: 32,
                    fontWeight: "bold",
                  },
                ]}
              >
                Spending
              </Text>
              <Text
                style={[
                  styles.headerSubtitle,
                  { color: colors.text.secondary, marginTop: 2, fontSize: 15 },
                ]}
              >
                {`Updated today, ${dayjs().format("HH:mm")}`}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.headerButton,
                { backgroundColor: colors.background.primary, marginLeft: 12 },
              ]}
              activeOpacity={0.8}
            >
              <Feather name="info" size={24} color={colors.primary[500]} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Tab Switch */}
        <View
          style={[
            styles.tabSwitchWrapper,
            {
              backgroundColor: colors.background.primary,
              borderColor: colors.border.light,
              flexDirection: "row",
              borderRadius: 999,
              padding: 4,
              marginTop: spacing.lg,
              marginHorizontal: spacing.lg,
              alignSelf: "center",
              width: 320,
              justifyContent: "center",
            },
          ]}
        >
          <TouchableOpacity
            style={[
              {
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 10,
                borderRadius: 999,
                backgroundColor:
                  selectedTab === "summary"
                    ? colors.primary[500]
                    : colors.background.primary,
                shadowColor:
                  selectedTab === "summary"
                    ? colors.primary[500]
                    : "transparent",
                shadowOpacity: selectedTab === "summary" ? 0.15 : 0,
                shadowRadius: selectedTab === "summary" ? 6 : 0,
              },
            ]}
            onPress={() => setSelectedTab("summary")}
            accessibilityRole="button"
            accessibilityState={{ selected: selectedTab === "summary" }}
          >
            <Text
              style={{
                color: selectedTab === "summary" ? "#FFF" : colors.primary[500],
                fontWeight: "600",
                fontSize: 16,
              }}
            >
              Your budget
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              {
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 10,
                borderRadius: 999,
                backgroundColor:
                  selectedTab === "categories"
                    ? colors.primary[500]
                    : colors.background.primary,
                shadowColor:
                  selectedTab === "categories"
                    ? colors.primary[500]
                    : "transparent",
                shadowOpacity: selectedTab === "categories" ? 0.15 : 0,
                shadowRadius: selectedTab === "categories" ? 6 : 0,
              },
            ]}
            onPress={() => setSelectedTab("categories")}
            accessibilityRole="button"
            accessibilityState={{ selected: selectedTab === "categories" }}
          >
            <Text
              style={{
                color:
                  selectedTab === "categories" ? "#FFF" : colors.primary[500],
                fontWeight: "600",
                fontSize: 16,
              }}
            >
              Your spending
            </Text>
          </TouchableOpacity>
        </View>

        {/* Month Picker */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{
            marginHorizontal: spacing.lg,
            marginTop: spacing.md,
            marginBottom: spacing.md,
          }}
          contentContainerStyle={{ gap: 8, paddingRight: 8 }}
        >
          {months.map((monthObj) => (
            <TouchableOpacity
              key={monthObj.id}
              style={[
                {
                  paddingHorizontal: 20,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor:
                    selectedMonth === monthObj.value
                      ? colors.primary[500]
                      : colors.background.secondary,
                  borderWidth: 1,
                  borderColor:
                    selectedMonth === monthObj.value
                      ? colors.primary[500]
                      : colors.border.light,
                  marginRight: 0,
                  minWidth: 60,
                  alignItems: "center",
                  justifyContent: "center",
                },
              ]}
              onPress={() => setSelectedMonth(monthObj.value)}
              accessibilityRole="button"
              accessibilityState={{
                selected: selectedMonth === monthObj.value,
              }}
            >
              <Text
                style={{
                  color:
                    selectedMonth === monthObj.value
                      ? "#FFF"
                      : colors.primary[500],
                  fontWeight: selectedMonth === monthObj.value ? "700" : "600",
                  fontSize: 15,
                }}
              >
                {monthObj.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Main Card - Budget Overview (Pie Chart) */}
        {selectedTab === "summary" && (
          <View style={styles.mainCardWrapper}>
            <LinearGradient
              colors={[colors.background.primary, colors.background.primary]}
              style={[styles.mainCard, { borderColor: colors.border.light }]}
            >
              <Text
                style={[styles.mainCardLabel, { color: colors.text.secondary }]}
              >
                This Month
              </Text>
              <View style={styles.mainCardHeader}>
                <View style={styles.mainCardHeaderLeft}>
                  <LinearGradient
                    colors={[colors.primary[500], "#8B5CF6"]}
                    style={styles.walletIconBg}
                  >
                    <MaterialCommunityIcons
                      name="wallet-outline"
                      color="white"
                      size={20}
                    />
                  </LinearGradient>
                  <Text
                    style={[
                      styles.mainCardAmount,
                      { color: colors.text.primary },
                    ]}
                  >
                    {formatAmount(monthlyTotalSpent, currency)}
                  </Text>
                  <Text
                    style={[
                      styles.mainCardAmountLabel,
                      { color: colors.text.secondary },
                    ]}
                  >
                    spent
                  </Text>
                </View>
                <TouchableOpacity>
                  <Ionicons
                    name="settings-outline"
                    color={colors.secondary[600]}
                    size={20}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.donutChartRow}>
                {/* Custom Donut Chart - Polished */}
                <View
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                    width: DONUT_SIZE,
                    height: DONUT_SIZE,
                  }}
                >
                  <Svg width={DONUT_SIZE} height={DONUT_SIZE}>
                    {/* Background ring */}
                    <Circle
                      cx={DONUT_SIZE / 2}
                      cy={DONUT_SIZE / 2}
                      r={RADIUS}
                      stroke={colors.gray[800]}
                      strokeWidth={STROKE_WIDTH}
                      fill="none"
                    />
                    {/* Animated progress ring */}
                    <AnimatedCircle
                      cx={DONUT_SIZE / 2}
                      cy={DONUT_SIZE / 2}
                      r={RADIUS}
                      stroke={
                        monthlyOverBudget ? colors.error[500] : colors.primary[500]
                      }
                      strokeWidth={STROKE_WIDTH}
                      fill="none"
                      strokeDasharray={`${CIRCUMFERENCE}, ${CIRCUMFERENCE}`}
                      strokeDashoffset={animatedStrokeDashoffset}
                      strokeLinecap="round"
                    />
                  </Svg>
                  <View
                    style={{
                      position: "absolute",
                      width: DONUT_SIZE,
                      height: DONUT_SIZE,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 28,
                        fontWeight: "bold",
                        color:
                          displayLeftToSpend < 0
                            ? colors.error[500]
                            : colors.text.primary,
                        textAlign: "center",
                      }}
                    >
                      {formatAmount(Math.abs(displayLeftToSpend), currency)}
                    </Text>
                    <Text
                      style={{
                        fontSize: 15,
                        color:
                          displayLeftToSpend < 0
                            ? colors.error[500]
                            : colors.text.secondary,
                        fontWeight: "600",
                        marginTop: 2,
                        textAlign: "center",
                      }}
                    >
                      {displayLeftToSpend < 0
                        ? "over budget"
                        : "left to spend"}
                    </Text>
                  </View>
                </View>
                {/* Legends */}
                <View style={{ marginLeft: 24, justifyContent: "center" }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <View
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 7,
                        backgroundColor: colors.primary[500],
                        marginRight: 8,
                      }}
                    />
                    <Text
                      style={{
                        color: colors.text.secondary,
                        fontWeight: "600",
                      }}
                    >
                      Spent
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 7,
                        backgroundColor: colors.gray[800],
                        marginRight: 8,
                      }}
                    />
                    <Text
                      style={{
                        color: colors.text.secondary,
                        fontWeight: "600",
                      }}
                    >
                      Left
                    </Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Daily Spending Chart - Your Spending Tab */}
        {selectedTab === "categories" && (
          <View
            style={{
              marginHorizontal: spacing.lg,
              marginBottom: spacing.md,
              backgroundColor: colors.background.primary,
              borderRadius: borderRadius["3xl"],
              padding: spacing.lg,
              borderWidth: 1,
              borderColor: colors.border.light,
              ...shadows.lg,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: spacing.md,
              }}
            >
              <View>
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.text.secondary,
                    marginBottom: 4,
                  }}
                >
                  {dayjs(selectedMonth).format("MMMM")} spend
                </Text>
                <Text
                  style={{
                    fontSize: 32,
                    fontWeight: "bold",
                    color: colors.text.primary,
                  }}
                >
                  {formatAmount(monthlyTotalSpent, currency)}
                </Text>
                {prevMonth && (
                  <Text
                    style={{
                      fontSize: 14,
                      color: diff >= 0 ? colors.error[500] : colors.success[500],
                      marginTop: 4,
                    }}
                  >
                    {diffLabel} vs. {prevMonth.name}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={{
                  borderRadius: 20,
                  borderWidth: 2,
                  borderColor: colors.error[400],
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                }}
              >
                <Text
                  style={{
                    color: colors.error[500],
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  📈 Personalise
                </Text>
              </TouchableOpacity>
            </View>
            
            {dailySpendingData.data.some(value => value > 0) ? (
              <LineChart
                data={{
                  labels: dailySpendingData.labels.filter((_, index) => index === 0 || index === Math.floor(dailySpendingData.labels.length / 2) || index === dailySpendingData.labels.length - 1), 
                  datasets: [
                    // Previous month line (light gray)
                    ...(prevMonth ? [{
                      data: dailySpendingData.prevMonthData,
                      strokeWidth: 2,
                      color: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
                    }] : []),
                    // Current month line (dark navy)
                    {
                      data: dailySpendingData.data,
                      strokeWidth: 3,
                      color: (opacity = 1) => `rgba(30, 41, 59, ${opacity})`,
                    },
                  ],
                }}
                width={width - 2 * spacing.lg - 2 * spacing.lg}
                height={200}
                chartConfig={{
                  backgroundColor: colors.background.primary,
                  backgroundGradientFrom: colors.background.primary,
                  backgroundGradientTo: colors.background.primary,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(30, 41, 59, ${opacity})`,
                  labelColor: (opacity = 1) => colors.text.secondary,
                  style: {
                    borderRadius: borderRadius.lg,
                  },
                  propsForDots: {
                    r: "0",
                    strokeWidth: "0",
                  },
                  propsForBackgroundLines: {
                    strokeDasharray: "",
                    stroke: colors.border.light,
                    strokeWidth: 0.5,
                    strokeOpacity: 0.2,
                  },
                }}
                bezier
                style={{
                  borderRadius: borderRadius.lg,
                }}
                formatYLabel={(value) => {
                  const numValue = parseFloat(value);
                  if (numValue >= 1000) {
                    return `£${(numValue / 1000).toFixed(1)}k`;
                  }
                  return `£${numValue.toFixed(0)}`;
                }}
                withVerticalLines={false}
                withHorizontalLines={true}
                withInnerLines={false}
                segments={3}
              />
            ) : (
              <View
                style={{
                  height: 200,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.background.secondary,
                  borderRadius: borderRadius.lg,
                }}
              >
                <Ionicons
                  name="trending-up-outline"
                  size={48}
                  color={colors.gray[400]}
                />
                <Text
                  style={{
                    color: colors.text.secondary,
                    fontSize: 16,
                    marginTop: 12,
                  }}
                >
                  No spending data for this month
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Categories Tab */}
        {selectedTab === "categories" && (
          <>
            {/* SpendingTab Switcher */}
            <View
              style={{
                flexDirection: "row",
                backgroundColor: colors.background.primary,
                borderRadius: 999,
                padding: 4,
                marginHorizontal: spacing.lg,
                marginBottom: spacing.md,
                alignSelf: "center",
                width: 260,
                justifyContent: "center",
              }}
            >
              <TouchableOpacity
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor:
                    spendingTab === "categories"
                      ? colors.primary[500]
                      : colors.background.primary,
                }}
                onPress={() => setSpendingTab("categories")}
                accessibilityRole="button"
                accessibilityState={{ selected: spendingTab === "categories" }}
              >
                <Text
                  style={{
                    color:
                      spendingTab === "categories"
                        ? "#FFF"
                        : colors.primary[500],
                    fontWeight: "600",
                    fontSize: 15,
                  }}
                >
                  Categories
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor:
                    spendingTab === "merchants"
                      ? colors.primary[500]
                      : colors.background.primary,
                }}
                onPress={() => setSpendingTab("merchants")}
                accessibilityRole="button"
                accessibilityState={{ selected: spendingTab === "merchants" }}
              >
                <Text
                  style={{
                    color:
                      spendingTab === "merchants"
                        ? "#FFF"
                        : colors.primary[500],
                    fontWeight: "600",
                    fontSize: 15,
                  }}
                >
                  Merchants
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sort Dropdown */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginHorizontal: spacing.lg,
                marginBottom: 8,
              }}
            >
              <Text
                style={{
                  color: colors.text.secondary,
                  fontWeight: "600",
                  fontSize: 15,
                  marginRight: 8,
                }}
              >
                Sort by:
              </Text>
              <Pressable
                onPress={() => setSortBy("spend")}
                accessibilityRole="button"
                accessibilityLabel="Sort by spend"
              >
                <Text
                  style={{
                    color:
                      sortBy === "spend"
                        ? colors.primary[500]
                        : colors.text.secondary,
                    fontWeight: "600",
                    marginRight: 8,
                  }}
                >
                  Spend
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setSortBy("name")}
                accessibilityRole="button"
                accessibilityLabel="Sort by name"
              >
                <Text
                  style={{
                    color:
                      sortBy === "name"
                        ? colors.primary[500]
                        : colors.text.secondary,
                    fontWeight: "600",
                    marginRight: 8,
                  }}
                >
                  Name
                </Text>
              </Pressable>
            </View>

            {/* In the Categories section, add the button above the sort controls */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                alignItems: "center",
                marginHorizontal: spacing.lg,
                marginTop: 8,
                marginBottom: 8,
              }}
            >
              <Pressable
                style={{
                  backgroundColor: colors.primary[500],
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                }}
                accessibilityRole="button"
                accessibilityLabel="Edit all budgets"
                onPress={() => router.push("/budgets/edit")}
              >
                <Text
                  style={{ color: "#FFF", fontWeight: "600", fontSize: 15 }}
                >
                  Edit Budgets
                </Text>
              </Pressable>
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
                                Overspent by {formatAmount(Math.abs(left), currency)}
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
                    if (tx.amount < 0) { // Only count expenses
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
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomLeftRadius: borderRadius["3xl"],
    borderBottomRightRadius: borderRadius["3xl"],
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
    ...shadows.md,
  },
  tabSwitchWrapper: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: borderRadius["3xl"],
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
    borderRadius: borderRadius["3xl"],
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
    borderRadius: borderRadius["3xl"],
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
});
