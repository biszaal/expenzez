import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { budgetService, BudgetProgress } from "../services/budgetService";
import { EXPENSE_CATEGORIES } from "../services/expenseStorage";
import { spacing, borderRadius } from "../constants/theme";

export default function BudgetOverview() {
  const { colors } = useTheme();
  const [budgetProgress, setBudgetProgress] = useState<BudgetProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBudgetProgress();
  }, []);

  const loadBudgetProgress = async () => {
    try {
      const progress = await budgetService.getAllBudgetProgress();
      setBudgetProgress(progress.slice(0, 3)); // Show only top 3 budgets
    } catch (error) {
      console.error("Error loading budget progress:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `£${amount.toFixed(2)}`;
  };

  const getBudgetStatusColor = (status: BudgetProgress["status"]) => {
    return budgetService.getBudgetStatusColor(status);
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
            Budgets
          </Text>
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator size="small" color={colors.primary[500]} />
        </View>
      </View>
    );
  }

  if (budgetProgress.length === 0) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background.secondary },
        ]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Budgets
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/budgets")}
            style={styles.headerButton}
          >
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.primary[500]}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💰</Text>
          <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
            No budgets set up yet
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/budgets/edit")}
            style={[
              styles.createButton,
              { backgroundColor: colors.primary[100] },
            ]}
          >
            <Text
              style={[styles.createButtonText, { color: colors.primary[600] }]}
            >
              Create Budget
            </Text>
          </TouchableOpacity>
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
          Budgets
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/budgets")}
          style={styles.headerButton}
        >
          <Text style={[styles.viewAllText, { color: colors.primary[500] }]}>
            View All
          </Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.primary[500]}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.budgetList}>
        {budgetProgress.map((progress) => {
          const categoryInfo = EXPENSE_CATEGORIES.find(
            (cat) => cat.id === progress.budget.category
          );
          const statusColor = getBudgetStatusColor(progress.status);

          return (
            <TouchableOpacity
              key={progress.budget.id}
              style={[
                styles.budgetItem,
                { backgroundColor: colors.background.primary },
              ]}
              onPress={() =>
                router.push(`/budgets/edit?id=${progress.budget.id}`)
              }
            >
              <View style={styles.budgetHeader}>
                <View style={styles.budgetInfo}>
                  <Text style={styles.budgetEmoji}>
                    {categoryInfo?.emoji || "📊"}
                  </Text>
                  <View style={styles.budgetDetails}>
                    <Text
                      style={[
                        styles.budgetName,
                        { color: colors.text.primary },
                      ]}
                    >
                      {progress.budget.name}
                    </Text>
                    <Text
                      style={[
                        styles.budgetPeriod,
                        { color: colors.text.secondary },
                      ]}
                    >
                      {progress.daysLeft} days left
                    </Text>
                  </View>
                </View>

                <View style={styles.budgetAmount}>
                  <Text style={[styles.spent, { color: colors.text.primary }]}>
                    {formatCurrency(progress.spent)}
                  </Text>
                  <Text
                    style={[styles.total, { color: colors.text.secondary }]}
                  >
                    of {formatCurrency(progress.budget.amount)}
                  </Text>
                </View>
              </View>

              <View style={styles.progressSection}>
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

                <View style={styles.progressText}>
                  <Text style={[styles.percentage, { color: statusColor }]}>
                    {Math.round(progress.percentage)}%
                  </Text>
                  <Text
                    style={[
                      styles.statusText,
                      { color: colors.text.secondary },
                    ]}
                  >
                    {progress.status === "on_track" && "On Track"}
                    {progress.status === "warning" && "Warning"}
                    {progress.status === "danger" && "Over Budget"}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {budgetProgress.length >= 3 && (
        <TouchableOpacity
          onPress={() => router.push("/budgets")}
          style={[
            styles.viewAllButton,
            { backgroundColor: colors.background.primary },
          ]}
        >
          <Text
            style={[styles.viewAllButtonText, { color: colors.primary[600] }]}
          >
            View All Budgets ({budgetProgress.length}+)
          </Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.primary[600]}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
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
    marginBottom: spacing.sm,
  },
  createButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  budgetList: {
    gap: spacing.sm,
  },
  budgetItem: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  budgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  budgetInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flex: 1,
  },
  budgetEmoji: {
    fontSize: 20,
  },
  budgetDetails: {
    flex: 1,
  },
  budgetName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  budgetPeriod: {
    fontSize: 12,
  },
  budgetAmount: {
    alignItems: "flex-end",
  },
  spent: {
    fontSize: 14,
    fontWeight: "600",
  },
  total: {
    fontSize: 12,
  },
  progressSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    position: "relative",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressOverflow: {
    position: "absolute",
    height: "100%",
    right: 0,
    top: 0,
    borderRadius: 3,
  },
  progressText: {
    alignItems: "flex-end",
    minWidth: 60,
  },
  percentage: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusText: {
    fontSize: 10,
    textTransform: "uppercase",
  },
  viewAllButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    gap: spacing.xs / 2,
  },
  viewAllButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
