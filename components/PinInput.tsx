import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, borderRadius } from '../constants/theme';

interface PinInputProps {
  pin: string;
  onPinChange: (pin: string) => void;
  isLoading?: boolean;
  maxLength?: number;
  showBiometric?: boolean;
  onBiometricPress?: () => void;
  isBiometricEnabled?: boolean;
  showPassword?: boolean;
  onPasswordPress?: () => void;
  showAttemptsWarning?: boolean;
  attemptsRemaining?: number;
}

export default function PinInput({
  pin,
  onPinChange,
  isLoading = false,
  maxLength = 5,
  showBiometric = false,
  onBiometricPress,
  isBiometricEnabled = false,
  showPassword = false,
  onPasswordPress,
  showAttemptsWarning = false,
  attemptsRemaining
}: PinInputProps) {
  const { colors } = useTheme();

  const handlePinPress = (digit: string) => {
    if (digit === 'backspace') {
      onPinChange(pin.slice(0, -1));
      return;
    }

    if (digit === 'biometric' && onBiometricPress) {
      onBiometricPress();
      return;
    }

    if (pin.length < maxLength) {
      onPinChange(pin + digit);
    }
  };

  const PinDot = ({ filled }: { filled: boolean }) => (
    <View
      style={[
        styles.pinDot,
        {
          borderColor: colors.border.medium,
          backgroundColor: filled ? colors.primary[500] : 'transparent',
        },
      ]}
    />
  );

  const NumberButton = ({
    digit,
    onPress,
  }: {
    digit: string;
    onPress: (digit: string) => void;
  }) => (
    <TouchableOpacity
      style={[
        styles.numberButton,
        {
          backgroundColor: colors.background.secondary,
          borderWidth: 1,
          borderColor: colors.border.medium,
        },
      ]}
      onPress={() => onPress(digit)}
      activeOpacity={0.7}
      disabled={isLoading}
    >
      <Text style={[styles.numberButtonText, { color: colors.text.primary }]}>
        {digit}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* PIN Dots */}
      <View style={styles.pinDotsContainer}>
        {Array.from({ length: maxLength }, (_, index) => (
          <PinDot key={index} filled={index < pin.length} />
        ))}
      </View>

      {/* Attempts Warning */}
      {showAttemptsWarning && attemptsRemaining !== undefined && (
        <View style={styles.attemptsWarningContainer}>
          <Ionicons name="warning" size={16} color={colors.error[500]} />
          <Text style={[styles.attemptsWarningText, { color: colors.error[500] }]}>
            {attemptsRemaining} {attemptsRemaining === 1 ? 'attempt' : 'attempts'} remaining
          </Text>
        </View>
      )}

      {/* Number Pad */}
      <View style={styles.numberPad}>
        <View style={styles.numberRow}>
          <NumberButton digit="1" onPress={handlePinPress} />
          <NumberButton digit="2" onPress={handlePinPress} />
          <NumberButton digit="3" onPress={handlePinPress} />
        </View>
        <View style={styles.numberRow}>
          <NumberButton digit="4" onPress={handlePinPress} />
          <NumberButton digit="5" onPress={handlePinPress} />
          <NumberButton digit="6" onPress={handlePinPress} />
        </View>
        <View style={styles.numberRow}>
          <NumberButton digit="7" onPress={handlePinPress} />
          <NumberButton digit="8" onPress={handlePinPress} />
          <NumberButton digit="9" onPress={handlePinPress} />
        </View>
        <View style={styles.numberRow}>
          {/* Left button - Biometric or empty space */}
          {showBiometric ? (
            <TouchableOpacity
              style={[
                styles.numberButton,
                {
                  backgroundColor: colors.background.secondary,
                  borderWidth: 1,
                  borderColor: colors.border.medium,
                  opacity: isBiometricEnabled ? 1 : 0.5
                },
              ]}
              onPress={() => handlePinPress('biometric')}
              disabled={!isBiometricEnabled || isLoading}
            >
              <Ionicons
                name="finger-print"
                size={28}
                color={colors.primary[500]}
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.numberButton,
                {
                  backgroundColor: colors.background.secondary,
                  borderWidth: 1,
                  borderColor: colors.border.light,
                  opacity: 0.3
                },
              ]}
              onPress={() => {
                Alert.alert(
                  "Face ID Unavailable",
                  "Face ID requires a development build and cannot be used in Expo Go. Please use your PIN to unlock.",
                  [{ text: "OK" }]
                );
              }}
              disabled={isLoading}
            >
              <Ionicons
                name="finger-print"
                size={28}
                color={colors.text.tertiary}
              />
            </TouchableOpacity>
          )}

          <NumberButton digit="0" onPress={handlePinPress} />

          <TouchableOpacity
            style={[
              styles.numberButton,
              {
                backgroundColor: colors.background.secondary,
                borderWidth: 1,
                borderColor: colors.border.medium,
              },
            ]}
            onPress={() => handlePinPress('backspace')}
            disabled={isLoading}
          >
            <Ionicons
              name="backspace-outline"
              size={24}
              color={colors.text.secondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Password Alternative */}
      {showPassword && (
        <View style={styles.alternativeSection}>
          <TouchableOpacity
            style={[styles.passwordButton, {
              backgroundColor: colors.background.secondary,
              borderColor: colors.border.medium,
            }]}
            onPress={onPasswordPress}
            disabled={isLoading}
          >
            <Ionicons name="key-outline" size={20} color={colors.primary[500]} />
            <Text style={[styles.passwordButtonText, { color: colors.primary[500] }]}>
              Use Password Instead
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  pinDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    marginHorizontal: spacing.md,
  },
  numberPad: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 240,
    marginBottom: spacing.lg,
  },
  numberButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberButtonText: {
    fontSize: 24,
    fontWeight: '300',
  },
  attemptsWarningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: borderRadius.md,
  },
  attemptsWarningText: {
    fontSize: 14,
    marginLeft: spacing.sm,
    fontWeight: '500',
  },
  alternativeSection: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  passwordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  passwordButtonText: {
    fontSize: 16,
    marginLeft: spacing.sm,
    fontWeight: '500',
  },
});