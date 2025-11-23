import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  ScrollView,
  RefreshControl,
  StyleSheet,
  View,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import dayjs from "dayjs";
import { useTheme } from "../../contexts/ThemeContext";
import { useSecurity } from "../../contexts/SecurityContext";
import { useNotifications } from "../../contexts/NotificationContext";
import { useAuth } from "../auth/AuthContext";
import { useRevenueCat } from "../../contexts/RevenueCatContext";
import { budgetAPI } from "../../services/api";
import { SPACING } from "../../constants/Colors";
import { TabLoadingScreen } from "../../components/ui";
import { DashboardSkeleton } from "../../components/ui/SkeletonLoader";
import {
  HomeHeader,
  BalanceCard,
  QuickActions,
  TransactionsList,
  UpcomingBillsCard,
  NotificationCard,
} from "../../components/home";
import { CompactSpendingSummary } from "../../components/home/CompactSpendingSummary";
import { CompactBudgetStatus } from "../../components/home/CompactBudgetStatus";
import { UpgradeBanner } from "../../components/premium/UpgradeBanner";
import { AIInsightCard } from "../../components/ai/AIInsightCard";
import { AIButton } from "../../components/ai/AIButton";
import { getBalanceInsight, ChartInsightResponse } from "../../services/api/chartInsightsAPI";
import { aiInsightPersistence } from "../../services/aiInsightPersistence";
import { useDashboardData } from "../../hooks/useDashboardData";

