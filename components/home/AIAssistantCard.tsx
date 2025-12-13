import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SHADOWS } from '../../constants/Colors';
import { styles } from './AIAssistantCard.styles';
import { useAuth } from '../../app/auth/AuthContext';
import { aiService } from '../../services/api/aiAPI';
import type { ProactiveInsight } from '../../services/api/aiAPI';

export const AIAssistantCard: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [topInsight, setTopInsight] = useState<ProactiveInsight | null>(null);

  useEffect(() => {
    const loadTopInsight = async () => {
      const userId = user?.id || user?.username || user?.sub;
      if (!userId) {
        console.log('AIAssistantCard: No user ID available');
        return;
      }

      try {
        const insights = await aiService.generateProactiveInsights(userId);
        // Get the highest priority insight
        const highPriorityInsight = insights.find(i => i.priority === 'high') || insights[0];
        setTopInsight(highPriorityInsight || null);
      } catch (error) {
        console.log('AIAssistantCard: Error loading insights:', error);
      }
    };

    loadTopInsight();
  }, [user?.id, user?.username, user?.sub]);

  return (
    <View style={styles.premiumAIWrapper}>
      <LinearGradient
        colors={['#7B2D8E', '#9B3DAE', '#B84DCE']}
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
              <Text style={styles.premiumAISubtitle}>
                {topInsight
                  ? topInsight.title.replace(/[🎉🏆💡⚠️🚀🌟📊]/g, '').trim()
                  : "Get personalized insights about your spending"
                }
              </Text>
              <View style={styles.premiumAIFeatures}>
                <View style={styles.premiumAIFeature}>
                  <Ionicons name="checkmark-circle" size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.premiumAIFeatureText}>
                    {topInsight ? 'New Insight Available' : 'Smart Analysis'}
                  </Text>
                </View>
                <View style={styles.premiumAIFeature}>
                  <Ionicons name="checkmark-circle" size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.premiumAIFeatureText}>
                    {topInsight && topInsight.actionable ? 'Action Ready' : 'Budget Tips'}
                  </Text>
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