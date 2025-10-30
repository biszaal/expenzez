import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import {
  insightsEngine,
  SpendingInsight,
  SpendingNudge,
} from "../services/insightsEngine";
import { spacing, borderRadius } from "../constants/theme";

export default function InsightsOverview() {
  const { colors } = useTheme();
  const [insights, setInsights] = useState<SpendingInsight[]>([]);
  const [nudges, setNudges] = useState<SpendingNudge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const [generatedInsights, dailyNudges] = await Promise.all([
        insightsEngine.generateInsights([]),
        insightsEngine.generateDailyNudges(),
      ]);

      // Show top 3 insights and 2 nudges for overview
      setInsights(generatedInsights.slice(0, 3));
      setNudges(dailyNudges.slice(0, 2));
    } catch (error) {
      console.error("Error loading insights:", error);
    } finally {
      setLoading(false);
    }
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
      case "financial_milestone":
        return "🏆";
      case "spending_streak":
        return "🔥";
      case "goal_reminder":
        return "🎯";
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
      case "celebration":
        return "#8B5CF6";
      case "info":
        return colors.primary.main;
      default:
        return colors.primary.main;
    }
  };

  const handleInsightPress = (insight: SpendingInsight) => {
    if (insight.actionType === "create_budget") {
      router.push("/budgets/edit");
    } else if (insight.actionType === "review_category") {
      router.push(`/insights/categories?category=${insight.category}`);
    } else {
      router.push("/insights");
    }
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background.secondary },
        ]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Insights
          </Text>
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator size="small" color={colors.primary.main} />
        </View>
      </View>
    );
  }

  if (insights.length === 0 && nudges.length === 0) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background.secondary },
        ]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Insights
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/insights")}
            style={styles.headerButton}
          >
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.primary.main}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
            Add more expenses to get personalized insights
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background.secondary },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          Insights
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/insights")}
          style={styles.headerButton}
        >
          <Text style={[styles.viewAllText, { color: colors.primary.main }]}>
            View All
          </Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.primary.main}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Daily Nudges */}
        {nudges.map((nudge) => (
          <View
            key={nudge.id}
            style={[
              styles.nudgeCard,
              { backgroundColor: colors.background.primary },
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
              </View>
            </View>
          </View>
        ))}

        {/* Insights */}
        {insights.map((insight) => {
          const priorityIcon = getPriorityIcon(insight.priority);

          return (
            <TouchableOpacity
              key={insight.id}
              style={[
                styles.insightCard,
                { backgroundColor: colors.background.primary },
              ]}
              onPress={() => handleInsightPress(insight)}
              activeOpacity={0.7}
            >
              <View style={styles.insightHeader}>
                <View style={styles.insightTitleRow}>
                  <Ionicons
                    name={priorityIcon.name}
                    size={18}
                    color={priorityIcon.color}
                  />
                  <Text
                    style={[
                      styles.insightTitle,
                      { color: colors.text.primary },
                    ]}
                  >
                    {insight.title}
                  </Text>
                </View>

                {insight.actionText && (
                  <View style={styles.actionIndicator}>
                    <Ionicons
                      name="chevron-forward"
                      size={14}
                      color={colors.primary.main}
                    />
                  </View>
                )}
              </View>

              <Text
                style={[
                  styles.insightDescription,
                  { color: colors.text.secondary },
                ]}
              >
                {insight.description}
              </Text>

              {insight.advisorNote && (
                <View
                  style={[
                    styles.advisorNote,
                    {
                      backgroundColor: colors.primary.main[50],
                      borderColor: colors.primary.main[200],
                    },
                  ]}
                >
                  <View style={styles.advisorHeader}>
                    <Ionicons
                      name="person-circle"
                      size={16}
                      color={colors.primary.main[600]}
                    />
                    <Text
                      style={[
                        styles.advisorLabel,
                        { color: colors.primary.main[700] },
                      ]}
                    >
                      Financial Advisor Note
                    </Text>
                  </View>
                  <Text
                    style={[styles.advisorText, { color: colors.primary.main[800] }]}
                  >
                    {insight.advisorNote}
                  </Text>
                </View>
              )}

              {(insight.amount !== undefined ||
                insight.percentage !== undefined) && (
                <View style={styles.insightMetrics}>
                  {insight.amount !== undefined && (
                    <View
                      style={[
                        styles.metricBadge,
                        { backgroundColor: colors.primary.main[100] },
                      ]}
                    >
                      <Text
                        style={[
                          styles.metricText,
                          { color: colors.primary.main[700] },
                        ]}
                      >
                        £{insight.amount.toFixed(0)}
                      </Text>
                    </View>
                  )}
                  {insight.percentage !== undefined && (
                    <View
                      style={[
                        styles.metricBadge,
                        { backgroundColor: colors.primary.main[100] },
                      ]}
                    >
                      <Text
                        style={[
                          styles.metricText,
                          { color: colors.primary.main[700] },
                        ]}
                      >
                        {insight.percentage.toFixed(0)}%
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {(insights.length >= 3 || nudges.length >= 2) && (
          <TouchableOpacity
            onPress={() => router.push("/insights")}
            style={[
              styles.viewAllButton,
              { backgroundColor: colors.background.primary },
            ]}
          >
            <Text
              style={[styles.viewAllButtonText, { color: colors.primary.main[600] }]}
            >
              View All Insights & Tips
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.primary.main[600]}
            />
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    maxHeight: 320,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs / 2,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "500",
  },
  centerContent: {
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  content: {
    flex: 1,
  },
  nudgeCard: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  nudgeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  nudgeEmoji: {
    fontSize: 16,
  },
  nudgeContent: {
    flex: 1,
  },
  nudgeMessage: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  insightCard: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  insightHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  insightTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  actionIndicator: {
    padding: 2,
  },
  insightDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  insightMetrics: {
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  metricBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  metricText: {
    fontSize: 12,
    fontWeight: "600",
  },
  viewAllButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
    gap: spacing.xs / 2,
  },
  viewAllButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  advisorNote: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  advisorHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs / 2,
  },
  advisorLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  advisorText: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: "italic",
  },
});
