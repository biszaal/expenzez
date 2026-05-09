import { StyleSheet } from "react-native";

// v1.5 redesign — rounded 22 card, soft hairline border, no heavy shadows.
// Card chrome inherits theme background through inline style at the
// component, so colours auto-update with the theme.
export const budgetSummaryCardStyles = StyleSheet.create({
  simpleBudgetContainer: {
    paddingHorizontal: 22,
    paddingTop: 14,
  },
  simpleBudgetCard: {
    padding: 18,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
  },
  simpleBudgetTitle: {
    fontSize: 16,
    textAlign: "left",
    marginBottom: 12,
  },

  // Stat tiles below the donut.
  budgetGridContainer: {
    marginTop: 4,
  },
  budgetRow: {
    flexDirection: "row",
    marginTop: 10,
    gap: 10,
  },
  budgetCard: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: "flex-start",
    minHeight: 76,
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  budgetCardPrimary: {},
  budgetCardSecondary: {},
  budgetCardAccent: {},
  budgetCardWarning: {},
  budgetCardAmount: {
    fontSize: 18,
    textAlign: "left",
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  budgetCardLabel: {
    fontSize: 11.5,
    textAlign: "left",
    letterSpacing: 0.4,
  },

  // Donut chart container.
  donutChartContainer: {
    alignItems: "center",
    marginVertical: 8,
  },
  donutChart: {
    width: 240,
    height: 240,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  donutCenter: {
    width: 144,
    height: 144,
    borderRadius: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  donutCenterPercentage: {
    fontSize: 38,
    textAlign: "center",
    letterSpacing: -1.4,
  },
  donutCenterLabel: {
    fontSize: 10,
    textAlign: "center",
    marginTop: 2,
    letterSpacing: 1.4,
  },
  donutCenterAmount: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 6,
  },
});
