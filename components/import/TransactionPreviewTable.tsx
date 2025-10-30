import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import {
  CategorizeTransaction,
  TRANSACTION_CATEGORIES,
} from "../../services/categorizeTransaction";
import type { EditableTransaction } from "./TransactionEditModal";

interface TransactionPreviewTableProps {
  transactions: EditableTransaction[];
  onEdit: (transaction: EditableTransaction) => void;
  onDelete: (transactionId: string) => void;
  onSelectMultiple?: (selectedIds: string[]) => void;
}

export const TransactionPreviewTable: React.FC<TransactionPreviewTableProps> = ({
  transactions,
  onEdit,
  onDelete,
  onSelectMultiple,
}) => {
  const { colors } = useTheme();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<"date" | "amount" | "category">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
    onSelectMultiple?.(Array.from(newSelected));
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === transactions.length) {
      setSelectedIds(new Set());
      onSelectMultiple?.([]);
    } else {
      const allIds = new Set(transactions.map((t) => t.id));
      setSelectedIds(allIds);
      onSelectMultiple?.(Array.from(allIds));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;

    Alert.alert(
      "Delete Selected",
      `Are you sure you want to delete ${selectedIds.size} transaction(s)?`,
      [
        { text: "Cancel", onPress: () => {} },
        {
          text: "Delete",
          onPress: () => {
            selectedIds.forEach((id) => onDelete(id));
            setSelectedIds(new Set());
          },
          style: "destructive",
        },
      ]
    );
  };

  const sortedTransactions = [...transactions].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case "date":
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case "amount":
        comparison = a.amount - b.amount;
        break;
      case "category":
        comparison = a.category.localeCompare(b.category);
        break;
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  const handleSort = (column: "date" | "amount" | "category") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
  const expenseCount = transactions.filter((t) => t.type === "debit").length;
  const incomeCount = transactions.filter((t) => t.type === "credit").length;

  return (
    <View style={styles.container}>
      {/* Stats Row */}
      <View
        style={[
          styles.statsRow,
          { backgroundColor: colors.background.secondary },
        ]}
      >
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
            Total
          </Text>
          <Text style={[styles.statValue, { color: colors.text.primary }]}>
            £{totalAmount.toFixed(2)}
          </Text>
        </View>
        <View
          style={[
            styles.statDivider,
            { backgroundColor: colors.background.tertiary },
          ]}
        />
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
            Expenses
          </Text>
          <Text style={[styles.statValue, { color: "#DC2626" }]}>
            {expenseCount}
          </Text>
        </View>
        <View
          style={[
            styles.statDivider,
            { backgroundColor: colors.background.tertiary },
          ]}
        />
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
            Income
          </Text>
          <Text style={[styles.statValue, { color: "#059669" }]}>
            {incomeCount}
          </Text>
        </View>
      </View>

      {/* Controls Row */}
      <View
        style={[
          styles.controlsRow,
          { backgroundColor: colors.background.secondary },
        ]}
      >
        <View style={styles.selectControls}>
          <TouchableOpacity
            style={styles.selectAllButton}
            onPress={toggleSelectAll}
          >
            <Ionicons
              name={selectedIds.size === transactions.length ? "checkbox" : "square-outline"}
              size={20}
              color={colors.primary.main}
            />
            <Text style={[styles.selectAllText, { color: colors.text.secondary }]}>
              {selectedIds.size === transactions.length ? "Deselect All" : "Select All"}
            </Text>
          </TouchableOpacity>

          {selectedIds.size > 0 && (
            <TouchableOpacity
              style={[
                styles.deleteButton,
                { backgroundColor: "#FEE2E2" },
              ]}
              onPress={handleDeleteSelected}
            >
              <Ionicons name="trash" size={16} color="#DC2626" />
              <Text style={{ color: "#DC2626", fontSize: 12, fontWeight: "600" }}>
                Delete ({selectedIds.size})
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Sort Controls */}
        <View style={styles.sortControls}>
          {(["date", "amount", "category"] as const).map((col) => (
            <TouchableOpacity
              key={col}
              style={[
                styles.sortButton,
                {
                  backgroundColor:
                    sortBy === col
                      ? colors.primary.main[100]
                      : colors.background.tertiary,
                  borderColor:
                    sortBy === col
                      ? colors.primary.main[300]
                      : colors.background.tertiary,
                },
              ]}
              onPress={() => handleSort(col)}
            >
              <Text
                style={[
                  styles.sortButtonText,
                  {
                    color:
                      sortBy === col
                        ? colors.primary.main
                        : colors.text.secondary,
                  },
                ]}
              >
                {col === "date" ? "Date" : col === "amount" ? "Amount" : "Category"}
              </Text>
              {sortBy === col && (
                <Ionicons
                  name={sortOrder === "asc" ? "arrow-up" : "arrow-down"}
                  size={12}
                  color={colors.primary.main}
                  style={{ marginLeft: 4 }}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Table Header */}
      <View
        style={[
          styles.tableHeader,
          { backgroundColor: colors.background.tertiary },
        ]}
      >
        <View style={styles.checkboxColumn} />
        <Text style={[styles.headerCell, { flex: 1.2, color: colors.text.primary }]}>
          Date
        </Text>
        <Text style={[styles.headerCell, { flex: 2, color: colors.text.primary }]}>
          Description
        </Text>
        <Text style={[styles.headerCell, { flex: 1, color: colors.text.primary }]}>
          Amount
        </Text>
        <Text style={[styles.headerCell, { flex: 1.2, color: colors.text.primary }]}>
          Category
        </Text>
        <View style={styles.actionColumn} />
      </View>

      {/* Table Body */}
      <FlatList
        data={sortedTransactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View
            style={[
              styles.tableRow,
              {
                backgroundColor:
                  index % 2 === 0
                    ? colors.background.secondary
                    : colors.background.primary,
                borderBottomColor: colors.background.tertiary,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.checkboxColumn}
              onPress={() => toggleSelect(item.id)}
            >
              <Ionicons
                name={selectedIds.has(item.id) ? "checkbox" : "square-outline"}
                size={18}
                color={colors.primary.main}
              />
            </TouchableOpacity>

            <Text
              style={[
                styles.tableCell,
                { flex: 1.2, color: colors.text.secondary, fontSize: 12 },
              ]}
            >
              {new Date(item.date).toLocaleDateString("en-GB")}
            </Text>

            <Text
              style={[
                styles.tableCell,
                { flex: 2, color: colors.text.primary },
              ]}
              numberOfLines={1}
            >
              {item.description}
            </Text>

            <Text
              style={[
                styles.tableCell,
                {
                  flex: 1,
                  color: item.type === "debit" ? "#DC2626" : "#059669",
                  fontWeight: "600",
                },
              ]}
            >
              {item.type === "debit" ? "-" : "+"}£{item.amount.toFixed(2)}
            </Text>

            <Text
              style={[
                styles.tableCell,
                { flex: 1.2, color: colors.text.secondary, fontSize: 12 },
              ]}
              numberOfLines={1}
            >
              {CategorizeTransaction.getCategoryEmoji(item.category)}{" "}
              {CategorizeTransaction.getCategoryName(item.category).split(" ")[0]}
            </Text>

            <View style={styles.actionColumn}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onEdit(item)}
              >
                <Ionicons
                  name="pencil"
                  size={16}
                  color={colors.primary.main}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  Alert.alert(
                    "Delete Transaction",
                    `Remove "${item.description}"?`,
                    [
                      { text: "Cancel", onPress: () => {} },
                      {
                        text: "Delete",
                        onPress: () => onDelete(item.id),
                        style: "destructive",
                      },
                    ]
                  );
                }}
              >
                <Ionicons
                  name="trash"
                  size={16}
                  color="#DC2626"
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
        scrollEnabled={false}
        nestedScrollEnabled
      />

      {/* Empty State */}
      {transactions.length === 0 && (
        <View style={[styles.emptyState, { backgroundColor: colors.background.secondary }]}>
          <Ionicons
            name="document-text-outline"
            size={48}
            color={colors.text.secondary}
          />
          <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
            No transactions to import
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  statDivider: {
    width: 1,
    height: 30,
    marginHorizontal: 8,
  },
  controlsRow: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  selectControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  selectAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  selectAllText: {
    fontSize: 12,
    fontWeight: "500",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  sortControls: {
    flexDirection: "row",
    gap: 6,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
  tableHeader: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerCell: {
    fontWeight: "600",
    fontSize: 12,
  },
  checkboxColumn: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  actionColumn: {
    width: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
  },
  tableRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
    borderBottomWidth: 1,
  },
  tableCell: {
    fontSize: 13,
  },
  actionButton: {
    padding: 6,
    borderRadius: 6,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    marginHorizontal: 12,
    borderRadius: 8,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
    fontWeight: "500",
  },
});
