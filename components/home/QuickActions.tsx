import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { bankingAPI } from '../../services/api';
import { DEEP_LINK_URLS } from '../../constants/config';
import { SHADOWS } from '../../constants/Colors';
import { styles } from './QuickActions.styles';

export const QuickActions: React.FC = () => {
  const router = useRouter();

  const handleConnectBank = async () => {
    try {
      const response = await bankingAPI.connectBank();
      if (response.link) {
        await WebBrowser.openAuthSessionAsync(
          response.link,
          DEEP_LINK_URLS.BANK_CALLBACK
        );
      } else {
        alert("Failed to get bank authentication link");
      }
    } catch (error) {
      alert("Failed to start bank connection. Please try again.");
    }
  };

  return (
    <View style={styles.professionalQuickActionsWrapper}>
      <View style={styles.professionalQuickActionsGrid}>
        <TouchableOpacity
          style={styles.professionalQuickActionCard}
          onPress={() => router.push("/ai-assistant")}
          activeOpacity={0.85}
        >
          <View
            style={[styles.professionalQuickActionGradient, SHADOWS.lg, { backgroundColor: '#8B5CF6' }]}
          >
            <View style={styles.professionalQuickActionIconContainer}>
              <View style={styles.professionalQuickActionIcon}>
                <Ionicons name="sparkles" size={24} color="white" />
              </View>
            </View>
            <View style={styles.professionalQuickActionText}>
              <Text style={styles.professionalQuickActionTitle}>AI Insights</Text>
              <Text style={styles.professionalQuickActionSubtitle}>Smart analysis</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.professionalQuickActionCard}
          onPress={() => router.push("/banks")}
          activeOpacity={0.85}
        >
          <View
            style={[styles.professionalQuickActionGradient, SHADOWS.lg, { backgroundColor: '#3B82F6' }]}
          >
            <View style={styles.professionalQuickActionIconContainer}>
              <View style={styles.professionalQuickActionIcon}>
                <Ionicons name="card-outline" size={24} color="white" />
              </View>
            </View>
            <View style={styles.professionalQuickActionText}>
              <Text style={styles.professionalQuickActionTitle}>My Banks</Text>
              <Text style={styles.professionalQuickActionSubtitle}>Manage accounts</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.professionalQuickActionCard}
          onPress={() => router.push("/spending")}
          activeOpacity={0.85}
        >
          <View
            style={[styles.professionalQuickActionGradient, SHADOWS.lg, { backgroundColor: '#10B981' }]}
          >
            <View style={styles.professionalQuickActionIconContainer}>
              <View style={styles.professionalQuickActionIcon}>
                <Ionicons name="analytics-outline" size={24} color="white" />
              </View>
            </View>
            <View style={styles.professionalQuickActionText}>
              <Text style={styles.professionalQuickActionTitle}>Analytics</Text>
              <Text style={styles.professionalQuickActionSubtitle}>Track spending</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.professionalQuickActionCard}
          onPress={handleConnectBank}
          activeOpacity={0.85}
        >
          <View
            style={[styles.professionalQuickActionGradient, SHADOWS.lg, { backgroundColor: '#F59E0B' }]}
          >
            <View style={styles.professionalQuickActionIconContainer}>
              <View style={styles.professionalQuickActionIcon}>
                <Ionicons name="add-circle-outline" size={24} color="white" />
              </View>
            </View>
            <View style={styles.professionalQuickActionText}>
              <Text style={styles.professionalQuickActionTitle}>Connect</Text>
              <Text style={styles.professionalQuickActionSubtitle}>Add bank</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};