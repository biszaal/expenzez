import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SHADOWS } from '../../constants/Colors';
import { styles } from './AIAssistantCard.styles';

export const AIAssistantCard: React.FC = () => {
  const router = useRouter();

  return (
    <View style={styles.premiumAIWrapper}>
      <LinearGradient
        colors={['#8B5CF6', '#A855F7', '#C084FC']}
        style={[styles.premiumAICard, SHADOWS.xl]}
      >
        <View style={styles.premiumAIContent}>
          <View style={styles.premiumAILeft}>
            <View style={styles.premiumAIIconContainer}>
              <Ionicons name="sparkles" size={32} color="white" />
              <View style={styles.premiumAIGlow} />
            </View>
            <View style={styles.premiumAIText}>
              <Text style={styles.premiumAITitle}>AI Financial Assistant</Text>
              <Text style={styles.premiumAISubtitle}>Get personalized insights about your spending</Text>
              <View style={styles.premiumAIFeatures}>
                <View style={styles.premiumAIFeature}>
                  <Ionicons name="checkmark-circle" size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.premiumAIFeatureText}>Smart Analysis</Text>
                </View>
                <View style={styles.premiumAIFeature}>
                  <Ionicons name="checkmark-circle" size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.premiumAIFeatureText}>Budget Tips</Text>
                </View>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={styles.premiumAIButton}
            onPress={() => router.push("/ai-assistant")}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
              style={styles.premiumAIButtonGradient}
            >
              <Text style={styles.premiumAIButtonText}>Ask AI</Text>
              <Ionicons name="arrow-forward" size={16} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
        {/* Decorative Elements */}
        <View style={styles.premiumAIDecoration1} />
        <View style={styles.premiumAIDecoration2} />
        <View style={styles.premiumAIDecoration3} />
      </LinearGradient>
    </View>
  );
};