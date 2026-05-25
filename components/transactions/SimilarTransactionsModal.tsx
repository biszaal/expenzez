import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import type { SimilarTransaction } from "@/services/api/transactionAPI";

interface Props {
  visible: boolean;
  merchant: string;
  category: string;
  transactions: SimilarTransaction[];
  applying?: boolean;
  onClose: () => void;
  onApply: (ids: string[]) => void;
}

const fmtAmount = (n: number) =>
  `${n < 0 ? "-" : ""}£${Math.abs(n).toFixed(2)}`;

export const SimilarTransactionsModal: React.FC<Props> = ({
  visible,
  merchant,
  category,
  transactions,
  applying = false,
  onClose,
  onApply,
}) => {
  const { colors } = useTheme();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Default to all selected whenever the list changes.
  useEffect(() => {
    setSelected(new Set(transactions.map((t) => t.id)));
  }, [transactions]);

  const allSelected = useMemo(
    () => transactions.length > 0 && selected.size === transactions.length,
    [selected, transactions]
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(
      allSelected ? new Set() : new Set(transactions.map((t) => t.id))
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.background.primary },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.text.primary }]}>
                Apply to similar?
              </Text>
              <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
                {transactions.length} other{" "}
                {transactions.length === 1 ? "transaction" : "transactions"} from{" "}
                <Text style={{ fontWeight: "700" }}>{merchant}</Text> can move to{" "}
                <Text style={{ color: colors.primary.main, fontWeight: "700" }}>
                  {category}
                </Text>
                .
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Select all */}
          <TouchableOpacity
            style={[styles.selectAll, { borderColor: colors.border.light }]}
            onPress={toggleAll}
            activeOpacity={0.7}
          >
            <Ionicons
              name={allSelected ? "checkbox" : "square-outline"}
              size={22}
              color={allSelected ? colors.primary.main : colors.text.tertiary}
            />
            <Text style={[styles.selectAllText, { color: colors.text.primary }]}>
              Select all
            </Text>
            <Text style={[styles.count, { color: colors.text.tertiary }]}>
              {selected.size}/{transactions.length}
            </Text>
          </TouchableOpacity>

          {/* List */}
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {transactions.map((t) => {
              const isOn = selected.has(t.id);
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.row, { borderColor: colors.border.light }]}
                  onPress={() => toggle(t.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={isOn ? "checkbox" : "square-outline"}
                    size={22}
                    color={isOn ? colors.primary.main : colors.text.tertiary}
                  />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text
                      style={[styles.rowTitle, { color: colors.text.primary }]}
                      numberOfLines={1}
                    >
                      {t.description || t.merchant}
                    </Text>
                    <Text
                      style={[styles.rowMeta, { color: colors.text.tertiary }]}
                      numberOfLines={1}
                    >
                      {t.date?.slice(0, 10)} · {t.category || "uncategorised"}
                    </Text>
                  </View>
                  <Text
                    style={[styles.amount, { color: colors.text.secondary }]}
                  >
                    {fmtAmount(t.amount)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, { borderColor: colors.border.medium }]}
              onPress={onClose}
              disabled={applying}
            >
              <Text style={[styles.btnText, { color: colors.text.secondary }]}>
                Not now
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.btn,
                styles.btnPrimary,
                {
                  backgroundColor: colors.primary.main,
                  opacity: selected.size === 0 || applying ? 0.5 : 1,
                },
              ]}
              onPress={() => onApply([...selected])}
              disabled={selected.size === 0 || applying}
            >
              {applying ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={[styles.btnText, { color: "#fff" }]}>
                  Apply to {selected.size}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    maxHeight: "82%",
  },
  header: { flexDirection: "row", alignItems: "flex-start", marginBottom: 16 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 4 },
  subtitle: { fontSize: 13.5, lineHeight: 19 },
  selectAll: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  selectAllText: { fontSize: 15, fontWeight: "600", marginLeft: 12, flex: 1 },
  count: { fontSize: 13 },
  list: { flexGrow: 0 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  rowTitle: { fontSize: 14.5, fontWeight: "600" },
  rowMeta: { fontSize: 12, marginTop: 2 },
  amount: { fontSize: 14, fontWeight: "600", marginLeft: 8 },
  actions: { flexDirection: "row", gap: 12, marginTop: 18 },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  btnPrimary: { borderWidth: 0 },
  btnText: { fontSize: 15, fontWeight: "700" },
});

export default SimilarTransactionsModal;
