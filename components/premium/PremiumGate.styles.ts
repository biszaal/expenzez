import { StyleSheet } from 'react-native';
import { SPACING } from '../../constants/Colors';

export const styles = StyleSheet.create({
  // Main gate container
  gateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },

  // Overlay mode styles
  overlayContainer: {
    position: 'relative',
  },

  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },

  // Preview mode styles
  previewContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },

  previewContent: {
    opacity: 0.6,
  },

  previewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },

  // Premium badge styles
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },

  badgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },

  badgeMedium: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },

  badgeLarge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
});