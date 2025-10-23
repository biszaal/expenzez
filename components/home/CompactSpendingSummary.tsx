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
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../contexts/ThemeContext";
import { TransactionService } from "../../services/transactionService";
import { spacing, borderRadius } from "../../constants/theme";

interface CompactSpendingSummaryProps {
  onViewAll?: () => void;
}

export const CompactSpendingSummary: React.FC<CompactSpendingSummaryProps> = ({
  onViewAll,
}) => {
  const { colors } = useTheme();
  const [spendingData, setSpendingData] = useState({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    loadSpendingData();
  }, []);

  // Refresh when screen comes into focus (for new transactions)
  useFocusEffect(
    React.useCallback(() => {
      loadSpendingData();
    }, [])
  );

  const loadSpendingData = async () => {
    try {
      setLoading(true);
      const allTransactions = await TransactionService.getTransactions();

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const calculateSpending = (startDate: Date, endDate: Date) => {
        return allTransactions
          .filter((t) => {
            const transactionDate = new Date(t.date);
            return (
              transactionDate >= startDate &&
              transactionDate <= endDate &&
              t.type === "debit"
            );
          })
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      };

      setSpendingData({
        today: calculateSpending(today, now),
        thisWeek: calculateSpending(weekStart, now),
        thisMonth: calculateSpending(monthStart, now),
      });
    } catch (error) {
      console.error("Error loading spending data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `£${amount.toFixed(2)}`;
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
            📊 Spending Summary
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary[500]} />
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
            📊 Spending Summary
          </Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            Track your daily expenses
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
        <>
          {/* Highlight: This Month (Primary Metric) */}
          <View
            style={[
              styles.primaryMetric,
              { backgroundColor: colors.primary[50] || colors.primary[100] },
            ]}
          >
            <Text style={[styles.primaryLabel, { color: colors.text.secondary }]}>
              This Month's Spending
            </Text>
            <Text style={[styles.primaryValue, { color: colors.primary[500] }]}>
              {formatCurrency(spendingData.thisMonth)}
            </Text>
          </View>

          {/* Secondary Metrics */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.text.secondary }]}>
                Today
              </Text>
              <Text style={[styles.summaryValue, { color: colors.text.primary }]}>
                {formatCurrency(spendingData.today)}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.text.secondary }]}>
                This Week
              </Text>
              <Text style={[styles.summaryValue, { color: colors.text.primary }]}>
                {formatCurrency(spendingData.thisWeek)}
              </Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
    marginBottom: 0,
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
  primaryMetric: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    alignItems: "center",
  },
  primaryLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: spacing.xs,
  },
  primaryValue: {
    fontSize: 28,
    fontWeight: "800",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: "#E5E7EB",
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: spacing.xs,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "700",
  },
});
