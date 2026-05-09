import { StyleSheet } from 'react-native';
import { spacing } from '../../../constants/theme';

// v1.5 redesign — hairline-only tiles, mono numerals, alignment left.
// Background tinting and font choice are passed inline from BudgetOverview
// so the same chrome can host themed colours without duplicating styles.
export const styles = StyleSheet.create({
  budgetCards: {
    padding: spacing.lg,
  },
  budgetRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  budgetCard: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'flex-start',
    minHeight: 76,
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  budgetCardAmount: {
    fontSize: 18,
    marginBottom: 4,
    letterSpacing: -0.4,
    textAlign: 'left',
  },
  budgetCardLabel: {
    fontSize: 11.5,
    textAlign: 'left',
    letterSpacing: 0.4,
  },
});