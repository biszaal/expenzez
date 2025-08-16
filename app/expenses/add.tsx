import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { expenseAPI } from "../../services/api";

const categories = [
  "Groceries",
  "Transport",
  "Dining",
  "Shopping",
  "Bills",
  "Health",
  "Entertainment",
  "Other",
];

export default function AddExpensePage() {
  const { colors } = useTheme();
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!amount || isNaN(Number(amount))) {
      Alert.alert("Invalid amount", "Please enter a valid amount.");
      return;
    }

    const numericAmount = parseFloat(amount);
    if (numericAmount <= 0) {
      Alert.alert("Invalid amount", "Amount must be greater than zero.");
      return;
    }

    setLoading(true);

    try {
      await expenseAPI.createExpense({
        amount: numericAmount,
        category: category.toLowerCase(),
        description: description.trim() || undefined,
        date: date.toISOString(),
      });

      Alert.alert("Success", "Your expense has been added successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error("Error creating expense:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to add expense. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background.secondary }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", padding: 16 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginRight: 12 }}
        >
          <Ionicons name="chevron-back" size={28} color={colors.primary[500]} />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 22,
            fontWeight: "700",
            color: colors.text.primary,
          }}
        >
          Add Expense
        </Text>
      </View>
      <View style={{ flex: 1, padding: 24 }}>
        <Text style={styles.label}>Amount</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.background.primary,
              color: colors.text.primary,
              borderColor: colors.border.light,
            },
          ]}
          placeholder="0.00"
          placeholderTextColor={colors.text.tertiary}
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />

        <Text style={styles.label}>Category</Text>
        <View
          style={[
            styles.picker,
            {
              backgroundColor: colors.background.primary,
              borderColor: colors.border.light,
            },
          ]}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryOption,
                category === cat && { backgroundColor: colors.primary[100] },
              ]}
              onPress={() => setCategory(cat)}
            >
              <Text
                style={{
                  color:
                    category === cat
                      ? colors.primary[600]
                      : colors.text.primary,
                }}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Date</Text>
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          style={[
            styles.input,
            {
              backgroundColor: colors.background.primary,
              borderColor: colors.border.light,
              flexDirection: "row",
              alignItems: "center",
            },
          ]}
        >
          <Ionicons
            name="calendar-outline"
            size={20}
            color={colors.primary[500]}
            style={{ marginRight: 8 }}
          />
          <Text style={{ color: colors.text.primary }}>
            {date.toDateString()}
          </Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={(_, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) setDate(selectedDate);
            }}
          />
        )}

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.background.primary,
              color: colors.text.primary,
              borderColor: colors.border.light,
              height: 80,
              textAlignVertical: "top",
            },
          ]}
          placeholder="Description (optional)"
          placeholderTextColor={colors.text.tertiary}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <TouchableOpacity
          style={{
            backgroundColor: loading ? colors.gray[400] : colors.primary[500],
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: "center",
            marginTop: 32,
            opacity: loading ? 0.7 : 1,
          }}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
              Add Expense
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  label: {
    fontWeight: "600",
    fontSize: 15,
    marginBottom: 6,
    marginTop: 18,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 8,
  },
  picker: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 8,
    padding: 6,
  },
  categoryOption: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 6,
  },
});
