import { StyleSheet } from "react-native";

// v1.5 redesign — list wrapper + empty state. Row styling lives in
// SpendingItemCard so each list looks identical regardless of source.
export const spendingCategoryListStyles = StyleSheet.create({
  categoriesTabWrapper: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 24,
    gap: 8,
  },

  emptyStateContainer: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyStateTitle: {
    fontSize: 15,
    textAlign: "center",
  },
  emptyStateSubtitle: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
});
