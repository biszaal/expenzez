import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../contexts/ThemeContext";
import { spacing, borderRadius } from "../constants/theme";
import dayjs from "dayjs";

interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  merchant: string;
  category?: string;
  type: "debit" | "credit";
  originalAmount: number;
}

interface EditTransactionModalProps {
  visible: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onSave: (transactionId: string, updates: Partial<Transaction>) => Promise<void>;
  onDelete: (transactionId: string) => Promise<void>;
}

const CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Bills & Utilities",
  "Healthcare",
  "Groceries",
  "Travel",
  "Education",
  "Personal Care",
  "Home",
  "Gifts & Donations",
  "Other",
];

export default function EditTransactionModal({
  visible,
  transaction,
  onClose,
  onSave,
  onDelete,
}: EditTransactionModalProps) {
  const { colors } = useTheme();

  const [description, setDescription] = useState("");
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState<"debit" | "credit">("debit");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description || "");
      setMerchant(transaction.merchant || transaction.description || "");
      setAmount(Math.abs(transaction.originalAmount || transaction.amount).toFixed(2));
      setCategory(transaction.category || "Other");
      setDate(dayjs(transaction.date).format("YYYY-MM-DD"));
      setType(transaction.type || "debit");
    }
  }, [transaction]);

  const handleSave = async () => {
    if (!transaction) return;

    if (!merchant.trim()) {
      Alert.alert("Validation Error", "Please enter a merchant/transaction name");
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert("Validation Error", "Please enter a valid amount");
      return;
    }

    setSaving(true);
    try {
      const updates: Partial<Transaction> = {
        merchant: merchant.trim(),
        description: description.trim() || merchant.trim(),
        amount: type === "credit" ? numAmount : -numAmount,
        originalAmount: numAmount,
        category,
        date: dayjs(date).toISOString(),
        type,
      };

      await onSave(transaction.id, updates);
      onClose();
    } catch (error) {
      console.error("Error saving transaction:", error);
      Alert.alert("Error", "Failed to update transaction");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!transaction) return;

    Alert.alert(
      "Delete Transaction",
      "Are you sure you want to delete this transaction? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await onDelete(transaction.id);
              onClose();
            } catch (error) {
              console.error("Error deleting transaction:", error);
              Alert.alert("Error", "Failed to delete transaction");
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (!transaction) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background.primary }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} disabled={saving || deleting}>
            <Ionicons name="close" size={28} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            Edit Transaction
          </Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving || deleting}
            style={styles.saveButton}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.primary[500]} />
            ) : (
              <Text
                style={[styles.saveButtonText, { color: colors.primary[500] }]}
              >
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Amount */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text.secondary }]}>
              Amount
            </Text>
            <View
              style={[
                styles.inputContainer,
                { backgroundColor: colors.background.secondary },
              ]}
            >
              <Text style={[styles.currencySymbol, { color: colors.text.primary }]}>
                £
              </Text>
              <TextInput
                style={[styles.input, { color: colors.text.primary }]}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.text.tertiary}
              />
            </View>
          </View>

          {/* Type Selection */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text.secondary }]}>
              Type
            </Text>
            <View style={styles.typeContainer}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  {
                    backgroundColor:
                      type === "debit"
                        ? colors.error[500]
                        : colors.background.secondary,
                  },
                ]}
                onPress={() => setType("debit")}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    {
                      color:
                        type === "debit" ? "white" : colors.text.primary,
                    },
                  ]}
                >
                  Expense
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  {
                    backgroundColor:
                      type === "credit"
                        ? colors.success[500]
                        : colors.background.secondary,
                  },
                ]}
                onPress={() => setType("credit")}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    {
                      color:
                        type === "credit" ? "white" : colors.text.primary,
                    },
                  ]}
                >
                  Income
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Merchant/Name */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text.secondary }]}>
              Merchant/Name
            </Text>
            <View
              style={[
                styles.inputContainer,
                { backgroundColor: colors.background.secondary },
              ]}
            >
              <TextInput
                style={[styles.input, { color: colors.text.primary }]}
                value={merchant}
                onChangeText={setMerchant}
                placeholder="Enter merchant or transaction name"
                placeholderTextColor={colors.text.tertiary}
              />
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text.secondary }]}>
              Description (Optional)
            </Text>
            <View
              style={[
                styles.inputContainer,
                { backgroundColor: colors.background.secondary },
              ]}
            >
              <TextInput
                style={[styles.input, { color: colors.text.primary }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Enter additional notes"
                placeholderTextColor={colors.text.tertiary}
              />
            </View>
          </View>

          {/* Category */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text.secondary }]}>
              Category
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
              contentContainerStyle={styles.categoryContainer}
            >
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor:
                        category === cat
                          ? colors.primary[500]
                          : colors.background.secondary,
                    },
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      {
                        color:
                          category === cat ? "white" : colors.text.primary,
                      },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Date */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text.secondary }]}>
              Date
            </Text>
            <View
              style={[
                styles.inputContainer,
                { backgroundColor: colors.background.secondary },
              ]}
            >
              <TextInput
                style={[styles.input, { color: colors.text.primary }]}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.text.tertiary}
              />
            </View>
          </View>

          {/* Delete Button */}
          <TouchableOpacity
            style={[
              styles.deleteButton,
              { backgroundColor: colors.error[500] + "20" },
            ]}
            onPress={handleDelete}
            disabled={saving || deleting}
          >
            {deleting ? (
              <ActivityIndicator size="small" color={colors.error[500]} />
            ) : (
              <>
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color={colors.error[500]}
                />
                <Text style={[styles.deleteButtonText, { color: colors.error[500] }]}>
                  Delete Transaction
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  saveButton: {
    minWidth: 60,
    alignItems: "flex-end",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: "600",
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: spacing.sm,
  },
  typeContainer: {
    flexDirection: "row",
    gap: spacing.md,
  },
  typeButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: "center",
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  categoryScroll: {
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  categoryContainer: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius["2xl"],
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    marginBottom: spacing["2xl"],
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
