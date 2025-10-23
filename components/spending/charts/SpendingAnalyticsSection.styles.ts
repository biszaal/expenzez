import { StyleSheet } from "react-native";
import { spacing, borderRadius } from "../../../constants/theme";

export const spendingAnalyticsSectionStyles = StyleSheet.create({
  premiumSpendingCardWrapper: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  premiumSpendingCard: {
    borderRadius: 16,
    padding: spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  premiumSpendingHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  premiumSpendingHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  premiumAnalyticsIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  premiumSpendingHeaderText: {
    flex: 1,
    justifyContent: "center",
  },
  premiumSpendingTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
    lineHeight: 24,
  },
  premiumSpendingSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 18,
    opacity: 0.7,
  },

  // Chart Section Styles
  premiumChartSection: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  premiumCustomChartContainer: {
    borderRadius: borderRadius.xl,
    padding: spacing.sm,
    paddingTop: spacing.xs,
  },
  premiumChartLegend: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.lg,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  premiumChartLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  premiumChartLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  premiumChartLegendText: {
    fontSize: 13,
    fontWeight: "600",
    opacity: 0.8,
  },

  // Mini Stats Cards
  miniStatsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  miniStatCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.lg,
    marginHorizontal: 1,
    minHeight: 70,
    justifyContent: "center",
  },
  miniStatIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  miniStatContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  miniStatValue: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 1,
    lineHeight: 18,
    textAlign: "center",
  },
  miniStatLabel: {
    fontSize: 10,
    fontWeight: "500",
    lineHeight: 12,
    opacity: 0.7,
    textAlign: "center",
  },

  // Current Value Display Styles
  currentValueContainer: {
    alignItems: "center",
    marginVertical: spacing.md,
    paddingVertical: spacing.sm,
  },
  currentValue: {
    fontSize: 32,
    fontWeight: "800",
    marginBottom: spacing.xs,
    letterSpacing: -0.5,
  },
  currentValueMeta: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  currentValueLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: spacing.xs,
    color: "#22C55E",
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
