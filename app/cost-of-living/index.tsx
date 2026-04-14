import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../contexts/ThemeContext";
import {
  costOfLivingService,
  CostOfLivingAnalysis,
  CategorySpending,
  MonthlyTrend,
} from "../../services/costOfLivingService";
import { TransactionService } from "../../services/transactionService";
import {
  UK_REGION_LABELS,
  UKRegion,
  ENERGY_PRICE_CAP_HISTORY,
  UK_INFLATION_RATES,
} from "../../constants/ukAverages";
import { spacing, borderRadius } from "../../constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function CostOfLivingDashboard() {
  const { colors } = useTheme();
  const router = useRouter();

  const [analysis, setAnalysis] = useState<CostOfLivingAnalysis | null>(null);
  const [trends, setTrends] = useState<MonthlyTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<UKRegion>("national");
  const [showRegionPicker, setShowRegionPicker] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const transactions = await TransactionService.getTransactionsByDateRange(
        startOfMonth,
        now
      );

      costOfLivingService.setRegion(selectedRegion);
      const analysisResult = await costOfLivingService.analyzeCurrentMonth(transactions);
      const trendsResult = await costOfLivingService.getMonthlyTrends(6);

      setAnalysis(analysisResult);
      setTrends(trendsResult);
    } catch (error) {
      console.error("Error loading Cost of Living data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedRegion]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const formatCurrency = (amount: number) => `£${amount.toFixed(0)}`;

  const getScoreColor = (score: number): string => {
    if (score >= 80) return "#22C55E";
    if (score >= 60) return "#84CC16";
    if (score >= 40) return "#F59E0B";
    if (score >= 20) return "#F97316";
    return "#EF4444";
  };

  const getStatusColor = (status: CategorySpending["status"]): string => {
    switch (status) {
      case "excellent":
        return "#22C55E";
      case "good":
        return "#84CC16";
      case "average":
        return "#F59E0B";
      case "high":
        return "#F97316";
      case "very_high":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const renderScoreCard = () => {
    if (!analysis) return null;

    const scoreColor = getScoreColor(analysis.score);

    return (
      <View style={[styles.scoreCard, { backgroundColor: colors.background.secondary }]}>
        <View style={styles.scoreHeader}>
          <Text style={[styles.scoreTitle, { color: colors.text.primary }]}>
            Your Cost of Living Score
          </Text>
          <TouchableOpacity
            style={[styles.regionButton, { backgroundColor: colors.primary.main + "15" }]}
            onPress={() => setShowRegionPicker(!showRegionPicker)}
          >
            <Ionicons name="location-outline" size={14} color={colors.primary.main} />
            <Text style={[styles.regionButtonText, { color: colors.primary.main }]}>
              {UK_REGION_LABELS[selectedRegion].split(" ")[0]}
            </Text>
            <Ionicons name="chevron-down" size={14} color={colors.primary.main} />
          </TouchableOpacity>
        </View>

        <View style={styles.scoreMain}>
          <View style={styles.scoreCircle}>
            <View
              style={[
                styles.scoreCircleInner,
                { borderColor: scoreColor, backgroundColor: scoreColor + "15" },
              ]}
            >
              <Text style={[styles.scoreValue, { color: scoreColor }]}>
                {analysis.score}
              </Text>
              <Text style={[styles.scoreMax, { color: colors.text.secondary }]}>
                /100
              </Text>
            </View>
          </View>

          <View style={styles.scoreDetails}>
            <Text style={[styles.scoreLabel, { color: scoreColor }]}>
              {analysis.scoreThreshold.label}
            </Text>
            <Text style={[styles.scoreDescription, { color: colors.text.secondary }]}>
              {analysis.scoreThreshold.description}
            </Text>

            <View style={styles.comparisonRow}>
              <View style={styles.comparisonItem}>
                <Text style={[styles.comparisonLabel, { color: colors.text.secondary }]}>
                  Your spending
                </Text>
                <Text style={[styles.comparisonValue, { color: colors.text.primary }]}>
                  {formatCurrency(analysis.totalUserSpending)}
                </Text>
              </View>
              <View style={styles.comparisonDivider} />
              <View style={styles.comparisonItem}>
                <Text style={[styles.comparisonLabel, { color: colors.text.secondary }]}>
                  UK Average
                </Text>
                <Text style={[styles.comparisonValue, { color: colors.text.secondary }]}>
                  {formatCurrency(analysis.totalNationalAverage)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {analysis.period.isPartialMonth && (
          <View style={[styles.partialMonthBadge, { backgroundColor: colors.warning?.main + "20" || "#F59E0B20" }]}>
            <Ionicons name="calendar-outline" size={14} color={colors.warning?.main || "#F59E0B"} />
            <Text style={[styles.partialMonthText, { color: colors.warning?.main || "#F59E0B" }]}>
              Based on {analysis.period.daysInPeriod} days of data this month
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderCategoryBreakdown = () => {
    if (!analysis) return null;

    const categoriesWithSpending = analysis.categoryBreakdown.filter(
      (c) => c.userSpending > 0 || c.nationalAverage > 0
    );

    return (
      <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Category Breakdown
        </Text>
        <Text style={[styles.sectionSubtitle, { color: colors.text.secondary }]}>
          Your spending vs UK national average
        </Text>

        {categoriesWithSpending.map((category) => (
          <View key={category.category} style={styles.categoryCard}>
            <View style={styles.categoryHeader}>
              <View style={styles.categoryLeft}>
                <View
                  style={[styles.categoryIcon, { backgroundColor: category.color + "20" }]}
                >
                  <Ionicons
                    name={category.icon as any}
                    size={20}
                    color={category.color}
                  />
                </View>
                <View>
                  <Text style={[styles.categoryName, { color: colors.text.primary }]}>
                    {category.label}
                  </Text>
                  <View style={styles.categoryBadge}>
                    <Text
                      style={[
                        styles.categoryBadgeText,
                        { color: getStatusColor(category.status) },
                      ]}
                    >
                      {category.percentageOfAverage}% of avg
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.categoryRight}>
                <Text style={[styles.categoryAmount, { color: colors.text.primary }]}>
                  {formatCurrency(category.userSpending)}
                </Text>
                <Text
                  style={[
                    styles.categoryDifference,
                    {
                      color:
                        category.difference > 0
                          ? colors.error.main
                          : "#22C55E",
                    },
                  ]}
                >
                  {category.difference > 0 ? "+" : ""}
                  {formatCurrency(category.difference)}
                </Text>
              </View>
            </View>

            <View style={styles.categoryBarContainer}>
              <View
                style={[styles.categoryBarBg, { backgroundColor: colors.gray[200] }]}
              >
                <View
                  style={[
                    styles.categoryBar,
                    {
                      width: `${Math.min(category.percentageOfAverage, 200) / 2}%`,
                      backgroundColor:
                        category.percentageOfAverage > 100
                          ? colors.error.main
                          : category.color,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.averageMarker,
                    { left: "50%", backgroundColor: colors.text.primary },
                  ]}
                />
              </View>
              <View style={styles.categoryBarLabels}>
                <Text style={[styles.barLabel, { color: colors.text.secondary }]}>
                  0
                </Text>
                <Text style={[styles.barLabel, { color: colors.text.secondary }]}>
                  {formatCurrency(category.nationalAverage)}
                </Text>
                <Text style={[styles.barLabel, { color: colors.text.secondary }]}>
                  2x
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderTrends = () => {
    if (trends.length === 0) return null;

    const maxScore = Math.max(...trends.map((t) => t.score), 100);

    return (
      <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Score History
        </Text>
        <Text style={[styles.sectionSubtitle, { color: colors.text.secondary }]}>
          Last 6 months trend
        </Text>

        <View style={styles.trendChart}>
          {trends.map((trend, index) => {
            const height = (trend.score / maxScore) * 100;
            const scoreColor = getScoreColor(trend.score);

            return (
              <View key={trend.month} style={styles.trendBar}>
                <View style={styles.trendBarContainer}>
                  <View
                    style={[
                      styles.trendBarFill,
                      { height: `${height}%`, backgroundColor: scoreColor },
                    ]}
                  />
                </View>
                <Text style={[styles.trendScore, { color: colors.text.primary }]}>
                  {trend.score}
                </Text>
                <Text style={[styles.trendLabel, { color: colors.text.secondary }]}>
                  {trend.label.split(" ")[0]}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderInsights = () => {
    if (!analysis || analysis.insights.length === 0) return null;

    return (
      <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Insights
        </Text>

        {analysis.insights.map((insight, index) => (
          <View
            key={index}
            style={[styles.insightCard, { backgroundColor: colors.primary.main + "10" }]}
          >
            <Ionicons name="bulb-outline" size={18} color={colors.primary.main} />
            <Text style={[styles.insightText, { color: colors.text.secondary }]}>
              {insight}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderUKContext = () => {
    const currentCap = ENERGY_PRICE_CAP_HISTORY[0];

    return (
      <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          UK Economic Context
        </Text>

        <View style={styles.contextGrid}>
          <View style={[styles.contextCard, { backgroundColor: colors.background.primary }]}>
            <Ionicons name="flash-outline" size={24} color="#F59E0B" />
            <Text style={[styles.contextLabel, { color: colors.text.secondary }]}>
              Energy Price Cap
            </Text>
            <Text style={[styles.contextValue, { color: colors.text.primary }]}>
              £{currentCap.monthlyCap}/mo
            </Text>
            <Text style={[styles.contextSub, { color: colors.text.secondary }]}>
              {currentCap.quarter}
            </Text>
          </View>

          <View style={[styles.contextCard, { backgroundColor: colors.background.primary }]}>
            <Ionicons name="trending-up" size={24} color="#EF4444" />
            <Text style={[styles.contextLabel, { color: colors.text.secondary }]}>
              UK Inflation
            </Text>
            <Text style={[styles.contextValue, { color: colors.text.primary }]}>
              {UK_INFLATION_RATES.current}%
            </Text>
            <Text style={[styles.contextSub, { color: colors.text.secondary }]}>
              Target: {UK_INFLATION_RATES.target}%
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderRegionPicker = () => {
    if (!showRegionPicker) return null;

    const regions: UKRegion[] = [
      "national",
      "london",
      "south_east",
      "south_west",
      "east",
      "west_midlands",
      "east_midlands",
      "yorkshire",
      "north_west",
      "north_east",
      "wales",
      "scotland",
      "northern_ireland",
    ];

    return (
      <View
        style={[styles.regionPicker, { backgroundColor: colors.background.secondary }]}
      >
        <Text style={[styles.regionPickerTitle, { color: colors.text.primary }]}>
          Select Your Region
        </Text>
        <ScrollView style={styles.regionList} showsVerticalScrollIndicator={false}>
          {regions.map((region) => (
            <TouchableOpacity
              key={region}
              style={[
                styles.regionOption,
                selectedRegion === region && {
                  backgroundColor: colors.primary.main + "15",
                },
              ]}
              onPress={() => {
                setSelectedRegion(region);
                setShowRegionPicker(false);
              }}
            >
              <Text
                style={[
                  styles.regionOptionText,
                  {
                    color:
                      selectedRegion === region
                        ? colors.primary.main
                        : colors.text.primary,
                  },
                ]}
              >
                {UK_REGION_LABELS[region]}
              </Text>
              {selectedRegion === region && (
                <Ionicons name="checkmark" size={20} color={colors.primary.main} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background.primary }]}
      >
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            Analyzing your spending...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background.primary }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Cost of Living
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary.main}
          />
        }
      >
        {renderScoreCard()}
        {renderRegionPicker()}
        {renderCategoryBreakdown()}
        {renderTrends()}
        {renderInsights()}
        {renderUKContext()}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  backButton: {
    padding: spacing.sm,
    marginLeft: -spacing.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
  },
  scoreCard: {
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  scoreHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  regionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  regionButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  scoreMain: {
    flexDirection: "row",
    alignItems: "center",
  },
  scoreCircle: {
    marginRight: spacing.lg,
  },
  scoreCircleInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: "800",
  },
  scoreMax: {
    fontSize: 12,
    fontWeight: "500",
  },
  scoreDetails: {
    flex: 1,
  },
  scoreLabel: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  scoreDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  comparisonRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  comparisonItem: {
    flex: 1,
  },
  comparisonLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  comparisonValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  comparisonDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(0,0,0,0.1)",
    marginHorizontal: spacing.md,
  },
  partialMonthBadge: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  partialMonthText: {
    fontSize: 12,
    fontWeight: "500",
  },
  section: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: spacing.lg,
  },
  categoryCard: {
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  categoryLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  categoryBadge: {},
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  categoryRight: {
    alignItems: "flex-end",
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  categoryDifference: {
    fontSize: 12,
    fontWeight: "600",
  },
  categoryBarContainer: {
    marginTop: spacing.xs,
  },
  categoryBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    position: "relative",
  },
  categoryBar: {
    height: "100%",
    borderRadius: 4,
  },
  averageMarker: {
    position: "absolute",
    width: 2,
    height: 12,
    top: -2,
    marginLeft: -1,
    borderRadius: 1,
  },
  categoryBarLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  barLabel: {
    fontSize: 10,
  },
  trendChart: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 140,
  },
  trendBar: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 4,
  },
  trendBarContainer: {
    width: "100%",
    height: 80,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 4,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  trendBarFill: {
    width: "100%",
    borderRadius: 4,
  },
  trendScore: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 6,
  },
  trendLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  insightCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  contextGrid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  contextCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
  },
  contextLabel: {
    fontSize: 12,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  contextValue: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 4,
  },
  contextSub: {
    fontSize: 11,
    marginTop: 2,
  },
  regionPicker: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  regionPickerTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: spacing.md,
  },
  regionList: {
    maxHeight: 300,
  },
  regionOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: 2,
  },
  regionOptionText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
