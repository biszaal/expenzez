import React, { useState, useEffect } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useSubscription } from "../../hooks/useSubscription";
import { PremiumFeature } from "../../services/subscriptionService";
import { budgetService, BudgetProgress } from "../../services/budgetService";
import { EXPENSE_CATEGORIES } from "../../services/expenseStorage";
import { spacing, borderRadius, typography } from "../../constants/theme";
import { UpgradeBanner } from "../../components/premium/UpgradeBanner";
import { LimitReachedPrompt } from "../../components/premium/LimitReachedPrompt";
import { FeatureShowcase } from "../../components/premium/FeatureShowcase";

export default function BudgetsScreen() {
  const { colors } = useTheme();
  const { isPremium, hasFeatureAccess } = useSubscription();
  const [budgetProgress, setBudgetProgress] = useState<BudgetProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showLimitPrompt, setShowLimitPrompt] = useState(false);
  const [budgetLimit, setBudgetLimit] = useState(3); // Free tier: 3 budgets max

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

  useEffect(() => {
    loadBudgets();
  }, []);

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

  const formatCurrency = (amount: number) => {
    return `£${amount.toFixed(2)}`;
  };

  const getCategoryIcon = (categoryName: string) => {
    const categoryMap: { [key: string]: string } = {
      "Monthly Budget": "💰",
      General: "💰",
      Shopping: "🛍️",
      Utilities: "💡",
      Entertainment: "🎬",
      "Food & Dining": "🍔",
      Transportation: "🚗",
      "Health & Fitness": "💊",
      Travel: "✈️",
      "Bills & Utilities": "💡",
      "Banking & Finance": "🏦",
      Other: "📦",
    };

    return categoryMap[categoryName] || "📊";
  };

  const renderBudgetCard = (progress: BudgetProgress) => {
    const categoryInfo = EXPENSE_CATEGORIES.find(
      (cat) => cat.id === progress.budget.category
    );
    const statusColor = getBudgetStatusColor(progress.status);
    const statusIcon = getBudgetStatusIcon(progress.status);
    const categoryIcon = getCategoryIcon(progress.budget.name);

    return (
      <View
        key={progress.budget.id}
        style={[
          styles.budgetCard,
          { backgroundColor: colors.background.secondary },
        ]}
      >
        <View style={styles.budgetHeader}>
          <View style={styles.budgetTitle}>
            <Text style={styles.budgetEmoji}>{categoryIcon}</Text>
            <View style={styles.budgetTitleText}>
              <Text style={[styles.budgetName, { color: colors.text.primary }]}>
                {progress.budget.name}
              </Text>
              <Text
                style={[styles.budgetPeriod, { color: colors.text.secondary }]}
              >
                {progress.budget.period} • {progress.daysLeft} days left
              </Text>
            </View>
          </View>

          <View style={styles.budgetActions}>
            <Ionicons name={statusIcon as any} size={20} color={statusColor} />
            <TouchableOpacity
              onPress={() =>
                router.push(`/budgets/edit?id=${progress.budget.id}`)
              }
              style={[
                styles.actionButton,
                { backgroundColor: colors.background.primary },
              ]}
            >
              <Ionicons name="pencil" size={16} color={colors.text.secondary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                handleDeleteBudget(progress.budget.id, progress.budget.name)
              }
              style={[
                styles.actionButton,
                { backgroundColor: colors.background.primary },
              ]}
            >
              <Ionicons name="trash" size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.budgetAmount}>
          <View style={styles.amountRow}>
            <Text style={[styles.spent, { color: colors.text.primary }]}>
              {formatCurrency(progress.spent)}
            </Text>
            <Text style={[styles.total, { color: colors.text.secondary }]}>
              of {formatCurrency(progress.budget.amount)}
            </Text>
          </View>
          <Text
            style={[
              styles.remaining,
              {
                color:
                  progress.remaining >= 0 ? colors.text.secondary : "#EF4444",
              },
            ]}
          >
            {progress.remaining >= 0
              ? formatCurrency(progress.remaining)
              : formatCurrency(Math.abs(progress.remaining))}{" "}
            {progress.remaining >= 0 ? "remaining" : "over budget"}
          </Text>
        </View>

        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBar,
              { backgroundColor: colors.border.light },
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
            {progress.percentage > 100 && (
              <View
                style={[
                  styles.progressOverflow,
                  {
                    backgroundColor: "#EF4444",
                    width: `${Math.min(progress.percentage - 100, 50)}%`,
                  },
                ]}
              />
            )}
          </View>
          <Text style={[styles.progressText, { color: colors.text.secondary }]}>
            {Math.round(progress.percentage)}%
          </Text>
        </View>

        <View style={styles.budgetInsights}>
          <View style={styles.insightItem}>
            <Text
              style={[styles.insightLabel, { color: colors.text.secondary }]}
            >
              Daily Budget
            </Text>
            <Text style={[styles.insightValue, { color: colors.text.primary }]}>
              {formatCurrency(progress.dailyBudget)}
            </Text>
          </View>
          <View style={styles.insightItem}>
            <Text
              style={[styles.insightLabel, { color: colors.text.secondary }]}
            >
              Projected
            </Text>
            <Text
              style={[
                styles.insightValue,
                {
                  color:
                    progress.projectedSpend > progress.budget.amount
                      ? "#EF4444"
                      : colors.text.primary,
                },
              ]}
            >
              {formatCurrency(progress.projectedSpend)}
            </Text>
          </View>
        </View>
      </View>
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
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            Loading budgets...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const { onTrack, atRisk, exceeded } = (() => {
    const onTrack = budgetProgress.filter(
      (b) => b.status === "on_track"
    ).length;
    const atRisk = budgetProgress.filter((b) => b.status === "warning").length;
    const exceeded = budgetProgress.filter((b) => b.status === "danger").length;
    return { onTrack, atRisk, exceeded };
  })();

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
              color={colors.primary[500]}
            />
          </TouchableOpacity>
          <View>
            <Text style={[styles.title, { color: colors.text.primary }]}>
              💰 Budgets
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
          style={[styles.addButton, { backgroundColor: colors.primary[500] }]}
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
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadBudgets(true)}
            tintColor={colors.primary[500]}
          />
        }
      >
        {budgetProgress.length > 0 && (
          <View
            style={[
              styles.summarySection,
              { backgroundColor: colors.background.secondary },
            ]}
          >
            <View style={styles.summaryItem}>
              <View
                style={[styles.summaryIcon, { backgroundColor: "#10B98120" }]}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color="#10B981"
                />
              </View>
              <Text style={[styles.summaryValue, { color: "#10B981" }]}>
                {onTrack}
              </Text>
              <Text
                style={[styles.summaryLabel, { color: colors.text.secondary }]}
              >
                On Track
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <View
                style={[styles.summaryIcon, { backgroundColor: "#F59E0B20" }]}
              >
                <Ionicons name="warning" size={20} color="#F59E0B" />
              </View>
              <Text style={[styles.summaryValue, { color: "#F59E0B" }]}>
                {atRisk}
              </Text>
              <Text
                style={[styles.summaryLabel, { color: colors.text.secondary }]}
              >
                At Risk
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <View
                style={[styles.summaryIcon, { backgroundColor: "#EF444420" }]}
              >
                <Ionicons
                  name="alert-circle"
                  size={20}
                  color="#EF4444"
                />
              </View>
              <Text style={[styles.summaryValue, { color: "#EF4444" }]}>
                {exceeded}
              </Text>
              <Text
                style={[styles.summaryLabel, { color: colors.text.secondary }]}
              >
                Exceeded
              </Text>
            </View>
          </View>
        )}

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

            <Text style={styles.emptyIcon}>💰</Text>
            <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
              No Budgets Yet
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
                { backgroundColor: colors.primary[500] },
              ]}
            >
              <Text style={styles.emptyButtonText}>Create Budget</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.budgetList}>
            {budgetProgress.map(renderBudgetCard)}
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
              <Ionicons name="bulb" size={20} color={colors.primary[500]} />
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
    padding: spacing.lg,
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
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
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
  budgetEmoji: {
    fontSize: 28,
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
