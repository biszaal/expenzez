import { StyleSheet } from "react-native";

// v1.5 redesign — hero ring card with horizontal layout.
// Ring on the left, REMAINING + ledger rows on the right. Card has a soft
// primary glow tucked into the top-right corner for depth.
export const budgetSummaryCardStyles = StyleSheet.create({
  simpleBudgetContainer: {
    paddingHorizontal: 22,
    paddingTop: 14,
  },
  simpleBudgetCard: {
    padding: 20,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    position: "relative",
  },

  // Header row above the hero ring layout.
  heroHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  simpleBudgetTitle: {
    fontSize: 15,
    letterSpacing: -0.2,
  },

  // Hero layout: ring (left) + stats (right).
  heroLayout: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
  ringWrapper: {
    width: 180,
    height: 180,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  ringCenter: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  ringCenterCaption: {
    fontSize: 10.5,
    letterSpacing: 1,
  },
  ringCenterPercent: {
    fontSize: 32,
    letterSpacing: -1.2,
    lineHeight: 34,
    marginTop: 2,
  },
  ringCenterPercentSign: {
    fontSize: 16,
    opacity: 0.5,
  },
  ringCenterStatus: {
    fontSize: 10.5,
    letterSpacing: 0.6,
    marginTop: 4,
  },

  // Stats column (right of ring).
  statsCol: {
    flex: 1,
    minWidth: 0,
  },
  statsCaption: {
    fontSize: 10.5,
    letterSpacing: 1,
  },
  statsRemaining: {
    fontSize: 30,
    letterSpacing: -1.2,
    lineHeight: 34,
    marginTop: 2,
  },
  statsDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 14,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  statsRowFirst: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statsRowLabel: {
    fontSize: 12,
  },
  statsRowValue: {
    fontSize: 12,
    letterSpacing: -0.2,
  },

  // Soft primary glow that anchors the top-right of the card.
  glow: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.85,
  },

  // Warning banner (over-budget / at-risk).
  warningBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
    gap: 12,
  },
  warningTitle: {
    fontSize: 13,
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  warningBody: {
    fontSize: 12.5,
    lineHeight: 17,
  },
});
