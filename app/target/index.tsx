import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const initialTargets = [
  { id: "1", category: "Groceries", target: 300 },
  { id: "2", category: "Transport", target: 100 },
  { id: "3", category: "Dining", target: 120 },
];

export default function TargetsPage() {
  const router = useRouter();
  const [targets, setTargets] = useState(initialTargets);
  const [newTarget, setNewTarget] = useState({ category: "", target: "" });

  const addTarget = () => {
    if (!newTarget.category || !newTarget.target) return;
    setTargets([
      ...targets,
      {
        id: String(+targets[targets.length - 1]?.id + 1 || 1),
        category: newTarget.category,
        target: Number(newTarget.target),
      },
    ]);
    setNewTarget({ category: "", target: "" });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={26} color="#2E2353" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Expense Targets</Text>
        <View style={{ width: 32 }} />
      </View>
      <View style={styles.content}>
        <Text style={styles.subtitle}>Set monthly spend targets:</Text>
        <FlatList
          data={targets}
          keyExtractor={(t) => t.id}
          style={{ marginBottom: 14 }}
          renderItem={({ item }) => (
            <View style={styles.targetRow}>
              <Text style={styles.targetCat}>{item.category}</Text>
              <Text style={styles.targetVal}>£{item.target}</Text>
            </View>
          )}
        />
        <View style={styles.addRow}>
          <TextInput
            style={[styles.input, { flex: 2, marginRight: 8 }]}
            placeholder="Category"
            value={newTarget.category}
            onChangeText={(v) => setNewTarget((t) => ({ ...t, category: v }))}
          />
          <TextInput
            style={[styles.input, { flex: 1, marginRight: 8 }]}
            placeholder="£"
            keyboardType="numeric"
            value={newTarget.target}
            onChangeText={(v) => setNewTarget((t) => ({ ...t, target: v }))}
          />
          <TouchableOpacity style={styles.addBtn} onPress={addTarget}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F5F7FB" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 32,
    paddingBottom: 16,
    paddingHorizontal: 14,
    backgroundColor: "#F5F7FB",
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  topBarTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2E2353",
  },
  content: {
    marginTop: 20,
    paddingHorizontal: 24,
    flex: 1,
  },
  subtitle: {
    fontWeight: "500",
    color: "#2E2353",
    fontSize: 17,
    marginBottom: 10,
  },
  targetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 13,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 10,
    shadowColor: "#7C4DFF",
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  targetCat: { fontSize: 16, fontWeight: "600", color: "#2E2353" },
  targetVal: { fontSize: 15, fontWeight: "500", color: "#7C4DFF" },
  addRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    color: "#2E2353",
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  addBtn: {
    backgroundColor: "#7C4DFF",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
