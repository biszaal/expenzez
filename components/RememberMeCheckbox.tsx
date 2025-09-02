import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface RememberMeCheckboxProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
}

export const RememberMeCheckbox: React.FC<RememberMeCheckboxProps> = ({
  value,
  onValueChange,
  label = "Remember me on this device",
}) => {
  const { colors } = useTheme();

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
          borderColor: value ? colors.primary[500] : colors.text.secondary,
          backgroundColor: value ? colors.primary[500] : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        {value && (
          <Ionicons
            name="checkmark"
            size={14}
            color={colors.background.primary}
          />
        )}
      </View>
      <Text
        style={{
          fontSize: 14,
          color: colors.text.primary,
          flex: 1,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};