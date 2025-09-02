import { StyleSheet } from 'react-native';
import { spacing, borderRadius } from '../../../constants/theme';

export const spendingCategoryListStyles = StyleSheet.create({
  categoriesTabWrapper: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  
  // Empty State
  emptyStateContainer: {
    alignItems: 'center',
    marginTop: 48,
  },
  emptyStateTitle: {
    fontSize: 18,
    marginTop: 12,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },

  // Category Card
  categoryCardPressable: {
    marginBottom: 16,
  },
  categoryCard: {
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  categoryCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  categoryCardHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  categoryIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  categoryCardHeaderContent: {
    flex: 1,
  },
  categoryCardHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  categoryCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  categoryCardAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  categoryCardHeaderBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryCardTransactions: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryCardBudget: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryCardHeaderRight: {
    alignItems: 'flex-end',
  },
  categoryCardPercentage: {
    fontSize: 16,
    fontWeight: '700',
  },

  // Progress Bar
  categoryCardProgress: {
    marginBottom: spacing.md,
  },
  categoryCardProgressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  categoryCardProgressBar: {
    height: '100%',
    borderRadius: 3,
  },

  // Bottom Stats
  categoryCardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryCardStat: {
    alignItems: 'flex-start',
  },
  categoryCardStatLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  categoryCardStatValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});