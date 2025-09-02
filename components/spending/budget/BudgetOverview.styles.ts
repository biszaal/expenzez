import { StyleSheet } from 'react-native';
import { spacing } from '../../../constants/theme';

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
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
  },
  budgetCardPrimary: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
  },
  budgetCardSecondary: {
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  budgetCardAccent: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  budgetCardWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
  },
  budgetCardAmount: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  budgetCardLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});