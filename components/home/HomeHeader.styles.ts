import { StyleSheet } from 'react-native';
import { SPACING, SHADOWS } from '../../constants/Colors';

export const styles = StyleSheet.create({
  professionalHeader: {
    paddingTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  professionalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
  },
  professionalBrandSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  professionalHeaderTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  professionalBrandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  professionalHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  professionalNotificationButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...SHADOWS.sm,
  },
  professionalNotificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  professionalNotificationBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 3,
    minWidth: 60,
    ...SHADOWS.sm,
  },
  quickActionText: {
    fontSize: 10,
    fontWeight: '600',
  },
});