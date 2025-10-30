import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';

export default function ManageBalanceScreen() {
  const { colors } = useTheme();
  const [currentBalance, setCurrentBalance] = useState('0.00');
  const [newBalance, setNewBalance] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const styles = createStyles(colors);

  useEffect(() => {
    loadCurrentBalance();
  }, []);

  const loadCurrentBalance = async () => {
    try {
      const balance = await AsyncStorage.getItem('manual_total_balance');
      const balanceValue = balance ? parseFloat(balance) : 0;
      setCurrentBalance(balanceValue.toFixed(2));
    } catch (error) {
      console.error('Error loading balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBalance = async () => {
    if (!newBalance) {
      Alert.alert('Missing Amount', 'Please enter a new balance amount.');
      return;
    }

    const balanceValue = parseFloat(newBalance);
    if (isNaN(balanceValue)) {
      Alert.alert('Invalid Amount', 'Please enter a valid balance amount.');
      return;
    }

    setSaving(true);

    try {
      // Save new balance
      await AsyncStorage.setItem('manual_total_balance', balanceValue.toString());

      // Create a balance adjustment transaction for record keeping
      const adjustmentTransaction = {
        id: `balance_adjustment_${Date.now()}`,
        amount: balanceValue - parseFloat(currentBalance),
        currency: 'GBP',
        description: 'Manual balance adjustment',
        category: 'Balance Adjustment',
        date: new Date().toISOString(),
        type: balanceValue >= parseFloat(currentBalance) ? 'credit' : 'debit',
      };

      // Load existing transactions
      const existingTransactions = await AsyncStorage.getItem('manual_transactions');
      const transactions = existingTransactions ? JSON.parse(existingTransactions) : [];

      // Add adjustment transaction
      transactions.unshift(adjustmentTransaction);

      // Save updated transactions
      await AsyncStorage.setItem('manual_transactions', JSON.stringify(transactions));

      // Update current balance display
      setCurrentBalance(balanceValue.toFixed(2));
      setNewBalance('');

      Alert.alert(
        'Balance Updated!',
        `Your balance has been updated to £${balanceValue.toFixed(2)}.`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error updating balance:', error);
      Alert.alert('Error', 'Failed to update balance. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetBalance = () => {
    Alert.alert(
      'Reset Balance',
      'Are you sure you want to reset your balance to £0.00? This will also clear all transaction history.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.setItem('manual_total_balance', '0');
              await AsyncStorage.removeItem('manual_transactions');
              setCurrentBalance('0.00');
              setNewBalance('');
              Alert.alert('Reset Complete', 'Your balance and transaction history have been reset.');
            } catch (error) {
              console.error('Error resetting balance:', error);
              Alert.alert('Error', 'Failed to reset balance. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Balance</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Balance</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Current Balance */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Balance</Text>
            <View style={styles.currentBalanceCard}>
              <Text style={styles.currentBalanceLabel}>Total Balance</Text>
              <Text style={[styles.currentBalanceAmount, { color: colors.primary.main }]}>
                £{currentBalance}
              </Text>
            </View>
          </View>

          {/* Update Balance */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Update Balance</Text>
            <Text style={styles.sectionDescription}>
              Set your current account balance. This will create a balance adjustment transaction.
            </Text>
            <View style={styles.amountContainer}>
              <Text style={styles.currencySymbol}>£</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="Enter new balance"
                
                value={newBalance}
                onChangeText={setNewBalance}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Quick Balance Options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Options</Text>
            <View style={styles.quickOptionsGrid}>
              <TouchableOpacity
                style={styles.quickOptionButton}
                onPress={() => setNewBalance('100')}
              >
                <Text style={styles.quickOptionText}>£100</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickOptionButton}
                onPress={() => setNewBalance('500')}
              >
                <Text style={styles.quickOptionText}>£500</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickOptionButton}
                onPress={() => setNewBalance('1000')}
              >
                <Text style={styles.quickOptionText}>£1,000</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickOptionButton}
                onPress={() => setNewBalance('2000')}
              >
                <Text style={styles.quickOptionText}>£2,000</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Reset Option */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.resetButton} onPress={handleResetBalance}>
              <Ionicons name="refresh" size={20} color="#EF4444" />
              <Text style={styles.resetButtonText}>Reset Balance & Clear History</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Update Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.updateButton,
              { backgroundColor: colors.primary.main },
              saving && styles.updateButtonDisabled,
            ]}
            onPress={handleUpdateBalance}
            disabled={saving}
          >
            <Text style={styles.updateButtonText}>
              {saving ? 'Updating...' : 'Update Balance'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.primary,
    },
    backButton: {
      padding: 4,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text.primary,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    section: {
      marginTop: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text.primary,
      marginBottom: 12,
    },
    sectionDescription: {
      fontSize: 14,
      color: colors.text.secondary,
      marginBottom: 16,
      lineHeight: 20,
    },
    currentBalanceCard: {
      backgroundColor: colors.background.secondary,
      borderRadius: 12,
      paddingHorizontal: 20,
      paddingVertical: 24,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border.primary,
    },
    currentBalanceLabel: {
      fontSize: 14,
      color: colors.text.secondary,
      marginBottom: 8,
    },
    currentBalanceAmount: {
      fontSize: 32,
      fontWeight: '700',
    },
    amountContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background.secondary,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderWidth: 1,
      borderColor: colors.border.primary,
    },
    currencySymbol: {
      fontSize: 24,
      fontWeight: '600',
      color: colors.text.primary,
      marginRight: 8,
    },
    amountInput: {
      flex: 1,
      fontSize: 24,
      fontWeight: '600',
      color: colors.text.primary,
    },
    quickOptionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    quickOptionButton: {
      width: '47%',
      backgroundColor: colors.background.secondary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border.primary,
    },
    quickOptionText: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text.primary,
    },
    resetButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background.secondary,
      borderRadius: 12,
      paddingVertical: 16,
      borderWidth: 1,
      borderColor: '#EF4444',
    },
    resetButtonText: {
      fontSize: 16,
      fontWeight: '500',
      color: '#EF4444',
      marginLeft: 8,
    },
    footer: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border.primary,
    },
    updateButton: {
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    updateButtonDisabled: {
      opacity: 0.6,
    },
    updateButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: 'white',
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      fontSize: 16,
      color: colors.text.secondary,
    },

});