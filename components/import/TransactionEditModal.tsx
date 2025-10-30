import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import {
  CategorizeTransaction,
  TRANSACTION_CATEGORIES,
} from "../../services/categorizeTransaction";

export interface EditableTransaction {
  id: string;
  date: string;
  description?: string; // Now optional
  amount: number;
  category: string;
  type: "debit" | "credit";
  merchant: string; // Now mandatory
}

interface TransactionEditModalProps {
  visible: boolean;
  transaction: EditableTransaction | null;
  onClose: () => void;
  onSave: (transaction: EditableTransaction) => void;
}

export const TransactionEditModal: React.FC<TransactionEditModalProps> = ({
  visible,
  transaction,
  onClose,
  onSave,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [editedTransaction, setEditedTransaction] = useState<EditableTransaction | null>(
    transaction
  );
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const [amountText, setAmountText] = useState<string>(
    editedTransaction?.amount.toString() || "0"
  );

  // Update state when transaction prop changes
  React.useEffect(() => {
    setEditedTransaction(transaction);
    if (transaction) {
      setAmountText(transaction.amount.toString());
    }
  }, [transaction]);

  if (!editedTransaction) return null;

  const handleSave = () => {
    // Parse amount from text input
    const parsedAmount = parseFloat(amountText);

    if (
      editedTransaction.merchant.trim() &&
      !isNaN(parsedAmount) &&
      parsedAmount > 0
    ) {
      const transactionToSave = {
        ...editedTransaction,
        amount: Math.abs(parsedAmount),
      };
      onSave(transactionToSave);
      onClose();
    }
  };

  const updateField = <K extends keyof EditableTransaction>(
    key: K,
    value: EditableTransaction[K]
  ) => {
    setEditedTransaction((prev) =>
      prev ? { ...prev, [key]: value } : null
    );
  };

  const handleDateChange = (newDate: string) => {
    // Simple date validation
    const date = new Date(newDate);
    if (!isNaN(date.getTime())) {
      updateField("date", date.toISOString());
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: colors.background.primary },
        ]}
        edges={["top", "left", "right"]}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.background.secondary,
              paddingTop: insets.top + 12,
            },
          ]}
        >
          <TouchableOpacity onPress={onClose}>
            <Ionicons
              name="close"
              size={24}
              color={colors.primary.main}
            />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Edit Transaction
          </Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={
              !editedTransaction.merchant.trim() ||
              !amountText ||
              parseFloat(amountText) <= 0
            }
          >
            <Ionicons
              name="checkmark"
              size={24}
              color={
                editedTransaction.merchant.trim() &&
                amountText &&
                parseFloat(amountText) > 0
                  ? colors.primary.main
                  : colors.text.secondary
              }
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Date Field */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.text.primary }]}>
              Date
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background.secondary,
                  color: colors.text.primary,
                  borderColor: colors.primary.main[200],
                },
              ]}
              value={new Date(editedTransaction.date)
                .toISOString()
                .split("T")[0]}
              onChangeText={handleDateChange}
              placeholderTextColor={colors.text.secondary}
              placeholder="YYYY-MM-DD"
            />
          </View>

          {/* Merchant Name Field (Mandatory) */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.text.primary }]}>
              Merchant Name *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background.secondary,
                  color: colors.text.primary,
                  borderColor: colors.primary.main[200],
                },
              ]}
              value={editedTransaction.merchant}
              onChangeText={(text) => updateField("merchant", text)}
              placeholderTextColor={colors.text.secondary}
              placeholder="Enter merchant name"
            />
          </View>

          {/* Description Field (Optional) */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.text.primary }]}>
              Description (Optional)
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background.secondary,
                  color: colors.text.primary,
                  borderColor: colors.primary.main[200],
                },
              ]}
              value={editedTransaction.description || ""}
              onChangeText={(text) => updateField("description", text)}
              placeholderTextColor={colors.text.secondary}
              placeholder="Add additional notes"
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Amount Field */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.text.primary }]}>
              Amount (£)
            </Text>
            <View style={styles.amountInputContainer}>
              <Text style={[styles.currencySymbol, { color: colors.text.primary }]}>
                £
              </Text>
              <TextInput
                style={[
                  styles.amountInput,
                  {
                    backgroundColor: colors.background.secondary,
                    color: colors.text.primary,
                    borderColor: colors.primary.main[200],
                  },
                ]}
                value={amountText}
                onChangeText={(text) => {
                  // Allow free typing of decimal numbers
                  setAmountText(text);
                }}
                placeholderTextColor={colors.text.secondary}
                placeholder="0.00"
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>

          {/* Type Field */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.text.primary }]}>
              Type
            </Text>
            <View style={styles.typeContainer}>
              {(["debit", "credit"] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    {
                      backgroundColor:
                        editedTransaction.type === type
                          ? colors.primary.main
                          : colors.background.secondary,
                      borderColor:
                        editedTransaction.type === type
                          ? colors.primary.main
                          : colors.primary.main[200],
                    },
                  ]}
                  onPress={() => updateField("type", type)}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      {
                        color:
                          editedTransaction.type === type
                            ? "#fff"
                            : colors.text.primary,
                      },
                    ]}
                  >
                    {type === "debit" ? "Expense" : "Income"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Category Field */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.text.primary }]}>
              Category
            </Text>
            <TouchableOpacity
              style={[
                styles.categoryButton,
                {
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.primary.main[200],
                },
              ]}
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            >
              <Text style={[styles.categoryButtonText, { color: colors.text.primary }]}>
                {CategorizeTransaction.getCategoryEmoji(
                  editedTransaction.category
                )}{" "}
                {CategorizeTransaction.getCategoryName(
                  editedTransaction.category
                )}
              </Text>
              <Ionicons
                name={showCategoryPicker ? "chevron-up" : "chevron-down"}
                size={20}
                color={colors.primary.main}
              />
            </TouchableOpacity>

            {showCategoryPicker && (
              <View
                style={[
                  styles.categoryPicker,
                  { backgroundColor: colors.background.secondary },
                ]}
              >
                {TRANSACTION_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryOption,
                      {
                        backgroundColor:
                          editedTransaction.category === cat.id
                            ? colors.primary.main[50]
                            : "transparent",
                        borderBottomColor: colors.background.tertiary,
                      },
                    ]}
                    onPress={() => {
                      updateField("category", cat.id);
                      setShowCategoryPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.categoryOptionText,
                        {
                          color:
                            editedTransaction.category === cat.id
                              ? colors.primary.main
                              : colors.text.primary,
                        },
                      ]}
                    >
                      {cat.emoji} {cat.name}
                    </Text>
                    {editedTransaction.category === cat.id && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={colors.primary.main}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 5,
    color: "#6B7280",
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 11,
    fontSize: 14,
    minHeight: 40,
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 6,
    borderColor: "#E5E7EB",
  },
  currencySymbol: {
    paddingLeft: 12,
    fontSize: 16,
    fontWeight: "600",
  },
  amountInput: {
    flex: 1,
    borderWidth: 0,
    padding: 11,
    fontSize: 14,
    minHeight: 40,
  },
  typeContainer: {
    flexDirection: "row",
    gap: 10,
  },
  typeButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    alignItems: "center",
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  categoryButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 11,
    paddingVertical: 9,
    minHeight: 40,
  },
  categoryButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },
  categoryPicker: {
    marginTop: 8,
    borderRadius: 6,
    maxHeight: 250,
    paddingVertical: 0,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  categoryOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderBottomWidth: 1,
  },
  categoryOptionText: {
    fontSize: 13,
    fontWeight: "500",
  },
});
