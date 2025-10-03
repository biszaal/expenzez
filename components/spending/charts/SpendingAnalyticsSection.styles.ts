import { StyleSheet } from "react-native";
import { spacing, borderRadius } from "../../../constants/theme";

export const spendingAnalyticsSectionStyles = StyleSheet.create({
  premiumSpendingCardWrapper: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  premiumSpendingCard: {
    borderRadius: borderRadius["2xl"],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  premiumSpendingHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  premiumSpendingHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  premiumAnalyticsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  premiumSpendingHeaderText: {
    flex: 1,
  },
  premiumSpendingTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 2,
  },
  premiumSpendingSubtitle: {
    fontSize: 14,
    fontWeight: "500",
  },

  // Chart Section Styles
  premiumChartSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  premiumCustomChartContainer: {
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  premiumChartTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  premiumChartTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  premiumChartLegend: {
    flexDirection: "row",
    alignItems: "center",
  },
  premiumChartLegendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  premiumChartLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  premiumChartLegendText: {
    fontSize: 12,
    fontWeight: "500",
  },

  // Mini Stats Cards
  miniStatsContainer: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  miniStatCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  miniStatIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  miniStatContent: {
    flex: 1,
  },
  miniStatValue: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  miniStatLabel: {
    fontSize: 11,
    fontWeight: "500",
  },

  // Current Value Display Styles
  currentValueContainer: {
    alignItems: "center",
    marginVertical: spacing.md,
    paddingVertical: spacing.sm,
  },
  currentValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  currentValueMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  currentValueLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: spacing.xs,
  },

  // Enhanced Chart Styles
  enhancedChartContainer: {
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },

  animatedChartWrapper: {
    paddingLeft: spacing.sm,
    width: "100%",
    alignItems: "center",
  },

  // Empty Chart Styles
  premiumEmptyChart: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing["2xl"],
    borderRadius: borderRadius.lg,
  },
  premiumEmptyChartIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  premiumEmptyChartTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  premiumEmptyChartSubtitle: {
    fontSize: 14,
    textAlign: "center",
  },
});