export default function HomeScreen() {
  const { colors } = useTheme();
  const { isLocked } = useSecurity();
  const router = useRouter();
  const { unreadCount } = useNotifications();
  const { isLoggedIn, user } = useAuth();
  const revenueCatData = useRevenueCat();
  const {
    isPro,
    isLoading: revenueCatLoading,
    refreshCustomerInfo,
  } = revenueCatData;

  // Use custom hook for data management
  const {
    transactions,
    totalBalance,
    loading,
    refreshing,
    warning,
    balanceRefreshing,
    loadData,
    refreshData,
    forceRefresh,
    handleRefreshBalance
  } = useDashboardData();

  // AI Insights state
  const [balanceInsight, setBalanceInsight] = useState<ChartInsightResponse | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [showAIInsight, setShowAIInsight] = useState(false);
  const [canRequestInsight, setCanRequestInsight] = useState(true);

  // Ref for scroll view
  const scrollViewRef = useRef<ScrollView>(null);

  // Current month for calculations
  const currentMonth = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  })();

  // Load user's budget from database
  const loadUserBudget = async () => {
    try {
      const budgetPreferences = await budgetAPI.getBudgetPreferences();
      if (budgetPreferences.monthlySpendingLimit) {
        setUserBudget(budgetPreferences.monthlySpendingLimit);
      }
    } catch (error) {
      console.error("Error loading user budget from database:", error);
    }
  };

  // Load cached AI insight on mount
  useEffect(() => {
    const loadCachedInsight = async () => {
      const userId = user?.id;
      if (!userId || !isPro || transactions.length === 0) {
        return;
      }

      try {
        const cached = await aiInsightPersistence.getInsight(userId, 'home_balance');

        if (cached) {
          console.log('[Home] 📦 Loaded cached balance insight');
          setBalanceInsight(cached.data);
          setShowAIInsight(true);
          setCanRequestInsight(false);
        } else {
          setCanRequestInsight(true);
        }
      } catch (error) {
        console.error('[Home] Error loading cached insight:', error);
      }
    };

    loadCachedInsight();
  }, [user?.id, isPro, transactions.length]);

  // Fetch AI balance insight
  const fetchBalanceInsight = async () => {
    const userId = user?.id;
    if (!userId) {
      console.warn('[Home] No userId available');
      return;
    }

    try {
      setInsightLoading(true);

      // Calculate income and expenses from transactions
      const income = transactions
        .filter((t) => t.type === "credit")
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = transactions
        .filter((t) => t.type === "debit")
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      // For now, use current balance as previous balance (will enhance later with historical data)
      const previousBalance = totalBalance * 0.92; // Placeholder: assume 8% growth

      console.log("[Home] Fetching balance insight...", {
        currentBalance: totalBalance,
        previousBalance,
        income,
        expenses,
      });

      const insight = await getBalanceInsight(
        totalBalance,
        previousBalance,
        income,
        expenses,
        "month"
      );

      setBalanceInsight(insight);

      // Save to cache with 24h expiration
      await aiInsightPersistence.saveInsight(userId, 'home_balance', insight);
      setCanRequestInsight(false);

      console.log("[Home] ✅ Balance insight loaded and cached for 24h");
    } catch (error) {
      // Silently fail - AI insights are optional and may not be configured
      console.warn("[Home] ⚠️ AI insights unavailable (OpenAI API key may not be configured)");
      setBalanceInsight(null);
    } finally {
      setInsightLoading(false);
    }
  };

  // Wrapper for handleRefreshBalance to add UI alerts
  const onRefreshBalancePress = async () => {
    const success = await handleRefreshBalance();
    if (success) {
      Alert.alert(
        "Balance Refreshed",
        "Balance updated successfully from transactions.",
        [{ text: "OK" }]
      );
    } else {
      Alert.alert(
        "Refresh Failed",
        "Failed to refresh balance. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  // Initial load
  useEffect(() => {
    if (!isLocked && isLoggedIn) {
      loadData();
      loadUserBudget();
    }
  }, [isLocked, isLoggedIn]);

  // Handler for AI button press
  const handleAIButtonPress = () => {
    if (!canRequestInsight) {
      Alert.alert(
        "AI Limit Reached",
        "You've reached your daily AI insight limit. Your insights will be available again in 24 hours.\n\nUpgrade to Premium for unlimited AI insights!",
        [{ text: "OK" }]
      );
      return;
    }

    if (!showAIInsight) {
      fetchBalanceInsight();
    }
    setShowAIInsight(!showAIInsight);
  };

  // Check for new transactions when screen comes into focus
  const checkForNewTransaction = useCallback(async () => {
    try {
      console.log("💰 [Home] Refreshing data from database...");
      await forceRefresh();
    } catch (error) {
      console.error("💰 [Home] Error refreshing data:", error);
    }
  }, [forceRefresh]);

  // Refresh data when screen comes into focus
  const hasRefreshedOnFocusRef = useRef(false);

  useFocusEffect(
    React.useCallback(() => {
      if (isLoggedIn && !isLocked && !hasRefreshedOnFocusRef.current) {
        hasRefreshedOnFocusRef.current = true;
        console.log(
          "🔄 [Home] Screen focused - checking for new transactions and refreshing data"
        );
        refreshCustomerInfo().catch((error) => {
          console.warn(
            "[Home] Failed to refresh RevenueCat customer info:",
            error
          );
        });
        checkForNewTransaction();

        setTimeout(() => {
          hasRefreshedOnFocusRef.current = false;
        }, 2000);
      }
    }, [isLoggedIn, isLocked, refreshCustomerInfo, checkForNewTransaction])
  );

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Morning";
    if (hour < 17) return "Afternoon";
    return "Evening";
  };

  const [userBudget, setUserBudget] = useState(2000);

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: colors.background.primary },
        ]}
      >
        <DashboardSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshData}
            colors={[colors.primary.main]}
            tintColor={colors.primary.main}
          />
        }
      >
        {/* Core Dashboard Section */}
        <View style={styles.section}>
          <HomeHeader />
          <View style={{ position: 'relative' }}>
            <BalanceCard
              totalBalance={totalBalance}
              getTimeOfDay={getTimeOfDay}
              onRefresh={onRefreshBalancePress}
              isRefreshing={balanceRefreshing}
            />

            {/* AI Button - Positioned inside balance card at bottom right */}
            {isPro && transactions.length > 0 && !showAIInsight && (
              <View style={{
                position: 'absolute',
                bottom: 16,
                right: 32,
                zIndex: 10,
              }}>
                <AIButton
                  onPress={handleAIButtonPress}
                  loading={insightLoading}
                  active={false}
                  label="Ask AI"
                />
              </View>
            )}
          </View>

          {/* AI Insight Card - Below balance card when active */}
          {isPro && transactions.length > 0 && showAIInsight && balanceInsight && (
            <View style={{
              marginHorizontal: 16,
              marginTop: 12,
              marginBottom: 16,
            }}>
              <AIInsightCard
                insight={balanceInsight.insight}
                expandedInsight={balanceInsight.expandedInsight}
                priority={balanceInsight.priority}
                actionable={balanceInsight.actionable}
                loading={insightLoading}
                collapsedByDefault={true}
              />
            </View>
          )}

          <QuickActions />
        </View>

        {/* Alerts & Action Items Section */}
        <View style={styles.section}>
          {/* Show notifications only if there are unread notifications */}
          {unreadCount > 0 && <NotificationCard />}

          {/* Upgrade Banner - Only show if user is not premium */}
          {!revenueCatLoading && !isPro && (
            <UpgradeBanner
              variant="subtle"
              message="Upgrade to Premium for unlimited budgets & advanced features"
              actionLabel="Upgrade"
            />
          )}
        </View>

        {/* Spending Overview Section */}
        <View style={styles.section}>
          <CompactSpendingSummary onViewAll={() => router.push("/spending")} />
        </View>

        {/* Budget Status Section */}
        <View style={styles.section}>
          <CompactBudgetStatus onViewAll={() => router.push("/budgets")} />
        </View>

        {/* Upcoming Bills Section */}
        <View style={styles.section}>
          <UpcomingBillsCard />
        </View>

        {/* Recent Transactions Section */}
        <View style={[styles.section, { marginBottom: 80 }]}>
          <TransactionsList
            transactions={transactions.slice(0, 5)}
            onViewAll={() => router.push("/transactions")}
            isLoading={loading}
          />
        </View>
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
  section: {
    marginBottom: SPACING.lg,
  },
});
