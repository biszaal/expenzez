import { StyleSheet } from 'react-native';
import { spacing, borderRadius } from '../../../constants/theme';

export const budgetSummaryCardStyles = StyleSheet.create({
  simpleBudgetContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  simpleBudgetCard: {
    padding: spacing.lg,
    borderRadius: borderRadius['2xl'],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
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
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
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
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  budgetCardLabel: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  
  // Animated Donut Chart Styles
  donutChartContainer: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  donutChart: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  donutCenter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  donutCenterPercentage: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
  },
  donutCenterLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
    letterSpacing: 1.5,
  },
  donutCenterAmount: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
});