import { StyleSheet } from 'react-native';
import { spacing, borderRadius } from '../../../constants/theme';

export const spendingTabSwitchStyles = StyleSheet.create({
  premiumTabContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  premiumTabSwitch: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: borderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  premiumTabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
  },
  premiumTabIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  premiumTabText: {
    fontSize: 15,
    fontWeight: '600',
  },
});