import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { useTheme } from "../../contexts/ThemeContext";
import {
  costOfLivingService,
  CostOfLivingAnalysis,
  CategorySpending,
} from "../../services/costOfLivingService";
import { TransactionService, Transaction } from "../../services/transactionService";
import { spacing, borderRadius } from "../../constants/theme";

interface CostOfLivingWidgetProps {
  transactions?: Transaction[];
  onViewDetails?: () => void;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const CostOfLivingWidget: React.FC<CostOfLivingWidgetProps> = ({
  transactions,
  onViewDetails,
}) => {
  const { colors } = useTheme();
  const [analysis, setAnalysis] = useState<CostOfLivingAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [animatedScore] = useState(new Animated.Value(0));

  const loadAnalysis = useCallback(async () => {
    try {
      setLoading(true);
      let txns = transactions;
      if (!txns) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        txns = await TransactionService.getTransactionsByDateRange(startOfMonth, now);
      }
      const result = await costOfLivingService.analyzeCurrentMonth(txns);
      setAnalysis(result);

      // Animate score
      Animated.timing(animatedScore, {
        toValue: result.score,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    } catch (error) {
      console.error("Error loading Cost of Living analysis:", error);
    } finally {
      setLoading(false);
    }
  }, [transactions, animatedScore]);

  useEffect(() => {
    loadAnalysis();
  }, [loadAnalysis]);

  useFocusEffect(
    useCallback(() => {
      loadAnalysis();
    }, [loadAnalysis])
  );

  const formatCurrency = (amount: number) => {
    return `£${amount.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;
  };

  const handlePress = () => {
    if (onViewDetails) {
      onViewDetails();
    } else {
      router.push("/cost-of-living" as any);
    }
  };

  const getScoreGradient = (score: number): { start: string; end: string } => {
    if (score >= 80) return { start: "#10B981", end: "#059669" }; // Emerald
    if (score >= 60) return { start: "#84CC16", end: "#65A30D" }; // Lime
    if (score >= 40) return { start: "#F59E0B", end: "#D97706" }; // Amber
    if (score >= 20) return { start: "#F97316", end: "#EA580C" }; // Orange
    return { start: "#EF4444", end: "#DC2626" }; // Red
  };

  const renderCircularProgress = (score: number) => {
    const size = 100;
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const progress = (score / 100) * circumference;
    const gradient = getScoreGradient(score);

    return (
      <View style={styles.progressContainer}>
        <Svg width={size} height={size} style={styles.progressSvg}>
          <Defs>
            <LinearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={gradient.start} />
              <Stop offset="100%" stopColor={gradient.end} />
            </LinearGradient>
          </Defs>
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.gray[100]}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#scoreGradient)"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${progress} ${circumference}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={styles.scoreTextOverlay}>
          <Text style={[styles.scoreNumber, { color: colors.text.primary }]}>
            {score}
          </Text>
        </View>
      </View>
    );
  };

  const renderCategoryBar = (category: CategorySpending, index: number) => {
    const percentage = Math.min(category.percentageOfAverage, 150);
    const barWidth = (percentage / 150) * 100;
    const isOverBudget = category.percentageOfAverage > 100;

    return (
      <View key={category.category} style={styles.categoryRow}>
        <View style={styles.categoryInfo}>
          <View style={[styles.categoryIndicator, { backgroundColor: category.color }]} />
          <Text style={[styles.categoryLabel, { color: colors.text.primary }]} numberOfLines={1}>
            {category.label}
          </Text>
        </View>
        <View style={styles.categoryBarSection}>
          <View style={[styles.barTrack, { backgroundColor: colors.gray[100] }]}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${barWidth}%`,
                  backgroundColor: isOverBudget ? "#EF4444" : category.color,
                },
              ]}
            />
            {/* Average marker at 66.67% (100/150) */}
            <View style={[styles.averageLine, { backgroundColor: colors.gray[400] }]} />
          </View>
        </View>
        <Text style={[styles.categoryAmount, { color: colors.text.secondary }]}>
          {formatCurrency(category.userSpending)}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="small" color={colors.primary.main} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            Analyzing spending...
          </Text>
        </View>
      </View>
    );
  }

  if (!analysis) {
    return null;
  }

  // Check if user has any categorized spending
  const hasCategories = analysis.categoryBreakdown.some(c => c.userSpending > 0);
  const hasSpending = analysis.totalUserSpending > 0;

  const scoreGradient = getScoreGradient(analysis.score);
  const savingsPercent = analysis.overallPercentage < 100
    ? 100 - analysis.overallPercentage
    : 0;
  const overspendPercent = analysis.overallPercentage > 100
    ? analysis.overallPercentage - 100
    : 0;

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.background.primary }]}
      onPress={handlePress}
      activeOpacity={0.95}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Cost of Living
          </Text>
          <Text style={[styles.subtitle, { color: colors.text.tertiary }]}>
            vs UK Average
          </Text>
        </View>
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            setIsMinimized(!isMinimized);
          }}
          style={styles.toggleButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons
            name={isMinimized ? "chevron-down" : "chevron-up"}
            size={20}
            color={colors.text.tertiary}
          />
        </TouchableOpacity>
      </View>

      {!isMinimized && (
        <>
          {/* Score Section */}
          <View style={styles.scoreSection}>
            {renderCircularProgress(analysis.score)}

            <View style={styles.scoreDetails}>
              <View style={styles.scoreLabelRow}>
                <Text style={[styles.scoreLabel, { color: scoreGradient.start }]}>
                  {analysis.scoreThreshold.label}
                </Text>
              </View>

              <Text style={[styles.comparisonText, { color: colors.text.secondary }]}>
                {savingsPercent > 0
                  ? `${savingsPercent}% below average`
                  : overspendPercent > 0
                    ? `${overspendPercent}% above average`
                    : "At average"
                }
              </Text>

              <View style={styles.amountComparison}>
                <Text style={[styles.userAmount, { color: colors.text.primary }]}>
                  {formatCurrency(analysis.totalUserSpending)}
                </Text>
                <Text style={[styles.vsText, { color: colors.text.tertiary }]}> vs </Text>
                <Text style={[styles.avgAmount, { color: colors.text.tertiary }]}>
                  {formatCurrency(analysis.totalNationalAverage)}
                </Text>
              </View>
            </View>
          </View>

          {/* Category Breakdown */}
          <View style={styles.categoriesSection}>
            <Text style={[styles.sectionLabel, { color: colors.text.tertiary }]}>
              BREAKDOWN
            </Text>
            {hasCategories ? (
              analysis.categoryBreakdown
                .filter(c => c.userSpending > 0)
                .slice(0, 4)
                .map((category, index) => renderCategoryBar(category, index))
            ) : (
              <View style={styles.emptyCategories}>
                <Text style={[styles.emptyCategoriesText, { color: colors.text.tertiary }]}>
                  No spending detected in tracked categories yet.
                </Text>
                <Text style={[styles.emptyCategoriesHint, { color: colors.text.tertiary }]}>
                  Add transactions for Housing, Energy, Food, or Transport to see your breakdown.
                </Text>
              </View>
            )}
          </View>

          {/* Insight Banner */}
          {(analysis.insights.length > 0 || !hasCategories) && (
            <View style={[styles.insightBanner, { backgroundColor: colors.gray[50] }]}>
              <View style={[styles.insightIcon, { backgroundColor: scoreGradient.start + "15" }]}>
                <Ionicons name={hasCategories ? "sparkles" : "information-circle"} size={14} color={scoreGradient.start} />
              </View>
              <Text style={[styles.insightText, { color: colors.text.secondary }]} numberOfLines={2}>
                {hasCategories
                  ? analysis.insights[0]
                  : `Your score is calculated from ${analysis.period.daysInPeriod} days of spending data this month.`
                }
              </Text>
            </View>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerLink, { color: colors.primary.main }]}>
              View detailed analysis
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary.main} />
          </View>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: "hidden",
  },
  loadingContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "500",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 4,
  },
  headerLeft: {},
  title: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  toggleButton: {
    padding: 4,
  },
  scoreSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  progressContainer: {
    width: 100,
    height: 100,
    position: "relative",
    marginRight: 20,
  },
  progressSvg: {
    transform: [{ rotate: "0deg" }],
  },
  scoreTextOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  scoreNumber: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -1,
  },
  scoreDetails: {
    flex: 1,
  },
  scoreLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  scoreLabel: {
    fontSize: 18,
    fontWeight: "700",
  },
  comparisonText: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 8,
  },
  amountComparison: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  userAmount: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  vsText: {
    fontSize: 13,
    fontWeight: "500",
  },
  avgAmount: {
    fontSize: 15,
    fontWeight: "600",
  },
  categoriesSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryInfo: {
    flexDirection: "row",
    alignItems: "center",
    width: 110,
  },
  categoryIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  categoryBarSection: {
    flex: 1,
    marginHorizontal: 12,
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "visible",
    position: "relative",
  },
  barFill: {
    height: "100%",
    borderRadius: 3,
  },
  averageLine: {
    position: "absolute",
    left: "66.67%",
    top: -2,
    width: 1.5,
    height: 10,
    borderRadius: 1,
  },
  categoryAmount: {
    fontSize: 13,
    fontWeight: "600",
    width: 50,
    textAlign: "right",
  },
  insightBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 12,
    borderRadius: 10,
    gap: 10,
  },
  insightIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  insightText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.04)",
    gap: 4,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyCategories: {
    paddingVertical: 12,
    alignItems: "center",
  },
  emptyCategoriesText: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
  emptyCategoriesHint: {
    fontSize: 12,
    fontWeight: "400",
    textAlign: "center",
    marginTop: 4,
    opacity: 0.7,
  },
});
