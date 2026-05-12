import { StyleSheet } from "react-native";
import { spacing, borderRadius } from "../../../constants/theme";

// v1.5 redesign — Spending sub-tab analytics card.
// Matches screens/spending.jsx: TOTAL SPENT eyebrow + big mono number with
// delta chip on the left, vertical "This month / {prev}" legend on the right;
// chart fills the bottom of the card; 3 stat tiles render as a separate row
// of compact cards below the chart card.
export const spendingAnalyticsSectionStyles = StyleSheet.create({
  premiumSpendingCardWrapper: {
    paddingHorizontal: 22,
    paddingTop: 14,
  },
  premiumSpendingCard: {
    borderRadius: 22,
    padding: 18,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },

  // Header row: TOTAL SPENT + value + delta chip on left, legend on right.
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
  },
  headerEyebrow: {
    fontSize: 11,
    letterSpacing: 1,
  },
  headerAmountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 4,
  },
  headerAmountWhole: {
    fontSize: 36,
    letterSpacing: -1.6,
    lineHeight: 40,
  },
  headerAmountDec: {
    fontSize: 18,
    letterSpacing: -0.6,
  },
  headerDeltaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  headerDeltaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
  },
  headerDeltaChipText: {
    fontSize: 11,
    letterSpacing: 0.2,
  },
  headerDeltaSub: {
    fontSize: 11,
  },

  // Right-side legend stack.
  legendCol: {
    alignItems: "flex-end",
    gap: 6,
    paddingTop: 2,
    minWidth: 72,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 11,
  },

  // Chart section.
  chartSection: {
    marginTop: 6,
  },
  chartArea: {
    width: "100%",
    alignItems: "center",
  },

  // X-axis labels under the chart.
  xAxisRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 4,
    paddingHorizontal: 4,
  },
  xAxisLabel: {
    fontSize: 10.5,
    letterSpacing: 0.4,
  },

  // 3-up stat row below the chart card.
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 22,
    paddingTop: 10,
    gap: 8,
  },
  statCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statLabel: {
    fontSize: 10.5,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  statValue: {
    fontSize: 16,
    letterSpacing: -0.4,
    marginTop: 6,
  },
  statSub: {
    fontSize: 10.5,
    marginTop: 2,
  },

  // Empty chart state.
  premiumEmptyChart: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing["2xl"],
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 14,
  },
  premiumEmptyChartIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  premiumEmptyChartTitle: {
    fontSize: 15,
    marginBottom: spacing.xs,
    letterSpacing: -0.2,
  },
  premiumEmptyChartSubtitle: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },

  // AI insight container (outside chart card).
  aiInsightSeparateContainer: {
    marginTop: spacing.lg,
    paddingHorizontal: 0,
  },
});
