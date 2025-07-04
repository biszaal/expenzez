import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SecurityPage() {
  const router = useRouter();
  const [faceId, setFaceId] = useState(true);
  const [passcode, setPasscode] = useState(false);

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
        <Text style={styles.topBarTitle}>Security</Text>
        <View style={{ width: 32 }} />
      </View>
      <View style={styles.content}>
        <View style={styles.securityRow}>
          <Ionicons
            name="finger-print-outline"
            size={30}
            color="#7C4DFF"
            style={{ marginRight: 12 }}
          />
          <Text style={styles.securityText}>Face ID / Touch ID</Text>
          <Switch value={faceId} onValueChange={setFaceId} />
        </View>
        <View style={styles.securityRow}>
          <Ionicons
            name="lock-closed-outline"
            size={30}
            color="#7C4DFF"
            style={{ marginRight: 12 }}
          />
          <Text style={styles.securityText}>Passcode lock</Text>
          <Switch value={passcode} onValueChange={setPasscode} />
        </View>
        <Text style={styles.tip}>
          Enable Face ID, Touch ID, or passcode for extra security on your
          account.
        </Text>
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
    marginTop: 28,
    paddingHorizontal: 24,
  },
  securityRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 16,
    shadowColor: "#7C4DFF",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  securityText: {
    fontWeight: "500",
    color: "#2E2353",
    fontSize: 16,
    flex: 1,
  },
  tip: {
    color: "#7B7B93",
    fontSize: 14,
    marginTop: 16,
    textAlign: "center",
  },
});
