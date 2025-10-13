import { StyleSheet } from "react-native";
import { spacing, borderRadius } from "../../../constants/theme";

export const spendingMonthPickerStyles = StyleSheet.create({
  premiumMonthPickerContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  premiumMonthPickerContent: {
    paddingHorizontal: 0,
    gap: spacing.sm,
  },
  premiumMonthButton: {
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.sm + 1,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    minWidth: 80,
  },
  premiumMonthButtonText: {
    fontSize: 14,
    textAlign: "center",
  },
  premiumMonthIndicator: {
    position: "absolute",
    bottom: 4,
    width: 20,
    height: 2,
    borderRadius: 1,
  },
  yearLabel: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  yearLabelText: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
});
