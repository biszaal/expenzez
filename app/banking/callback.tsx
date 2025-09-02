import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, ViewStyle, TextStyle } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { bankingAPI } from '../../services/api';
import { getEnvironmentName, isTestFlight } from '../../config/environment';

const BankingCallback: React.FC = () => {
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [message, setMessage] = useState('Processing bank connection...');

  useEffect(() => {
    processBankingCallback();
  }, []);

  const processBankingCallback = async () => {
    try {
      console.log('🏦 Processing banking callback in', getEnvironmentName());
      console.log('📋 Callback params:', params);

      const { code, error, error_description } = params;

      if (error) {
        // Handle error from TrueLayer
        const errorMsg = error_description || error || 'Banking connection failed';
        console.error('❌ Banking callback error:', errorMsg);
        
        setMessage(`Error: ${errorMsg}`);
        setIsProcessing(false);

        // Show error alert and redirect after delay
        setTimeout(() => {
          Alert.alert(
            'Connection Failed',
            String(errorMsg),
            [
              {
                text: 'OK',
                onPress: () => router.replace('/(tabs)/account')
              }
            ]
          );
        }, 1000);

        return;
      }

      if (code) {
        // Success - process the authorization code
        setMessage('Connecting to your bank account...');
        
        try {
          // Call backend to exchange code for access token and connect account
          const response = await bankingAPI.handleCallback(String(code));

          console.log('✅ Banking connection successful:', response);
          setMessage('Successfully connected!');
          
          // Show success message and redirect
          setTimeout(() => {
            Alert.alert(
              'Success!',
              'Your bank account has been connected successfully.',
              [
                {
                  text: 'Continue',
                  onPress: () => router.replace('/(tabs)')
                }
              ]
            );
          }, 1000);

        } catch (apiError: any) {
          console.error('❌ API error processing callback:', apiError);
          
          const apiErrorMsg = apiError.response?.data?.message || 
                             apiError.message || 
                             'Failed to connect bank account';
          
          setMessage(`Error: ${apiErrorMsg}`);
          setIsProcessing(false);

          setTimeout(() => {
            Alert.alert(
              'Connection Error',
              String(apiErrorMsg),
              [
                {
                  text: 'Try Again',
                  onPress: () => router.replace('/(tabs)/account')
                }
              ]
            );
          }, 1000);
        }
      } else {
        // No code or error - invalid callback
        console.error('❌ Invalid banking callback - no code or error');
        setMessage('Invalid callback - no authorization code received');
        setIsProcessing(false);

        setTimeout(() => {
          Alert.alert(
            'Invalid Callback',
            'No authorization code received from bank',
            [
              {
                text: 'OK',
                onPress: () => router.replace('/(tabs)/account')
              }
            ]
          );
        }, 1000);
      }

    } catch (error: any) {
      console.error('❌ Banking callback processing error:', error);
      setMessage(`Error: ${error.message || 'Unknown error'}`);
      setIsProcessing(false);

      setTimeout(() => {
        Alert.alert(
          'Processing Error',
          error.message || 'Failed to process banking callback',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(tabs)/account')
            }
          ]
        );
      }, 1000);
    }
  };

  const styles = {
    container: {
      flex: 1,
      backgroundColor: colors.background.primary,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    } as ViewStyle,
    content: {
      alignItems: 'center',
      maxWidth: 300,
    } as ViewStyle,
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text.primary,
      marginBottom: 20,
      textAlign: 'center',
    } as TextStyle,
    message: {
      fontSize: 16,
      color: colors.text.secondary,
      textAlign: 'center',
      marginTop: 20,
      lineHeight: 24,
    } as TextStyle,
    loader: {
      marginBottom: 20,
    } as ViewStyle,
    environmentInfo: {
      position: 'absolute',
      top: 50,
      right: 20,
      padding: 10,
      backgroundColor: colors.gray[100],
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.gray[200],
    } as ViewStyle,
    environmentText: {
      fontSize: 12,
      color: colors.text.tertiary,
      fontFamily: 'monospace',
    } as TextStyle,
  };

  return (
    <View style={styles.container}>
      {/* Environment indicator for debugging */}
      {__DEV__ && (
        <View style={styles.environmentInfo}>
          <Text style={styles.environmentText}>{getEnvironmentName()}</Text>
          <Text style={styles.environmentText}>TestFlight: {isTestFlight() ? 'Yes' : 'No'}</Text>
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.title}>Banking Connection</Text>
        
        {isProcessing && (
          <ActivityIndicator 
            size="large" 
            color={colors.primary[500]} 
            style={styles.loader}
          />
        )}
        
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
};

export default BankingCallback;