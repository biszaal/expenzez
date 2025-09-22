import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { savingsInsightsAPI } from '../../services/api/savingsInsightsAPI';
import { SPACING, BORDER_RADIUS } from '../../constants/Colors';

interface ConfidenceIndicatorProps {
  confidence: number;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  confidence,
  size = 'medium',
  showLabel = true
}) => {
  const confidenceLevel = savingsInsightsAPI.getConfidenceLevel(confidence);
  const confidenceColor = savingsInsightsAPI.getConfidenceColor(confidence);
  const confidencePercentage = Math.round(confidence * 100);

  const iconSize = {
    small: 14,
    medium: 16,
    large: 18
  }[size];

  const fontSize = {
    small: 11,
    medium: 12,
    large: 14
  }[size];

  const styles = createStyles(confidenceColor, fontSize);

  const getConfidenceIcon = () => {
    if (confidence >= 0.8) return 'checkmark-circle';
    if (confidence >= 0.6) return 'warning';
    return 'alert-circle';
  };

  return (
    <View style={styles.container}>
      <Ionicons
        name={getConfidenceIcon()}
        size={iconSize}
        color={confidenceColor}
      />
      {showLabel && (
        <Text style={styles.text}>
          {confidenceLevel} ({confidencePercentage}%)
        </Text>
      )}
    </View>
  );
};

const createStyles = (confidenceColor: string, fontSize: number) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: confidenceColor + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm
  },
  text: {
    fontSize,
    fontWeight: '600',
    color: confidenceColor,
    marginLeft: 4
  }
});