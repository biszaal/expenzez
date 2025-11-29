import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../auth/AuthContext';
import { spacing, borderRadius } from '../../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

type CreditBureau = 'TransUnion' | 'Experian' | 'Equifax';

interface CreditScoreEntry {
  score: number;
  date: string;
  monthYear: string;
}

interface BureauHistory {
  bureau: CreditBureau;
  scores: CreditScoreEntry[];
  latestScore?: CreditScoreEntry; // Optional for backward compatibility
}

interface CreditScoreHistory {
  bureaus?: BureauHistory[];
  scores?: any[]; // Old format for migration
}

const CREDIT_SCORE_STORAGE_KEY = '@expenzez:credit_scores';

// Bureau-specific configurations
const BUREAU_CONFIGS: Record<CreditBureau, { maxScore: number }> = {
  TransUnion: { maxScore: 710 },
  Experian: { maxScore: 999 },
  Equifax: { maxScore: 700 },
};

export default function FinancialHealthScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [bureauHistories, setBureauHistories] = useState<BureauHistory[]>([]);

  // Load credit scores from storage
  const loadCreditScores = async () => {
    try {
      const stored = await AsyncStorage.getItem(`${CREDIT_SCORE_STORAGE_KEY}:${user?.userId}`);
      if (stored) {
        const data: CreditScoreHistory = JSON.parse(stored);

        // Handle both old and new formats
        if (data.bureaus) {
          setBureauHistories(data.bureaus);
        } else if (data.scores) {
          // Migrate old format
          const migratedBureaus: BureauHistory[] = data.scores.map((oldScore: any) => ({
            bureau: oldScore.bureau,
            scores: [{
              score: oldScore.score,
              date: oldScore.lastUpdated || new Date().toISOString(),
              monthYear: new Date(oldScore.lastUpdated || new Date()).toISOString().substring(0, 7),
            }],
          }));
          setBureauHistories(migratedBureaus);
        }
      }
    } catch (error) {
      console.error('Error loading credit scores:', error);
    }
  };

  // Reload scores when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadCreditScores();
    }, [user?.userId])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCreditScores();
    setTimeout(() => setRefreshing(false), 500);
  };

  const getLatestScoreForBureau = (bureau: CreditBureau): CreditScoreEntry | undefined => {
    const bureauHistory = bureauHistories.find((b) => b.bureau === bureau);
    if (!bureauHistory || bureauHistory.scores.length === 0) return undefined;
    return bureauHistory.scores[0];
  };

  const getScoreChange = (bureau: CreditBureau): number | null => {
    const bureauHistory = bureauHistories.find((b) => b.bureau === bureau);
    if (!bureauHistory || bureauHistory.scores.length < 2) return null;
    return bureauHistory.scores[0].score - bureauHistory.scores[1].score;
  };

  const getScoreColor = (score: number, bureau: CreditBureau): string => {
    const maxScore = BUREAU_CONFIGS[bureau].maxScore;
    const percentage = (score / maxScore) * 100;

    if (percentage >= 88) return '#10B981'; // Excellent (green)
    if (percentage >= 75) return '#3B82F6'; // Good (blue)
    if (percentage >= 60) return '#F59E0B'; // Fair (orange)
    if (percentage >= 45) return '#EF4444'; // Poor (red)
    return '#DC2626'; // Very Poor (dark red)
  };

  const getAverageScore = (): { score: number; color: string } | null => {
    if (bureauHistories.length === 0) return null;

    // Calculate weighted average based on latest scores
    let totalWeightedScore = 0;

    bureauHistories.forEach((bh) => {
      if (bh.scores.length > 0) {
        const latestScore = bh.scores[0].score;
        const maxScore = BUREAU_CONFIGS[bh.bureau].maxScore;
        const normalizedScore = (latestScore / maxScore) * 100;
        totalWeightedScore += normalizedScore;
      }
    });

    const averagePercentage = totalWeightedScore / bureauHistories.length;

    // Get color based on average percentage
    let color = '#DC2626';
    if (averagePercentage >= 88) color = '#10B981';
    else if (averagePercentage >= 75) color = '#3B82F6';
    else if (averagePercentage >= 60) color = '#F59E0B';
    else if (averagePercentage >= 45) color = '#EF4444';

    return { score: Math.round(averagePercentage), color };
  };

  const hasScores = bureauHistories.length > 0 && bureauHistories.some(b => b.scores.length > 0);
  const averageScore = getAverageScore();

  const openExternalLink = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Financial Health
          </Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            Track your credit score and financial wellness
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Credit Score Card */}
        <TouchableOpacity
          style={[styles.creditScoreCard, { backgroundColor: colors.background.secondary }]}
          onPress={() => router.push('/credit-score')}
          activeOpacity={0.7}
        >
          <View style={styles.creditScoreHeader}>
            <View style={styles.creditScoreLeft}>
              <View style={[styles.creditScoreIcon, { backgroundColor: hasScores ? `${averageScore?.color}20` : `${colors.primary.main}20` }]}>
                <Ionicons name="analytics" size={28} color={hasScores ? averageScore?.color : colors.primary.main} />
              </View>
              <View>
                <Text style={[styles.creditScoreTitle, { color: colors.text.primary }]}>
                  Credit Score
                </Text>
                <Text style={[styles.creditScoreSubtitle, { color: colors.text.secondary }]}>
                  {hasScores ? `${bureauHistories.length} bureau${bureauHistories.length > 1 ? 's' : ''} tracked` : 'Tap to view details'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.text.tertiary} />
          </View>

          {hasScores ? (
            <>
              <View style={styles.creditScoreBody}>
                <View style={styles.scoresGrid}>
                  {bureauHistories.map((bh) => {
                    const latestScore = bh.scores?.[0] || bh.latestScore;
                    if (!latestScore) return null; // Skip if no score available

                    const scoreChange = getScoreChange(bh.bureau);

                    return (
                      <View key={bh.bureau} style={styles.scoreItem}>
                        <Text style={[styles.scoreBureauName, { color: colors.text.secondary }]}>
                          {bh.bureau}
                        </Text>
                        <View style={styles.scoreWithTrend}>
                          <Text style={[styles.scoreValue, { color: getScoreColor(latestScore.score, bh.bureau) }]}>
                            {latestScore.score}
                          </Text>
                          {scoreChange !== null && scoreChange !== 0 && (
                            <View style={[styles.trendBadge, { backgroundColor: scoreChange > 0 ? '#10B98110' : '#EF444410' }]}>
                              <Ionicons
                                name={scoreChange > 0 ? 'trending-up' : 'trending-down'}
                                size={12}
                                color={scoreChange > 0 ? '#10B981' : '#EF4444'}
                              />
                              <Text style={[styles.trendText, { color: scoreChange > 0 ? '#10B981' : '#EF4444' }]}>
                                {Math.abs(scoreChange)}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.scoreMax, { color: colors.text.tertiary }]}>
                          / {BUREAU_CONFIGS[bh.bureau].maxScore}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.updateScoreButton, { backgroundColor: colors.background.primary, borderWidth: 1, borderColor: colors.border.light }]}
                onPress={() => router.push('/credit-score')}
                activeOpacity={0.8}
              >
                <Ionicons name="pencil-outline" size={20} color={colors.primary.main} />
                <Text style={[styles.updateScoreButtonText, { color: colors.primary.main }]}>
                  Update Scores
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.creditScoreBody}>
                <Text style={[styles.creditScorePlaceholder, { color: colors.text.tertiary }]}>
                  No credit score entered yet
                </Text>
                <Text style={[styles.creditScoreHint, { color: colors.text.secondary }]}>
                  Track your credit score to get personalized education
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.updateScoreButton, { backgroundColor: colors.primary.main }]}
                onPress={() => router.push('/credit-score')}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
                <Text style={[styles.updateScoreButtonText, { color: '#FFFFFF' }]}>
                  Add Credit Score
                </Text>
              </TouchableOpacity>
            </>
          )}
        </TouchableOpacity>

        {/* AI Credit Education Card */}
        <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="school-outline" size={24} color={colors.primary.main} />
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Credit Education
            </Text>
          </View>
          <Text style={[styles.sectionDescription, { color: colors.text.secondary }]}>
            Learn about credit score factors, improvement strategies, and financial wellness principles.
          </Text>
          <TouchableOpacity
            style={[styles.sectionButton, { borderColor: colors.primary.main }]}
            onPress={() => router.push('/credit-score')}
            activeOpacity={0.7}
          >
            <Text style={[styles.sectionButtonText, { color: colors.primary.main }]}>
              Start Learning
            </Text>
            <Ionicons name="arrow-forward" size={18} color={colors.primary.main} />
          </TouchableOpacity>
        </View>

        {/* Financial Overview */}
        <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="stats-chart-outline" size={24} color={colors.primary.main} />
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Financial Overview
            </Text>
          </View>

          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={[styles.metricLabel, { color: colors.text.secondary }]}>
                Net Worth
              </Text>
              <Text style={[styles.metricValue, { color: colors.text.primary }]}>
                —
              </Text>
              <Text style={[styles.metricHint, { color: colors.text.tertiary }]}>
                Coming soon
              </Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={[styles.metricLabel, { color: colors.text.secondary }]}>
                Total Debt
              </Text>
              <Text style={[styles.metricValue, { color: colors.text.primary }]}>
                —
              </Text>
              <Text style={[styles.metricHint, { color: colors.text.tertiary }]}>
                Coming soon
              </Text>
            </View>
          </View>
        </View>

        {/* External Resources */}
        <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="link-outline" size={24} color={colors.primary.main} />
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Helpful Resources
            </Text>
          </View>
          <Text style={[styles.sectionDescription, { color: colors.text.secondary }]}>
            Free UK financial guidance from trusted sources
          </Text>

          <TouchableOpacity
            style={styles.resourceLink}
            onPress={() => openExternalLink('https://www.moneyhelper.org.uk')}
            activeOpacity={0.7}
          >
            <View style={styles.resourceLeft}>
              <Ionicons name="open-outline" size={20} color={colors.primary.main} />
              <View style={styles.resourceText}>
                <Text style={[styles.resourceTitle, { color: colors.text.primary }]}>
                  Money Helper
                </Text>
                <Text style={[styles.resourceDescription, { color: colors.text.secondary }]}>
                  Free, impartial financial guidance
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resourceLink}
            onPress={() => openExternalLink('https://www.citizensadvice.org.uk')}
            activeOpacity={0.7}
          >
            <View style={styles.resourceLeft}>
              <Ionicons name="open-outline" size={20} color={colors.primary.main} />
              <View style={styles.resourceText}>
                <Text style={[styles.resourceTitle, { color: colors.text.primary }]}>
                  Citizens Advice
                </Text>
                <Text style={[styles.resourceDescription, { color: colors.text.secondary }]}>
                  Free advice on credit and debt
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resourceLink}
            onPress={() => openExternalLink('https://www.stepchange.org')}
            activeOpacity={0.7}
          >
            <View style={styles.resourceLeft}>
              <Ionicons name="open-outline" size={20} color={colors.primary.main} />
              <View style={styles.resourceText}>
                <Text style={[styles.resourceTitle, { color: colors.text.primary }]}>
                  StepChange
                </Text>
                <Text style={[styles.resourceDescription, { color: colors.text.secondary }]}>
                  Free debt advice charity
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        {/* Disclaimer */}
        <View style={[styles.disclaimer, { backgroundColor: `${colors.warning.main}10` }]}>
          <Ionicons name="information-circle-outline" size={20} color={colors.warning.main} />
          <Text style={[styles.disclaimerText, { color: colors.text.secondary }]}>
            Expenzez provides educational content only. We are not FCA-authorized financial advisors.
            Consult a qualified professional for personal financial advice.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },

  // Credit Score Card
  creditScoreCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  creditScoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  creditScoreLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  creditScoreIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  creditScoreTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  creditScoreSubtitle: {
    fontSize: 13,
  },
  creditScoreBody: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  creditScorePlaceholder: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 6,
  },
  creditScoreHint: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  scoresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
  },
  scoreItem: {
    alignItems: 'center',
    minWidth: 80,
  },
  scoreBureauName: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  scoreWithTrend: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 36,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '600',
  },
  scoreMax: {
    fontSize: 11,
    marginTop: 2,
  },
  updateScoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  updateScoreButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Section Card
  section: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  sectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
  },
  sectionButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  metricLabel: {
    fontSize: 13,
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  metricHint: {
    fontSize: 11,
  },

  // Resource Links
  resourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  resourceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  resourceText: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  resourceDescription: {
    fontSize: 13,
  },

  // Disclaimer
  disclaimer: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
    marginTop: spacing.sm,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
});
