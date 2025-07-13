import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import transactionsData from "../../test/data/transactions.json";

function formatAmount(amount: number) {
  const color = amount < 0 ? "#E53E3E" : "#16A34A";
  return (
    <Text style={[styles.amount, { color }]}>
      {amount < 0 ? "-" : "+"}£{Math.abs(amount).toFixed(2)}
    </Text>
  );
}

function formatDate(date: string) {
  const d = new Date(date);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function TransactionsPage() {
  const router = useRouter();

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
        <Text style={styles.topBarTitle}>Transactions</Text>
        <View style={{ width: 32 }} /> {/* Placeholder for symmetry */}
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>Recent Transactions</Text>
        </View>
        <FlatList
          data={transactionsData}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            <View style={styles.transactionCard}>
              <View style={styles.iconWrap}>
                <Ionicons name={item.icon as any} size={26} color="#7C4DFF" />
              </View>
              <View style={styles.details}>
                <Text style={styles.merchant}>{item.merchant}</Text>
                <Text style={styles.categoryDate}>
                  {item.category} • {formatDate(item.date)}
                </Text>
              </View>
              <View style={styles.amountWrap}>{formatAmount(item.amount)}</View>
            </View>
          )}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },
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
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2E2353",
  },
  list: {
    paddingHorizontal: 12,
  },
  transactionCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    padding: 14,
    shadowColor: "#7C4DFF",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  iconWrap: {
    backgroundColor: "#F5F7FB",
    borderRadius: 18,
    padding: 10,
    marginRight: 14,
  },
  details: {
    flex: 1,
    justifyContent: "center",
  },
  merchant: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2E2353",
  },
  categoryDate: {
    color: "#7B7B93",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 1,
  },
  amountWrap: {
    justifyContent: "center",
    alignItems: "flex-end",
  },
  amount: {
    fontWeight: "bold",
    fontSize: 16,
  },
});
