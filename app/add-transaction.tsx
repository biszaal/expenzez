import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { fontFamily } from "../constants/theme";
import { transactionAPI } from "../services/api";
import { useXP } from "../hooks/useXP";
import {
  expenseKeywords,
  incomeKeywords,
} from "../services/autoDetectionKeywords";
import { MilestoneService } from "../services/milestoneService";
import { reviewPromptService } from "../services/reviewPromptService";
import { analyticsService } from "../services/analytics";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const expenseCategories: Category[] = [
  { id: "food", name: "Food & Dining", icon: "restaurant", color: "#EF4444" },
  { id: "transport", name: "Transport", icon: "car", color: "#3B82F6" },
  { id: "shopping", name: "Shopping", icon: "bag", color: "#EC4899" },
  {
    id: "entertainment",
    name: "Entertainment",
    icon: "game-controller",
    color: "#8B5CF6",
  },
  { id: "bills", name: "Bills & Utilities", icon: "receipt", color: "#F59E0B" },
  { id: "healthcare", name: "Healthcare", icon: "medical", color: "#10B981" },
  { id: "education", name: "Education", icon: "school", color: "#06B6D4" },
  { id: "travel", name: "Travel", icon: "airplane", color: "#84CC16" },
  { id: "groceries", name: "Groceries", icon: "basket", color: "#22C55E" },
  { id: "fuel", name: "Fuel", icon: "car-sport", color: "#F97316" },
  {
    id: "subscriptions",
    name: "Subscriptions",
    icon: "card",
    color: "#A855F7",
  },
  { id: "other", name: "Other", icon: "ellipsis-horizontal", color: "#6B7280" },
];

const incomeCategories: Category[] = [
  { id: "salary", name: "Salary", icon: "briefcase", color: "#10B981" },
  { id: "freelance", name: "Freelance", icon: "laptop", color: "#3B82F6" },
  { id: "business", name: "Business", icon: "storefront", color: "#8B5CF6" },
  {
    id: "investment",
    name: "Investment",
    icon: "trending-up",
    color: "#F59E0B",
  },
  { id: "rental", name: "Rental", icon: "home", color: "#06B6D4" },
  { id: "gift", name: "Gift", icon: "gift", color: "#EC4899" },
];

