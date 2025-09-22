import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { SavingsOpportunity } from '../../services/api/savingsInsightsAPI';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/Colors';

interface SavingsActionButtonProps {
  opportunity: SavingsOpportunity;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
}

export const SavingsActionButton: React.FC<SavingsActionButtonProps> = ({
  opportunity,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false
}) => {
  const { colors } = useTheme();

  const getButtonText = () => {
    switch (opportunity.type) {
      case 'subscription_optimization':
        return 'Review Subscriptions';
      case 'category_reduction':
        return 'Set Budget Alert';
      case 'goal_acceleration':
        return 'Accelerate Goal';
      case 'emergency_fund':
        return 'Start Emergency Fund';
      case 'habit_change':
        return 'Track Habit';
      default:
        return 'Take Action';
    }
  };

  const getButtonIcon = () => {
    switch (opportunity.type) {
      case 'subscription_optimization':
        return 'refresh';
      case 'category_reduction':
        return 'trending-down';
      case 'goal_acceleration':
        return 'rocket';
      case 'emergency_fund':
        return 'shield';
      case 'habit_change':
        return 'checkmark-circle';
      default:
        return 'arrow-forward';
    }
  };

  const buttonSizes = {
    small: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, fontSize: 14, iconSize: 16 },
    medium: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg, fontSize: 16, iconSize: 18 },
    large: { paddingVertical: SPACING.lg, paddingHorizontal: SPACING.xl, fontSize: 18, iconSize: 20 }
  }[size];

  const styles = createStyles(colors, variant, buttonSizes, disabled);

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled}
    >
      <Ionicons
        name={getButtonIcon() as any}
        size={buttonSizes.iconSize}
        color={styles.buttonText.color}
        style={styles.icon}
      />
      <Text style={styles.buttonText}>
        {getButtonText()}
      </Text>
    </TouchableOpacity>
  );
};

const createStyles = (colors: any, variant: string, buttonSizes: any, disabled: boolean) => {
  const getButtonStyle = () => {
    if (disabled) {
      return {
        backgroundColor: colors.text.tertiary,
        borderColor: colors.text.tertiary
      };
    }

    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.primary.main,
          borderColor: colors.primary.main
        };
      case 'secondary':
        return {
          backgroundColor: colors.secondary.main,
          borderColor: colors.secondary.main
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: colors.primary.main,
          borderWidth: 2
        };
      default:
        return {
          backgroundColor: colors.primary.main,
          borderColor: colors.primary.main
        };
    }
  };

  const getTextColor = () => {
    if (disabled) {
      return colors.background.primary;
    }

    return variant === 'outline' ? colors.primary.main : '#FFFFFF';
  };

  const buttonStyle = getButtonStyle();

  return StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: buttonSizes.paddingVertical,
      paddingHorizontal: buttonSizes.paddingHorizontal,
      borderRadius: BORDER_RADIUS.md,
      ...buttonStyle,
      ...(variant !== 'outline' && !disabled ? SHADOWS.sm : {})
    },
    icon: {
      marginRight: SPACING.sm
    },
    buttonText: {
      fontSize: buttonSizes.fontSize,
      fontWeight: '700',
      color: getTextColor()
    }
  });
};