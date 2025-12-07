import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../auth/AuthContext';
import { spacing, borderRadius } from '../../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { creditAPI, CreditInsightResponse } from '../../services/api/creditAPI';

type CreditBureau = 'TransUnion' | 'Experian' | 'Equifax';

interface CreditScoreEntry {
  score: number;
  date: string; // ISO date string (YYYY-MM-DD)
  monthYear: string; // Format: "2025-11" for grouping
}

interface BureauHistory {
  bureau: CreditBureau;
  scores: CreditScoreEntry[];
}

interface CreditScoreHistory {
  bureaus: BureauHistory[];
}

interface BureauConfig {
  name: CreditBureau;
  maxScore: number;
  ranges: {
    min: number;
    max: number;
    rating: string;
    color: string;
  }[];
}

const CREDIT_SCORE_STORAGE_KEY = '@expenzez:credit_scores';

// Bureau-specific configurations
const BUREAU_CONFIGS: Record<CreditBureau, BureauConfig> = {
  TransUnion: {
    name: 'TransUnion',
    maxScore: 710,
    ranges: [
      { min: 628, max: 710, rating: 'Excellent', color: '#10B981' },
      { min: 604, max: 627, rating: 'Good', color: '#3B82F6' },
      { min: 566, max: 603, rating: 'Fair', color: '#F59E0B' },
      { min: 551, max: 565, rating: 'Poor', color: '#EF4444' },
      { min: 0, max: 550, rating: 'Very Poor', color: '#DC2626' },
    ],
  },
  Experian: {
    name: 'Experian',
    maxScore: 999,
    ranges: [
      { min: 961, max: 999, rating: 'Excellent', color: '#10B981' },
      { min: 881, max: 960, rating: 'Good', color: '#3B82F6' },
      { min: 721, max: 880, rating: 'Fair', color: '#F59E0B' },
      { min: 561, max: 720, rating: 'Poor', color: '#EF4444' },
      { min: 0, max: 560, rating: 'Very Poor', color: '#DC2626' },
    ],
  },
  Equifax: {
    name: 'Equifax',
    maxScore: 700,
    ranges: [
      { min: 466, max: 700, rating: 'Excellent', color: '#10B981' },
      { min: 420, max: 465, rating: 'Good', color: '#3B82F6' },
      { min: 380, max: 419, rating: 'Fair', color: '#F59E0B' },
      { min: 280, max: 379, rating: 'Poor', color: '#EF4444' },
      { min: 0, max: 279, rating: 'Very Poor', color: '#DC2626' },
    ],
  },
};

