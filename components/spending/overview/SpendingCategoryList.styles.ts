import { StyleSheet } from "react-native";
import { spacing, borderRadius } from "../../../constants/theme";

export const spendingCategoryListStyles = StyleSheet.create({
  categoriesTabWrapper: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },

  // Empty State
  emptyStateContainer: {
    alignItems: "center",
    marginTop: 32,
  },
  emptyStateTitle: {
    fontSize: 16,
    marginTop: 8,
  },
  emptyStateSubtitle: {
    fontSize: 13,
    marginTop: 4,
    textAlign: "center",
  },

  // Category Card
  categoryCardPressable: {
    marginBottom: spacing.md,
  },
  categoryCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  categoryCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  categoryCardHeaderLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  categoryIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  categoryCardHeaderContent: {
    flex: 1,
  },
  categoryCardHeaderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.xs,
  },
  categoryCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  categoryCardAmount: {
    fontSize: 16,
    fontWeight: "700",
  },
  categoryCardHeaderBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryCardTransactions: {
    fontSize: 12,
    fontWeight: "500",
  },
  categoryCardBudget: {
    fontSize: 12,
    fontWeight: "500",
  },
  categoryCardHeaderRight: {
    alignItems: "flex-end",
    justifyContent: "center",
    minWidth: 50,
  },
  categoryCardPercentage: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "right",
  },

  // Progress Bar
  categoryCardProgress: {
    marginBottom: spacing.sm,
  },
  categoryCardProgressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  categoryCardProgressBar: {
    height: "100%",
    borderRadius: 3,
  },

  // Bottom Stats
  categoryCardStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  categoryCardStat: {
    alignItems: "flex-start",
  },
  categoryCardStatLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 2,
  },
  categoryCardStatValue: {
    fontSize: 14,
    fontWeight: "600",
  },
});
