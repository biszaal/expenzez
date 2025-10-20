/**
 * AIBriefCard Component - Phase 2B
 *
 * Displays the daily AI-generated financial brief on the home screen
 * with spending summary, budget status, and personalized insights
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { briefsAPI, DailyBrief } from "../../services/api/briefsAPI";
import { useRouter } from "expo-router";

interface AIBriefCardProps {
  onRefresh?: () => void;
}

export const AIBriefCard: React.FC<AIBriefCardProps> = ({ onRefresh }) => {
  const { colors } = useTheme();
  const router = useRouter();
  const [brief, setBrief] = useState<DailyBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  // Early return if theme is not available
  if (!theme || !theme.colors) {
    return null;
  }

  useEffect(() => {
    loadDailyBrief();
  }, []);

  useEffect(() => {
    if (brief) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [brief]);

  const loadDailyBrief = async () => {
    try {
      setLoading(true);
      const data = await briefsAPI.getDailyBrief();
      setBrief(data);

      // Mark as viewed after a short delay
      if (data?.briefId) {
        setTimeout(() => {
          briefsAPI.markBriefAsViewed(data.briefId);
        }, 2000);
      }
    } catch (error) {
      console.error("Error loading daily brief:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadDailyBrief();
    onRefresh?.();
  };

  const handleInsightAction = (actionRoute?: string) => {
    if (actionRoute) {
      router.push(actionRoute as any);
    }
  };

  if (loading) {
    return (
      <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading your daily brief...
          </Text>
        </View>
      </View>
    );
  }

  if (!brief) {
    return (
      <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📰</Text>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            No Brief Available Yet
          </Text>
          <Text
            style={[styles.emptyText, { color: theme.colors.textSecondary }]}
          >
            Your daily financial brief will be generated at 6:00 AM
          </Text>
          <TouchableOpacity
            style={[
              styles.refreshButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={handleRefresh}
          >
            <Ionicons name="refresh" size={16} color="#FFFFFF" />
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const spendingChange = briefsAPI.formatSpendingChange(
    brief.spendingSummary.comparisonToLastWeek
  );
  const budgetEmoji = briefsAPI.getBudgetStatusEmoji(brief.budgetStatus);

  return (
    <Animated.View
      style={[
        styles.card,
        { backgroundColor: theme.colors.card, opacity: fadeAnim },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerIcon}>📰</Text>
          <View>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Daily Financial Brief
            </Text>
            <Text
              style={[
                styles.headerSubtitle,
                { color: theme.colors.textSecondary },
              ]}
            >
              {brief.greeting}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => setExpanded(!expanded)}>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={24}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Spending Summary */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          📊 Spending Summary
        </Text>
        <View style={styles.spendingGrid}>
          <View style={styles.spendingItem}>
            <Text
              style={[
                styles.spendingLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              Today
            </Text>
            <Text style={[styles.spendingAmount, { color: theme.colors.text }]}>
              {briefsAPI.formatCurrency(brief.spendingSummary.todaySpent)}
            </Text>
          </View>
          <View style={styles.spendingItem}>
            <Text
              style={[
                styles.spendingLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              This Week
            </Text>
            <Text style={[styles.spendingAmount, { color: theme.colors.text }]}>
              {briefsAPI.formatCurrency(brief.spendingSummary.weekSpent)}
            </Text>
            <Text
              style={[styles.spendingChange, { color: spendingChange.color }]}
            >
              {spendingChange.text}
            </Text>
          </View>
          <View style={styles.spendingItem}>
            <Text
              style={[
                styles.spendingLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              This Month
            </Text>
            <Text style={[styles.spendingAmount, { color: theme.colors.text }]}>
              {briefsAPI.formatCurrency(brief.spendingSummary.monthSpent)}
            </Text>
            <Text
              style={[
                styles.spendingChange,
                {
                  color: briefsAPI.formatSpendingChange(
                    brief.spendingSummary.comparisonToLastMonth
                  ).color,
                },
              ]}
            >
              {
                briefsAPI.formatSpendingChange(
                  brief.spendingSummary.comparisonToLastMonth
                ).text
              }
            </Text>
          </View>
        </View>
      </View>

      {/* Budget Status */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {budgetEmoji} Budget Status
        </Text>
        <View style={styles.budgetRow}>
          <View style={styles.budgetItem}>
            <Text style={[styles.budgetValue, { color: "#10B981" }]}>
              {brief.budgetStatus.budgetsOnTrack}
            </Text>
            <Text
              style={[
                styles.budgetLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              On Track
            </Text>
          </View>
          <View style={styles.budgetItem}>
            <Text style={[styles.budgetValue, { color: "#F59E0B" }]}>
              {brief.budgetStatus.budgetsAtRisk}
            </Text>
            <Text
              style={[
                styles.budgetLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              At Risk
            </Text>
          </View>
          <View style={styles.budgetItem}>
            <Text style={[styles.budgetValue, { color: "#EF4444" }]}>
              {brief.budgetStatus.budgetsExceeded}
            </Text>
            <Text
              style={[
                styles.budgetLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              Exceeded
            </Text>
          </View>
        </View>

        {brief.budgetStatus.topConcern && (
          <View
            style={[
              styles.concernBox,
              { backgroundColor: theme.colors.background },
            ]}
          >
            <Text style={[styles.concernText, { color: theme.colors.text }]}>
              ⚠️{" "}
              <Text style={{ fontWeight: "600" }}>
                {brief.budgetStatus.topConcern.category}
              </Text>{" "}
              at {brief.budgetStatus.topConcern.percentage}% (
              {briefsAPI.formatCurrency(
                brief.budgetStatus.topConcern.remaining
              )}{" "}
              remaining)
            </Text>
          </View>
        )}
      </View>

      {/* Insights */}
      {expanded && brief.insights.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            💡 Today's Insights
          </Text>
          {brief.insights.map((insight, index) => (
            <View
              key={index}
              style={[
                styles.insightCard,
                { backgroundColor: theme.colors.background },
              ]}
            >
              <View style={styles.insightHeader}>
                <Text style={styles.insightIcon}>
                  {briefsAPI.getInsightIcon(insight.type)}
                </Text>
                <Text
                  style={[styles.insightTitle, { color: theme.colors.text }]}
                >
                  {insight.title}
                </Text>
              </View>
              <Text
                style={[
                  styles.insightMessage,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {insight.message}
              </Text>
              {insight.actionable && insight.actionText && (
                <TouchableOpacity
                  style={[
                    styles.insightButton,
                    { borderColor: theme.colors.primary },
                  ]}
                  onPress={() => handleInsightAction(insight.actionRoute)}
                >
                  <Text
                    style={[
                      styles.insightButtonText,
                      { color: theme.colors.primary },
                    ]}
                  >
                    {insight.actionText}
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={16}
                    color={theme.colors.primary}
                  />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text
          style={[styles.footerText, { color: theme.colors.textSecondary }]}
        >
          Generated{" "}
          {new Date(brief.generatedAt).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
        <TouchableOpacity onPress={handleRefresh}>
          <Ionicons
            name="refresh"
            size={18}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  refreshButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    gap: 12,
  },
  headerIcon: {
    fontSize: 32,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  spendingGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  spendingItem: {
    flex: 1,
    alignItems: "center",
  },
  spendingLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  spendingAmount: {
    fontSize: 16,
    fontWeight: "700",
  },
  spendingChange: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  budgetRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  budgetItem: {
    alignItems: "center",
  },
  budgetValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  budgetLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  concernBox: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  concernText: {
    fontSize: 13,
    lineHeight: 18,
  },
  insightCard: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  insightIcon: {
    fontSize: 20,
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  insightMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  insightButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
    gap: 6,
  },
  insightButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
  },
  footerText: {
    fontSize: 12,
  },
});
