import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../auth/AuthContext';
import { insightsEngine, CategoryInsights } from '../../services/insightsEngine';
import { EXPENSE_CATEGORIES } from '../../services/expenseStorage';
import { spacing, borderRadius } from '../../constants/theme';
import { useSubscription } from '../../hooks/useSubscription';
import { AIInsightCard } from '../../components/ai/AIInsightCard';
import { AIButton } from '../../components/ai/AIButton';
import { getCategoryInsight, ChartInsightResponse } from '../../services/api/chartInsightsAPI';
import { aiInsightPersistence } from '../../services/aiInsightPersistence';

export default function CategoriesAnalysisScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [categoryInsights, setCategoryInsights] = useState<CategoryInsights[]>([]);
  const [loading, setLoading] = useState(true);

  // AI insights state
  const [categoryAIInsight, setCategoryAIInsight] = useState<ChartInsightResponse | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [showAIInsight, setShowAIInsight] = useState(false);
  const [canRequestInsight, setCanRequestInsight] = useState(true);

  // Refs for auto-scroll
  const scrollViewRef = React.useRef<ScrollView>(null);
  const aiInsightRef = React.useRef<View>(null);

  useEffect(() => {
    loadCategoryAnalysis();
  }, []);

  // Load cached AI insight on mount
  useEffect(() => {
    const loadCachedInsight = async () => {
      const userId = user?.id;
      if (!userId || !isPremium) {
        return;
      }

      try {
        const cached = await aiInsightPersistence.getInsight(userId, 'categories');
        if (cached) {
          console.log('[Categories] 📦 Loaded cached category insight');
          setCategoryAIInsight(cached.data);
          setShowAIInsight(true);
          setCanRequestInsight(false);
        } else {
          setCanRequestInsight(true);
        }
      } catch (error) {
        console.error('[Categories] Error loading cached insight:', error);
      }
    };

    loadCachedInsight();
  }, [user?.id, isPremium]);

  // Auto-scroll to AI insight when it appears
  useEffect(() => {
    if (showAIInsight && aiInsightRef.current && scrollViewRef.current) {
      setTimeout(() => {
        aiInsightRef.current?.measureLayout(
          scrollViewRef.current as any,
          (x, y) => {
            scrollViewRef.current?.scrollTo({
              y: y - 20,
              animated: true,
            });
          },
          () => {
            console.log('[Categories] Failed to measure AI insight position');
          }
        );
      }, 300);
    }
  }, [showAIInsight]);

  const loadCategoryAnalysis = async () => {
    try {
      setLoading(true);
      const insights: CategoryInsights[] = [];

      for (const category of EXPENSE_CATEGORIES) {
        const categoryData = await insightsEngine.getCategoryInsights(category.id);
        if (categoryData && categoryData.totalSpent > 0) {
          insights.push(categoryData);
        }
      }

      // Sort by total spent
      insights.sort((a, b) => b.totalSpent - a.totalSpent);
      setCategoryInsights(insights);
    } catch (error) {
      console.error('Error loading category analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch AI insight for category distribution
  const fetchCategoryAIInsight = useCallback(async () => {
    if (!isPremium || categoryInsights.length === 0) {
      return;
    }

    try {
      setInsightLoading(true);

      // Prepare category data for AI insight
      const categories = categoryInsights.map((insight) => {
        const categoryInfo = EXPENSE_CATEGORIES.find(cat => cat.id === insight.category);
        return {
          name: categoryInfo?.name || insight.category,
          amount: insight.totalSpent,
        };
      });

      const totalSpending = categories.reduce((sum, cat) => sum + cat.amount, 0);

      console.log('[Categories] Fetching AI insight...', {
        categoriesCount: categories.length,
        totalSpending,
        topCategory: categories[0],
      });

      const insight = await getCategoryInsight(categories, totalSpending);

      setCategoryAIInsight(insight);

      // Save to cache with 24h expiration
      const userId = user?.id;
      if (userId) {
        await aiInsightPersistence.saveInsight(userId, 'categories', insight);
        setCanRequestInsight(false);
        console.log('[Categories] ✅ AI insight loaded and cached for 24h');
      }
    } catch (error) {
      console.warn('[Categories] ⚠️ AI insights unavailable');
      setCategoryAIInsight(null);
    } finally {
      setInsightLoading(false);
    }
  }, [isPremium, categoryInsights, user?.id]);

  // Handler for AI button press
  const handleAIButtonPress = () => {
    // Check if user can request a new insight
    if (!canRequestInsight) {
      Alert.alert(
        "AI Limit Reached",
        "You've reached your daily AI insight limit. Your insights will be available again in 24 hours.\n\nUpgrade to Premium for unlimited AI insights!",
        [{ text: "OK" }]
      );
      return;
    }

    if (!showAIInsight) {
      fetchCategoryAIInsight();
    }
    setShowAIInsight(!showAIInsight);
  };

  const getTrendIcon = (trend: 'increasing' | 'decreasing' | 'stable') => {
    switch (trend) {
      case 'increasing': return { name: 'trending-up' as const, color: '#EF4444' };
      case 'decreasing': return { name: 'trending-down' as const, color: '#10B981' };
      case 'stable': return { name: 'remove' as const, color: '#6B7280' };
    }
  };

  const getCategoryEmoji = (category: string) => {
    const categoryInfo = EXPENSE_CATEGORIES.find(cat => cat.id === category);
    return categoryInfo?.emoji || '📊';
  };

  const getCategoryName = (category: string) => {
    const categoryInfo = EXPENSE_CATEGORIES.find(cat => cat.id === category);
    return categoryInfo?.name || category;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            Analyzing categories...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={colors.primary.main} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Category Analysis
          </Text>
        </View>

        {/* AI Button in Header - Hidden when insight is active */}
        {isPremium && categoryInsights.length > 0 && !showAIInsight && (
          <AIButton
            onPress={handleAIButtonPress}
            loading={insightLoading}
            active={false}
            label="Ask AI"
          />
        )}
      </View>

      <ScrollView ref={scrollViewRef} style={styles.content} showsVerticalScrollIndicator={false}>
        {categoryInsights.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
              No Category Data
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.text.secondary }]}>
              Add some expenses to see category breakdowns and spending patterns.
            </Text>
          </View>
        ) : (
          <>
            {/* AI Category Insight - Premium Feature */}
            {isPremium && showAIInsight && categoryAIInsight && (
              <View ref={aiInsightRef} style={{ marginBottom: 16 }}>
                <AIInsightCard
                  insight={categoryAIInsight.insight}
                  expandedInsight={categoryAIInsight.expandedInsight}
                  priority={categoryAIInsight.priority}
                  actionable={categoryAIInsight.actionable}
                  loading={insightLoading}
                  collapsedByDefault={true}
                />
              </View>
            )}

            <View style={styles.categoriesList}>
              {categoryInsights.map((insight) => {
              const trendIcon = getTrendIcon(insight.trend);

              return (
                <TouchableOpacity
                  key={insight.category}
                  style={[styles.categoryCard, { backgroundColor: colors.background.secondary }]}
                  onPress={() => router.push(`/insights/categories?category=${insight.category}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.categoryHeader}>
                    <View style={styles.categoryTitle}>
                      <Text style={styles.categoryEmoji}>
                        {getCategoryEmoji(insight.category)}
                      </Text>
                      <View style={styles.categoryInfo}>
                        <Text style={[styles.categoryName, { color: colors.text.primary }]}>
                          {getCategoryName(insight.category)}
                        </Text>
                        <Text style={[styles.categoryFrequency, { color: colors.text.secondary }]}>
                          {insight.frequency} transactions
                        </Text>
                      </View>
                    </View>

                    <View style={styles.categoryTrend}>
                      <Ionicons
                        name={trendIcon.name}
                        size={16}
                        color={trendIcon.color}
                      />
                      <Text style={[styles.trendText, { color: trendIcon.color }]}>
                        {insight.trendPercentage.toFixed(0)}%
                      </Text>
                    </View>
                  </View>

                  <View style={styles.categoryStats}>
                    <View style={styles.statItem}>
                      <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                        Total Spent
                      </Text>
                      <Text style={[styles.statValue, { color: colors.text.primary }]}>
                        £{insight.totalSpent.toFixed(2)}
                      </Text>
                    </View>

                    <View style={styles.statItem}>
                      <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                        Average
                      </Text>
                      <Text style={[styles.statValue, { color: colors.text.primary }]}>
                        £{insight.averageTransaction.toFixed(2)}
                      </Text>
                    </View>
                  </View>

                  {insight.topMerchants.length > 0 && (
                    <View style={styles.topMerchants}>
                      <Text style={[styles.merchantsLabel, { color: colors.text.secondary }]}>
                        Top spending: {insight.topMerchants[0].name} (£{insight.topMerchants[0].amount.toFixed(2)})
                      </Text>
                    </View>
                  )}

                  {insight.unusualTransactions.length > 0 && (
                    <View style={styles.alertBadge}>
                      <Ionicons name="warning" size={12} color="#F59E0B" />
                      <Text style={[styles.alertText, { color: '#F59E0B' }]}>
                        {insight.unusualTransactions.length} unusual transaction{insight.unusualTransactions.length > 1 ? 's' : ''}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
            </View>
          </>
        )}

        {/* Summary Stats */}
        {categoryInsights.length > 0 && (
          <View style={styles.summarySection}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Summary
            </Text>

            <View style={[styles.summaryCard, { backgroundColor: colors.background.secondary }]}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.text.secondary }]}>
                  Active Categories
                </Text>
                <Text style={[styles.summaryValue, { color: colors.text.primary }]}>
                  {categoryInsights.length}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.text.secondary }]}>
                  Total Spending
                </Text>
                <Text style={[styles.summaryValue, { color: colors.text.primary }]}>
                  £{categoryInsights.reduce((sum, c) => sum + c.totalSpent, 0).toFixed(2)}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.text.secondary }]}>
                  Highest Category
                </Text>
                <Text style={[styles.summaryValue, { color: colors.text.primary }]}>
                  {categoryInsights.length > 0 ? getCategoryName(categoryInsights[0].category) : 'None'}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  categoriesList: {
    gap: spacing.md,
  },
  categoryCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  categoryEmoji: {
    fontSize: 24,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  categoryFrequency: {
    fontSize: 12,
  },
  categoryTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  topMerchants: {
    marginTop: spacing.xs,
  },
  merchantsLabel: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  alertText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.lg,
  },
  summarySection: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  summaryCard: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },

});