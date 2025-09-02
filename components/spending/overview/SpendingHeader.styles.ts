import { StyleSheet } from 'react-native';
import { spacing } from '../../../constants/theme';

export const styles = StyleSheet.create({
  premiumHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing["3xl"],
    paddingBottom: spacing.xl,
  },
  premiumHeaderContent: {
    alignItems: 'center',
  },
  premiumBrandSection: {
    alignItems: 'center',
    width: '100%',
  },
  premiumTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing.md,
  },
  monthSelector: {
    flex: 1,
    alignItems: 'center',
  },
  navButton: {
    padding: spacing.sm,
  },
  infoButton: {
    padding: spacing.sm,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  currentIndicator: {
    fontSize: 16,
    fontWeight: '500',
  },
  spendingOverview: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  totalSpent: {
    fontSize: 36,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  comparison: {
    fontSize: 14,
    fontWeight: '500',
  },
});