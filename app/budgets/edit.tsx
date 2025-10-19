import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
  Animated,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";
import { budgetAPI } from "../../services/api";
import { transactionAPI } from "../../services/api/transactionAPI";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";

const { width } = Dimensions.get("window");

export default function EditBudgetPage() {
  const router = useRouter();
  const { colors } = useTheme();
  const [categories, setCategories] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<Record<string, string>>({});
  const [mainBudget, setMainBudget] = useState<string>("2000");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  // Load user's saved budget on component mount
  useEffect(() => {
    loadUserBudget();
  }, []);

  // Animation on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
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
      let allocatedBudget = 0;
      let remainingCategories = 0;

      // First pass: allocate based on known weights
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

        if (weight > 0) {
          const suggestedBudget = Math.round(budgetAmount * weight);
          newBudgets[cat.id] = suggestedBudget.toString();
          allocatedBudget += suggestedBudget;
        } else {
          remainingCategories++;
        }
      });

      // Second pass: distribute remaining budget to unknown categories
      if (remainingCategories > 0) {
        const remainingBudget = budgetAmount - allocatedBudget;
        const perCategoryRemainder = Math.floor(
          remainingBudget / remainingCategories
        );

        categories.forEach((cat) => {
          if (!newBudgets[cat.id]) {
            newBudgets[cat.id] = perCategoryRemainder.toString();
          }
        });
      }
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
  const saveBudgetToDatabase = async (budgetAmount: number) => {
    try {
      // Save to backend database
      await budgetAPI.updateBudgetPreferences({
        monthlySpendingLimit: budgetAmount,
        updatedAt: new Date().toISOString(),
      });

      console.log("Budget saved successfully to database:", budgetAmount);
    } catch (error) {
      console.error("Error saving budget to database:", error);
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

      // Save main budget to database and storage
      await saveBudgetToDatabase(budgetAmount);

      // Convert category budgets by mapping category IDs back to names
      const categoryBudgetsByName: Record<string, number> = {};
      categories.forEach((cat) => {
        const budgetValue = parseFloat(budgets[cat.id]) || 0;
        if (budgetValue > 0) {
          categoryBudgetsByName[cat.name] = budgetValue;
        }
      });

      // Save category budgets to database
      try {
        await budgetAPI.updateBudgetPreferences({
          monthlySpendingLimit: budgetAmount,
          categoryBudgets: categoryBudgetsByName,
          alertThreshold: 80,
          currency: "GBP",
          updatedAt: new Date().toISOString(),
        });
        console.log("✅ Budget preferences saved to database");

        Alert.alert("Success", "Budgets saved successfully!", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } catch (dbError) {
        console.error("❌ Error saving to database:", dbError);
        throw dbError; // Re-throw to be caught by outer catch block
      }
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
        setCategories(generatedCategories);

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
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background.secondary,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text
          style={{ color: colors.text.primary, marginTop: 16, fontSize: 16 }}
        >
          Loading budget data...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background.secondary }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <Animated.View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingTop: 48,
          paddingHorizontal: 20,
          marginBottom: 8,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{ marginRight: 12, padding: 4 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={28} color={colors.text.primary} />
        </Pressable>
        <Text
          style={{
            fontSize: 28,
            fontWeight: "bold",
            color: colors.text.primary,
          }}
        >
          Edit Budgets
        </Text>
      </Animated.View>

      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 140 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Main Budget Card */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <View
            style={{
              backgroundColor: colors.background.primary,
              borderRadius: 20,
              padding: 24,
              marginBottom: 24,
              shadowColor: colors.primary[500],
              shadowOpacity: 0.1,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 4 },
              elevation: 8,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: colors.primary[100],
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 16,
                }}
              >
                <Ionicons name="wallet" size={24} color={colors.primary[600]} />
              </View>
              <View>
                <Text
                  style={{
                    color: colors.text.primary,
                    fontWeight: "700",
                    fontSize: 20,
                    marginBottom: 4,
                  }}
                >
                  Monthly Budget
                </Text>
                <Text
                  style={{
                    color: colors.text.secondary,
                    fontSize: 14,
                  }}
                >
                  Set your monthly spending limit
                </Text>
              </View>
            </View>

            <View
              style={{
                backgroundColor: colors.background.secondary,
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  color: colors.text.secondary,
                  fontSize: 16,
                  marginBottom: 8,
                  fontWeight: "600",
                }}
              >
                Budget Amount (£)
              </Text>
              <TextInput
                style={{
                  backgroundColor: colors.background.primary,
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 24,
                  color: colors.text.primary,
                  fontWeight: "bold",
                  borderWidth: 2,
                  borderColor: colors.primary[200],
                }}
                keyboardType="numeric"
                value={mainBudget}
                onChangeText={handleMainBudgetChange}
                placeholder="2000"
                accessibilityLabel="Set main budget"
              />
            </View>

            <View
              style={{
                backgroundColor: overBudget
                  ? colors.error[50]
                  : colors.success[50],
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: overBudget
                  ? colors.error[200]
                  : colors.success[200],
              }}
            >
              <Text
                style={{
                  color: overBudget ? colors.error[700] : colors.success[700],
                  fontWeight: "600",
                  fontSize: 16,
                  textAlign: "center",
                }}
              >
                {overBudget ? (
                  <>
                    ⚠️ Over budget by £
                    {(totalAssigned - mainBudgetNum).toFixed(2)}
                  </>
                ) : (
                  <>
                    Assigned: £{totalAssigned.toFixed(2)} / £
                    {mainBudgetNum.toFixed(2)}
                    {remaining > 0 && (
                      <Text style={{ color: colors.text.secondary }}>
                        {" "}
                        (£{remaining.toFixed(2)} remaining)
                      </Text>
                    )}
                  </>
                )}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Category Budgets */}
        {categories.length > 0 && (
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            <View
              style={{
                backgroundColor: colors.background.primary,
                borderRadius: 20,
                padding: 24,
                marginBottom: 24,
                shadowColor: colors.primary[500],
                shadowOpacity: 0.1,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 4 },
                elevation: 8,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: colors.primary[100],
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 16,
                  }}
                >
                  <Ionicons name="list" size={24} color={colors.primary[600]} />
                </View>
                <View>
                  <Text
                    style={{
                      color: colors.text.primary,
                      fontWeight: "700",
                      fontSize: 20,
                      marginBottom: 4,
                    }}
                  >
                    Category Budgets
                  </Text>
                  <Text
                    style={{
                      color: colors.text.secondary,
                      fontSize: 14,
                    }}
                  >
                    Auto-filled based on your spending
                  </Text>
                </View>
              </View>

              {categories.map((category, index) => (
                <Animated.View
                  key={category.id}
                  style={{
                    backgroundColor: colors.background.secondary,
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: colors.border.light,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: category.color + "20",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                      }}
                    >
                      <Ionicons
                        name={category.icon as any}
                        size={16}
                        color={category.color}
                      />
                    </View>
                    <Text
                      style={{
                        color: colors.text.primary,
                        fontWeight: "600",
                        fontSize: 16,
                        flex: 1,
                      }}
                    >
                      {category.name}
                    </Text>
                  </View>

                  <TextInput
                    style={{
                      backgroundColor: colors.background.primary,
                      borderRadius: 12,
                      padding: 12,
                      fontSize: 18,
                      color: colors.text.primary,
                      fontWeight: "600",
                      borderWidth: 1,
                      borderColor: colors.border.light,
                    }}
                    keyboardType="numeric"
                    value={budgets[category.id] || ""}
                    onChangeText={(value) =>
                      handleCategoryBudgetChange(category.id, value)
                    }
                    placeholder="0"
                  />
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Save Button */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={{
              backgroundColor: saving
                ? colors.primary[300]
                : colors.primary[500],
              borderRadius: 16,
              padding: 18,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              shadowColor: colors.primary[500],
              shadowOpacity: 0.3,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 4 },
              elevation: 6,
            }}
          >
            {saving ? (
              <ActivityIndicator
                size="small"
                color="white"
                style={{ marginRight: 8 }}
              />
            ) : (
              <Ionicons
                name="checkmark-circle"
                size={20}
                color="white"
                style={{ marginRight: 8 }}
              />
            )}
            <Text
              style={{
                color: "white",
                fontWeight: "700",
                fontSize: 18,
              }}
            >
              {saving ? "Saving..." : "Save Budget"}
            </Text>
          </Pressable>
        </Animated.View>
      </Animated.ScrollView>
    </KeyboardAvoidingView>
  );
}
