import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CreditScorePage() {
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
        <Text style={styles.topBarTitle}>Credit Score</Text>
        <View style={{ width: 32 }} />
      </View>
      <View style={styles.center}>
        <Ionicons name="pie-chart" size={60} color="#7C4DFF" />
        <Text style={styles.title}>Your Credit Score</Text>
        <Text style={styles.score}>528</Text>
        <Text style={styles.desc}>Next update: 27 July</Text>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>See full report</Text>
        </TouchableOpacity>
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
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    color: "#2E2353",
    fontWeight: "700",
    marginTop: 18,
    marginBottom: 2,
  },
  score: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#7C4DFF",
    marginVertical: 10,
  },
  desc: {
    color: "#7B7B93",
    fontSize: 15,
    marginBottom: 24,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#7C4DFF",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginTop: 6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
