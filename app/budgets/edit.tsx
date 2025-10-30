import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";
import { budgetAPI } from "../../services/api";
import { transactionAPI } from "../../services/api/transactionAPI";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { spacing, borderRadius } from "../../constants/theme";

export default function EditBudgetPage() {
  const router = useRouter();
  const { colors } = useTheme();
  const [categories, setCategories] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<Record<string, string>>({});
  const [mainBudget, setMainBudget] = useState<string>("2000");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load user's saved budget on component mount
  useEffect(() => {
    loadUserBudget();
  }, []);

  // Load user's saved budget from database
  const loadUserBudget = async () => {
    try {
      const budgetPreferences = await budgetAPI.getBudgetPreferences();
      if (budgetPreferences.monthlySpendingLimit) {
        setMainBudget(budgetPreferences.monthlySpendingLimit.toString());
      }
    } catch (error) {
      console.error("Error loading user budget from database:", error);
      // Fallback to default if database fails
      setMainBudget("2000");
    }
  };

  // Smart budget distribution weights based on typical spending patterns
  const getSmartWeights = (): Record<string, number> => {
    // Common budget allocation percentages (should add up to 1.0)
    return {
      "Food & dining": 0.25, // 25% - Groceries and dining out
      Food: 0.25,
      Groceries: 0.2,
      Dining: 0.15,
      Restaurant: 0.15,
      Shopping: 0.15, // 15% - Retail and personal items
      Retail: 0.15,
      Transportation: 0.12, // 12% - Gas, public transit, car
      Transport: 0.12,
      Car: 0.1,
      Gas: 0.08,
      Bills: 0.2, // 20% - Utilities, phone, internet
      Utilities: 0.15,
      Entertainment: 0.1, // 10% - Movies, hobbies, fun
      Recreation: 0.1,
      Health: 0.08, // 8% - Medical, fitness, wellness
      Healthcare: 0.08,
      Fitness: 0.05,
      Personal: 0.05, // 5% - Personal care
      Education: 0.05, // 5% - Learning, courses
      Other: 0.05, // 5% - Miscellaneous
    };
  };

  // Smart auto-fill budgets based on historical spending or smart weights
  const autoFillBudgets = (budgetAmount: number) => {
    if (budgetAmount <= 0 || categories.length === 0) {
      return;
    }

    // Calculate total historical spending across all categories
    const totalSpent = categories.reduce(
      (sum, cat) => sum + (cat.totalSpent || 0),
      0
    );

    const newBudgets: Record<string, string> = {};

    if (totalSpent > 0) {
      // Distribute based on actual spending proportions
      categories.forEach((cat) => {
        const proportion = (cat.totalSpent || 0) / totalSpent;
        const suggestedBudget = Math.round(budgetAmount * proportion);
        newBudgets[cat.id] = suggestedBudget.toString();
      });
    } else {
      // Smart distribution based on typical spending patterns
      const smartWeights = getSmartWeights();
      const categoryWeights: { id: string; weight: number }[] = [];
      let totalWeight = 0;

      // Assign weights to each category
      categories.forEach((cat) => {
        const categoryName = cat.name.toLowerCase();
        let weight = smartWeights[cat.name] || 0;

        // Check for partial matches if exact match not found
        if (weight === 0) {
          const matchingKey = Object.keys(smartWeights).find(
            (key) =>
              categoryName.includes(key.toLowerCase()) ||
              key.toLowerCase().includes(categoryName)
          );
          weight = matchingKey ? smartWeights[matchingKey] : 0;
        }

        // Default weight for unknown categories
        if (weight === 0) {
          weight = 0.05; // 5% default
        }

        categoryWeights.push({ id: cat.id, weight });
        totalWeight += weight;
      });

      // Normalize weights to ensure they sum to 1.0
      let allocatedBudget = 0;
      categoryWeights.forEach((item, index) => {
        const normalizedWeight = item.weight / totalWeight;
        const suggestedBudget =
          index === categoryWeights.length - 1
            ? budgetAmount - allocatedBudget // Last category gets remainder to avoid rounding errors
            : Math.round(budgetAmount * normalizedWeight);

        // Ensure budget is never negative
        newBudgets[item.id] = Math.max(0, suggestedBudget).toString();
        allocatedBudget += suggestedBudget;
      });
    }

    setBudgets(newBudgets);
  };

  // Auto-fill budgets when main budget or categories change
  useEffect(() => {
    const budgetAmount = parseFloat(mainBudget) || 0;
    if (budgetAmount > 0 && categories.length > 0) {
      autoFillBudgets(budgetAmount);
    }
  }, [mainBudget, categories.length]);

  // Save budget to database
  const saveBudgetToDatabase = async (
    budgetAmount: number,
    categoryBudgetsByName: Record<string, number>
  ) => {
    try {
      // Save to backend database with category budgets
      await budgetAPI.updateBudgetPreferences({
        monthlySpendingLimit: budgetAmount,
        categoryBudgets: categoryBudgetsByName,
        alertThreshold: 80,
        currency: "GBP",
      });

      console.log(
        "Budget and category budgets saved successfully to DynamoDB:",
        {
          mainBudget: budgetAmount,
          categoryBudgets: categoryBudgetsByName,
        }
      );
    } catch (error) {
      console.error("Error saving budget to DynamoDB:", error);
      throw error;
    }
  };

  // Generate categories dynamically from transaction data
  const generateCategoriesFromTransactions = (transactions: any[]) => {
    const categoryMap = new Map<
      string,
      { count: number; totalSpent: number }
    >();

    transactions.forEach((tx) => {
      if (tx.amount < 0) {
        // Only expenses
        const rawCategory = tx.category || "Other";
        // Normalize category: capitalize first letter, lowercase rest
        const category =
          rawCategory.charAt(0).toUpperCase() +
          rawCategory.slice(1).toLowerCase();

        const existing = categoryMap.get(category) || {
          count: 0,
          totalSpent: 0,
        };
        categoryMap.set(category, {
          count: existing.count + 1,
          totalSpent: existing.totalSpent + Math.abs(tx.amount),
        });
      }
    });

    const categories = Array.from(categoryMap.entries()).map(
      ([name, data], index) => ({
        id: `${name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()}_${index}`,
        name,
        icon: getCategoryIcon(name),
        color: getCategoryColor(name, index),
      })
    );

    return categories;
  };

  const getCategoryIcon = (categoryName: string) => {
    const iconMap: Record<string, string> = {
      "Food & Dining": "restaurant",
      Transportation: "car",
      Shopping: "bag",
      Entertainment: "film",
      Bills: "receipt",
      Health: "medical",
      Other: "ellipsis-horizontal",
    };
    return iconMap[categoryName] || "ellipsis-horizontal";
  };

  const getCategoryColor = (categoryName: string, index: number) => {
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#FFEAA7",
      "#DDA0DD",
      "#98D8C8",
      "#F7DC6F",
      "#BB8FCE",
      "#85C1E9",
    ];
    return colors[index % colors.length];
  };

  const handleMainBudgetChange = (text: string) => {
    // Only allow numbers and one decimal point
    const cleaned = text.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length <= 2) {
      setMainBudget(cleaned);
    }
  };

  const handleCategoryBudgetChange = (categoryId: string, value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length <= 2) {
      setBudgets((prev) => ({
        ...prev,
        [categoryId]: cleaned,
      }));
    }
  };

  const totalAssigned = Object.values(budgets).reduce(
    (sum, v) => sum + (parseFloat(v) || 0),
    0
  );
  const mainBudgetNum = parseFloat(mainBudget) || 0;
  const remaining = mainBudgetNum - totalAssigned;
  const overBudget = totalAssigned > mainBudgetNum;

  const handleSave = async () => {
    if (overBudget) {
      Alert.alert("Over Budget", "Assigned budgets exceed the main budget.");
      return;
    }

    try {
      setSaving(true);

      const budgetAmount = parseFloat(mainBudget);
      if (isNaN(budgetAmount) || budgetAmount <= 0) {
        Alert.alert("Invalid Amount", "Please enter a valid budget amount.");
        return;
      }

      // Convert category budgets by mapping category IDs back to names
      const categoryBudgetsByName: Record<string, number> = {};
      categories.forEach((cat) => {
        const budgetValue = parseFloat(budgets[cat.id]) || 0;
        if (budgetValue > 0) {
          categoryBudgetsByName[cat.name] = budgetValue;
        }
      });

      // Save main budget and category budgets to DynamoDB
      await saveBudgetToDatabase(budgetAmount, categoryBudgetsByName);

      Alert.alert("Success", "Budgets saved successfully!", [
        { text: "OK", onPress: () => router.replace("/budgets") },
      ]);
    } catch (error) {
      console.error("Error saving budget:", error);
      Alert.alert("Error", "Failed to save budget. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load transactions to generate categories
        const transactionsResponse = await transactionAPI.getTransactions({
          limit: 1000,
        });
        const transactions = transactionsResponse.transactions || [];

        // Generate categories from transactions
        const generatedCategories =
          generateCategoriesFromTransactions(transactions);

        // If no categories from transactions, show default categories for new users
        if (generatedCategories.length === 0) {
          const defaultCategories = [
            {
              id: "food_dining",
              name: "Food & Dining",
              icon: "restaurant",
              totalSpent: 0,
              count: 0,
            },
            {
              id: "transportation",
              name: "Transportation",
              icon: "car",
              totalSpent: 0,
              count: 0,
            },
            {
              id: "shopping",
              name: "Shopping",
              icon: "bag",
              totalSpent: 0,
              count: 0,
            },
            {
              id: "entertainment",
              name: "Entertainment",
              icon: "game-controller",
              totalSpent: 0,
              count: 0,
            },
            {
              id: "utilities",
              name: "Utilities",
              icon: "flash",
              totalSpent: 0,
              count: 0,
            },
            {
              id: "healthcare",
              name: "Healthcare",
              icon: "medical",
              totalSpent: 0,
              count: 0,
            },
            {
              id: "other",
              name: "Other",
              icon: "ellipsis-horizontal",
              totalSpent: 0,
              count: 0,
            },
          ];
          setCategories(defaultCategories);
        } else {
          setCategories(generatedCategories);
        }

        // Load existing category budgets
        try {
          const savedBudgets = await AsyncStorage.getItem("categoryBudgets");
          if (savedBudgets) {
            const parsed = JSON.parse(savedBudgets);
            setBudgets(parsed);
          }
        } catch (error) {
          console.log("No existing category budgets found");
        }
      } catch (error) {
        console.error("Error loading data:", error);
        Alert.alert("Error", "Failed to load budget data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background.primary },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary.main} />
        <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
          Loading budget data...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background.primary,
            borderBottomColor: colors.border.light,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.replace("/budgets")}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back to budgets"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Edit Budgets
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Main Budget Card */}
        <View
          style={[
            styles.mainCard,
            { backgroundColor: colors.background.secondary },
          ]}
        >
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.primary.main[100] },
              ]}
            >
              <Ionicons name="wallet" size={24} color={colors.primary.main[600]} />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.cardTitle, { color: colors.text.primary }]}>
                Monthly Budget
              </Text>
              <Text
                style={[styles.cardSubtitle, { color: colors.text.secondary }]}
              >
                Set your monthly spending limit
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.inputSection,
              { backgroundColor: colors.background.primary },
            ]}
          >
            <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>
              Budget Amount (£)
            </Text>
            <TextInput
              style={[
                styles.mainInput,
                {
                  backgroundColor: colors.background.secondary,
                  color: colors.text.primary,
                  borderColor: colors.border.light,
                },
              ]}
              keyboardType="numeric"
              value={mainBudget}
              onChangeText={handleMainBudgetChange}
              placeholder="2000"
              accessibilityLabel="Set main budget"
            />
          </View>

          <View
            style={[
              styles.statusContainer,
              {
                backgroundColor: overBudget
                  ? colors.error[50]
                  : colors.success[50],
                borderColor: overBudget
                  ? colors.error[200]
                  : colors.success[200],
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: overBudget ? colors.error[700] : colors.success[700] },
              ]}
            >
              {overBudget
                ? `⚠️ Over budget by £${(totalAssigned - mainBudgetNum).toFixed(2)}`
                : `Assigned: £${totalAssigned.toFixed(2)} / £${mainBudgetNum.toFixed(2)}` +
                  (remaining > 0
                    ? ` (£${remaining.toFixed(2)} remaining)`
                    : "")}
            </Text>
          </View>
        </View>

        {/* Category Budgets */}
        {categories.length > 0 && (
          <View
            style={[
              styles.categoryCard,
              { backgroundColor: colors.background.secondary },
            ]}
          >
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: colors.primary.main[100] },
                ]}
              >
                <Ionicons name="list" size={24} color={colors.primary.main[600]} />
              </View>
              <View style={styles.headerText}>
                <Text
                  style={[styles.cardTitle, { color: colors.text.primary }]}
                >
                  Category Budgets
                </Text>
                <Text
                  style={[
                    styles.cardSubtitle,
                    { color: colors.text.secondary },
                  ]}
                >
                  Auto-filled based on your spending
                </Text>
              </View>
            </View>

            {categories.map((category) => (
              <View
                key={category.id}
                style={[
                  styles.categoryItem,
                  {
                    backgroundColor: colors.background.primary,
                    borderColor: colors.border.light,
                  },
                ]}
              >
                <View style={styles.categoryHeader}>
                  <View
                    style={[
                      styles.categoryIcon,
                      { backgroundColor: category.color + "20" },
                    ]}
                  >
                    <Ionicons
                      name={category.icon as any}
                      size={16}
                      color={category.color}
                    />
                  </View>
                  <Text
                    style={[
                      styles.categoryName,
                      { color: colors.text.primary },
                    ]}
                  >
                    {category.name}
                  </Text>
                </View>

                <TextInput
                  style={[
                    styles.categoryInput,
                    {
                      backgroundColor: colors.background.secondary,
                      color: colors.text.primary,
                      borderColor: colors.border.light,
                    },
                  ]}
                  keyboardType="numeric"
                  value={budgets[category.id] || ""}
                  onChangeText={(value) =>
                    handleCategoryBudgetChange(category.id, value)
                  }
                  placeholder="0"
                />
              </View>
            ))}
          </View>
        )}

        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={[
            styles.saveButton,
            {
              backgroundColor: saving
                ? colors.primary.main[300]
                : colors.primary.main,
            },
          ]}
        >
          {saving ? (
            <ActivityIndicator
              size="small"
              color="white"
              style={styles.buttonIcon}
            />
          ) : (
            <Ionicons
              name="checkmark-circle"
              size={20}
              color="white"
              style={styles.buttonIcon}
            />
          )}
          <Text style={styles.saveButtonText}>
            {saving ? "Saving..." : "Save Budget"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    fontWeight: "500",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.sm,
    paddingBottom: 100,
  },
  mainCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  inputSection: {
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  mainInput: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: 24,
    fontWeight: "700",
    borderWidth: 2,
  },
  statusContainer: {
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  categoryItem: {
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    borderWidth: 1,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  categoryInput: {
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: 16,
    fontWeight: "600",
    borderWidth: 1,
  },
  saveButton: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonIcon: {
    marginRight: spacing.sm,
  },
  saveButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
});
