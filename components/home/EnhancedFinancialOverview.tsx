import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";

interface EnhancedFinancialOverviewProps {
  thisMonthSpent: number;
  userBudget: number | null;
}

export const EnhancedFinancialOverview: React.FC<
  EnhancedFinancialOverviewProps
> = ({ thisMonthSpent, userBudget }) => {
  const { colors } = useTheme();
  const router = useRouter();

  // Early return if colors is not available
  if (!colors) {
    return null;
  }

  const budgetRemaining = userBudget ? userBudget - thisMonthSpent : 0;
  const budgetPercentage = userBudget ? (thisMonthSpent / userBudget) * 100 : 0;
  const isOverBudget = thisMonthSpent > (userBudget || 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          This Month
        </Text>
        <TouchableOpacity
          style={[
            styles.viewAllButton,
            { backgroundColor: colors.primary.main },
          ]}
          onPress={() => router.push("/spending")}
          activeOpacity={0.7}
        >
          <Text style={styles.viewAllButtonText}>View Details</Text>
          <Ionicons name="arrow-forward" size={16} color="white" />
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.overviewCard,
          { backgroundColor: colors.background.secondary },
        ]}
      >
        <View style={styles.statsContainer}>
          {/* Spent Section */}
          <View style={styles.statSection}>
            <View style={styles.statHeader}>
              <Text
                style={[styles.statLabel, { color: colors.text.secondary }]}
              >
                Spent
              </Text>
              <View
                style={[
                  styles.statBadge,
                  { backgroundColor: isOverBudget ? "#EF4444" : "#10B981" },
                ]}
              >
                <Ionicons
                  name={isOverBudget ? "trending-down" : "trending-up"}
                  size={12}
                  color="white"
                />
                <Text style={styles.statBadgeText}>
                  {isOverBudget ? "Over budget" : "On track"}
                </Text>
              </View>
            </View>
            <Text style={[styles.statValue, { color: colors.text.primary }]}>
              £{thisMonthSpent.toFixed(2)}
            </Text>
            <View
              style={[
                styles.progressBar,
                { backgroundColor: colors.background.primary },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: isOverBudget ? "#EF4444" : "#10B981",
                    width: `${Math.min(100, budgetPercentage)}%`,
                  },
                ]}
              />
            </View>
            <Text
              style={[styles.progressLabel, { color: colors.text.tertiary }]}
            >
              {budgetPercentage.toFixed(1)}% of budget used
            </Text>
          </View>

          <View
            style={[styles.divider, { backgroundColor: colors.border.light }]}
          />

          {/* Budget Section */}
          <View style={styles.statSection}>
            <View style={styles.statHeader}>
              <Text
                style={[styles.statLabel, { color: colors.text.secondary }]}
              >
                Budget
              </Text>
              <View style={[styles.statBadge, { backgroundColor: "#3B82F6" }]}>
                <Ionicons name="wallet" size={12} color="white" />
                <Text style={styles.statBadgeText}>Monthly</Text>
              </View>
            </View>
            <Text style={[styles.statValue, { color: colors.text.primary }]}>
              £{(userBudget || 0).toFixed(2)}
            </Text>
            <View
              style={[
                styles.progressBar,
                { backgroundColor: colors.background.primary },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: "#3B82F6",
                    width:
                      userBudget && thisMonthSpent > 0
                        ? `${Math.min(100, ((userBudget - thisMonthSpent) / userBudget) * 100)}%`
                        : "0%",
                  },
                ]}
              />
            </View>
            <Text
              style={[styles.progressLabel, { color: colors.text.tertiary }]}
            >
              {budgetRemaining > 0
                ? `£${budgetRemaining.toFixed(2)} remaining`
                : "Budget exceeded"}
            </Text>
          </View>
        </View>

        {/* Summary Section */}
        <View
          style={[
            styles.summarySection,
            { backgroundColor: colors.background.primary },
          ]}
        >
          <View style={styles.summaryItem}>
            <Ionicons
              name={isOverBudget ? "warning" : "checkmark-circle"}
              size={20}
              color={isOverBudget ? "#EF4444" : "#10B981"}
            />
            <Text
              style={[
                styles.summaryText,
                {
                  color: isOverBudget ? "#EF4444" : "#10B981",
                },
              ]}
            >
              {isOverBudget
                ? `You're £${Math.abs(budgetRemaining).toFixed(2)} over budget`
                : `You're on track with £${budgetRemaining.toFixed(2)} remaining`}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = {
  container: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  header: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
  },
  viewAllButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  viewAllButtonText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "white",
  },
  overviewCard: {
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statsContainer: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
  },
  statSection: {
    flex: 1,
  },
  statHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: "500" as const,
  },
  statBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  statBadgeText: {
    fontSize: 10,
    fontWeight: "600" as const,
    color: "white",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700" as const,
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden" as const,
    marginBottom: 4,
  },
  progressFill: {
    flex: 1,
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: "500" as const,
  },
  divider: {
    width: 1,
    marginHorizontal: 16,
  },
  summarySection: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
  summaryItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: "600" as const,
    flex: 1,
  },
};
