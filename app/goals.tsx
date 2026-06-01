import React, { useEffect, useState, useCallback } from "react";
import {
  ScrollView,
  RefreshControl,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "./auth/AuthContext";
import { TabLoadingScreen } from "../components/ui";
import {
  goalsAPI,
  GoalsResponse,
  FinancialGoal,
  CreateGoalRequest,
} from "../services/api/goalsAPI";
import { GoalsOverview, GoalCard, CreateGoalForm } from "../components/goals";
import {
  createSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
} from "../services/dataSource";
import { SPACING } from "../constants/Colors";
import { fontFamily } from "../constants/theme";

export default function GoalsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  // Styles
  const styles = createStyles(colors);

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [goalsData, setGoalsData] = useState<GoalsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const [contributeGoal, setContributeGoal] = useState<FinancialGoal | null>(null);
  const [contributeAmount, setContributeAmount] = useState("");
  const [contributing, setContributing] = useState(false);
  const [detailGoal, setDetailGoal] = useState<FinancialGoal | null>(null);

  // Load goals data
  const loadGoalsData = useCallback(
    async (isRefresh = false) => {
      const userId = user?.sub || user?.id || user?.username;
      if (!userId) {
        console.log("🎯 [Goals] No user ID available, user object:", user);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        console.log("🎯 [Goals] Loading goals data for user:", userId);

        const data = await goalsAPI.getUserGoals(userId);
        setGoalsData(data);

        console.log("✅ [Goals] Goals data loaded successfully:", {
          activeGoals: data.activeGoals?.length,
          completedGoals: data.completedGoals?.length,
          totalSaved: data.totalSavedTowardsGoals,
        });
      } catch (error: any) {
        console.error("❌ [Goals] Error loading goals data:", error);
        setError(error.message || "Failed to load goals data");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.id, user?.username]
  );

  // Initial load
  useEffect(() => {
    loadGoalsData();
  }, [loadGoalsData]);

  // Create a new goal, or save edits to an existing one — both persist for real.
  const handleSaveGoal = async (goalData: CreateGoalRequest) => {
    try {
      setIsCreating(true);

      if (editingGoal) {
        await updateSavingsGoal(editingGoal.goalId, {
          title: goalData.title,
          description: goalData.description,
          targetAmount: goalData.targetAmount,
          targetDate: goalData.targetDate,
          category: goalData.category,
        });
      } else {
        await createSavingsGoal({
          title: goalData.title,
          description: goalData.description,
          targetAmount: goalData.targetAmount,
          currentAmount: 0,
          targetDate: goalData.targetDate,
          category: goalData.category,
        });
      }

      await loadGoalsData();
      setShowCreateForm(false);
      setEditingGoal(null);
    } catch (error: any) {
      console.error("❌ [Goals] Error saving goal:", error);
      Alert.alert(
        "Error",
        `Could not ${editingGoal ? "update" : "create"} your goal. Please try again.`
      );
    } finally {
      setIsCreating(false);
    }
  };

  const findGoal = (goalId: string) =>
    goalsData?.activeGoals.find((g) => g.goalId === goalId) ||
    goalsData?.completedGoals.find((g) => g.goalId === goalId) ||
    null;

  // Tapping a goal opens its detail sheet.
  const handleGoalPress = (goal: FinancialGoal) => {
    setDetailGoal(goal);
  };

  const handleDeleteGoal = (goal: FinancialGoal) => {
    Alert.alert(
      "Delete goal",
      `Delete "${goal.title}"? This can't be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteSavingsGoal(goal.goalId);
              setDetailGoal(null);
              await loadGoalsData();
            } catch (error) {
              console.error("❌ [Goals] Error deleting goal:", error);
              Alert.alert("Error", "Could not delete your goal.");
            }
          },
        },
      ]
    );
  };

  // Add money to a goal: bump currentAmount via the real update endpoint.
  const handleContribute = async () => {
    if (!contributeGoal) return;
    const amount = parseFloat(contributeAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Enter an amount", "Please enter how much to add.");
      return;
    }
    try {
      setContributing(true);
      await updateSavingsGoal(contributeGoal.goalId, {
        currentAmount: contributeGoal.currentAmount + amount,
      });
      setContributeGoal(null);
      setContributeAmount("");
      await loadGoalsData();
    } catch (error) {
      console.error("❌ [Goals] Error adding contribution:", error);
      Alert.alert("Error", "Could not add to your goal. Please try again.");
    } finally {
      setContributing(false);
    }
  };

  const togglePause = async (goal: FinancialGoal) => {
    try {
      await updateSavingsGoal(goal.goalId, { isActive: !goal.isActive });
      await loadGoalsData();
    } catch (error) {
      console.error("❌ [Goals] Error pausing goal:", error);
      Alert.alert("Error", "Could not update your goal. Please try again.");
    }
  };

  // Quick actions from a goal card — all real now.
  const handleQuickAction = (
    goalId: string,
    action: "contribute" | "edit" | "pause"
  ) => {
    const goal = findGoal(goalId);
    if (!goal) return;

    switch (action) {
      case "contribute":
        setContributeAmount("");
        setContributeGoal(goal);
        break;
      case "edit":
        setEditingGoal(goal);
        setShowCreateForm(true);
        break;
      case "pause":
        togglePause(goal);
        break;
    }
  };

  // Show create / edit form
  if (showCreateForm) {
    return (
      <CreateGoalForm
        onSubmit={handleSaveGoal}
        onCancel={() => {
          setShowCreateForm(false);
          setEditingGoal(null);
        }}
        isLoading={isCreating}
        initialGoal={editingGoal ?? undefined}
      />
    );
  }

  // Loading state
  if (loading || !goalsData) {
    return <TabLoadingScreen message="Loading your goals..." />;
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: colors.background.secondary },
        ]}
      >
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={colors.error.main}
          />
          <Text style={[styles.errorTitle, { color: colors.text.primary }]}>
            Failed to Load Goals
          </Text>
          <Text style={[styles.errorText, { color: colors.text.secondary }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[
              styles.retryButton,
              { backgroundColor: colors.primary.main },
            ]}
            onPress={() => loadGoalsData()}
          >
            <Text
              style={[
                styles.retryButtonText,
                { color: colors.background.primary },
              ]}
            >
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Financial Goals</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setEditingGoal(null);
            setShowCreateForm(true);
          }}
        >
          <Ionicons name="add" size={24} color={colors.primary.main} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadGoalsData(true)}
            tintColor={colors.primary.main}
          />
        }
      >
        {/* Overview */}
        <GoalsOverview goalsData={goalsData} />

        {/* Active Goals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Goals</Text>
            <Text style={styles.sectionSubtitle}>
              {goalsData.activeGoals.length} goal
              {goalsData.activeGoals.length !== 1 ? "s" : ""}
            </Text>
          </View>

          {goalsData.activeGoals.length > 0 ? (
            goalsData.activeGoals.map((goal) => {
              const progress = goalsData.goalProgress.find(
                (p) => p.goalId === goal.goalId
              );
              if (!progress) return null;

              return (
                <GoalCard
                  key={goal.goalId}
                  goal={goal}
                  progress={progress}
                  onPress={handleGoalPress}
                  onQuickAction={handleQuickAction}
                />
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Ionicons
                name="flag-outline"
                size={48}
                color={colors.text.tertiary}
              />
              <Text style={styles.emptyTitle}>No Active Goals</Text>
              <Text style={styles.emptyText}>
                Create your first goal to start building your financial future!
              </Text>
              <TouchableOpacity
                style={styles.createFirstGoalButton}
                onPress={() => {
            setEditingGoal(null);
            setShowCreateForm(true);
          }}
              >
                <Ionicons
                  name="add"
                  size={20}
                  color={colors.background.primary}
                />
                <Text style={styles.createFirstGoalText}>
                  Create Your First Goal
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Completed Goals */}
        {goalsData.completedGoals.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Completed Goals</Text>
              <Text style={styles.sectionSubtitle}>
                {goalsData.completedGoals.length} completed
              </Text>
            </View>

            {goalsData.completedGoals.map((goal) => {
              const progress = {
                goalId: goal.goalId,
                progressPercentage: 100,
                amountRemaining: 0,
                daysRemaining: 0,
                isOnTrack: true,
                projectedCompletionDate: goal.targetDate,
                recommendedMonthlySavings: 0,
              };

              return (
                <GoalCard
                  key={goal.goalId}
                  goal={goal}
                  progress={progress}
                  onPress={handleGoalPress}
                />
              );
            })}
          </View>
        )}

        {/* Goal Recommendations */}
        {goalsData.recommendations.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recommended Goals</Text>
              <Text style={styles.sectionSubtitle}>
                Personalized suggestions
              </Text>
            </View>

            <View style={styles.recommendationsContainer}>
              {goalsData.recommendations.map((recommendation, index) => {
                const typeColor = goalsAPI.getGoalTypeColor(
                  recommendation.type
                );
                const typeIcon = goalsAPI.getGoalTypeIcon(recommendation.type);
                const priorityColor = goalsAPI.getPriorityColor(
                  recommendation.priority
                );

                return (
                  <View
                    key={index}
                    style={[
                      styles.recommendationCard,
                      { borderLeftColor: typeColor },
                    ]}
                  >
                    <View style={styles.recommendationHeader}>
                      <View
                        style={[
                          styles.recommendationIcon,
                          { backgroundColor: typeColor + "20" },
                        ]}
                      >
                        <Ionicons
                          name={typeIcon as any}
                          size={20}
                          color={typeColor}
                        />
                      </View>
                      <View style={styles.recommendationInfo}>
                        <Text style={styles.recommendationTitle}>
                          {recommendation.title}
                        </Text>
                        <View
                          style={[
                            styles.recommendationPriority,
                            { backgroundColor: priorityColor + "20" },
                          ]}
                        >
                          <Text
                            style={[
                              styles.recommendationPriorityText,
                              { color: priorityColor },
                            ]}
                          >
                            {recommendation.priority.toUpperCase()} PRIORITY
                          </Text>
                        </View>
                      </View>
                    </View>

                    <Text style={styles.recommendationDescription}>
                      {recommendation.description}
                    </Text>

                    <View style={styles.recommendationDetails}>
                      <Text style={styles.recommendationAmount}>
                        Target:{" "}
                        {goalsAPI.formatCurrency(
                          recommendation.suggestedAmount
                        )}
                      </Text>
                      <Text style={styles.recommendationTimeframe}>
                        {goalsAPI.formatTimeRemaining(
                          recommendation.suggestedTimeframe * 30
                        )}
                      </Text>
                    </View>

                    <Text style={styles.recommendationReasoning}>
                      💡 {recommendation.reasoning}
                    </Text>

                    <TouchableOpacity
                      style={[
                        styles.createFromRecommendationButton,
                        { backgroundColor: typeColor },
                      ]}
                      onPress={() => {
                        setEditingGoal(null);
                        setShowCreateForm(true);
                      }}
                    >
                      <Text style={styles.createFromRecommendationText}>
                        Create This Goal
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Contribute sheet */}
      <Modal
        visible={!!contributeGoal}
        transparent
        animationType="fade"
        onRequestClose={() => setContributeGoal(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Add to {contributeGoal?.title}
            </Text>
            {contributeGoal && (
              <Text style={styles.modalSub}>
                {goalsAPI.formatCurrency(contributeGoal.currentAmount)} of{" "}
                {goalsAPI.formatCurrency(contributeGoal.targetAmount)}
              </Text>
            )}

            <View style={styles.amountInputRow}>
              <Text style={styles.currencyPrefix}>£</Text>
              <TextInput
                style={styles.amountInput}
                value={contributeAmount}
                onChangeText={(t) =>
                  setContributeAmount(t.replace(/[^0-9.]/g, ""))
                }
                placeholder="0"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setContributeGoal(null)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirm}
                onPress={handleContribute}
                disabled={contributing}
                activeOpacity={0.85}
              >
                <Text style={styles.modalConfirmText}>
                  {contributing ? "Adding..." : "Add"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Goal detail sheet */}
      <Modal
        visible={!!detailGoal}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailGoal(null)}
      >
        <View style={styles.modalOverlay}>
          {detailGoal &&
            (() => {
              const g = detailGoal;
              const progress = goalsAPI.calculateGoalProgress(g);
              const pct = Math.min(progress.progressPercentage, 100);
              return (
                <View style={styles.detailCard}>
                  <View style={styles.detailHeader}>
                    <Text style={styles.detailTitle} numberOfLines={1}>
                      {g.title}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setDetailGoal(null)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons
                        name="close"
                        size={22}
                        color={colors.text.secondary}
                      />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.detailAmount}>
                    {goalsAPI.formatCurrency(g.currentAmount)}
                    <Text style={styles.detailAmountTotal}>
                      {"  of "}
                      {goalsAPI.formatCurrency(g.targetAmount)}
                    </Text>
                  </Text>

                  <View style={styles.detailProgressBar}>
                    <View
                      style={[
                        styles.detailProgressFill,
                        {
                          width: `${pct}%`,
                          backgroundColor: g.isActive
                            ? colors.primary.main
                            : colors.text.tertiary,
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.detailMetaRow}>
                    <Text style={styles.detailMeta}>{pct}% saved</Text>
                    <Text style={styles.detailMeta}>
                      {goalsAPI.formatCurrency(progress.amountRemaining)} to go
                    </Text>
                  </View>

                  <View style={styles.detailInfoRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={16}
                      color={colors.text.tertiary}
                    />
                    <Text style={styles.detailInfoText}>
                      {progress.daysRemaining > 0
                        ? `${goalsAPI.formatTimeRemaining(progress.daysRemaining)} left`
                        : "Past target date"}
                    </Text>
                    {!g.isActive && (
                      <View style={styles.pausedPill}>
                        <Text style={styles.pausedPillText}>Paused</Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    style={styles.detailPrimaryBtn}
                    activeOpacity={0.85}
                    onPress={() => {
                      setDetailGoal(null);
                      setContributeAmount("");
                      setContributeGoal(g);
                    }}
                  >
                    <Ionicons name="add" size={20} color="#fff" />
                    <Text style={styles.detailPrimaryText}>Add money</Text>
                  </TouchableOpacity>

                  <View style={styles.detailActions}>
                    <TouchableOpacity
                      style={styles.detailActionBtn}
                      onPress={() => {
                        setDetailGoal(null);
                        setEditingGoal(g);
                        setShowCreateForm(true);
                      }}
                    >
                      <Ionicons
                        name="create-outline"
                        size={18}
                        color={colors.text.primary}
                      />
                      <Text style={styles.detailActionText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.detailActionBtn}
                      onPress={async () => {
                        setDetailGoal(null);
                        await togglePause(g);
                      }}
                    >
                      <Ionicons
                        name={g.isActive ? "pause-outline" : "play-outline"}
                        size={18}
                        color={colors.text.primary}
                      />
                      <Text style={styles.detailActionText}>
                        {g.isActive ? "Pause" : "Resume"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.detailActionBtn}
                      onPress={() => handleDeleteGoal(g)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color={colors.error.main}
                      />
                      <Text
                        style={[
                          styles.detailActionText,
                          { color: colors.error.main },
                        ]}
                      >
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })()}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.secondary,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: SPACING.lg,
      backgroundColor: colors.background.primary,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.light,
    },
    backButton: {
      padding: SPACING.sm,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.text.primary,
    },
    addButton: {
      padding: SPACING.sm,
    },
    scrollView: {
      flex: 1,
    },
    section: {
      marginTop: SPACING.lg,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: SPACING.lg,
      marginBottom: SPACING.md,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text.primary,
    },
    sectionSubtitle: {
      fontSize: 14,
      color: colors.text.secondary,
      fontWeight: "500",
    },
    emptyState: {
      backgroundColor: colors.background.primary,
      margin: SPACING.lg,
      padding: SPACING.xl,
      borderRadius: 16,
      alignItems: "center",
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text.primary,
      marginTop: SPACING.md,
      marginBottom: SPACING.sm,
    },
    emptyText: {
      fontSize: 14,
      color: colors.text.secondary,
      textAlign: "center",
      marginBottom: SPACING.lg,
      lineHeight: 20,
    },
    createFirstGoalButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.primary.main,
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
      borderRadius: 24,
    },
    createFirstGoalText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.background.primary,
      marginLeft: SPACING.sm,
    },
    recommendationsContainer: {
      paddingHorizontal: SPACING.lg,
    },
    recommendationCard: {
      backgroundColor: colors.background.primary,
      borderRadius: 12,
      padding: SPACING.lg,
      marginBottom: SPACING.md,
      borderLeftWidth: 4,
    },
    recommendationHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: SPACING.md,
    },
    recommendationIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      marginRight: SPACING.md,
    },
    recommendationInfo: {
      flex: 1,
    },
    recommendationTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text.primary,
      marginBottom: SPACING.xs,
    },
    recommendationPriority: {
      alignSelf: "flex-start",
      paddingHorizontal: SPACING.sm,
      paddingVertical: 2,
      borderRadius: 4,
    },
    recommendationPriorityText: {
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 0.5,
    },
    recommendationDescription: {
      fontSize: 14,
      color: colors.text.secondary,
      lineHeight: 18,
      marginBottom: SPACING.md,
    },
    recommendationDetails: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: SPACING.md,
    },
    recommendationAmount: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text.primary,
    },
    recommendationTimeframe: {
      fontSize: 14,
      color: colors.text.secondary,
      fontWeight: "500",
    },
    recommendationReasoning: {
      fontSize: 12,
      color: colors.text.secondary,
      fontStyle: "italic",
      marginBottom: SPACING.md,
    },
    createFromRecommendationButton: {
      padding: SPACING.md,
      borderRadius: 8,
      alignItems: "center",
    },
    createFromRecommendationText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.background.primary,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: SPACING.xl,
    },
    errorTitle: {
      fontSize: 18,
      fontWeight: "600",
      marginTop: SPACING.md,
      marginBottom: SPACING.sm,
    },
    errorText: {
      fontSize: 14,
      textAlign: "center",
      marginBottom: SPACING.lg,
    },
    retryButton: {
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
      borderRadius: 8,
    },
    retryButtonText: {
      fontSize: 16,
      fontWeight: "600",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      paddingHorizontal: SPACING.lg,
    },
    modalCard: {
      backgroundColor: colors.background.primary,
      borderRadius: 20,
      padding: SPACING.lg,
      borderWidth: 1,
      borderColor: colors.border.medium,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text.primary,
    },
    modalSub: {
      fontSize: 14,
      color: colors.text.secondary,
      marginTop: 4,
      fontFamily: fontFamily.mono,
    },
    amountInputRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: SPACING.lg,
      paddingHorizontal: SPACING.md,
      paddingVertical: 4,
      borderRadius: 14,
      backgroundColor: colors.background.secondary,
      borderWidth: 1,
      borderColor: colors.border.medium,
    },
    currencyPrefix: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.text.secondary,
      marginRight: 6,
    },
    amountInput: {
      flex: 1,
      fontSize: 28,
      fontWeight: "700",
      color: colors.text.primary,
      paddingVertical: SPACING.md,
      fontFamily: fontFamily.monoSemibold,
    },
    modalActions: {
      flexDirection: "row",
      gap: SPACING.md,
      marginTop: SPACING.lg,
    },
    modalCancel: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: "center",
      backgroundColor: colors.background.secondary,
    },
    modalCancelText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text.secondary,
    },
    modalConfirm: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: "center",
      backgroundColor: colors.primary.main,
    },
    modalConfirmText: {
      fontSize: 16,
      fontWeight: "700",
      color: "#fff",
    },
    detailCard: {
      backgroundColor: colors.background.primary,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: SPACING.lg,
      paddingBottom: SPACING.xl,
      borderTopWidth: 1,
      borderColor: colors.border.medium,
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
    },
    detailHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: SPACING.md,
    },
    detailTitle: {
      flex: 1,
      fontSize: 20,
      fontWeight: "700",
      color: colors.text.primary,
      marginRight: SPACING.md,
    },
    detailAmount: {
      fontSize: 28,
      fontFamily: fontFamily.monoSemibold,
      color: colors.text.primary,
    },
    detailAmountTotal: {
      fontSize: 15,
      fontFamily: fontFamily.mono,
      color: colors.text.tertiary,
    },
    detailProgressBar: {
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.border.light,
      overflow: "hidden",
      marginTop: SPACING.md,
    },
    detailProgressFill: {
      height: "100%",
      borderRadius: 5,
    },
    detailMetaRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: SPACING.sm,
    },
    detailMeta: {
      fontSize: 13,
      color: colors.text.secondary,
      fontFamily: fontFamily.mono,
    },
    detailInfoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: SPACING.md,
    },
    detailInfoText: {
      fontSize: 14,
      color: colors.text.secondary,
    },
    pausedPill: {
      marginLeft: "auto",
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 999,
      backgroundColor: colors.background.secondary,
    },
    pausedPillText: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.text.secondary,
      letterSpacing: 0.5,
    },
    detailPrimaryBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.primary.main,
      borderRadius: 16,
      paddingVertical: 16,
      marginTop: SPACING.lg,
    },
    detailPrimaryText: {
      fontSize: 16,
      fontWeight: "700",
      color: "#fff",
    },
    detailActions: {
      flexDirection: "row",
      gap: SPACING.sm,
      marginTop: SPACING.md,
    },
    detailActionBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor: colors.background.secondary,
    },
    detailActionText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text.primary,
    },
  });
