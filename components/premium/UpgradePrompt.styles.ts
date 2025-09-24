import { StyleSheet } from 'react-native';
import { SPACING } from '../../constants/Colors';

export const styles = StyleSheet.create({
  // Main container
  container: {
    padding: SPACING.lg,
    borderRadius: 16,
    alignItems: 'center',
    maxWidth: 400,
  },

  compactContainer: {
    padding: SPACING.md,
    borderRadius: 12,
  },

  // Modal container
  modalContainer: {
    flex: 1,
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
  },

  // Header section
  header: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },

  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.5,
  },

  compactTitle: {
    fontSize: 18,
    marginBottom: SPACING.xs,
  },

  // Message section
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },

  compactMessage: {
    fontSize: 14,
    marginBottom: SPACING.md,
  },

  // Features section
  featuresContainer: {
    width: '100%',
    marginBottom: SPACING.lg,
  },

  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },

  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },

  featureText: {
    fontSize: 14,
    marginLeft: SPACING.sm,
    flex: 1,
  },

  // Action buttons
  actionContainer: {
    width: '100%',
    gap: SPACING.sm,
  },

  trialButton: {
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },

  trialButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  upgradeButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  upgradeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.xs,
  },

  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Close button
  closeButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Usage indicator
  usageIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.sm,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: SPACING.xs,
  },

  usageInfo: {
    flex: 1,
  },

  usageLabel: {
    fontSize: 12,
    marginBottom: 2,
  },

  usageCount: {
    fontSize: 16,
    fontWeight: '600',
  },

  upgradeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  upgradeHintText: {
    fontSize: 12,
    fontWeight: '500',
  },
});