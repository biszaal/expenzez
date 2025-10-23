import { StyleSheet } from "react-native";
import { spacing, borderRadius } from "../../../constants/theme";

export const spendingItemCardStyles = StyleSheet.create({
  itemCardPressable: {
    marginBottom: spacing.lg,
  },
  itemCard: {
    borderRadius: 16,
    borderWidth: 0,
    padding: spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  itemCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  itemCardHeaderLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  itemIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  itemCardHeaderContent: {
    flex: 1,
  },
  itemCardHeaderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.xs,
  },
  itemCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  itemCardAmount: {
    fontSize: 16,
    fontWeight: "700",
  },
  itemCardHeaderBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemCardInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  itemCardTransactions: {
    fontSize: 12,
    fontWeight: "500",
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  trendText: {
    fontSize: 12,
    fontWeight: "600",
  },
  itemCardBudget: {
    fontSize: 12,
    fontWeight: "500",
  },
  itemCardHeaderRight: {
    alignItems: "flex-end",
    justifyContent: "center",
    minWidth: 50,
  },
  itemCardPercentage: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "right",
  },

  // Progress Bar
  itemCardProgress: {
    marginBottom: spacing.sm,
  },
  itemCardProgressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  itemCardProgressBar: {
    height: "100%",
    borderRadius: 3,
  },
  progressInfo: {
    marginTop: 4,
  },
  progressText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
