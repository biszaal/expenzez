import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TopBar from "../../components/TopBar";
import { useRouter } from "expo-router";
import { useAuth } from "../auth/AuthContext";
import { bankingAPI } from "../../services/api";
import {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
} from "../../constants/theme";

interface BankAccount {
  id: string;
  name: string;
  bank: string;
  balance: number;
  currency: string;
  accountNumber: string;
}

export default function BanksScreen() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      fetchAccounts();
    }
  }, [isLoggedIn]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await bankingAPI.getAccounts();
      setAccounts(response.accounts || []);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      Alert.alert("Error", "Failed to load bank accounts");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAccounts = async () => {
    try {
      setSyncing(true);
      await bankingAPI.syncAccounts();
      await fetchAccounts(); // Refresh accounts after sync
      Alert.alert("Success", "Accounts synced successfully");
    } catch (error) {
      console.error("Error syncing accounts:", error);
      Alert.alert("Error", "Failed to sync accounts");
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnectAccount = async (accountId: string) => {
    Alert.alert(
      "Disconnect Account",
      "Are you sure you want to disconnect this account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            try {
              await bankingAPI.disconnectAccount(accountId);
              await fetchAccounts(); // Refresh accounts
              Alert.alert("Success", "Account disconnected successfully");
            } catch (error) {
              console.error("Error disconnecting account:", error);
              Alert.alert("Error", "Failed to disconnect account");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopBar title="Banks" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Add Bank Button */}
        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.9}
          onPress={() => {
            router.push("/banks/connect" as any);
          }}
        >
          <Ionicons name="add-circle-outline" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add Bank Account</Text>
        </TouchableOpacity>

        {/* Connected Banks Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Connected Banks</Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary[500]} />
              <Text style={styles.loadingText}>Loading accounts...</Text>
            </View>
          ) : accounts.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="card-outline" size={28} color="#6B7280" />
              </View>
              <Text style={styles.emptyTitle}>No banks connected yet</Text>
              <Text style={styles.emptySubtitle}>
                Connect your first bank account to get started
              </Text>
            </View>
          ) : (
            <View style={styles.bankList}>
              {accounts.map((account) => (
                <View key={account.id} style={styles.bankItem}>
                  <View style={styles.bankLogoContainer}>
                    <Text style={styles.bankLogo}>
                      {account.bank === "Revolut"
                        ? "🟣"
                        : account.bank === "Monzo"
                          ? "🟠"
                          : "🏦"}
                    </Text>
                  </View>
                  <View style={styles.bankInfo}>
                    <Text style={styles.bankName} numberOfLines={1}>
                      {account.name}
                    </Text>
                    <Text style={styles.bankAccount} numberOfLines={1}>
                      {account.accountNumber} • {account.bank}
                    </Text>
                    <Text style={styles.bankBalance}>
                      £{account.balance.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.bankActions}>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>Connected</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.disconnectButton}
                      onPress={() => handleDisconnectAccount(account.id)}
                    >
                      <Ionicons name="close-circle" size={20} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionList}>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={handleSyncAccounts}
              disabled={syncing}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="sync-outline" size={20} color="#3B82F6" />
              </View>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>
                  {syncing ? "Syncing..." : "Sync Accounts"}
                </Text>
                <Text style={styles.actionSubtitle}>
                  Update your account balances
                </Text>
              </View>
              {syncing ? (
                <ActivityIndicator size="small" color="#3B82F6" />
              ) : (
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem}>
              <View style={[styles.actionIcon, { backgroundColor: "#D1FAE5" }]}>
                <Ionicons name="shield-outline" size={20} color="#10B981" />
              </View>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>Security Settings</Text>
                <Text style={styles.actionSubtitle}>
                  Manage your account security
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#3B82F6",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    marginLeft: 12,
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  sectionCard: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#1F2937",
    marginBottom: 24,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
  bankList: {
    gap: 16,
  },
  bankItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  bankLogoContainer: {
    backgroundColor: "white",
    padding: 8,
    borderRadius: 12,
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bankLogo: {
    fontSize: 24, // Changed from width/height to fontSize for emoji
  },
  bankInfo: {
    flex: 1,
    minWidth: 0,
  },
  bankName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 2,
  },
  bankAccount: {
    fontSize: 14,
    color: "#6B7280",
  },
  bankBalance: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 4,
  },
  bankActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusBadge: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#059669",
  },
  disconnectButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 16,
    color: "#6B7280",
    fontSize: 16,
  },
  actionList: {
    gap: 16,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  actionIcon: {
    backgroundColor: "#DBEAFE",
    padding: 8,
    borderRadius: 12,
    marginRight: 16,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
});
