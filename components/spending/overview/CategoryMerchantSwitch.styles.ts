import { StyleSheet } from 'react-native';
import { spacing, borderRadius } from '../../../constants/theme';

export const categoryMerchantSwitchStyles = StyleSheet.create({
  premiumCategoryTabContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  premiumCategoryTabSwitch: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: borderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  premiumCategoryTabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 1,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  premiumCategoryTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
});