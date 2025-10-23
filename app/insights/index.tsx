import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import {
  insightsEngine,
  SpendingInsight,
  SpendingNudge,
} from "../../services/insightsEngine";
import FinancialAdvisorDisclaimer from "../../components/FinancialAdvisorDisclaimer";
import { spacing, borderRadius } from "../../constants/theme";

export default function InsightsScreen() {
  const { colors } = useTheme();
  const [insights, setInsights] = useState<SpendingInsight[]>([]);
  const [nudges, setNudges] = useState<SpendingNudge[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"insights" | "nudges">("insights");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [generatedInsights, dailyNudges] = await Promise.all([
        insightsEngine.generateInsights([]), // Pass empty array for now
        insightsEngine.generateDailyNudges(),
      ]);

      setInsights(generatedInsights.filter((i) => !i.isDismissed));
      setNudges(dailyNudges);
    } catch (error) {
      console.error("Error loading insights:", error);
      Alert.alert("Error", "Failed to load insights");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleInsightAction = async (insight: SpendingInsight) => {
    // Mark as read
    await insightsEngine.markInsightAsRead(insight.id);

    // Handle action
    if (insight.actionType === "create_budget") {
      router.push("/budgets/edit");
    } else if (insight.actionType === "review_category") {
      router.push(`/insights/categories?category=${insight.category}`);
    } else if (insight.actionType === "view_details") {
      // Could navigate to expense details or analytics
      router.push("/expenses");
    }

    // Refresh insights
    loadData();
  };

  const handleDismissInsight = async (insightId: string) => {
    Alert.alert(
      "Dismiss Insight",
      "Are you sure you want to dismiss this insight?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Dismiss",
          style: "destructive",
          onPress: async () => {
            await insightsEngine.dismissInsight(insightId);
            loadData();
          },
        },
      ]
    );
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent":
        return { name: "alert" as const, color: "#DC2626" };
      case "high":
        return { name: "warning" as const, color: "#EF4444" };
      case "medium":
        return { name: "information-circle" as const, color: "#F59E0B" };
      case "low":
        return { name: "checkmark-circle" as const, color: "#10B981" };
      default:
        return { name: "information-circle" as const, color: "#10B981" };
    }
  };

  const getNudgeIcon = (type: SpendingNudge["type"]) => {
    switch (type) {
      case "daily_limit":
        return "💰";
      case "budget_warning":
        return "⚠️";
      case "weekly_summary":
        return "📊";
      case "saving_tip":
        return "💡";
      case "category_review":
        return "📝";
      default:
        return "💡";
    }
  };

  const getNudgePriorityColor = (priority: SpendingNudge["priority"]) => {
    switch (priority) {
      case "warning":
        return "#F59E0B";
      case "success":
        return "#10B981";
      case "info":
        return colors.primary[500];
      default:
        return colors.primary[500];
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const renderInsight = (insight: SpendingInsight) => {
    const priorityIcon = getPriorityIcon(insight.priority);

    return (
      <View
        key={insight.id}
        style={[
          styles.insightCard,
          { backgroundColor: colors.background.secondary },
        ]}
      >
        <View style={styles.insightHeader}>
          <View style={styles.insightTitleRow}>
            <Ionicons
              name={priorityIcon.name}
              size={20}
              color={priorityIcon.color}
            />
            <Text style={[styles.insightTitle, { color: colors.text.primary }]}>
              {insight.title}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => handleDismissInsight(insight.id)}
            style={styles.dismissButton}
          >
            <Ionicons name="close" size={16} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        <Text
          style={[styles.insightDescription, { color: colors.text.secondary }]}
        >
          {insight.description}
        </Text>

        {(insight.amount !== undefined || insight.percentage !== undefined) && (
          <View style={styles.insightMetrics}>
            {insight.amount !== undefined && (
              <View
                style={[
                  styles.metricBadge,
                  { backgroundColor: colors.primary[100] },
                ]}
              >
                <Text
                  style={[styles.metricText, { color: colors.primary[700] }]}
                >
                  £{insight.amount.toFixed(0)}
                </Text>
              </View>
            )}
            {insight.percentage !== undefined && (
              <View
                style={[
                  styles.metricBadge,
                  { backgroundColor: colors.primary[100] },
                ]}
              >
                <Text
                  style={[styles.metricText, { color: colors.primary[700] }]}
                >
                  {insight.percentage.toFixed(0)}%
                </Text>
              </View>
            )}
            {insight.category && (
              <View
                style={[
                  styles.metricBadge,
                  { backgroundColor: colors.border.light },
                ]}
              >
                <Text
                  style={[styles.metricText, { color: colors.text.secondary }]}
                >
                  {insight.category}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.insightFooter}>
          <Text style={[styles.timeStamp, { color: colors.text.secondary }]}>
            {formatTimeAgo(insight.createdAt)}
          </Text>

          {insight.actionText && (
            <TouchableOpacity
              onPress={() => handleInsightAction(insight)}
              style={[
                styles.actionButton,
                { backgroundColor: colors.primary[500] },
              ]}
            >
              <Text style={styles.actionButtonText}>{insight.actionText}</Text>
              <Ionicons name="chevron-forward" size={14} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderNudge = (nudge: SpendingNudge) => (
    <View
      key={nudge.id}
      style={[
        styles.nudgeCard,
        { backgroundColor: colors.background.secondary },
      ]}
    >
      <View style={styles.nudgeHeader}>
        <Text style={styles.nudgeEmoji}>{getNudgeIcon(nudge.type)}</Text>
        <View style={styles.nudgeContent}>
          <Text
            style={[
              styles.nudgeMessage,
              { color: getNudgePriorityColor(nudge.priority) },
            ]}
          >
            {nudge.message}
          </Text>
          {nudge.category && (
            <View style={styles.nudgeCategory}>
              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: colors.border.light },
                ]}
              >
                <Text
                  style={[
                    styles.categoryBadgeText,
                    { color: colors.text.secondary },
                  ]}
                >
                  {nudge.category}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );

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
            Analyzing your spending patterns...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Insights & Tips
          </Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab("insights")}
          style={[
            styles.tab,
            activeTab === "insights" && {
              backgroundColor: colors.primary[100],
            },
          ]}
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "insights"
                    ? colors.primary[700]
                    : colors.text.secondary,
                fontWeight: activeTab === "insights" ? "600" : "400",
              },
            ]}
          >
            Insights ({insights.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("nudges")}
          style={[
            styles.tab,
            activeTab === "nudges" && { backgroundColor: colors.primary[100] },
          ]}
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "nudges"
                    ? colors.primary[700]
                    : colors.text.secondary,
                fontWeight: activeTab === "nudges" ? "600" : "400",
              },
            ]}
          >
            Daily Tips ({nudges.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
            tintColor={colors.primary[500]}
          />
        }
      >
        {/* Financial Advisor Disclaimer */}
        <FinancialAdvisorDisclaimer
          showInline={true}
          style={{ marginBottom: spacing.md }}
        />
        {activeTab === "insights" ? (
          <>
            {insights.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text
                  style={[styles.emptyTitle, { color: colors.text.primary }]}
                >
                  No Insights Yet
                </Text>
                <Text
                  style={[
                    styles.emptyDescription,
                    { color: colors.text.secondary },
                  ]}
                >
                  Add more expenses and create budgets to get personalized
                  insights about your spending patterns.
                </Text>
              </View>
            ) : (
              <View style={styles.insightsList}>
                {insights.map(renderInsight)}
              </View>
            )}
          </>
        ) : (
          <>
            {nudges.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>💭</Text>
                <Text
                  style={[styles.emptyTitle, { color: colors.text.primary }]}
                >
                  No Tips Today
                </Text>
                <Text
                  style={[
                    styles.emptyDescription,
                    { color: colors.text.secondary },
                  ]}
                >
                  Check back tomorrow for personalized spending tips and daily
                  nudges.
                </Text>
              </View>
            ) : (
              <View style={styles.nudgesList}>{nudges.map(renderNudge)}</View>
            )}
          </>
        )}

        {/* Analytics Quick Links */}
        <View style={styles.quickLinksSection}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Explore More
          </Text>

          <TouchableOpacity
            onPress={() => router.push("/insights/trends")}
            style={[
              styles.quickLinkButton,
              { backgroundColor: colors.background.secondary },
            ]}
          >
            <Ionicons
              name="trending-up"
              size={20}
              color={colors.primary[500]}
            />
            <Text
              style={[styles.quickLinkText, { color: colors.text.primary }]}
            >
              Spending Trends
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.text.secondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/insights/categories")}
            style={[
              styles.quickLinkButton,
              { backgroundColor: colors.background.secondary },
            ]}
          >
            <Ionicons name="pie-chart" size={20} color={colors.primary[500]} />
            <Text
              style={[styles.quickLinkText, { color: colors.text.primary }]}
            >
              Category Analysis
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.text.secondary}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
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
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: "#F3F4F6",
    borderRadius: borderRadius.md,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: "center",
  },
  tabText: {
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  insightsList: {
    gap: spacing.md,
  },
  insightCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  insightHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  insightTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  dismissButton: {
    padding: spacing.xs,
  },
  insightDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  insightMetrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  metricBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
  },
  metricText: {
    fontSize: 12,
    fontWeight: "600",
  },
  insightFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  timeStamp: {
    fontSize: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: spacing.xs / 2,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  nudgesList: {
    gap: spacing.sm,
  },
  nudgeCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  nudgeHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  nudgeEmoji: {
    fontSize: 20,
    marginTop: 2,
  },
  nudgeContent: {
    flex: 1,
    gap: spacing.xs,
  },
  nudgeMessage: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  nudgeCategory: {
    flexDirection: "row",
  },
  categoryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  categoryBadgeText: {
    fontSize: 12,
    textTransform: "capitalize",
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
    paddingHorizontal: spacing.lg,
  },
  quickLinksSection: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  quickLinkButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  quickLinkText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
});
