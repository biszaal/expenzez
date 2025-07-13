import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { healthCheck, authAPI } from '../services/api';

export default function ApiTest() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string>('');

  const testHealthCheck = async () => {
    setLoading(true);
    try {
      const response = await healthCheck();
      setResults(`Health Check: ${JSON.stringify(response, null, 2)}`);
      Alert.alert('Success', 'Health check passed!');
    } catch (error: any) {
      setResults(`Health Check Error: ${error.message}`);
      Alert.alert('Error', `Health check failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testRegister = async () => {
    setLoading(true);
    try {
      const response = await authAPI.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
      setResults(`Register: ${JSON.stringify(response, null, 2)}`);
      Alert.alert('Success', 'Registration test passed!');
    } catch (error: any) {
      setResults(`Register Error: ${error.message}`);
      Alert.alert('Error', `Registration test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    setLoading(true);
    try {
      const response = await authAPI.login({
        email: 'test@example.com',
        password: 'password123'
      });
      setResults(`Login: ${JSON.stringify(response, null, 2)}`);
      Alert.alert('Success', 'Login test passed!');
    } catch (error: any) {
      setResults(`Login Error: ${error.message}`);
      Alert.alert('Error', `Login test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>API Connection Test</Text>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={testHealthCheck}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Testing...' : 'Test Health Check'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button} 
        onPress={testRegister}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Testing...' : 'Test Register'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button} 
        onPress={testLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Testing...' : 'Test Login'}
        </Text>
      </TouchableOpacity>

      {results ? (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Results:</Text>
          <Text style={styles.resultsText}>{results}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  resultsText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
}); 