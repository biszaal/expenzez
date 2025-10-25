/**
 * PremiumGate Component
 * Controls access to premium features with upgrade prompts
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { useFeatureAccess } from '../hooks/useSubscription';
import { PremiumFeature } from '../services/subscriptionService';

interface PremiumGateProps {
  /**
   * The premium feature to check access for
   */
  feature: PremiumFeature;

  /**
   * Current usage data for features with limits (e.g., AI queries today)
   */
  currentUsage?: { [key: string]: number };

  /**
   * If true, completely block access. If false, show soft prompt but allow action
   * @default true
   */
  hardGate?: boolean;

  /**
   * Children to render when user has access
   */
  children: React.ReactNode;

  /**
   * Custom fallback component to show when access is denied (overrides default upgrade prompt)
   */
  fallback?: React.ReactNode;

  /**
   * Callback when user dismisses the upgrade prompt (for soft gates)
   */
  onDismiss?: () => void;
}

/**
 * Premium Feature Gate Component
 *
 * Wraps premium features and shows upgrade prompts when access is denied.
 *
 * @example Hard Gate (blocks access completely)
 * ```tsx
 * <PremiumGate feature={PremiumFeature.ADVANCED_ANALYTICS}>
 *   <AdvancedAnalyticsView />
 * </PremiumGate>
 * ```
 *
 * @example Soft Gate (shows prompt but allows dismissal)
 * ```tsx
 * <PremiumGate
 *   feature={PremiumFeature.AI_CHAT}
 *   currentUsage={{ aiQueriesToday: 5 }}
 *   hardGate={false}
 *   onDismiss={() => setPremiumPromptDismissed(true)}
 * >
 *   <AIChat />
 * </PremiumGate>
 * ```
 */
export const PremiumGate: React.FC<PremiumGateProps> = ({
  feature,
  currentUsage,
  hardGate = true,
  children,
  fallback,
  onDismiss,
}) => {
  const { colors } = useTheme();
  const router = useRouter();
  const featureAccess = useFeatureAccess(feature, currentUsage);

  console.log("[PremiumGate]", feature, "hasAccess:", featureAccess.hasAccess);

  // If user has access, render children
  if (featureAccess.hasAccess) {
    return <>{children}</>;
  }

  // If custom fallback provided, use it
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default upgrade prompt
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      {/* Back Button Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={colors.primary[500]} />
        </TouchableOpacity>
      </View>

      <View style={[styles.promptCard, { backgroundColor: colors.background.primary }]}>
        {/* Premium Icon */}
        <View style={[styles.iconContainer, { backgroundColor: colors.primary[100] }]}>
          <Ionicons name="diamond" size={48} color={colors.primary[500]} />
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.text.primary }]}>
          Premium Feature
        </Text>

        {/* Message */}
        <Text style={[styles.message, { color: colors.text.secondary }]}>
          {featureAccess.upgradeMessage || 'Upgrade to Premium to unlock this feature'}
        </Text>

        {/* Reason (if provided, e.g., "5 AI queries remaining today") */}
        {featureAccess.reason && (
          <View style={[styles.reasonContainer, { backgroundColor: colors.background.secondary }]}>
            <Ionicons name="information-circle" size={16} color={colors.text.tertiary} />
            <Text style={[styles.reasonText, { color: colors.text.tertiary }]}>
              {featureAccess.reason}
            </Text>
          </View>
        )}

        {/* Upgrade Button */}
        <TouchableOpacity
          style={[styles.upgradeButton, { backgroundColor: colors.primary[500] }]}
          onPress={() => router.push('/subscription/plans')}
          activeOpacity={0.8}
        >
          <Ionicons name="diamond-outline" size={20} color="white" />
          <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
        </TouchableOpacity>

        {/* Dismiss Button (only for soft gates) */}
        {!hardGate && onDismiss && (
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={onDismiss}
            activeOpacity={0.8}
          >
            <Text style={[styles.dismissButtonText, { color: colors.text.secondary }]}>
              Not now
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

/**
 * Inline Premium Badge
 *
 * Shows a small "Premium" badge next to feature labels
 *
 * @example
 * ```tsx
 * <View style={{ flexDirection: 'row', alignItems: 'center' }}>
 *   <Text>Advanced Analytics</Text>
 *   <PremiumBadge />
 * </View>
 * ```
 */
export const PremiumBadge: React.FC<{ size?: 'small' | 'medium' }> = ({ size = 'small' }) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: colors.primary[500] },
        size === 'medium' && styles.badgeMedium,
      ]}
    >
      <Ionicons
        name="diamond"
        size={size === 'small' ? 10 : 12}
        color="white"
      />
      <Text
        style={[
          styles.badgeText,
          size === 'medium' && styles.badgeTextMedium,
        ]}
      >
        PRO
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'flex-start',
    width: '100%',
  },
  backButton: {
    padding: 8,
  },
  promptCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 40,
    borderRadius: 16,
    padding: 32,
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 16,
  },
  reasonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 24,
  },
  reasonText: {
    fontSize: 14,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  dismissButton: {
    paddingVertical: 8,
  },
  dismissButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  badgeMedium: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  badgeTextMedium: {
    fontSize: 12,
  },
});
