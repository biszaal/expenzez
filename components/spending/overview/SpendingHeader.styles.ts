import { StyleSheet } from "react-native";

// v1.5 redesign — clean header chrome matching the design language.
export const styles = StyleSheet.create({
  premiumHeader: {
    paddingHorizontal: 22,
    paddingTop: 6,
    paddingBottom: 4,
  },
  premiumHeaderContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  premiumBrandSection: {
    flex: 1,
  },
  dateRange: {
    fontSize: 13,
    letterSpacing: 0.2,
  },
  premiumTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  premiumTitle: {
    fontSize: 28,
    letterSpacing: -0.6,
  },
  currentIndicator: {
    fontSize: 12,
    letterSpacing: 0.5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  iconCluster: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonDisabled: {
    opacity: 0.4,
  },
  spendingOverview: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    paddingHorizontal: 22,
    paddingTop: 12,
  },
  totalSpent: {
    fontSize: 30,
    letterSpacing: -1.2,
  },
  comparison: {
    fontSize: 12,
  },
});
