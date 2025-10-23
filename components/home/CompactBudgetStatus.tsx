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
import { useTheme } from "../../contexts/ThemeContext";
import { budgetService, BudgetProgress } from "../../services/budgetService";
import { spacing, borderRadius } from "../../constants/theme";

interface CompactBudgetStatusProps {
  onViewAll?: () => void;
}

export const CompactBudgetStatus: React.FC<CompactBudgetStatusProps> = ({
  onViewAll,
}) => {
  const { colors } = useTheme();
  const [budgetProgress, setBudgetProgress] = useState<BudgetProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    loadBudgetData();
  }, []);

  const loadBudgetData = async () => {
    try {
      setLoading(true);
      const progress = await budgetService.getAllBudgetProgress();
      setBudgetProgress(progress);
    } catch (error) {
      console.error("Error loading budget data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getBudgetStatusCounts = () => {
    const onTrack = budgetProgress.filter(
      (b) => b.status === "on_track"
    ).length;
    const atRisk = budgetProgress.filter((b) => b.status === "warning").length;
    const exceeded = budgetProgress.filter((b) => b.status === "danger").length;
    return { onTrack, atRisk, exceeded };
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background.primary },
        ]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            💰 Budget Status
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary[500]} />
        </View>
      </View>
    );
  }

  const { onTrack, atRisk, exceeded } = getBudgetStatusCounts();
  const totalBudgets = budgetProgress.length;

  if (totalBudgets === 0) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background.primary },
        ]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            💰 Budget Status
          </Text>
          {onViewAll && (
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={onViewAll}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.viewAllText, { color: colors.primary[500] }]}
              >
                View All
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.primary[500]}
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
            No budgets set up
          </Text>
          <TouchableOpacity
            style={[
              styles.createButton,
              { backgroundColor: colors.primary[500] },
            ]}
            onPress={() => router.push("/budgets/edit")}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={16} color="white" />
            <Text style={styles.createButtonText}>Create Budget</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background.primary }]}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            💰 Budget Status
          </Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            {totalBudgets} budgets total
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => setIsMinimized(!isMinimized)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isMinimized ? "chevron-down" : "chevron-up"}
              size={20}
              color={colors.primary[500]}
            />
          </TouchableOpacity>
          {onViewAll && (
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={onViewAll}
              activeOpacity={0.7}
            >
              <Ionicons
                name="arrow-forward"
                size={16}
                color={colors.primary[500]}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {!isMinimized && (
        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <View style={[styles.statusIcon, { backgroundColor: "#10B98120" }]}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            </View>
            <Text style={[styles.statusValue, { color: "#10B981" }]}>
              {onTrack}
            </Text>
            <Text style={[styles.statusLabel, { color: colors.text.secondary }]}>
              On Track
            </Text>
          </View>

          <View style={styles.statusItem}>
            <View style={[styles.statusIcon, { backgroundColor: "#F59E0B20" }]}>
              <Ionicons name="warning" size={20} color="#F59E0B" />
            </View>
            <Text style={[styles.statusValue, { color: "#F59E0B" }]}>
              {atRisk}
            </Text>
            <Text style={[styles.statusLabel, { color: colors.text.secondary }]}>
              At Risk
            </Text>
          </View>

          <View style={styles.statusItem}>
            <View style={[styles.statusIcon, { backgroundColor: "#EF444420" }]}>
              <Ionicons name="alert-circle" size={20} color="#EF4444" />
            </View>
            <Text style={[styles.statusValue, { color: "#EF4444" }]}>
              {exceeded}
            </Text>
            <Text style={[styles.statusLabel, { color: colors.text.secondary }]}>
              Exceeded
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  headerLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "400",
  },
  viewAllButton: {
    padding: spacing.xs,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: "500",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  createButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  statusItem: {
    flex: 1,
    alignItems: "center",
    gap: spacing.sm,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  statusValue: {
    fontSize: 20,
    fontWeight: "800",
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});
