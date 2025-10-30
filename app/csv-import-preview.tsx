import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { transactionAPI } from "../services/api";
import {
  TransactionEditModal,
  EditableTransaction,
} from "../components/import/TransactionEditModal";
import { TransactionPreviewTable } from "../components/import/TransactionPreviewTable";
import { CategorizeTransaction } from "../services/categorizeTransaction";

interface CSVTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category?: string;
  type: "debit" | "credit";
  merchant?: string;
}

export default function CSVImportPreviewScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{
    transactions?: string;
    fileName?: string;
    formatDetected?: string;
  }>();

  const [transactions, setTransactions] = useState<EditableTransaction[]>(() => {
    try {
      if (params.transactions) {
        const parsed = JSON.parse(params.transactions);
        return parsed.map((t: any) => ({
          ...t,
          id: t.id || `csv_${Date.now()}_${Math.random()}`,
        }));
      }
    } catch (error) {
      console.error("Error parsing transactions:", error);
    }
    return [];
  });

  const [editingTransaction, setEditingTransaction] = useState<EditableTransaction | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleEditTransaction = (transaction: EditableTransaction) => {
    setEditingTransaction(transaction);
    setShowEditModal(true);
  };

  const handleSaveTransaction = (updatedTransaction: EditableTransaction) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === updatedTransaction.id ? updatedTransaction : t))
    );
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const handleImport = async () => {
    if (transactions.length === 0) {
      Alert.alert("No Transactions", "Please add at least one transaction to import.");
      return;
    }

    try {
      setImporting(true);

      // Convert transactions to API format
      const apiTransactions = transactions.map((t) => ({
        id: t.id,
        date: t.date,
        description: t.description,
        merchant: t.merchant,
        amount: t.amount,
        originalAmount: t.amount,
        category: t.category || CategorizeTransaction.categorize(t.merchant),
        type: t.type,
      }));

      // Call import API
      const result = await transactionAPI.importCsvTransactions(apiTransactions);

      const summary = result.summary || {
        imported: result.imported,
        failed: result.failed,
        autoCategorized: 0,
      };

      const expenseCount = transactions.filter((t) => t.type === "debit").length;
      const incomeCount = transactions.filter((t) => t.type === "credit").length;

      let summaryMessage = `Import completed!\n• ${summary.imported} transactions saved\n• ${expenseCount} expenses\n• ${incomeCount} income entries`;

      if (summary.failed > 0) {
        summaryMessage += `\n• ${summary.failed} failed to import`;
      }

      Alert.alert(
        summary.imported > 0 ? "Import Successful" : "Import Failed",
        summaryMessage,
        [
          {
            text: "View Dashboard",
            onPress: () => {
              router.replace("/");
            },
          },
          ...(summary.imported > 0
            ? [
                {
                  text: "View Transactions",
                  onPress: () => {
                    router.replace("/transactions");
                  },
                },
              ]
            : []),
        ]
      );
    } catch (error: any) {
      console.error("Error importing transactions:", error);
      Alert.alert(
        "Import Failed",
        `Failed to import transactions: ${error.message || "Please try again."}`
      );
    } finally {
      setImporting(false);
    }
  };

  const fileName = params.fileName || "transactions.csv";
  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
      edges={["top"]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.background.secondary, borderBottomColor: colors.background.tertiary },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons
            name="chevron-back"
            size={24}
            color={colors.primary.main}
          />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Review Transactions
          </Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            {fileName}
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.primary.main[50] },
          ]}
        >
          <View style={styles.summaryContent}>
            <Text style={[styles.summaryValue, { color: colors.primary.main[700] }]}>
              {transactions.length}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.primary.main[600] }]}>
              Transactions
            </Text>
          </View>
          <Ionicons
            name="list-outline"
            size={32}
            color={colors.primary.main[200]}
          />
        </View>

        <View
          style={[
            styles.summaryCard,
            { backgroundColor: "#FEF3C7" },
          ]}
        >
          <View style={styles.summaryContent}>
            <Text style={[styles.summaryValue, { color: "#B45309" }]}>
              £{totalAmount.toFixed(2)}
            </Text>
            <Text style={[styles.summaryLabel, { color: "#D97706" }]}>
              Total Amount
            </Text>
          </View>
          <Ionicons
            name="cash-outline"
            size={32}
            color="#F3E8FF"
          />
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <View
          style={[
            styles.instructionCard,
            { backgroundColor: colors.background.secondary },
          ]}
        >
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={colors.primary.main}
          />
          <Text style={[styles.instructionText, { color: colors.text.secondary }]}>
            Review the transactions below. You can edit categories, amounts, or delete unwanted transactions before importing.
          </Text>
        </View>
      </View>

      {/* Transactions Table */}
      <ScrollView
        style={styles.tableContainer}
        showsVerticalScrollIndicator={false}
      >
        <TransactionPreviewTable
          transactions={transactions}
          onEdit={handleEditTransaction}
          onDelete={handleDeleteTransaction}
        />
      </ScrollView>

      {/* Action Buttons */}
      <View
        style={[
          styles.footer,
          { backgroundColor: colors.background.secondary, borderTopColor: colors.background.tertiary },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.cancelButton,
            { borderColor: colors.primary.main[300] },
          ]}
          onPress={() => router.back()}
          disabled={importing}
        >
          <Text style={[styles.cancelButtonText, { color: colors.primary.main }]}>
            Cancel
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.importButton,
            {
              backgroundColor: colors.primary.main,
              opacity: importing || transactions.length === 0 ? 0.6 : 1,
            },
          ]}
          onPress={handleImport}
          disabled={importing || transactions.length === 0}
        >
          {importing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
          )}
          <Text style={styles.importButtonText}>
            {importing ? "Importing..." : `Import ${transactions.length} Transactions`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Edit Modal */}
      <TransactionEditModal
        visible={showEditModal}
        transaction={editingTransaction}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveTransaction}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
  },
  summaryContainer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  summaryCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 12,
  },
  summaryContent: {
    flex: 1,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  instructionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  instructionCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 12,
    borderRadius: 8,
  },
  instructionText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  tableContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 0.4,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontWeight: "600",
    fontSize: 14,
  },
  importButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  importButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});