export default function AddTransaction() {
  const { colors } = useTheme();
  const { awardXP } = useXP();
  const [transactionType, setTransactionType] = useState<"expense" | "income">(
    "expense"
  );
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>(
    expenseCategories[0]
  );
  const [loading, setLoading] = useState(false);
  const [autoDetectedCategory, setAutoDetectedCategory] = useState(false);

  // Numeric validation regex (allows numbers with up to 2 decimal places)
  const numericRegex = /^\d*\.?\d{0,2}$/;

  // Handle amount input with numeric validation
  const handleAmountChange = (text: string) => {
    if (numericRegex.test(text) || text === "") {
      setAmount(text);
    }
  };

  // Auto-detect category based on transaction name
  const autoDetectCategory = (transactionName: string) => {
    const name = transactionName.toLowerCase().trim();

    let foundMatch = false;

    // Check expense categories
    if (transactionType === "expense") {
      for (const [categoryId, keywords] of Object.entries(expenseKeywords)) {
        const matchedKeyword = keywords.find((keyword) =>
          name.includes(keyword)
        );
        if (matchedKeyword) {
          const category = expenseCategories.find(
            (cat) => cat.id === categoryId
          );
          if (category) {
            setSelectedCategory(category);
            setAutoDetectedCategory(true);
            // Reset the auto-detected flag after 2 seconds
            setTimeout(() => setAutoDetectedCategory(false), 2000);
            foundMatch = true;
            return;
          }
        }
      }
    } else {
      // Check income categories
      for (const [categoryId, keywords] of Object.entries(incomeKeywords)) {
        if (keywords.some((keyword) => name.includes(keyword))) {
          const category = incomeCategories.find(
            (cat) => cat.id === categoryId
          );
          if (category) {
            setSelectedCategory(category);
            setAutoDetectedCategory(true);
            // Reset the auto-detected flag after 2 seconds
            setTimeout(() => setAutoDetectedCategory(false), 2000);
            foundMatch = true;
            return;
          }
        }
      }
    }

    // If no match found and name is not empty, reset to first category
    if (!foundMatch && name.length > 0) {
      const defaultCategory =
        transactionType === "expense"
          ? expenseCategories[0]
          : incomeCategories[0];
      setSelectedCategory(defaultCategory);
      setAutoDetectedCategory(false);
    }
  };

  // Handle name input with auto-category detection
  const handleNameChange = (text: string) => {
    setName(text);
    // Auto-detect category when user types (with a small delay to avoid too many updates)
    if (text.length > 2) {
      autoDetectCategory(text);
    }
  };

  const handleSaveTransaction = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert(
        "Invalid Amount",
        `Please enter a valid ${transactionType} amount.`
      );
      return;
    }

    if (!name.trim()) {
      Alert.alert(
        "Missing Name",
        `Please enter a name for this ${transactionType}.`
      );
      return;
    }

    try {
      setLoading(true);

      const transactionAmount =
        transactionType === "expense"
          ? -Math.abs(parseFloat(amount)) // Expenses are negative
          : Math.abs(parseFloat(amount)); // Income is positive

      const transactionData = {
        amount: transactionAmount,
        description: name.trim(),
        category: selectedCategory.name,
        type:
          transactionType === "expense"
            ? ("debit" as const)
            : ("credit" as const),
        date: new Date().toISOString(),
        merchant: name.trim(),
        currency: "GBP",
      };

      console.log(`💰 Saving ${transactionType}:`, transactionData);

      const result = await transactionAPI.createTransaction(transactionData);

      // Award XP for adding a transaction (for both expenses and income)
      if (result) {
        console.log(
          "✅ Transaction saved successfully with ID:",
          result.transaction?.id
        );

        // Track transaction in analytics
        analyticsService.logAddTransaction({
          amount: transactionAmount,
          category: selectedCategory?.name || "General",
          type: transactionType === "expense" ? "debit" : "credit",
        });

        // Transaction saved successfully - balance will be updated by backend
        console.log(
          "💰 [AddTransaction] Transaction saved, balance will be updated by backend"
        );

        Alert.alert(
          "Success",
          `${transactionType === "expense" ? "Expense" : "Income"} saved successfully!`,
          [
            {
              text: "Add Another",
              onPress: () => {
                setAmount("");
                setName("");
              },
            },
            {
              text: "Done",
              style: "default",
              onPress: () => router.back(),
            },
          ]
        );

        try {
          // Track milestone progress for all transactions
          const achievedMilestones = await MilestoneService.recordTransaction();

          // Award milestone XP
          for (const milestoneAction of achievedMilestones) {
            console.log(
              `🎯 [AddTransaction] Milestone achieved: ${milestoneAction}`
            );
            await awardXP(milestoneAction);
          }

          // Check if review prompt should be shown after milestone achievement
          if (achievedMilestones.length > 0) {
            try {
              const milestoneData = await MilestoneService.getMilestones();
              const shouldShow = await reviewPromptService.shouldShowReviewPrompt(
                milestoneData.totalTransactions
              );

              if (shouldShow) {
                // Show review prompt after a slight delay to let success alert dismiss
                setTimeout(() => {
                  reviewPromptService.showReviewPrompt();
                }, 1500);
              }
            } catch (reviewError) {
              console.error('[AddTransaction] Error checking review prompt:', reviewError);
            }
          }

          // For expenses only: award daily XP and track streaks
          if (transactionType === "expense") {
            // Award XP for adding expense
            await awardXP("add-expense");

            // Track daily streak (if StreakService is available)
            // try {
            //   await StreakService.incrementStreak();
            //   console.log("🔥 [AddTransaction] Daily streak recorded");
            // } catch (streakError) {
            //   console.error(
            //     "[AddTransaction] Error recording streak:",
            //     streakError
            //   );
            // }
          } else {
            // Award XP for adding income
            await awardXP("add-income");
          }
        } catch (xpError) {
          console.error("[AddTransaction] Error awarding XP:", xpError);
        }
      }
    } catch (error) {
      console.error(`Error saving ${transactionType}:`, error);
      Alert.alert(
        "Error",
        `Failed to save ${transactionType}. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  const currentCategories =
    transactionType === "expense" ? expenseCategories : incomeCategories;

  const isExpense = transactionType === "expense";
  const amountText = amount || "0.00";
  const [whole, dec] = amountText.includes(".")
    ? amountText.split(".")
    : [amountText, ""];
  const decimalsDisplay = dec ? `.${dec.padEnd(2, "0").slice(0, 2)}` : ".00";

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top bar */}
          <View style={styles.topBar}>
            <Pressable
              onPress={() => router.back()}
              style={[
                styles.backChip,
                {
                  backgroundColor: colors.card.background,
                  borderColor: colors.border.medium,
                },
              ]}
            >
              <Ionicons
                name="chevron-back"
                size={18}
                color={colors.text.secondary}
              />
            </Pressable>
            <Text
              style={[
                styles.topTitle,
                { color: colors.text.primary, fontFamily: fontFamily.semibold },
              ]}
            >
              New transaction
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Type toggle */}
          <View
            style={[
              styles.typeToggle,
              {
                backgroundColor: colors.card.background,
                borderColor: colors.border.medium,
              },
            ]}
          >
            {(["expense", "income"] as const).map((tp) => {
              const active = transactionType === tp;
              return (
                <Pressable
                  key={tp}
                  onPress={() => {
                    setTransactionType(tp);
                    setSelectedCategory(
                      tp === "expense" ? expenseCategories[0] : incomeCategories[0]
                    );
                  }}
                  style={{ flex: 1, borderRadius: 12, overflow: "hidden" }}
                >
                  {active ? (
                    <LinearGradient
                      colors={
                        tp === "expense"
                          ? [colors.rose[500], colors.rose[600]]
                          : [colors.lime[500], colors.lime[600]]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.typePill}
                    >
                      <Ionicons
                        name={
                          tp === "expense" ? "arrow-up" : "arrow-down"
                        }
                        size={13}
                        color="#fff"
                      />
                      <Text style={styles.typePillTextActive}>
                        {tp === "expense" ? "Expense" : "Income"}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.typePill}>
                      <Ionicons
                        name={
                          tp === "expense" ? "arrow-up" : "arrow-down"
                        }
                        size={13}
                        color={colors.text.tertiary}
                      />
                      <Text
                        style={[
                          styles.typePillText,
                          {
                            color: colors.text.secondary,
                            fontFamily: fontFamily.semibold,
                          },
                        ]}
                      >
                        {tp === "expense" ? "Expense" : "Income"}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Amount hero */}
          <View style={styles.amountHero}>
            <Text
              style={[
                styles.amountEyebrow,
                { color: colors.text.tertiary, fontFamily: fontFamily.semibold },
              ]}
            >
              AMOUNT
            </Text>
            <View style={styles.amountRow}>
              <Text
                style={[
                  styles.amountCurrency,
                  { color: colors.text.tertiary, fontFamily: fontFamily.mono },
                ]}
              >
                £
              </Text>
              <Text
                style={[
                  styles.amountWhole,
                  { color: colors.text.primary, fontFamily: fontFamily.monoMedium },
                ]}
              >
                {whole || "0"}
              </Text>
              <Text
                style={[
                  styles.amountDecimals,
                  { color: colors.text.tertiary, fontFamily: fontFamily.mono },
                ]}
              >
                {decimalsDisplay}
              </Text>
            </View>
            <TextInput
              style={styles.amountHiddenInput}
              placeholder="0.00"
              placeholderTextColor="transparent"
              value={amount}
              onChangeText={handleAmountChange}
              keyboardType="numeric"
            />
          </View>

          {/* Description */}
          <View style={styles.fieldBlock}>
            <Text
              style={[
                styles.fieldEyebrow,
                { color: colors.text.tertiary, fontFamily: fontFamily.semibold },
              ]}
            >
              DESCRIPTION
            </Text>
            <View
              style={[
                styles.fieldWrap,
                {
                  backgroundColor: colors.card.background,
                  borderColor: colors.border.medium,
                },
              ]}
            >
              <Ionicons
                name="receipt-outline"
                size={17}
                color={colors.text.tertiary}
              />
              <TextInput
                style={{
                  flex: 1,
                  color: colors.text.primary,
                  fontFamily: fontFamily.medium,
                  fontSize: 15,
                  paddingVertical: 0,
                }}
                placeholder="e.g. Tesco — Bethnal Green"
                placeholderTextColor={colors.text.tertiary}
                value={name}
                onChangeText={handleNameChange}
                autoFocus
              />
            </View>
          </View>

          {/* Category grid */}
          <View style={styles.fieldBlock}>
            <View style={styles.catHeader}>
              <Text
                style={[
                  styles.fieldEyebrow,
                  { color: colors.text.tertiary, fontFamily: fontFamily.semibold },
                ]}
              >
                CATEGORY
              </Text>
              {autoDetectedCategory && (
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 7,
                    backgroundColor: colors.posBg,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      color: colors.lime[500],
                      fontFamily: fontFamily.bold,
                      letterSpacing: 0.5,
                    }}
                  >
                    AUTO
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.catGrid}>
              {currentCategories.map((category) => {
                const active = selectedCategory.id === category.id;
                return (
                  <Pressable
                    key={category.id}
                    onPress={() => setSelectedCategory(category)}
                    style={[
                      styles.catTile,
                      {
                        backgroundColor: active
                          ? "rgba(157,91,255,0.12)"
                          : colors.card.background,
                        borderColor: active
                          ? colors.primary[500]
                          : colors.border.medium,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.catTileIcon,
                        { backgroundColor: category.color + "22" },
                      ]}
                    >
                      <Ionicons
                        name={category.icon as any}
                        size={17}
                        color={category.color}
                      />
                    </View>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 11.5,
                        color: active
                          ? colors.text.primary
                          : colors.text.secondary,
                        fontFamily: fontFamily.medium,
                      }}
                    >
                      {category.name}
                    </Text>
                    {active && (
                      <View
                        style={[
                          styles.catCheck,
                          { backgroundColor: colors.primary[500] },
                        ]}
                      >
                        <Ionicons name="checkmark" size={10} color="#fff" />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Save Button */}
          <Pressable
            onPress={handleSaveTransaction}
            disabled={loading}
            style={({ pressed }) => [
              styles.saveButton,
              { opacity: pressed || loading ? 0.85 : 1 },
            ]}
          >
            <LinearGradient
              colors={[colors.primary[500], colors.primary[600]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.saveButtonGradient,
                { shadowColor: colors.primary[500] },
              ]}
            >
              <Text style={styles.saveButtonText}>
                {loading
                  ? "Saving…"
                  : `Save ${isExpense ? "expense" : "income"}`}
              </Text>
              {!loading && (
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              )}
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardAvoidingView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 6,
    paddingBottom: 32,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backChip: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  topTitle: {
    fontSize: 16,
    letterSpacing: -0.2,
  },
  typeToggle: {
    flexDirection: "row",
    marginTop: 20,
    padding: 4,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  typePill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
  },
  typePillText: {
    fontSize: 13.5,
  },
  typePillTextActive: {
    color: "#fff",
    fontSize: 13.5,
    fontFamily: fontFamily.semibold,
  },
  amountHero: {
    paddingTop: 32,
    alignItems: "center",
  },
  amountEyebrow: {
    fontSize: 11,
    letterSpacing: 1.2,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 4,
    marginTop: 8,
  },
  amountCurrency: {
    fontSize: 30,
    letterSpacing: -1,
  },
  amountWhole: {
    fontSize: 64,
    letterSpacing: -3,
    lineHeight: 64,
  },
  amountDecimals: {
    fontSize: 36,
    letterSpacing: -1.4,
  },
  amountHiddenInput: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    color: "transparent",
    fontSize: 1,
    backgroundColor: "transparent",
  },
  fieldBlock: {
    marginTop: 24,
  },
  fieldEyebrow: {
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 8,
  },
  fieldWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  catHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  catGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  catTile: {
    width: "31.6%",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    gap: 8,
    position: "relative",
  },
  catTileIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  catCheck: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {
    marginTop: 24,
    borderRadius: 18,
    overflow: "hidden",
  },
  saveButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 17,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 8,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: fontFamily.semibold,
    letterSpacing: 0.2,
  },
});
