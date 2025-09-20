import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';

export default function DebugStorageScreen() {
  const { colors } = useTheme();
  const [storageData, setStorageData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const styles = createStyles(colors);

  const checkAsyncStorage = async () => {
    setLoading(true);
    try {
      const keys = ['manual_transactions', 'manual_total_balance'];
      const data: any = {};

      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        data[key] = value ? JSON.parse(value) : null;
      }

      setStorageData(data);
    } catch (error) {
      console.error('❌ [Debug] Error reading AsyncStorage:', error);
      Alert.alert('Error', 'Failed to read AsyncStorage data');
    } finally {
      setLoading(false);
    }
  };

  const clearAsyncStorage = async () => {
    try {
      await AsyncStorage.multiRemove(['manual_transactions', 'manual_total_balance']);
      setStorageData({});
      Alert.alert('Success', 'AsyncStorage data cleared');
    } catch (error) {
      console.error('❌ [Debug] Error clearing AsyncStorage:', error);
      Alert.alert('Error', 'Failed to clear AsyncStorage data');
    }
  };

  const addTestData = async () => {
    try {
      const testTransactions = [
        {
          id: 'test_1',
          amount: -25.50,
          currency: 'GBP',
          description: 'Test Coffee Shop',
          category: 'Food & Dining',
          date: new Date().toISOString(),
          type: 'debit',
        },
      ];

      await AsyncStorage.setItem('manual_transactions', JSON.stringify(testTransactions));
      await AsyncStorage.setItem('manual_total_balance', '2474.50');

      Alert.alert('Success', 'Test data added to AsyncStorage');
      checkAsyncStorage();
    } catch (error) {
      console.error('❌ [Debug] Error adding test data:', error);
      Alert.alert('Error', 'Failed to add test data');
    }
  };

  useEffect(() => {
    checkAsyncStorage();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Debug AsyncStorage</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AsyncStorage Contents</Text>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary[500] }]}
            onPress={checkAsyncStorage}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Loading...' : 'Refresh Data'}
            </Text>
          </TouchableOpacity>

          <View style={styles.dataContainer}>
            <Text style={styles.dataTitle}>manual_transactions:</Text>
            <Text style={styles.dataText}>
              {storageData.manual_transactions
                ? JSON.stringify(storageData.manual_transactions, null, 2)
                : 'null'
              }
            </Text>

            <Text style={styles.dataTitle}>manual_total_balance:</Text>
            <Text style={styles.dataText}>
              {storageData.manual_total_balance || 'null'}
            </Text>
          </View>

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#10B981' }]}
              onPress={addTestData}
            >
              <Text style={styles.buttonText}>Add Test Data</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#EF4444' }]}
              onPress={clearAsyncStorage}
            >
              <Text style={styles.buttonText}>Clear All Data</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
      marginBottom: 16,
    },
    button: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 12,
    },
    buttonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
    },
    buttonGroup: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 16,
    },
    dataContainer: {
      backgroundColor: colors.background.secondary,
      borderRadius: 8,
      padding: 16,
      marginTop: 12,
    },
    dataTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text.primary,
      marginTop: 16,
      marginBottom: 8,
    },
    dataText: {
      fontSize: 12,
      color: colors.text.secondary,
      fontFamily: 'monospace',
    },
  });