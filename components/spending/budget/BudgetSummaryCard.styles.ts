import { StyleSheet } from 'react-native';
import { spacing, borderRadius } from '../../../constants/theme';

export const budgetSummaryCardStyles = StyleSheet.create({
  simpleBudgetContainer: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  simpleBudgetCard: {
    padding: spacing.lg,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  simpleBudgetTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  budgetGridContainer: {
    marginBottom: spacing.lg,
  },
  budgetRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  budgetCard: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: 16,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  budgetCardPrimary: {
    // Will be set dynamically with theme colors
  },
  budgetCardSecondary: {
    // Will be set dynamically with theme colors
  },
  budgetCardAccent: {
    // Will be set dynamically with theme colors
  },
  budgetCardWarning: {
    // Will be set dynamically with theme colors
  },
  budgetCardAmount: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  budgetCardLabel: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
  
  // Animated Donut Chart Styles
  donutChartContainer: {
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  donutChart: {
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  donutCenter: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  donutCenterPercentage: {
    fontSize: 40,
    fontWeight: '800',
    textAlign: 'center',
  },
  donutCenterLabel: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: 1.5,
  },
  donutCenterAmount: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 6,
  },
});