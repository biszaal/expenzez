import { StyleSheet } from 'react-native';
import { SPACING } from '../../constants/Colors';

export const styles = StyleSheet.create({
  professionalQuickActionsWrapper: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  professionalQuickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  professionalQuickActionCard: {
    flex: 1,
    minWidth: '47%',
    maxWidth: '50%',
  },
  professionalQuickActionGradient: {
    borderRadius: 16,
    padding: SPACING.lg,
    minHeight: 100,
    justifyContent: 'space-between',
  },
  professionalQuickActionIconContainer: {
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  professionalQuickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  professionalQuickActionText: {
    gap: 2,
  },
  professionalQuickActionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    lineHeight: 20,
  },
  professionalQuickActionSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 16,
  },
});