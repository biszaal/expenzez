import { StyleSheet, Dimensions } from 'react-native';
import { SPACING } from '../../constants/Colors';

const screenWidth = Dimensions.get('window').width;
const cardPadding = SPACING.lg * 2; // Total horizontal padding (left + right)
const cardGap = SPACING.md; // Gap between cards
const availableWidth = screenWidth - cardPadding - cardGap;
const cardWidth = availableWidth / 2; // Each card takes exactly half of available width

export const styles = StyleSheet.create({
  professionalQuickActionsWrapper: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  professionalQuickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: SPACING.md,
  },
  professionalQuickActionCard: {
    width: cardWidth,
  },
  professionalQuickActionCardWide: {
    width: '100%',
  },
  professionalQuickActionGradient: {
    borderRadius: 16,
    padding: SPACING.lg,
    height: 120,
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