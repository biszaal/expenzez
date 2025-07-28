import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";
import { bankingAPI } from "../../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";

export default function EditBudgetPage() {
  const router = useRouter();
  const { colors } = useTheme();
  const [categories, setCategories] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<Record<string, string>>({});
  const [mainBudget, setMainBudget] = useState<string>("2000");
  const [loading, setLoading] = useState(true);

  // Generate categories dynamically from transaction data (same logic as spending tab)
  const generateCategoriesFromTransactions = (transactions: any[]) => {
    const categoryMap = new Map<string, { count: number; totalSpent: number }>();
    
    transactions.forEach(tx => {
      if (tx.amount < 0) { // Only expenses
        const category = tx.category || "Other";
        const existing = categoryMap.get(category) || { count: 0, totalSpent: 0 };
        categoryMap.set(category, {
          count: existing.count + 1,
          totalSpent: existing.totalSpent + Math.abs(tx.amount)
        });
      }
    });

    const categories = Array.from(categoryMap.entries()).map(([name, data], index) => ({
      id: name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase(),
      name,
      icon: getCategoryIcon(name),
      color: getCategoryColor(name, index)
    }));

    return categories;
  };

  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('food') || name.includes('dining') || name.includes('restaurant')) return 'restaurant-outline';
    if (name.includes('transport') || name.includes('travel') || name.includes('uber') || name.includes('taxi')) return 'car-outline';
    if (name.includes('shop') || name.includes('retail') || name.includes('amazon')) return 'bag-outline';
    if (name.includes('entertainment') || name.includes('game') || name.includes('movie')) return 'game-controller-outline';
    if (name.includes('bill') || name.includes('utility') || name.includes('electric') || name.includes('gas')) return 'flash-outline';
    if (name.includes('health') || name.includes('fitness') || name.includes('gym') || name.includes('medical')) return 'fitness-outline';
    return 'pricetag-outline';
  };

  const getCategoryColor = (categoryName: string, index: number) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#95A5A6'];
    return colors[index % colors.length];
  };

  React.useEffect(() => {
    const loadData = async () => {
      try {
        // Load existing budgets from storage
        const storedMainBudget = await AsyncStorage.getItem('mainBudget');
        const storedCategoryBudgets = await AsyncStorage.getItem('categoryBudgets');
        
        if (storedMainBudget) {
          setMainBudget(storedMainBudget);
        }

        // Fetch transactions to generate categories
        const transactionsData = await bankingAPI.getAllTransactions();
        let allTransactions: any[] = [];
        
        if (transactionsData.transactions && Array.isArray(transactionsData.transactions)) {
          allTransactions = transactionsData.transactions.map((tx: any, idx: number) => ({
            id: tx.transactionId || tx.id || `tx-${idx}`,
            amount: tx.type === 'debit' ? -Math.abs(Number(tx.amount || 0)) : Math.abs(Number(tx.amount || 0)),
            category: tx.category || "Other",
            date: tx.date || tx.createdAt || new Date().toISOString(),
          }));
        }

        const dynamicCategories = generateCategoriesFromTransactions(allTransactions);
        setCategories(dynamicCategories);

        // Set up budget state
        const initialBudgets: Record<string, string> = {};
        const parsedStoredBudgets = storedCategoryBudgets ? JSON.parse(storedCategoryBudgets) : {};
        
        dynamicCategories.forEach(cat => {
          // Use stored budget if available, otherwise default to 0
          initialBudgets[cat.id] = String(parsedStoredBudgets[cat.id] || 0);
        });
        
        setBudgets(initialBudgets);
      } catch (error) {
        console.error("Error loading budget data:", error);
        Alert.alert("Error", "Failed to load budget data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleBudgetChange = (id: string, value: string) => {
    setBudgets((prev) => ({ ...prev, [id]: value.replace(/[^0-9.]/g, "") }));
  };

  const handleMainBudgetChange = (value: string) => {
    setMainBudget(value.replace(/[^0-9.]/g, ""));
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
      // Save main budget
      await AsyncStorage.setItem('mainBudget', mainBudget);
      
      // Convert string budgets to numbers and save
      const numericBudgets: Record<string, number> = {};
      Object.entries(budgets).forEach(([id, value]) => {
        numericBudgets[id] = parseFloat(value) || 0;
      });
      
      await AsyncStorage.setItem('categoryBudgets', JSON.stringify(numericBudgets));
      
      Alert.alert("Success", "Budgets saved successfully!", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error("Error saving budgets:", error);
      Alert.alert("Error", "Failed to save budgets. Please try again.");
    }
  };

  if (loading)
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading...</Text>
      </View>
    );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background.secondary }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingTop: 48,
          paddingHorizontal: 20,
          marginBottom: 8,
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
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 140 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Main Budget */}
        <View
          style={{
            backgroundColor: colors.background.primary,
            borderRadius: 18,
            padding: 20,
            marginBottom: 24,
            shadowColor: colors.primary[500],
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 2,
          }}
        >
          <Text
            style={{
              color: colors.text.primary,
              fontWeight: "700",
              fontSize: 20,
              marginBottom: 8,
            }}
          >
            Main Budget (£)
          </Text>
          <TextInput
            style={{
              backgroundColor: colors.background.secondary,
              borderRadius: 8,
              padding: 14,
              fontSize: 20,
              color: colors.text.primary,
              borderWidth: 1,
              borderColor: colors.border.light,
              fontWeight: "bold",
              marginBottom: 10,
            }}
            keyboardType="numeric"
            value={mainBudget}
            onChangeText={handleMainBudgetChange}
            placeholder="Enter main budget (£)"
            accessibilityLabel="Set main budget"
          />
          <Text
            style={{
              color: overBudget
                ? typeof colors.error === "string"
                  ? colors.error
                  : colors.error[500]
                : typeof colors.text.secondary === "string"
                  ? colors.text.secondary
                  : colors.text.secondary[500],
              fontWeight: "600",
              fontSize: 16,
            }}
          >
            Assigned: £{totalAssigned.toFixed(2)} / £{mainBudgetNum.toFixed(2)}
          </Text>
          {overBudget && (
            <Text
              style={{
                color:
                  typeof colors.error === "string"
                    ? colors.error
                    : colors.error[500],
                marginTop: 4,
                fontWeight: "600",
              }}
            >
              Assigned budgets exceed the main budget!
            </Text>
          )}
        </View>
        {/* Category Budgets */}
        {categories.map((cat) => (
          <View
            key={cat.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 22,
              backgroundColor: colors.background.primary,
              borderRadius: 18,
              paddingVertical: 20,
              paddingHorizontal: 18,
              shadowColor: colors.primary[500],
              shadowOpacity: 0.08,
              shadowRadius: 10,
              elevation: 2,
            }}
          >
            {/* Icon */}
            <View
              style={{
                marginRight: 16,
                backgroundColor: colors.background.secondary,
                borderRadius: 999,
                padding: 10,
              }}
            >
              <Ionicons
                name={cat.icon || "pricetag-outline"}
                size={28}
                color={colors.primary[500]}
              />
            </View>
            {/* Name and Input */}
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text
                style={{
                  color: colors.text.primary,
                  fontWeight: "600",
                  fontSize: 18,
                  marginRight: 12,
                  flexShrink: 1,
                }}
                numberOfLines={1}
              >
                {cat.name}
              </Text>
              <TextInput
                style={{
                  backgroundColor: colors.background.secondary,
                  borderRadius: 10,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  fontSize: 18,
                  color: colors.text.primary,
                  borderWidth: 1,
                  borderColor: colors.border.light,
                  minWidth: 90,
                  textAlign: "right",
                }}
                keyboardType="numeric"
                value={budgets[cat.id]}
                onChangeText={(v) => handleBudgetChange(cat.id, v)}
                placeholder="£0"
                accessibilityLabel={`Set budget for ${cat.name}`}
              />
            </View>
          </View>
        ))}
      </ScrollView>
      {/* Sticky Save Button */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: colors.background.secondary,
          padding: 20,
          borderTopWidth: 1,
          borderTopColor: colors.border.light,
        }}
      >
        <Pressable
          style={{
            backgroundColor: overBudget
              ? colors.border.light
              : colors.primary[500],
            borderRadius: 14,
            paddingVertical: 18,
            alignItems: "center",
            opacity: overBudget ? 0.6 : 1,
          }}
          onPress={handleSave}
          accessibilityRole="button"
          accessibilityLabel="Save budgets"
          disabled={overBudget}
        >
          <Text style={{ color: "#FFF", fontWeight: "bold", fontSize: 20 }}>
            Save
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
