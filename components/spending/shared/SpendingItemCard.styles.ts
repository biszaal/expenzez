import { StyleSheet } from "react-native";

// v1.5 redesign — rounded card with category-tinted icon, mono numerals.
export const spendingItemCardStyles = StyleSheet.create({
  itemCardPressable: {
    marginBottom: 8,
  },
  itemCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  itemCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  itemCardHeaderLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  itemIconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  itemCardHeaderContent: {
    flex: 1,
  },
  itemCardHeaderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: 8,
  },
  itemCardTitle: {
    flex: 1,
    fontSize: 14,
  },
  itemCardAmount: {
    fontSize: 14,
  },
  itemCardHeaderBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  itemCardInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 1,
  },
  itemCardTransactions: {
    fontSize: 11.5,
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  trendText: {
    fontSize: 11,
  },
  itemCardBudget: {
    fontSize: 11.5,
    flexShrink: 1,
    textAlign: "right",
  },
  itemCardHeaderRight: {
    alignItems: "flex-end",
    justifyContent: "center",
    minWidth: 36,
  },
  itemCardPercentage: {
    fontSize: 13,
    textAlign: "right",
  },

  // Slim progress bar (4 px) — sits flush under the row.
  itemCardProgress: {
    gap: 4,
  },
  itemCardProgressTrack: {
    height: 4,
    borderRadius: 4,
    overflow: "hidden",
  },
  itemCardProgressBar: {
    height: "100%",
    borderRadius: 4,
  },
  progressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressText: {
    fontSize: 11,
  },
});
