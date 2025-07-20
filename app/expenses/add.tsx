import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";

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

  const handleSubmit = () => {
    if (!amount || isNaN(Number(amount))) {
      Alert.alert("Invalid amount", "Please enter a valid amount.");
      return;
    }
    // For now, just log the data
    console.log({ amount, category, date, description });
    Alert.alert("Expense Added", "Your expense has been added!", [
      { text: "OK", onPress: () => router.back() },
    ]);
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
            backgroundColor: colors.primary[500],
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: "center",
            marginTop: 32,
          }}
          onPress={handleSubmit}
        >
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
            Add Expense
          </Text>
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
