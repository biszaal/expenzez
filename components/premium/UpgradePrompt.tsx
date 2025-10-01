import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useTheme } from '../../contexts/ThemeContext';
import { styles } from './UpgradePrompt.styles';

interface UpgradePromptProps {
  /**
   * Title of the upgrade prompt
   */
  title: string;

  /**
   * Message explaining why upgrade is needed
   */
  message: string;

  /**
   * Callback when upgrade button is pressed
   */
  onUpgrade?: () => void;

  /**
   * Whether to show the trial option
   */
  showTrialOption?: boolean;

  /**
   * Compact mode for smaller spaces
   */
  compact?: boolean;

  /**
   * Custom features to highlight
   */
  features?: string[];

  /**
   * Whether to show as modal
   */
  isModal?: boolean;

  /**
   * Modal visibility (when isModal is true)
   */
  visible?: boolean;

  /**
   * Callback when modal is closed
   */
  onClose?: () => void;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  title,
  message,
  onUpgrade,
  showTrialOption = true,
  compact = false,
  features,
  isModal = false,
  visible = false,
  onClose,
}) => {
  const { startTrial, isLoading, subscription } = useSubscription();
  const { colors } = useTheme();
  const router = useRouter();
  const [isStartingTrial, setIsStartingTrial] = useState(false);

  const defaultFeatures = [
    'Unlimited bank connections',
    'Advanced analytics & insights',
    'Unlimited AI conversations',
    'Credit score monitoring',
    'Smart bill predictions',
    'Unlimited goals & budgets',
  ];

  const featureList = features || defaultFeatures;

  const handleStartTrial = async () => {
    // Redirect to plans page where user must verify payment method through Apple
    // Apple requires Face ID/Touch ID authentication which confirms payment will be charged after trial
    Alert.alert(
      'Start Your Free Trial',
      'You\'ll get 14 days of Premium features absolutely free. After the trial, you\'ll be charged unless you cancel. Payment verification required via Apple.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Continue',
          onPress: () => {
            router.push('/subscription/plans');
            if (onClose) onClose();
          },
          style: 'default'
        }
      ]
    );
  };

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      router.push('/subscription/plans');
    }
    if (onClose) onClose();
  };

  const PromptContent = () => (
    <View style={[styles.container, compact && styles.compactContainer]}>
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={[colors.primary[500], colors.primary[600]]}
          style={styles.iconContainer}
        >
          <Ionicons name="diamond" size={compact ? 20 : 24} color="white" />
        </LinearGradient>
        <Text style={[styles.title, { color: colors.text.primary }, compact && styles.compactTitle]}>
          {title}
        </Text>
      </View>

      {/* Message */}
      <Text style={[styles.message, { color: colors.text.secondary }, compact && styles.compactMessage]}>
        {message}
      </Text>

      {/* Features (if not compact) */}
      {!compact && (
        <View style={styles.featuresContainer}>
          <Text style={[styles.featuresTitle, { color: colors.text.primary }]}>
            Premium includes:
          </Text>
          {featureList.slice(0, 4).map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success[500]} />
              <Text style={[styles.featureText, { color: colors.text.secondary }]}>
                {feature}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        {showTrialOption && subscription.tier === 'free' && (
          <TouchableOpacity
            style={[styles.trialButton, { borderColor: colors.primary[500] }]}
            onPress={handleStartTrial}
            disabled={isStartingTrial}
            activeOpacity={0.8}
          >
            <Text style={[styles.trialButtonText, { color: colors.primary[500] }]}>
              {isStartingTrial ? 'Starting...' : 'Start 14-Day Trial'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.upgradeButton]}
          onPress={handleUpgrade}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary[500], colors.primary[600]]}
            style={styles.upgradeButtonGradient}
          >
            <Text style={[styles.upgradeButtonText, { color: 'white' }]}>
              {subscription.tier === 'free' ? 'View Premium Plans' : 'Upgrade Now'}
            </Text>
            <Ionicons name="arrow-forward" size={16} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Close button for modal */}
      {isModal && onClose && (
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color={colors.text.tertiary} />
        </TouchableOpacity>
      )}
    </View>
  );

  if (isModal) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background.primary }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <PromptContent />
          </ScrollView>
        </View>
      </Modal>
    );
  }

  return <PromptContent />;
};

/**
 * Usage tracking component for free users
 */
export const UsageIndicator: React.FC<{
  type: 'aiChats' | 'goals' | 'budgets';
  style?: any;
}> = ({ type, style }) => {
  const { getUsageDisplay, isPremium, isTrialActive } = useSubscription();
  const { colors } = useTheme();
  const router = useRouter();

  if (isPremium || isTrialActive) {
    return null; // Don't show usage for premium users
  }

  const usage = getUsageDisplay(type);
  const [used, total] = usage.split('/').map(n => parseInt(n) || 0);
  const isAtLimit = used >= total;

  const typeLabels = {
    aiChats: 'AI Chats',
    goals: 'Goals',
    budgets: 'Budgets',
  };

  return (
    <TouchableOpacity
      style={[
        styles.usageIndicator,
        {
          backgroundColor: isAtLimit ? colors.error[100] : colors.background.secondary,
          borderColor: isAtLimit ? colors.error[300] : colors.border.medium,
        },
        style
      ]}
      onPress={() => router.push('/subscription/plans')}
      activeOpacity={0.7}
    >
      <View style={styles.usageInfo}>
        <Text style={[styles.usageLabel, { color: colors.text.secondary }]}>
          {typeLabels[type]} used this month
        </Text>
        <Text style={[
          styles.usageCount,
          { color: isAtLimit ? colors.error[600] : colors.text.primary }
        ]}>
          {usage}
        </Text>
      </View>
      {isAtLimit && (
        <View style={styles.upgradeHint}>
          <Text style={[styles.upgradeHintText, { color: colors.error[600] }]}>
            Upgrade for unlimited
          </Text>
          <Ionicons name="arrow-forward" size={14} color={colors.error[600]} />
        </View>
      )}
    </TouchableOpacity>
  );
};