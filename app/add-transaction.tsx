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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { transactionAPI } from "../services/api";
import { useXP } from "../hooks/useXP";
import {
  expenseKeywords,
  incomeKeywords,
} from "../services/autoDetectionKeywords";
import { MilestoneService } from "../services/milestoneService";
import { reviewPromptService } from "../services/reviewPromptService";

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

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={colors.text.primary}
              />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
              Add {transactionType === "expense" ? "Expense" : "Income"}
            </Text>
            <View style={styles.placeholder} />
          </View>

          {/* Transaction Type Toggle */}
          <View style={styles.typeToggle}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                transactionType === "expense" && styles.typeButtonActive,
                {
                  backgroundColor:
                    transactionType === "expense"
                      ? colors.primary.main
                      : colors.background.primary,
                },
              ]}
              onPress={() => {
                setTransactionType("expense");
                setSelectedCategory(expenseCategories[0]);
              }}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  {
                    color:
                      transactionType === "expense"
                        ? "#FFFFFF"
                        : colors.text.primary,
                  },
                ]}
              >
                Expense
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                transactionType === "income" && styles.typeButtonActive,
                {
                  backgroundColor:
                    transactionType === "income"
                      ? colors.primary.main
                      : colors.background.primary,
                },
              ]}
              onPress={() => {
                setTransactionType("income");
                setSelectedCategory(incomeCategories[0]);
              }}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  {
                    color:
                      transactionType === "income"
                        ? "#FFFFFF"
                        : colors.text.primary,
                  },
                ]}
              >
                Income
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Name Field */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text.primary }]}>
                Name
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background.primary,
                    color: colors.text.primary,
                    borderColor: colors.border.light,
                  },
                ]}
                placeholder="Enter transaction name"
                placeholderTextColor={colors.text.secondary}
                value={name}
                onChangeText={handleNameChange}
                autoFocus
              />
            </View>

            {/* Amount Field */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text.primary }]}>
                Amount
              </Text>
              <View style={styles.amountContainer}>
                <Text
                  style={[
                    styles.currencySymbol,
                    { color: colors.text.primary },
                  ]}
                >
                  £
                </Text>
                <TextInput
                  style={[
                    styles.amountInput,
                    {
                      backgroundColor: colors.background.primary,
                      color: colors.text.primary,
                      borderColor: colors.border.light,
                    },
                  ]}
                  placeholder="0.00"
                  placeholderTextColor={colors.text.secondary}
                  value={amount}
                  onChangeText={handleAmountChange}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Category Selection */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text.primary }]}>
                Category
              </Text>
              <View style={styles.categoryGrid}>
                {currentCategories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryItem,
                      {
                        backgroundColor:
                          selectedCategory.id === category.id
                            ? category.color
                            : colors.background.primary,
                        borderColor:
                          selectedCategory.id === category.id
                            ? category.color
                            : colors.border.light,
                      },
                    ]}
                    onPress={() => setSelectedCategory(category)}
                  >
                    <Ionicons
                      name={category.icon as any}
                      size={20}
                      color={
                        selectedCategory.id === category.id
                          ? "#FFFFFF"
                          : colors.text.primary
                      }
                    />
                    <Text
                      style={[
                        styles.categoryText,
                        {
                          color:
                            selectedCategory.id === category.id
                              ? "#FFFFFF"
                              : colors.text.primary,
                        },
                      ]}
                    >
                      {category.name}
                    </Text>
                    {autoDetectedCategory &&
                      selectedCategory.id === category.id && (
                        <View style={styles.autoDetectedBadge}>
                          <Text style={styles.autoDetectedText}>Auto</Text>
                        </View>
                      )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: colors.primary.main },
              loading && styles.saveButtonDisabled,
            ]}
            onPress={handleSaveTransaction}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading
                ? "Saving..."
                : `Save ${transactionType === "expense" ? "Expense" : "Income"}`}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  placeholder: {
    width: 40,
  },
  typeToggle: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 4,
    marginBottom: 30,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  typeButtonActive: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    // backgroundColor removed - applied dynamically for dark mode support
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: "600",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 14,
    paddingRight: 16,
    fontSize: 16,
    borderWidth: 0,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 100,
    justifyContent: "center",
    position: "relative",
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 6,
  },
  autoDetectedBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#10B981",
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  autoDetectedText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
