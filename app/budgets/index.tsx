import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useCurrency } from "../../contexts/CurrencyContext";
import { useAuth } from "../auth/AuthContext";
import { useSubscription } from "../../hooks/useSubscription";
import { PremiumFeature } from "../../services/subscriptionService";
import { budgetService, BudgetProgress } from "../../services/budgetService";
import { EXPENSE_CATEGORIES } from "../../services/expenseStorage";
import { spacing, borderRadius, typography, fontFamily } from "../../constants/theme";
import { UpgradeBanner } from "../../components/premium/UpgradeBanner";
import { LimitReachedPrompt } from "../../components/premium/LimitReachedPrompt";
import { FeatureShowcase } from "../../components/premium/FeatureShowcase";
import { AIInsightCard } from "../../components/ai/AIInsightCard";
import { AIButton } from "../../components/ai/AIButton";
import { getBudgetInsight, ChartInsightResponse } from "../../services/api/chartInsightsAPI";
import { aiInsightPersistence } from "../../services/aiInsightPersistence";

export default function BudgetsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { isPremium, hasFeatureAccess } = useSubscription();
  const [budgetProgress, setBudgetProgress] = useState<BudgetProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showLimitPrompt, setShowLimitPrompt] = useState(false);
  const [budgetLimit, setBudgetLimit] = useState(3); // Free tier: 3 budgets max

  // AI insights state - one insight per budget
  const [budgetInsights, setBudgetInsights] = useState<Record<string, ChartInsightResponse>>({});
  const [insightLoading, setInsightLoading] = useState<Record<string, boolean>>({});
  const [showAIInsight, setShowAIInsight] = useState<Record<string, boolean>>({});
  const [canRequestInsight, setCanRequestInsight] = useState<Record<string, boolean>>({});

  // Refs for auto-scroll
  const scrollViewRef = React.useRef<ScrollView>(null);
  const budgetCardRefs = React.useRef<Record<string, View | null>>({});

  // Handle adding a new budget with subscription check
  const handleAddBudget = () => {
    const budgetAccess = hasFeatureAccess(PremiumFeature.UNLIMITED_BUDGETS, {
      budgetCount: budgetProgress.length,
    });

    if (!budgetAccess.hasAccess) {
      setShowLimitPrompt(true);
      return;
    }

    router.push("/budgets/edit");
  };

  // Reload whenever the screen regains focus (e.g. returning from the
  // add/edit budget page), so newly saved budgets show without a remount.
  useFocusEffect(
    useCallback(() => {
      loadBudgets();
    }, [])
  );

  // Load cached AI insights for all budgets on mount
  useEffect(() => {
    const loadCachedInsights = async () => {
      const userId = user?.id;
      if (!userId || !isPremium || budgetProgress.length === 0) {
        return;
      }

      try {
        const cachedInsights: Record<string, ChartInsightResponse> = {};
        const canRequest: Record<string, boolean> = {};
        const shouldShow: Record<string, boolean> = {};

        for (const progress of budgetProgress) {
          const budgetId = progress.budget.id;
          const cached = await aiInsightPersistence.getInsight(userId, `budget_${budgetId}`);

          if (cached) {
            console.log(`[Budgets] 📦 Loaded cached insight for budget: ${progress.budget.name}`);
            cachedInsights[budgetId] = cached.data;
            canRequest[budgetId] = false;
            shouldShow[budgetId] = true;
          } else {
            canRequest[budgetId] = true;
            shouldShow[budgetId] = false;
          }
        }

        setBudgetInsights(prev => ({ ...prev, ...cachedInsights }));
        setCanRequestInsight(prev => ({ ...prev, ...canRequest }));
        setShowAIInsight(prev => ({ ...prev, ...shouldShow }));
      } catch (error) {
        console.error('[Budgets] Error loading cached insights:', error);
      }
    };

    loadCachedInsights();
  }, [user?.id, isPremium, budgetProgress.length]);

  // Auto-scroll to budget when its AI insight appears
  React.useEffect(() => {
    // Find the most recently shown insight
    const shownBudgetIds = Object.entries(showAIInsight)
      .filter(([_, isShown]) => isShown)
      .map(([budgetId]) => budgetId);

    if (shownBudgetIds.length > 0 && scrollViewRef.current) {
      const latestBudgetId = shownBudgetIds[shownBudgetIds.length - 1];
      const budgetCardRef = budgetCardRefs.current[latestBudgetId];

      if (budgetCardRef) {
        setTimeout(() => {
          budgetCardRef?.measureLayout(
            scrollViewRef.current as any,
            (x, y) => {
              scrollViewRef.current?.scrollTo({
                y: y - 20,
                animated: true,
              });
            },
            () => {
              console.log('[Budgets] Failed to measure budget card position');
            }
          );
        }, 400);
      }
    }
  }, [showAIInsight]);

  const loadBudgets = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const progress = await budgetService.getAllBudgetProgress();
      setBudgetProgress(progress);
    } catch (error) {
      console.error("Error loading budgets:", error);
      Alert.alert("Error", "Failed to load budgets");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch AI insight for a specific budget
  const fetchBudgetAIInsight = useCallback(async (progress: BudgetProgress) => {
    if (!isPremium) {
      return;
    }

    try {
      setInsightLoading(prev => ({ ...prev, [progress.budget.id]: true }));

      console.log(`[Budgets] Fetching AI insight for budget: ${progress.budget.name}`, {
        spent: progress.spent,
        limit: progress.budget.amount,
        daysLeft: progress.daysLeft,
        percentage: progress.percentage,
      });

      const insight = await getBudgetInsight(
        progress.budget.name,
        progress.spent,
        progress.budget.amount,
        progress.daysLeft
      );

      setBudgetInsights(prev => ({ ...prev, [progress.budget.id]: insight }));

      // Save to cache with 24h expiration
      const userId = user?.id;
      if (userId) {
        await aiInsightPersistence.saveInsight(userId, `budget_${progress.budget.id}`, insight);
        setCanRequestInsight(prev => ({ ...prev, [progress.budget.id]: false }));
        console.log(`[Budgets] ✅ AI insight loaded and cached for ${progress.budget.name}`);
      }
    } catch (error) {
      console.warn(`[Budgets] ⚠️ AI insights unavailable for ${progress.budget.name}`);
    } finally {
      setInsightLoading(prev => ({ ...prev, [progress.budget.id]: false }));
    }
  }, [isPremium, user?.id]);

  // Handler for AI button press for a specific budget
  const handleAIButtonPress = (progress: BudgetProgress) => {
    const budgetId = progress.budget.id;
    const isCurrentlyShown = showAIInsight[budgetId];
    const canRequest = canRequestInsight[budgetId] !== false; // Default to true if undefined

    // Check if user can request a new insight
    if (!canRequest) {
      Alert.alert(
        "AI Limit Reached",
        "You've reached your daily AI insight limit. Your insights will be available again in 24 hours.\n\nUpgrade to Premium for unlimited AI insights!",
        [{ text: "OK" }]
      );
      return;
    }

    if (!isCurrentlyShown && !budgetInsights[budgetId]) {
      // First time opening and allowed - fetch the insight
      fetchBudgetAIInsight(progress);
    }

    // Toggle show state
    setShowAIInsight(prev => ({ ...prev, [budgetId]: !isCurrentlyShown }));
  };

  const handleDeleteBudget = (budgetId: string, budgetName: string) => {
    Alert.alert(
      "Delete Budget",
      `Are you sure you want to delete the "${budgetName}" budget?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const success = await budgetService.deleteBudget(budgetId);
            if (success) {
              Alert.alert("Success", "Budget deleted successfully");
              loadBudgets();
            } else {
              Alert.alert("Error", "Failed to delete budget");
            }
          },
        },
      ]
    );
  };

  const getBudgetStatusColor = (status: BudgetProgress["status"]) => {
    return budgetService.getBudgetStatusColor(status);
  };

  const getBudgetStatusIcon = (status: BudgetProgress["status"]) => {
    return budgetService.getBudgetStatusIcon(status);
  };

  const { formatAmount: formatCurrency } = useCurrency();

  const getCategoryIcon = (categoryName: string): keyof typeof Ionicons.glyphMap => {
    const categoryMap: { [key: string]: keyof typeof Ionicons.glyphMap } = {
      "Monthly Budget": "wallet-outline",
      General: "wallet-outline",
      Shopping: "bag-handle-outline",
      Utilities: "bulb-outline",
      Entertainment: "film-outline",
      "Food & Dining": "restaurant-outline",
      Transportation: "car-outline",
      Transport: "car-outline",
      "Health & Fitness": "fitness-outline",
      Travel: "airplane-outline",
      "Bills & Utilities": "receipt-outline",
      "Banking & Finance": "card-outline",
      Groceries: "basket-outline",
      Other: "ellipsis-horizontal-circle-outline",
    };

    return categoryMap[categoryName] || "pricetag-outline";
  };

  // The overall monthly budget, shown as one clear summary at the top.
  const renderMonthlyHero = (progress: BudgetProgress) => {
    const statusColor = getBudgetStatusColor(progress.status);
    const over = progress.remaining < 0;
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push(`/budgets/edit?id=${progress.budget.id}`)}
        style={[
          styles.heroCard,
          {
            backgroundColor: colors.background.secondary,
            borderColor: colors.border.medium,
          },
        ]}
      >
        <View style={styles.heroTopRow}>
          <Text style={[styles.heroLabel, { color: colors.text.secondary }]}>
            This month
          </Text>
          <Text style={[styles.heroDays, { color: colors.text.tertiary }]}>
            {progress.daysLeft} {progress.daysLeft === 1 ? "day" : "days"} left
          </Text>
        </View>

        <View style={styles.heroAmountRow}>
          <Text style={[styles.heroSpent, { color: colors.text.primary }]}>
            {formatCurrency(progress.spent)}
          </Text>
          <Text style={[styles.heroLimit, { color: colors.text.tertiary }]}>
            of {formatCurrency(progress.budget.amount)}
          </Text>
        </View>
        <Text
          style={[
            styles.heroRemaining,
            { color: over ? colors.error.main : colors.text.secondary },
          ]}
        >
          {over
            ? `${formatCurrency(Math.abs(progress.remaining))} over budget`
            : `${formatCurrency(progress.remaining)} left to spend`}
        </Text>

        <View
          style={[
            styles.progressBar,
            { backgroundColor: colors.border.light, marginTop: spacing.md },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: statusColor,
                width: `${Math.min(progress.percentage, 100)}%`,
              },
            ]}
          />
        </View>
      </TouchableOpacity>
    );
  };

  // A single category cap — minimal row, tap to edit.
  const renderCategoryRow = (progress: BudgetProgress, isLast: boolean) => {
    const statusColor = getBudgetStatusColor(progress.status);
    const categoryIcon = getCategoryIcon(progress.budget.name);
    const over = progress.remaining < 0;
    return (
      <TouchableOpacity
        key={progress.budget.id}
        activeOpacity={0.7}
        onPress={() => router.push(`/budgets/edit?id=${progress.budget.id}`)}
        style={[
          styles.catRow,
          !isLast && {
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.border.light,
          },
        ]}
      >
        <View
          style={[
            styles.budgetIconChip,
            { backgroundColor: colors.primary.main + "1F" },
          ]}
        >
          <Ionicons name={categoryIcon} size={18} color={colors.primary.main} />
        </View>
        <View style={styles.catBody}>
          <View style={styles.catTopRow}>
            <Text
              style={[styles.catName, { color: colors.text.primary }]}
              numberOfLines={1}
            >
              {progress.budget.name}
            </Text>
            <Text
              style={[
                styles.catAmount,
                { color: over ? colors.error.main : colors.text.secondary },
              ]}
            >
              {formatCurrency(progress.spent)} / {formatCurrency(progress.budget.amount)}
            </Text>
          </View>
          <View
            style={[
              styles.progressBar,
              { backgroundColor: colors.border.light, marginTop: 8 },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: statusColor,
                  width: `${Math.min(progress.percentage, 100)}%`,
                },
              ]}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: colors.background.primary },
        ]}
      >
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            Loading budgets...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const mainBudgetProgress = budgetProgress.find(
    (b) => b.budget.id === "main-budget"
  );
  const categoryProgress = budgetProgress.filter(
    (b) => b.budget.id !== "main-budget"
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons
              name="chevron-back"
              size={24}
              color={colors.primary.main}
            />
          </TouchableOpacity>
          <View>
            <Text style={[styles.title, { color: colors.text.primary }]}>
              Budgets
            </Text>
            <Text
              style={[styles.subtitle, { color: colors.text.secondary }]}
            >
              Track your spending limits
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleAddBudget}
          style={[styles.addButton, { backgroundColor: colors.primary.main }]}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Upgrade Banner */}
      <UpgradeBanner
        variant="subtle"
        message={`${budgetProgress.length}/${budgetLimit} budgets created`}
        actionLabel="Upgrade"
      />

      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadBudgets(true)}
            tintColor={colors.primary.main}
          />
        }
      >
        {budgetProgress.length === 0 ? (
          <View style={styles.emptyState}>
            {/* Feature Showcase for Empty State */}
            <FeatureShowcase
              title="Unlock Budget Power with Premium"
              features={[
                {
                  icon: "wallet",
                  label: "Budgets",
                  freeValue: "3",
                  premiumValue: "Unlimited",
                },
                {
                  icon: "alert-circle",
                  label: "Spending Alerts",
                  freeValue: "Basic",
                  premiumValue: "Advanced",
                },
                {
                  icon: "analytics",
                  label: "Budget Analytics",
                  freeValue: "Limited",
                  premiumValue: "Full",
                },
              ]}
            />

            <Ionicons
              name="wallet-outline"
              size={48}
              color={colors.text.tertiary}
              style={styles.emptyIcon}
            />
            <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
              No budgets yet
            </Text>
            <Text
              style={[
                styles.emptyDescription,
                { color: colors.text.secondary },
              ]}
            >
              Create your first budget to start tracking your spending and reach
              your financial goals.
            </Text>
            <TouchableOpacity
              onPress={handleAddBudget}
              style={[
                styles.emptyButton,
                { backgroundColor: colors.primary.main },
              ]}
            >
              <Text style={styles.emptyButtonText}>Create Budget</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.budgetList}>
            {mainBudgetProgress && renderMonthlyHero(mainBudgetProgress)}

            {categoryProgress.length > 0 && (
              <>
                <Text
                  style={[styles.sectionLabel, { color: colors.text.secondary }]}
                >
                  Categories
                </Text>
                <View
                  style={[
                    styles.catGroup,
                    {
                      backgroundColor: colors.background.secondary,
                      borderColor: colors.border.medium,
                    },
                  ]}
                >
                  {categoryProgress.map((p, i) =>
                    renderCategoryRow(p, i === categoryProgress.length - 1)
                  )}
                </View>
              </>
            )}
          </View>
        )}

        {budgetProgress.length > 0 && (
          <View style={styles.suggestionsSection}>
            <TouchableOpacity
              onPress={() => router.push("/insights")}
              style={[
                styles.suggestionButton,
                { backgroundColor: colors.background.secondary },
              ]}
            >
              <Ionicons name="bulb" size={20} color={colors.primary.main} />
              <Text
                style={[styles.suggestionText, { color: colors.text.primary }]}
              >
                Get Budget Suggestions
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.text.secondary}
              />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Limit Reached Modal */}
      <LimitReachedPrompt
        visible={showLimitPrompt}
        limitType="budgets"
        currentUsage={budgetProgress.length}
        limit={budgetLimit}
        message={`You've reached the budget limit on your Free plan (${budgetLimit} budgets). Upgrade to Premium for unlimited budgets.`}
        onDismiss={() => setShowLimitPrompt(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "400",
    marginTop: 2,
  },
  summarySection: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginHorizontal: spacing.md,
    marginTop: 0,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    gap: spacing.xs,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: 14,
  },
  budgetList: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  // Monthly total hero
  heroCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: StyleSheet.hairlineWidth,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  heroDays: {
    fontSize: 12,
    fontFamily: fontFamily.mono,
  },
  heroAmountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  heroSpent: {
    fontSize: 34,
    fontFamily: fontFamily.monoSemibold,
    letterSpacing: -0.5,
  },
  heroLimit: {
    fontSize: 15,
    fontFamily: fontFamily.mono,
  },
  heroRemaining: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 4,
  },
  // Category rows
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    marginTop: spacing.sm,
    marginBottom: 2,
    marginLeft: 4,
  },
  catGroup: {
    borderRadius: borderRadius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
  },
  catRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  catBody: {
    flex: 1,
  },
  catTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  catName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
  catAmount: {
    fontSize: 13,
    fontFamily: fontFamily.mono,
  },
  budgetCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  budgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  budgetTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  budgetIconChip: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  budgetTitleText: {
    flex: 1,
  },
  budgetName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  budgetPeriod: {
    fontSize: 13,
    textTransform: "capitalize",
    fontWeight: "500",
  },
  budgetActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  statusIcon: {
    fontSize: 18,
    marginRight: spacing.xs,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  budgetAmount: {
    gap: 6,
    paddingBottom: spacing.xs,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.xs,
  },
  spent: {
    fontSize: 22,
    fontWeight: "800",
  },
  total: {
    fontSize: 15,
    fontWeight: "400",
  },
  remaining: {
    fontSize: 14,
    fontWeight: "600",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    position: "relative",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressOverflow: {
    position: "absolute",
    height: "100%",
    right: 0,
    top: 0,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "600",
    minWidth: 35,
    textAlign: "right",
  },
  budgetInsights: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  insightItem: {
    alignItems: "center",
    flex: 1,
  },
  insightLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  insightValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  emptyButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  emptyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  suggestionsSection: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  suggestionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  suggestionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
});
