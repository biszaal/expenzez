import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { Animated } from "react-native";
import dayjs from "dayjs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { transactionAPI } from "../services/api/transactionAPI";
import { budgetAPI } from "../services/api";
import { balanceAPI } from "../services/api/balanceAPI";
import { getMerchantInfo } from "../services/merchantService";
import { processTransactionExpense } from "../utils/expenseDetection";
import { PerformanceMonitor } from "../utils/performanceOptimizations";
import { SPENDING_CATEGORIES } from "../constants/spendingCategories";
import { useAuth } from "../app/auth/AuthContext";
import { useXP } from "../hooks/useXP";
import { aiInsightPersistence } from "../services/aiInsightPersistence";
import { ChartInsightResponse } from "../services/api/chartInsightsAPI";

export const useSpendingData = (isPro: boolean) => {
  const { user } = useAuth();
  const { awardXPSilently } = useXP();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    dayjs().format("YYYY-MM")
  );
  const [transactions, setTransactions] = useState<any[]>([]);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [userBudget, setUserBudget] = useState(2000);

  // AI Insights state
  const [spendingInsight, setSpendingInsight] = useState<ChartInsightResponse | null>(null);
  const [budgetInsight, setBudgetInsight] = useState<ChartInsightResponse | null>(null);
  const [canRequestSpendingInsight, setCanRequestSpendingInsight] = useState(true);
  const [canRequestBudgetInsight, setCanRequestBudgetInsight] = useState(true);

  // Animation values
  const animatedProgress = useMemo(() => new Animated.Value(0), []);
  const animatedScale = useMemo(() => new Animated.Value(0.9), []);

  // Refs
  const fetchingRef = useRef(false);
  const xpAwardedRef = useRef(false);

  // Load user budget
  const loadUserBudget = async () => {
    try {
      const budgetPreferences = await budgetAPI.getBudgetPreferences();
      if (budgetPreferences.monthlySpendingLimit) {
        setUserBudget(budgetPreferences.monthlySpendingLimit);
      }
    } catch (error) {
      console.error("Error loading user budget:", error);
    }
  };

  // Load cached insights
  useEffect(() => {
    const loadCachedInsights = async () => {
      const userId = user?.id;
      if (!userId || !isPro) return;

      try {
        const cachedSpending = await aiInsightPersistence.getInsight(userId, 'spending_chart');
        if (cachedSpending) {
          setSpendingInsight(cachedSpending.data);
          setCanRequestSpendingInsight(false);
        }

        const cachedBudget = await aiInsightPersistence.getInsight(userId, 'spending_budget');
        if (cachedBudget) {
          setBudgetInsight(cachedBudget.data);
          setCanRequestBudgetInsight(false);
        }
      } catch (error) {
        console.error('Error loading cached insights:', error);
      }
    };

    loadCachedInsights();
  }, [user?.id, isPro]);

  // Fetch data
  const fetchData = async (forceRefresh = false) => {
    if (fetchingRef.current && !forceRefresh) return;
    fetchingRef.current = true;

    try {
      setLoading(true);
      setError(null);

      // Load budget
      await loadUserBudget();

      // Get available months from balance summary
      try {
        const summary = await balanceAPI.getSummary({
          useCache: !forceRefresh,
          forceRefresh: forceRefresh,
        });
        if (summary?.monthsWithData) {
          setAvailableMonths(summary.monthsWithData);
        }
      } catch (err) {
        console.warn("Failed to load balance summary:", err);
      }

      // Fetch transactions
      const response = await transactionAPI.getTransactions({
        limit: 1000,
        startDate: dayjs().subtract(12, "months").startOf("month").format("YYYY-MM-DD"),
        endDate: dayjs().endOf("month").format("YYYY-MM-DD"),
      });

      if (response.transactions) {
        setTransactions(response.transactions);
      }

      // Award XP if not already awarded
      if (!xpAwardedRef.current) {
        awardXPSilently("check-spending");
        xpAwardedRef.current = true;
      }

    } catch (err) {
      console.error("Error fetching spending data:", err);
      setError("Failed to load spending data");
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  // Monthly Transactions
  const monthlyTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      if (!txn.date) return false;
      return dayjs(txn.date).format("YYYY-MM") === selectedMonth;
    });
  }, [transactions, selectedMonth]);

  // Monthly Data Calculation
  const monthlyData = useMemo(() => {
    const stopTiming = PerformanceMonitor.startTiming("monthly-data-calculation");
    
    const monthlySpentByCategory: Record<string, number> = {};
    const monthlySpentByMerchant: Record<string, number> = {};

    if (monthlyTransactions.length === 0) {
      stopTiming();
      return {
        categoryData: [],
        merchantData: [],
        totalSpent: 0,
        averageTransaction: 0,
        monthlySpentByCategory: {},
        monthlySpentByMerchant: {},
        monthlyTotalSpent: 0
      };
    }

    // Process transactions
    monthlyTransactions.forEach((txn, index) => {
      const category = txn.category || "Other";
      const merchantInfo = getMerchantInfo(txn.description || txn.merchant || "Unknown");
      
      const { isExpense } = processTransactionExpense(txn, index, false);

      if (isExpense) {
        const amount = Math.abs(txn.amount);
        monthlySpentByCategory[category] = (monthlySpentByCategory[category] || 0) + amount;
        monthlySpentByMerchant[merchantInfo.name] = (monthlySpentByMerchant[merchantInfo.name] || 0) + amount;
      }
    });

    const monthlyTotalSpent = Object.values(monthlySpentByCategory).reduce((a, b) => a + b, 0);

    stopTiming();
    return {
      monthlyTransactions,
      monthlySpentByCategory,
      monthlySpentByMerchant,
      monthlyTotalSpent,
    };
  }, [monthlyTransactions]);

  // Chart Data Calculation
  const dailySpendingData = useMemo(() => {
    const currentMonthSpending: Record<string, number> = {};
    const prevMonthSpending: Record<string, number> = {};
    
    const prevMonth = dayjs(selectedMonth).subtract(1, "month").format("YYYY-MM");
    const prevTransactions = transactions.filter(tx => 
      tx.date && dayjs(tx.date).format("YYYY-MM") === prevMonth
    );

    // Helper to process spending
    const processSpending = (txs: any[], target: Record<string, number>) => {
      txs.forEach(tx => {
        if (!tx.date) return;
        const { isExpense } = processTransactionExpense(tx, 0, false);
        if (isExpense) {
          const day = dayjs(tx.date).format("DD");
          target[day] = (target[day] || 0) + Math.abs(tx.amount);
        }
      });
    };

    processSpending(monthlyTransactions, currentMonthSpending);
    processSpending(prevTransactions, prevMonthSpending);

    // Build chart arrays
    const daysInMonth = dayjs(selectedMonth).daysInMonth();
    const isCurrentMonth = selectedMonth === dayjs().format("YYYY-MM");
    const today = dayjs().date();
    const maxDay = isCurrentMonth ? today : daysInMonth;

    const labels: string[] = [];
    const data: number[] = [];
    const prevMonthData: number[] = [];
    
    let currentCumulative = 0;
    let prevCumulative = 0;

    // Calculate full previous month cumulative first
    const fullPrevMonthData: number[] = [];
    const prevDaysInMonth = dayjs(prevMonth).daysInMonth();
    for(let i=1; i<=prevDaysInMonth; i++) {
      const day = i.toString().padStart(2, "0");
      prevCumulative += (prevMonthSpending[day] || 0);
      fullPrevMonthData.push(prevCumulative);
    }

    // Build chart data
    for (let i = 1; i <= daysInMonth; i++) {
      // Labels
      if (i === 1 || i === daysInMonth || i === Math.floor(daysInMonth/2)) {
        labels.push(`${i} ${dayjs(selectedMonth).format("MMM")}`);
      } else {
        labels.push("");
      }

      // Current Month Data
      if (i <= maxDay) {
        const day = i.toString().padStart(2, "0");
        currentCumulative += (currentMonthSpending[day] || 0);
        data.push(currentCumulative);
      }

      // Previous Month Data (mapped to current month days)
      if (i <= prevDaysInMonth) {
        prevMonthData.push(fullPrevMonthData[i-1]);
      } else {
        prevMonthData.push(fullPrevMonthData[fullPrevMonthData.length-1]);
      }
    }

    return { labels, data, prevMonthData };
  }, [monthlyTransactions, transactions, selectedMonth]);

  // Category Data Generation
  const generateCategoryData = async () => {
    const data = Object.entries(monthlyData.monthlySpentByCategory).map(([name, amount]) => {
      const config = SPENDING_CATEGORIES.find(c => c.name === name) || {
        name,
        icon: "pricetag-outline",
        color: "#95A5A6"
      };
      
      return {
        ...config,
        totalSpent: amount,
        transactionCount: monthlyTransactions.filter(t => t.category === name).length,
        budget: 300 // Default, logic to load actual budget can be added here
      };
    });

    return data.sort((a, b) => b.totalSpent - a.totalSpent);
  };

  return {
    loading,
    error,
    selectedMonth,
    setSelectedMonth,
    availableMonths,
    userBudget,
    monthlyData,
    dailySpendingData,
    fetchData,
    generateCategoryData,
    spendingInsight,
    budgetInsight,
    canRequestSpendingInsight,
    canRequestBudgetInsight,
    setSpendingInsight,
    setBudgetInsight,
    setCanRequestSpendingInsight,
    setCanRequestBudgetInsight,
    animatedProgress,
    animatedScale
  };
};
