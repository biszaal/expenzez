import { StyleSheet } from 'react-native';
import { SPACING } from '../../constants/Colors';

export const styles = StyleSheet.create({
  container: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderRadius: 16,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  premiumTransactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  premiumTransactionsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  premiumTransactionsIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumTransactionsHeaderText: {
    flex: 1,
    gap: 2,
  },
  premiumTransactionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
  },
  premiumTransactionsSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.7,
  },
  premiumTransactionsRefresh: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumTransactionsList: {
    marginBottom: SPACING.lg,
  },
  premiumTransactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.md,
  },
  premiumTransactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumTransactionContent: {
    flex: 1,
    gap: 4,
  },
  premiumTransactionTitle: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 18,
  },
  premiumTransactionDate: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.6,
  },
  premiumTransactionAmountContainer: {
    alignItems: 'flex-end',
  },
  premiumTransactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  premiumEmptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.sm,
  },
  premiumEmptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  premiumEmptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  premiumEmptySubtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    opacity: 0.6,
  },
  premiumViewAllTransactions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  premiumViewAllTransactionsText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
});