import { StyleSheet } from 'react-native';
import { SPACING } from '../../constants/Colors';

export const styles = StyleSheet.create({
  premiumAIWrapper: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  premiumAICard: {
    borderRadius: 20,
    padding: SPACING.xl,
    position: 'relative',
    overflow: 'hidden',
  },
  premiumAIContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  premiumAILeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  premiumAIIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumAIGlow: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    opacity: 0.5,
  },
  premiumAIText: {
    flex: 1,
    gap: SPACING.xs,
  },
  premiumAITitle: {
    fontSize: 18,
    fontWeight: '800',
    color: 'white',
    lineHeight: 22,
  },
  premiumAISubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 18,
    marginBottom: SPACING.xs,
  },
  premiumAIFeatures: {
    gap: 4,
  },
  premiumAIFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  premiumAIFeatureText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  premiumAIButton: {
    alignSelf: 'flex-start',
  },
  premiumAIButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  premiumAIButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
  },
  premiumAIDecoration1: {
    position: 'absolute',
    top: -15,
    right: -15,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  premiumAIDecoration2: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  premiumAIDecoration3: {
    position: 'absolute',
    top: 40,
    right: -10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});