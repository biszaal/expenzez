import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface RememberMeCheckboxProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  lightText?: boolean; // Use white text for dark backgrounds (gradient/glass design)
}

export const RememberMeCheckbox: React.FC<RememberMeCheckboxProps> = ({
  value,
  onValueChange,
  label = "Remember me on this device",
  lightText = false,
}) => {
  const { colors } = useTheme();

  const textColor = lightText ? 'white' : colors.text.primary;
  const checkboxBorderColor = lightText
    ? 'rgba(255, 255, 255, 0.6)'
    : value ? colors.primary[500] : colors.text.secondary;
  const checkboxBackgroundColor = lightText
    ? value ? 'rgba(255, 255, 255, 0.3)' : 'transparent'
    : value ? colors.primary[500] : 'transparent';
  const checkmarkColor = lightText ? 'white' : colors.background.primary;

  return (
    <TouchableOpacity
      onPress={() => onValueChange(!value)}
      activeOpacity={0.7}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 4,
      }}
    >
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 4,
          borderWidth: 2,
          borderColor: checkboxBorderColor,
          backgroundColor: checkboxBackgroundColor,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        {value && (
          <Ionicons
            name="checkmark"
            size={14}
            color={checkmarkColor}
          />
        )}
      </View>
      <Text
        style={{
          fontSize: 14,
          color: textColor,
          flex: 1,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};