export default function CreditScoreScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [bureauHistories, setBureauHistories] = useState<BureauHistory[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBureau, setSelectedBureau] = useState<CreditBureau>('TransUnion');
  const [scoreInput, setScoreInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().substring(0, 7)); // YYYY-MM
  const [showScoreRanges, setShowScoreRanges] = useState(false);

  // AI Insights state
  const [aiInsight, setAiInsight] = useState<CreditInsightResponse | null>(null);
  const [aiInsightExpanded, setAiInsightExpanded] = useState(false);
  const [loadingAiInsight, setLoadingAiInsight] = useState(false);
  const [syncedWithBackend, setSyncedWithBackend] = useState(false);

  // Load credit scores from storage
  useEffect(() => {
    loadCreditScores();
  }, []);

  const loadCreditScores = async () => {
    try {
      // Try loading from backend first
      console.log('[CreditScore] Loading credit scores from backend...');
      try {
        const backendData = await creditAPI.getCreditScores();
        if (backendData.bureaus && backendData.bureaus.length > 0) {
          console.log('[CreditScore] ✅ Loaded from backend:', backendData.bureaus.length, 'bureaus');
          setBureauHistories(backendData.bureaus);
          setSyncedWithBackend(true);
          setLoading(false);
          return;
        }
      } catch (backendError) {
        console.log('[CreditScore] Backend load failed, falling back to AsyncStorage:', backendError);
      }

      // Fallback to AsyncStorage and migrate to backend
      console.log('[CreditScore] Loading from AsyncStorage...');
      const stored = await AsyncStorage.getItem(`${CREDIT_SCORE_STORAGE_KEY}:${user?.userId}`);
      if (stored) {
        const data = JSON.parse(stored);

        // Migrate old format to new format if needed
        if (data.scores && !data.bureaus) {
          console.log('[CreditScore] Migrating old format to new format');
          const migratedBureaus: BureauHistory[] = data.scores.map((oldScore: any) => ({
            bureau: oldScore.bureau,
            scores: [{
              score: oldScore.score,
              date: oldScore.lastUpdated || new Date().toISOString(),
              monthYear: new Date(oldScore.lastUpdated || new Date()).toISOString().substring(0, 7),
            }],
          }));
          setBureauHistories(migratedBureaus);
          // Sync to backend
          await syncToBackend(migratedBureaus);
        } else if (data.bureaus) {
          setBureauHistories(data.bureaus || []);
          // Sync existing data to backend
          await syncToBackend(data.bureaus);
        }
      }
    } catch (error) {
      console.error('[CreditScore] Error loading credit scores:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sync local credit scores to backend
   */
  const syncToBackend = async (bureaus: BureauHistory[]) => {
    try {
      console.log('[CreditScore] Syncing to backend...');
      const allScores: any[] = [];

      bureaus.forEach((bureau) => {
        bureau.scores.forEach((score) => {
          allScores.push({
            bureau: bureau.bureau,
            score: score.score,
            date: score.date,
            monthYear: score.monthYear,
          });
        });
      });

      if (allScores.length > 0) {
        await creditAPI.saveCreditScores(allScores);
        console.log('[CreditScore] ✅ Synced', allScores.length, 'scores to backend');
        setSyncedWithBackend(true);
      }
    } catch (error) {
      console.error('[CreditScore] Failed to sync to backend:', error);
    }
  };

  const saveCreditScores = async (bureaus: BureauHistory[]) => {
    try {
      const data: CreditScoreHistory = { bureaus };
      // Save to AsyncStorage for offline access
      await AsyncStorage.setItem(
        `${CREDIT_SCORE_STORAGE_KEY}:${user?.userId}`,
        JSON.stringify(data)
      );

      // Sync to backend
      await syncToBackend(bureaus);
    } catch (error) {
      console.error('[CreditScore] Error saving credit scores:', error);
    }
  };

  /**
   * Fetch AI credit insights
   */
  const fetchAIInsight = async () => {
    try {
      setLoadingAiInsight(true);
      console.log('[CreditScore] Fetching AI credit insight...');

      const insight = await creditAPI.getCreditInsight();
      setAiInsight(insight);
      setAiInsightExpanded(true); // Auto-expand on first load

      console.log('[CreditScore] ✅ AI insight fetched successfully');
    } catch (error: any) {
      console.error('[CreditScore] Failed to fetch AI insight:', error);
      Alert.alert(
        'AI Insight Unavailable',
        error.message || 'Unable to generate credit insights. Please try again later.'
      );
    } finally {
      setLoadingAiInsight(false);
    }
  };

  const handleAddScore = () => {
    const score = parseInt(scoreInput);
    const bureauConfig = BUREAU_CONFIGS[selectedBureau];

    if (!scoreInput || isNaN(score)) {
      Alert.alert('Invalid Score', 'Please enter a valid credit score number');
      return;
    }

    if (score < 0 || score > bureauConfig.maxScore) {
      Alert.alert(
        'Invalid Score',
        `${selectedBureau} credit score must be between 0 and ${bureauConfig.maxScore}`
      );
      return;
    }

    const currentMonthYear = selectedMonth; // Use selected month instead of current month

    // Find or create bureau history
    let updatedBureaus = [...bureauHistories];
    let bureauHistory = updatedBureaus.find((b) => b.bureau === selectedBureau);

    if (!bureauHistory) {
      // Create new bureau history
      bureauHistory = {
        bureau: selectedBureau,
        scores: [],
      };
      updatedBureaus.push(bureauHistory);
    }

    // Check if score already exists for current month
    const existingScoreIndex = bureauHistory.scores.findIndex(
      (s) => s.monthYear === currentMonthYear
    );

    // Create date from selected month (use first day of month)
    const selectedDate = new Date(selectedMonth + '-01');

    const newEntry: CreditScoreEntry = {
      score,
      date: selectedDate.toISOString(),
      monthYear: currentMonthYear,
    };

    if (existingScoreIndex >= 0) {
      // Update existing month's score
      bureauHistory.scores[existingScoreIndex] = newEntry;
    } else {
      // Add new month's score
      bureauHistory.scores.push(newEntry);
      // Sort by date descending (newest first)
      bureauHistory.scores.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    setBureauHistories(updatedBureaus);
    saveCreditScores(updatedBureaus);

    // Reset and close modal
    setScoreInput('');
    setSelectedMonth(new Date().toISOString().substring(0, 7)); // Reset to current month
    setModalVisible(false);
  };

  // Generate list of months (current month + 11 previous months)
  const getAvailableMonths = (): { value: string; label: string }[] => {
    const months: { value: string; label: string }[] = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed (0=Jan, 11=Dec)

    for (let i = 0; i < 12; i++) {
      // Calculate year and month
      let year = currentYear;
      let month = currentMonth - i;

      // Handle negative months (previous year)
      while (month < 0) {
        month += 12;
        year -= 1;
      }

      // Format as YYYY-MM
      const monthYear = `${year}-${String(month + 1).padStart(2, '0')}`;

      // Create a date for label formatting
      const date = new Date(year, month, 1);
      const label = date.toLocaleDateString('en-GB', {
        month: 'long',
        year: 'numeric',
      });

      months.push({ value: monthYear, label });
    }

    return months;
  };

  const getLatestScoreForBureau = (bureau: CreditBureau): CreditScoreEntry | undefined => {
    const bureauHistory = bureauHistories.find((b) => b.bureau === bureau);
    if (!bureauHistory || bureauHistory.scores.length === 0) return undefined;
    // Scores are already sorted by date descending, so first is latest
    return bureauHistory.scores[0];
  };

  const getBureauHistory = (bureau: CreditBureau): BureauHistory | undefined => {
    return bureauHistories.find((b) => b.bureau === bureau);
  };

  const getScoreChange = (bureau: CreditBureau): number | null => {
    const history = getBureauHistory(bureau);
    if (!history || history.scores.length < 2) return null;

    const latest = history.scores[0].score;
    const previous = history.scores[1].score;
    return latest - previous;
  };

  const getScoreColor = (score: number, bureau: CreditBureau): string => {
    const config = BUREAU_CONFIGS[bureau];
    const range = config.ranges.find((r) => score >= r.min && score <= r.max);
    return range?.color || '#DC2626';
  };

  const getScoreRating = (score: number, bureau: CreditBureau): string => {
    const config = BUREAU_CONFIGS[bureau];
    const range = config.ranges.find((r) => score >= r.min && score <= r.max);
    return range?.rating || 'Very Poor';
  };

  const bureaus: CreditBureau[] = ['TransUnion', 'Experian', 'Equifax'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header with Back Button and AI Button */}
      <View style={[styles.header, { backgroundColor: colors.background.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Credit Score</Text>
        </View>
        <TouchableOpacity
          onPress={fetchAIInsight}
          style={[styles.aiButton, { backgroundColor: `${colors.primary.main}15` }]}
          disabled={loadingAiInsight}
        >
          {loadingAiInsight ? (
            <ActivityIndicator size="small" color={colors.primary.main} />
          ) : (
            <Ionicons name="sparkles" size={20} color={colors.primary.main} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Legal Disclaimer */}
        <View style={[styles.disclaimer, { backgroundColor: `${colors.warning.main}10` }]}>
          <Ionicons name="information-circle-outline" size={20} color={colors.warning.main} />
          <Text style={[styles.disclaimerText, { color: colors.text.secondary }]}>
            Educational content only. We cannot access your credit score - you must enter it
            manually. We are not FCA-authorized financial advisors.
          </Text>
        </View>

        {/* AI Credit Insight Card */}
        {aiInsight && (
          <View style={[styles.aiInsightCard, { backgroundColor: colors.background.secondary }]}>
            <TouchableOpacity
              style={styles.aiInsightHeader}
              onPress={() => setAiInsightExpanded(!aiInsightExpanded)}
              activeOpacity={0.7}
            >
              <View style={styles.aiInsightHeaderLeft}>
                <View style={[styles.aiInsightIcon, { backgroundColor: `${colors.primary.main}15` }]}>
                  <Ionicons name="sparkles" size={20} color={colors.primary.main} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.aiInsightTitle, { color: colors.text.primary }]}>
                    AI Credit Insight
                  </Text>
                  {aiInsight.cached && (
                    <Text style={[styles.aiInsightCached, { color: colors.text.tertiary }]}>
                      Cached • Tap to refresh
                    </Text>
                  )}
                </View>
              </View>
              <View style={styles.aiInsightHeaderRight}>
                <View
                  style={[
                    styles.priorityBadge,
                    {
                      backgroundColor:
                        aiInsight.priority === 'high'
                          ? '#FEE2E2'
                          : aiInsight.priority === 'medium'
                          ? '#FEF3C7'
                          : '#DBEAFE',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.priorityText,
                      {
                        color:
                          aiInsight.priority === 'high'
                            ? '#DC2626'
                            : aiInsight.priority === 'medium'
                            ? '#D97706'
                            : '#2563EB',
                      },
                    ]}
                  >
                    {aiInsight.priority.toUpperCase()}
                  </Text>
                </View>
                <Ionicons
                  name={aiInsightExpanded ? 'chevron-up' : 'chevron-down'}
                  size={24}
                  color={colors.text.secondary}
                />
              </View>
            </TouchableOpacity>

            {/* Minimized View - Brief Insight */}
            {!aiInsightExpanded && (
              <Text
                style={[styles.aiInsightBrief, { color: colors.text.secondary }]}
                numberOfLines={2}
              >
                {aiInsight.insight}
              </Text>
            )}

            {/* Expanded View */}
            {aiInsightExpanded && (
              <View style={styles.aiInsightBody}>
                {/* Summary */}
                <View style={styles.aiInsightSection}>
                  <Text style={[styles.aiInsightText, { color: colors.text.primary }]}>
                    {aiInsight.insight}
                  </Text>
                </View>

                {/* Expanded Analysis */}
                {aiInsight.expandedInsight && (
                  <View style={styles.aiInsightSection}>
                    <Text style={[styles.aiInsightSubtitle, { color: colors.text.primary }]}>
                      Detailed Analysis
                    </Text>
                    <Text style={[styles.aiInsightText, { color: colors.text.secondary }]}>
                      {aiInsight.expandedInsight}
                    </Text>
                  </View>
                )}

                {/* Recommendations */}
                {aiInsight.recommendations && aiInsight.recommendations.length > 0 && (
                  <View style={styles.aiInsightSection}>
                    <Text style={[styles.aiInsightSubtitle, { color: colors.text.primary }]}>
                      Recommendations
                    </Text>
                    {aiInsight.recommendations.map((rec, index) => (
                      <View key={index} style={styles.recommendationItem}>
                        <View
                          style={[
                            styles.recommendationBullet,
                            { backgroundColor: colors.primary.main },
                          ]}
                        />
                        <Text style={[styles.recommendationText, { color: colors.text.secondary }]}>
                          {rec}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Credit Factors */}
                {aiInsight.factors && aiInsight.factors.length > 0 && (
                  <View style={styles.aiInsightSection}>
                    <Text style={[styles.aiInsightSubtitle, { color: colors.text.primary }]}>
                      Credit Factors
                    </Text>
                    {aiInsight.factors.map((factor, index) => (
                      <View key={index} style={styles.factorCard}>
                        <View style={styles.factorCardHeader}>
                          <Text style={[styles.factorCardName, { color: colors.text.primary }]}>
                            {factor.name}
                          </Text>
                          <View
                            style={[
                              styles.factorStatusBadge,
                              {
                                backgroundColor:
                                  factor.status === 'good'
                                    ? '#D1FAE5'
                                    : factor.status === 'fair'
                                    ? '#FEF3C7'
                                    : '#FEE2E2',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.factorStatusText,
                                {
                                  color:
                                    factor.status === 'good'
                                      ? '#065F46'
                                      : factor.status === 'fair'
                                      ? '#92400E'
                                      : '#991B1B',
                                },
                              ]}
                            >
                              {factor.status.toUpperCase()}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.factorCardImpact, { color: colors.text.secondary }]}>
                          {factor.impact}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Credit Score Cards */}
        <View style={styles.scoresSection}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Your Credit Scores
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.text.secondary }]}>
              Add scores from at least one bureau
            </Text>
          </View>

          {bureaus.map((bureau) => {
            const latestScore = getLatestScoreForBureau(bureau);
            const hasScore = latestScore !== undefined;
            const scoreChange = getScoreChange(bureau);
            const history = getBureauHistory(bureau);

            return (
              <TouchableOpacity
                key={bureau}
                style={[
                  styles.bureauCard,
                  { backgroundColor: colors.background.secondary },
                ]}
                onPress={() => {
                  setSelectedBureau(bureau);
                  setScoreInput(latestScore?.score.toString() || '');
                  setSelectedMonth(new Date().toISOString().substring(0, 7));
                  setModalVisible(true);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.bureauCardLeft}>
                  <View
                    style={[
                      styles.bureauIcon,
                      {
                        backgroundColor: hasScore
                          ? `${getScoreColor(latestScore.score, bureau)}20`
                          : `${colors.text.tertiary}20`,
                      },
                    ]}
                  >
                    <Ionicons
                      name={hasScore ? 'checkmark-circle' : 'add-circle-outline'}
                      size={24}
                      color={
                        hasScore ? getScoreColor(latestScore.score, bureau) : colors.text.tertiary
                      }
                    />
                  </View>
                  <View style={styles.bureauInfo}>
                    <Text style={[styles.bureauName, { color: colors.text.primary }]}>
                      {bureau}
                    </Text>
                    {hasScore && (
                      <View style={styles.bureauSubInfo}>
                        <Text style={[styles.bureauDate, { color: colors.text.secondary }]}>
                          {new Date(latestScore.date).toLocaleDateString('en-GB', {
                            month: 'short',
                            year: 'numeric',
                          })}
                        </Text>
                        {history && history.scores.length > 1 && (
                          <Text style={[styles.bureauHistory, { color: colors.text.tertiary }]}>
                            • {history.scores.length} months
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                </View>

                {hasScore ? (
                  <View style={styles.bureauScoreContainer}>
                    <View style={styles.scoreWithChange}>
                      <Text
                        style={[
                          styles.bureauScore,
                          { color: getScoreColor(latestScore.score, bureau) },
                        ]}
                      >
                        {latestScore.score}
                      </Text>
                      {scoreChange !== null && scoreChange !== 0 ? (
                        <View style={styles.changeIndicator}>
                          <Ionicons
                            name={scoreChange > 0 ? 'arrow-up' : 'arrow-down'}
                            size={14}
                            color={scoreChange > 0 ? '#10B981' : '#EF4444'}
                          />
                          <Text
                            style={[
                              styles.changeText,
                              { color: scoreChange > 0 ? '#10B981' : '#EF4444' },
                            ]}
                          >
                            {Math.abs(scoreChange)}
                          </Text>
                        </View>
                      ) : (
                        <View style={[styles.changeIndicator, { backgroundColor: 'transparent' }]}>
                          <Text
                            style={[
                              styles.changeText,
                              { color: colors.text.tertiary },
                            ]}
                          >
                            —
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.bureauRating,
                        { color: getScoreColor(latestScore.score, bureau) },
                      ]}
                    >
                      {getScoreRating(latestScore.score, bureau)}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.addScoreButton}>
                    <Text style={[styles.addScoreText, { color: colors.primary.main }]}>
                      Add Score
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color={colors.primary.main} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Score History Section */}
        {bureauHistories.some(bh => bh.scores.length > 1) && (
          <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
            <View style={styles.sectionHeaderWithIcon}>
              <View style={[styles.sectionIconContainer, { backgroundColor: `${colors.primary.main}15` }]}>
                <Ionicons name="trending-up-outline" size={20} color={colors.primary.main} />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Score History
              </Text>
            </View>

            {bureaus.map((bureau) => {
              const history = getBureauHistory(bureau);
              if (!history || history.scores.length <= 1) return null;

              const maxScore = BUREAU_CONFIGS[bureau].maxScore;
              const scores = history.scores.slice().reverse(); // Oldest first for chart

              return (
                <View key={bureau} style={styles.historySection}>
                  <Text style={[styles.historyBureauTitle, { color: colors.text.primary }]}>
                    {bureau}
                  </Text>

                  {/* Line chart visualization */}
                  <ScrollView
                    ref={(ref) => {
                      // Auto-scroll to end when component mounts
                      if (ref) {
                        setTimeout(() => {
                          ref.scrollToEnd({ animated: true });
                        }, 100);
                      }
                    }}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chartScrollContent}
                    style={styles.chartScroll}
                  >
                    <View style={[styles.chartContainer, { width: Math.max(400, scores.length * 100) }]}>
                      {/* Calculate min and max scores for better scaling */}
                      {(() => {
                        const allScores = scores.map(s => s.score);
                        const minScore = Math.min(...allScores);
                        const maxChartScore = Math.max(...allScores);
                        const scoreRange = maxChartScore - minScore;
                        const padding = scoreRange > 0 ? scoreRange * 0.2 : 50; // 20% padding or 50 if no range
                        const chartMin = Math.max(0, Math.floor(minScore - padding));
                        const chartMax = Math.min(maxScore, Math.ceil(maxChartScore + padding));
                        const chartRange = chartMax - chartMin;

                        return (
                          <>
                            {/* Grid lines only - no Y-axis labels */}
                            <View style={styles.yAxisContainer}>
                              {[0, 1, 2, 3].map((index) => (
                                <View key={index} style={styles.yAxisLine}>
                                  <View style={[styles.gridLine, { backgroundColor: colors.border.light }]} />
                                </View>
                              ))}
                            </View>

                            {/* Line chart with connecting lines */}
                            <View style={styles.lineChartContainer}>
                              {/* Connecting lines */}
                              {scores.map((entry, index) => {
                                if (index === scores.length - 1) return null; // Skip last point (no line after it)

                                const currentPercentage = ((entry.score - chartMin) / chartRange) * 100;
                                const nextEntry = scores[index + 1];
                                const nextPercentage = ((nextEntry.score - chartMin) / chartRange) * 100;

                                const currentY = 160 - (currentPercentage / 100) * 160;
                                const nextY = 160 - (nextPercentage / 100) * 160;
                                const currentX = index * 100 + 50; // Center of point
                                const nextX = (index + 1) * 100 + 50;

                                const dx = nextX - currentX;
                                const dy = nextY - currentY;
                                const lineLength = Math.sqrt(dx * dx + dy * dy);
                                const angle = Math.atan2(dy, dx) * (180 / Math.PI);

                                return (
                                  <View
                                    key={`${bureau}-line-${index}`}
                                    style={[
                                      styles.connectingLine,
                                      {
                                        position: 'absolute',
                                        left: currentX,
                                        top: currentY,
                                        width: lineLength,
                                        height: 3,
                                        backgroundColor: colors.primary.main,
                                        transform: [{ rotate: `${angle}deg` }],
                                        transformOrigin: 'left center',
                                      }
                                    ]}
                                  />
                                );
                              })}

                              {/* Data points with circles and labels */}
                              {scores.map((entry, index) => {
                                const percentage = ((entry.score - chartMin) / chartRange) * 100;
                                const yPosition = 160 - (percentage / 100) * 160;
                                const isLatest = index === scores.length - 1;
                                const scoreColor = getScoreColor(entry.score, bureau);

                                return (
                                  <View
                                    key={`${bureau}-${entry.date}-${index}`}
                                    style={[
                                      styles.dataPoint,
                                      {
                                        left: index * 100 + 50, // Center of column
                                        top: 0,
                                      }
                                    ]}
                                  >
                                    {/* Score label above dot */}
                                    <View style={{
                                      position: 'absolute',
                                      top: yPosition - 30,
                                      alignItems: 'center',
                                      width: 60,
                                      left: -30,
                                    }}>
                                      <Text
                                        style={[
                                          styles.scoreLabel,
                                          {
                                            color: isLatest ? scoreColor : colors.text.secondary,
                                            fontWeight: isLatest ? '800' : '700',
                                          }
                                        ]}
                                        numberOfLines={1}
                                      >
                                        {entry.score}
                                      </Text>
                                    </View>

                                    {/* Circular data point */}
                                    <View
                                      style={[
                                        styles.dataCircle,
                                        {
                                          position: 'absolute',
                                          top: yPosition - 8,
                                          left: -8,
                                          backgroundColor: scoreColor,
                                          borderColor: colors.background.secondary,
                                          transform: [{ scale: isLatest ? 1.2 : 1 }],
                                        }
                                      ]}
                                    />

                                    {/* Month label below chart area */}
                                    <View style={{
                                      position: 'absolute',
                                      top: 165,
                                      alignItems: 'center',
                                      width: 60,
                                      left: -30,
                                    }}>
                                      <Text
                                        style={[
                                          styles.monthLabel,
                                          {
                                            color: colors.text.tertiary,
                                            fontWeight: isLatest ? '700' : '500',
                                          }
                                        ]}
                                        numberOfLines={1}
                                      >
                                        {new Date(entry.date).toLocaleDateString('en-GB', {
                                          month: 'short',
                                        })}
                                      </Text>
                                    </View>
                                  </View>
                                );
                              })}
                            </View>
                          </>
                        );
                      })()}
                    </View>
                  </ScrollView>
                </View>
              );
            })}
          </View>
        )}

        {/* Credit Score Ranges Education - Bureau Specific */}
        <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
          <TouchableOpacity
            style={styles.sectionHeaderWithIcon}
            onPress={() => setShowScoreRanges(!showScoreRanges)}
            activeOpacity={0.7}
          >
            <View style={[styles.sectionIconContainer, { backgroundColor: `${colors.primary.main}15` }]}>
              <Ionicons name="school-outline" size={20} color={colors.primary.main} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text.primary, flex: 1 }]}>
              Score Ranges
            </Text>
            <Ionicons
              name={showScoreRanges ? 'chevron-up' : 'chevron-down'}
              size={24}
              color={colors.text.secondary}
            />
          </TouchableOpacity>

          {showScoreRanges && (
            <View style={styles.rangesList}>
              {['Excellent', 'Good', 'Fair', 'Poor', 'Very Poor'].map((rating) => {
                // Get ranges from all bureaus for this rating
                const transUnionRange = BUREAU_CONFIGS.TransUnion.ranges.find(r => r.rating === rating);
                const experianRange = BUREAU_CONFIGS.Experian.ranges.find(r => r.rating === rating);
                const equifaxRange = BUREAU_CONFIGS.Equifax.ranges.find(r => r.rating === rating);

                const color = transUnionRange?.color || '#6B7280';

                const rangeDescriptions: Record<string, string> = {
                  'Excellent': 'Getting loans and credit is easiest with excellent credit. Lenders will offer you the best interest rates and terms. You\'re likely to be approved for most credit applications with premium benefits.',
                  'Good': 'Getting credit is straightforward with good credit. Most lenders will approve your applications with favorable terms, though not always the lowest rates. You have strong borrowing power.',
                  'Fair': 'Getting credit can be challenging with fair credit. You may be approved, but expect higher interest rates and less favorable terms. Focus on improving your score through timely payments.',
                  'Poor': 'Getting approved for credit is difficult with poor credit. You may face frequent rejections and will likely receive high interest rates if approved. Consider secured credit cards to rebuild.',
                  'Very Poor': 'Getting any credit is very difficult. Most lenders will decline applications. Focus on rebuilding through secured cards, timely bill payments, and reducing existing debt.',
                };

                return (
                  <View key={rating} style={styles.rangeItemExpanded}>
                    <View style={styles.rangeItemHeader}>
                      <View style={[styles.rangeColor, { backgroundColor: color }]} />
                      <Text style={[styles.ratingTextLarge, { color: colors.text.primary }]}>
                        {rating}
                      </Text>
                    </View>

                    <View style={styles.bureauRangesRow}>
                      {transUnionRange && (
                        <Text style={[styles.bureauRangeText, { color: colors.text.secondary }]}>
                          <Text style={{ fontWeight: '600' }}>TransUnion:</Text> {transUnionRange.min}-{transUnionRange.max}
                        </Text>
                      )}
                      {experianRange && (
                        <Text style={[styles.bureauRangeText, { color: colors.text.secondary }]}>
                          <Text style={{ fontWeight: '600' }}>Experian:</Text> {experianRange.min}-{experianRange.max}
                        </Text>
                      )}
                      {equifaxRange && (
                        <Text style={[styles.bureauRangeText, { color: colors.text.secondary }]}>
                          <Text style={{ fontWeight: '600' }}>Equifax:</Text> {equifaxRange.min}-{equifaxRange.max}
                        </Text>
                      )}
                    </View>

                    <Text style={[styles.rangeDescription, { color: colors.text.secondary }]}>
                      {rangeDescriptions[rating]}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Credit Factors */}
        <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
          <View style={styles.sectionHeaderWithIcon}>
            <View style={[styles.sectionIconContainer, { backgroundColor: `${colors.primary.main}15` }]}>
              <Ionicons name="analytics-outline" size={20} color={colors.primary.main} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Key Factors
            </Text>
          </View>

          <View style={styles.factorsList}>
            {[
              {
                icon: 'calendar-outline',
                title: 'Payment History',
                description: 'Most important factor - pay bills on time',
              },
              {
                icon: 'trending-down-outline',
                title: 'Credit Utilization',
                description: 'Keep usage below 30% of available credit',
              },
              {
                icon: 'time-outline',
                title: 'Credit History Length',
                description: 'Longer credit history is better',
              },
              {
                icon: 'albums-outline',
                title: 'Credit Mix',
                description: 'Different types of credit accounts',
              },
              {
                icon: 'search-outline',
                title: 'Recent Inquiries',
                description: 'Avoid too many hard credit checks',
              },
            ].map((factor, index) => (
              <View key={index} style={styles.factorItem}>
                <View
                  style={[
                    styles.factorIcon,
                    { backgroundColor: `${colors.primary.main}15` },
                  ]}
                >
                  <Ionicons name={factor.icon as any} size={20} color={colors.primary.main} />
                </View>
                <View style={styles.factorContent}>
                  <Text style={[styles.factorTitle, { color: colors.text.primary }]}>
                    {factor.title}
                  </Text>
                  <Text style={[styles.factorDescription, { color: colors.text.secondary }]}>
                    {factor.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Final Disclaimer */}
        <View style={[styles.disclaimer, { backgroundColor: `${colors.warning.main}10` }]}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.warning.main} />
          <Text style={[styles.disclaimerText, { color: colors.text.secondary }]}>
            Always consult FCA-authorized financial advisors for personal advice. Visit
            MoneyHelper.org.uk for free, impartial guidance.
          </Text>
        </View>
      </ScrollView>

      {/* Add/Edit Score Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        presentationStyle="overFullScreen"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          >
            <TouchableOpacity
              style={[styles.modalContent, { backgroundColor: colors.background.primary }]}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
            {/* Modal Handle */}
            <View style={styles.modalHandle}>
              <View style={[styles.modalHandleLine, { backgroundColor: colors.text.tertiary }]} />
            </View>

            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                  {selectedBureau} Score
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.text.secondary }]}>
                  {getLatestScoreForBureau(selectedBureau) ? 'Update existing score' : 'Add new score'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close-circle" size={28} color={colors.text.tertiary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {/* Month Selector */}
              <Text style={[styles.inputLabel, { color: colors.text.primary }]}>
                Month
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.monthSelector}
                contentContainerStyle={styles.monthSelectorContent}
              >
                {getAvailableMonths().map((month) => {
                  const isSelected = month.value === selectedMonth;
                  const history = getBureauHistory(selectedBureau);
                  const hasScoreForMonth = history?.scores.some(
                    (s) => s.monthYear === month.value
                  );

                  return (
                    <TouchableOpacity
                      key={month.value}
                      style={[
                        styles.monthChip,
                        {
                          backgroundColor: isSelected
                            ? colors.primary.main
                            : colors.background.secondary,
                          borderWidth: hasScoreForMonth ? 1 : 0,
                          borderColor: hasScoreForMonth ? colors.success.main : 'transparent',
                        },
                      ]}
                      onPress={() => {
                        setSelectedMonth(month.value);
                        // Pre-fill score if exists for this month
                        const existingScore = history?.scores.find(
                          (s) => s.monthYear === month.value
                        );
                        setScoreInput(existingScore?.score.toString() || '');
                      }}
                    >
                      <Text
                        style={[
                          styles.monthChipText,
                          {
                            color: isSelected
                              ? '#FFFFFF'
                              : colors.text.primary,
                          },
                        ]}
                      >
                        {month.label}
                      </Text>
                      {hasScoreForMonth && !isSelected && (
                        <View style={[styles.scoreDot, { backgroundColor: colors.success.main }]} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Score Input */}
              <Text style={[styles.inputLabel, { color: colors.text.primary, marginTop: spacing.lg }]}>
                Score (0-{BUREAU_CONFIGS[selectedBureau].maxScore})
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background.secondary,
                    color: colors.text.primary,
                    borderColor: colors.border.light,
                  },
                ]}
                value={scoreInput}
                onChangeText={setScoreInput}
                keyboardType="number-pad"
                placeholder="Enter your credit score"
                placeholderTextColor={colors.text.tertiary}
                maxLength={3}
              />

              <View style={[styles.modalInfo, { backgroundColor: `${colors.primary.main}15` }]}>
                <Ionicons name="information-circle-outline" size={20} color={colors.primary.main} />
                <Text style={[styles.modalInfoText, { color: colors.text.secondary }]}>
                  You can find your credit score on {selectedBureau}&apos;s website or through credit
                  monitoring services.
                </Text>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border.medium }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text.primary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary.main }]}
                onPress={handleAddScore}
              >
                <Text style={styles.saveButtonText}>Save Score</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerSpacer: {
    width: 40,
  },
  aiButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },

  // Disclaimer
  disclaimer: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },

  // Scores Section
  scoresSection: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  sectionHeaderWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },

  // Bureau Cards
  bureauCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderRadius: 16,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  bureauCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  bureauIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bureauInfo: {
    flex: 1,
  },
  bureauName: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  bureauSubInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bureauDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  bureauHistory: {
    fontSize: 11,
    fontWeight: '500',
  },
  scoreWithChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  changeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  bureauScoreContainer: {
    alignItems: 'flex-end',
  },
  bureauScore: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 3,
    letterSpacing: -0.5,
  },
  bureauRating: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  addScoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addScoreText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Section
  section: {
    borderRadius: 16,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },

  // History Section
  historySection: {
    marginBottom: spacing.xl,
  },
  historyBureauTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: spacing.lg,
    letterSpacing: 0.3,
  },

  // Line Chart Styles
  chartScroll: {
    marginBottom: spacing.lg,
  },
  chartScrollContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  chartContainer: {
    height: 240,
    position: 'relative',
  },
  yAxisContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 160,
    justifyContent: 'space-between',
  },
  yAxisLine: {
    width: '100%',
    height: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridLine: {
    width: '100%',
    height: 1,
    opacity: 0.1,
  },
  lineChartContainer: {
    position: 'relative',
    height: 160,
    marginTop: 0,
    paddingHorizontal: 10,
  },
  connectingLine: {
    opacity: 0.8,
  },
  dataPoint: {
    position: 'absolute',
    width: 1,
    height: 1,
  },
  dataCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  monthLabel: {
    fontSize: 11,
    fontWeight: '500',
  },

  // Ranges List
  bureauRangesSection: {
    marginBottom: spacing.lg,
  },
  bureauRangesTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.md,
    letterSpacing: 0.2,
  },
  rangesList: {
    gap: spacing.sm,
  },
  rangeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: borderRadius.md,
  },
  rangeItemExpanded: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  rangeItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rangeColor: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  rangeText: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    letterSpacing: 0.2,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  ratingTextLarge: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  bureauRangesRow: {
    gap: spacing.xs,
    paddingLeft: 32,
  },
  bureauRangeText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  rangeDescription: {
    fontSize: 13,
    lineHeight: 19,
    paddingLeft: 32,
    fontWeight: '500',
    marginTop: spacing.xs,
  },

  // Factors List
  factorsList: {
    gap: spacing.md,
  },
  factorItem: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.sm,
  },
  factorIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  factorContent: {
    flex: 1,
    justifyContent: 'center',
  },
  factorTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  factorDescription: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
    padding: 0,
  },
  modalContent: {
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl + 20,
    paddingTop: spacing.sm,
  },
  modalHandle: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  modalHandleLine: {
    width: 40,
    height: 4,
    borderRadius: 2,
    opacity: 0.3,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  modalCloseButton: {
    marginLeft: spacing.sm,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  modalSubtitle: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  modalBody: {
    marginBottom: spacing.xl,
  },
  monthSelector: {
    marginBottom: spacing.md,
  },
  monthSelectorContent: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  monthChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  monthChipText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  scoreDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: spacing.sm,
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 2,
    borderRadius: 14,
    padding: spacing.lg,
    fontSize: 18,
    marginBottom: spacing.lg,
    fontWeight: '600',
  },
  modalInfo: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
  },
  modalInfoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 2,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  saveButton: {
    // backgroundColor set dynamically
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  // AI Insight Card
  aiInsightCard: {
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  aiInsightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  aiInsightHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  aiInsightHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  aiInsightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiInsightTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  aiInsightCached: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  aiInsightBrief: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  aiInsightBody: {
    marginTop: spacing.md,
    gap: spacing.lg,
  },
  aiInsightSection: {
    gap: spacing.sm,
  },
  aiInsightSubtitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  aiInsightText: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },
  recommendationItem: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  recommendationBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
  },
  recommendationText: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    flex: 1,
  },
  factorCard: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  factorCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  factorCardName: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
    flex: 1,
  },
  factorStatusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 6,
  },
  factorStatusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  factorCardImpact: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
});
