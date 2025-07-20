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
import { getSpendingCategories } from "../../services/dataSource";
import { Ionicons } from "@expo/vector-icons";

export default function EditBudgetPage() {
  const router = useRouter();
  const { colors } = useTheme();
  const [categories, setCategories] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<Record<string, string>>({});
  const [mainBudget, setMainBudget] = useState<string>("2000");
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    getSpendingCategories().then((cats) => {
      setCategories(cats);
      setBudgets(
        Object.fromEntries(
          cats.map((c: any) => [c.id, String(c.defaultBudget || 0)])
        )
      );
      setLoading(false);
    });
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

  const handleSave = () => {
    if (overBudget) {
      Alert.alert("Over Budget", "Assigned budgets exceed the main budget.");
      return;
    }
    // TODO: Save budgets to backend or local state
    router.back();
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
              color: overBudget ? colors.error : colors.text.secondary,
              fontWeight: "600",
              fontSize: 16,
            }}
          >
            Assigned: £{totalAssigned.toFixed(2)} / £{mainBudgetNum.toFixed(2)}
          </Text>
          {overBudget && (
            <Text
              style={{ color: colors.error, marginTop: 4, fontWeight: "600" }}
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
