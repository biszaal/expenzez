import { StyleSheet } from 'react-native';
import { SPACING } from '../../constants/Colors';

export const styles = StyleSheet.create({
  professionalMonthlyWrapper: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  professionalMonthlyCard: {
    borderRadius: 16,
    padding: SPACING.lg,
  },
  professionalMonthlyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  professionalMonthlyHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  professionalMonthlyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  professionalMonthlyHeaderText: {
    gap: 2,
  },
  professionalMonthlyTitle: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  professionalMonthlySubtitle: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.7,
  },
  professionalViewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  professionalViewAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  professionalMonthlyStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  professionalMonthlyStat: {
    flex: 1,
  },
  professionalMonthlyStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  professionalMonthlyStatLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  professionalStatBadgePositive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  professionalStatBadgePositiveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
    textTransform: 'uppercase',
  },
  professionalStatBadgeNegative: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  professionalStatBadgeNegativeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
    textTransform: 'uppercase',
  },
  professionalMonthlyStatValue: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  professionalMonthlyStatProgress: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  professionalMonthlyStatProgressFill: {
    height: 8,
    borderRadius: 4,
  },
  professionalMonthlyStatDivider: {
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginHorizontal: 4,
    alignSelf: 'stretch',
  },
});