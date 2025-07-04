import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfilePage() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Profile</Text>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => router.push("/settings")}
          activeOpacity={0.8}
        >
          <Feather name="settings" size={22} color="#7C4DFF" />
        </TouchableOpacity>
      </View>

      {/* Profile Main */}
      <View style={styles.center}>
        <View style={styles.avatarWrap}>
          <Ionicons name="person-circle" size={96} color="#7C4DFF" />
        </View>
        <Text style={styles.displayName}>Biszal A.</Text>
        <Text style={styles.email}>biszaal@email.com</Text>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color="#7C4DFF"
            />
            <Text style={styles.actionText}>Credit Score</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="scan-circle-outline" size={20} color="#7C4DFF" />
            <Text style={styles.actionText}>Expense Targets</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="lock-closed-outline" size={20} color="#7C4DFF" />
            <Text style={styles.actionText}>Security</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={18} color="#E53E3E" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F5F7FB" },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 16,
    paddingHorizontal: 24,
    backgroundColor: "#F5F7FB",
  },
  topBarTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2E2353",
  },
  settingsBtn: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C4DFF",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: 8,
  },
  avatarWrap: {
    borderRadius: 52,
    backgroundColor: "#fff",
    padding: 6,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 10,
  },
  displayName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2E2353",
    marginTop: 2,
    marginBottom: 2,
  },
  email: {
    color: "#7B7B93",
    fontSize: 15,
    marginBottom: 30,
    textAlign: "center",
  },
  actions: {
    width: "90%",
    marginTop: 10,
    marginBottom: 24,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 14,
    shadowColor: "#7C4DFF",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  actionText: {
    fontWeight: "600",
    color: "#2E2353",
    fontSize: 16,
    marginLeft: 12,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 18,
    backgroundColor: "#fff",
    shadowColor: "#E53E3E",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 2,
    elevation: 1,
  },
  logoutText: {
    color: "#E53E3E",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 9,
  },
});
