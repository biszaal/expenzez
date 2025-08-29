import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';

interface PinSetupModalProps {
  isVisible: boolean;
  onClose: () => void;
  onPinSet: (pin: string) => void;
}

export const PinSetupModal: React.FC<PinSetupModalProps> = ({
  isVisible,
  onClose,
  onPinSet,
}) => {
  const { colors } = useTheme();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'setup' | 'confirm'>('setup');

  const handlePinPress = (digit: string) => {
    if (digit === 'backspace') {
      if (step === 'setup') {
        setPin(prev => prev.slice(0, -1));
      } else {
        setConfirmPin(prev => prev.slice(0, -1));
      }
      return;
    }

    if (step === 'setup') {
      if (pin.length < 5) {
        const newPin = pin + digit;
        setPin(newPin);
        
        if (newPin.length === 5) {
          // Move to confirmation step
          setTimeout(() => {
            setStep('confirm');
          }, 200);
        }
      }
    } else {
      if (confirmPin.length < 5) {
        const newConfirmPin = confirmPin + digit;
        setConfirmPin(newConfirmPin);
        
        if (newConfirmPin.length === 5) {
          // Check if PINs match
          if (pin === newConfirmPin) {
            handlePinSetup(pin);
          } else {
            Alert.alert(
              'PINs Don\'t Match',
              'The PINs you entered don\'t match. Please try again.',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    setPin('');
                    setConfirmPin('');
                    setStep('setup');
                  },
                },
              ]
            );
          }
        }
      }
    }
  };

  const handlePinSetup = async (pinToSet: string) => {
    try {
      await AsyncStorage.setItem('@expenzez_app_password', pinToSet);
      onPinSet(pinToSet);
      
      // Reset state
      setPin('');
      setConfirmPin('');
      setStep('setup');
      
      Alert.alert(
        'PIN Set Successfully',
        'Your 5-digit PIN has been set up. You can now use it to unlock the app.',
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to set up PIN. Please try again.');
    }
  };

  const PinDot = ({ filled }: { filled: boolean }) => (
    <View
      style={[
        styles.pinDot,
        {
          borderColor: colors.primary[500],
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
          borderColor: colors.border.primary,
        },
      ]}
      onPress={() => onPress(digit)}
      activeOpacity={0.7}
    >
      <Text style={[styles.numberButtonText, { color: colors.text.primary }]}>
        {digit}
      </Text>
    </TouchableOpacity>
  );

  const currentPin = step === 'setup' ? pin : confirmPin;

  return (
    <Modal visible={isVisible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background.primary }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            {step === 'setup' ? 'Set Up PIN' : 'Confirm PIN'}
          </Text>
          <View style={styles.closeButton} />
        </View>

        <View style={styles.content}>
          {/* Instructions */}
          <Text style={[styles.instructions, { color: colors.text.secondary }]}>
            {step === 'setup'
              ? 'Enter a 5-digit PIN to secure your app'
              : 'Re-enter your PIN to confirm'}
          </Text>

          {/* PIN Dots */}
          <View style={styles.pinDotsContainer}>
            {[0, 1, 2, 3, 4].map(index => (
              <PinDot key={index} filled={index < currentPin.length} />
            ))}
          </View>

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
              <View style={styles.numberButton} />
              <NumberButton digit="0" onPress={handlePinPress} />
              <TouchableOpacity
                style={[
                  styles.numberButton,
                  {
                    backgroundColor: colors.background.secondary,
                    borderWidth: 1,
                    borderColor: colors.border.primary,
                  },
                ]}
                onPress={() => handlePinPress('backspace')}
              >
                <Ionicons
                  name="backspace-outline"
                  size={24}
                  color={colors.text.secondary}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  instructions: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
  },
  pinDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
    marginBottom: 60,
  },
  pinDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  numberPad: {
    alignItems: 'center',
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 240,
    marginBottom: 20,
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
});