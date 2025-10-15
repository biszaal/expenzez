import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../auth/AuthContext";
import {
  finexerAPI,
  BankConnection,
  BankAccount,
} from "../../services/finexerAPI";
import {
  spacing,
  borderRadius,
  typography,
  shadows,
} from "../../constants/theme";

export default function BankAccountsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [connections, setConnections] = useState<BankConnection[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const [connectionsData, accountsData] = await Promise.all([
        finexerAPI.getConnections(user.id),
        finexerAPI.getAccounts(user.id),
      ]);
      setConnections(connectionsData);
      setAccounts(accountsData);
    } catch (error) {
      console.error("Error loading data:", error);
      Alert.alert("Error", "Failed to load bank accounts");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSync = async (connectionId: string) => {
    if (!user?.id) return;

    try {
      setSyncing(connectionId);
      await finexerAPI.syncAccounts(user.id, connectionId);
      await loadData(); // Reload data after sync
      Alert.alert("Success", "Accounts synced successfully");
    } catch (error) {
      console.error("Error syncing accounts:", error);
      Alert.alert("Error", "Failed to sync accounts");
    } finally {
      setSyncing(null);
    }
  };

  const handleDisconnect = async (connectionId: string, bankName: string) => {
    if (!user?.id) return;

    Alert.alert(
      "Disconnect Bank Account",
      `Are you sure you want to disconnect your ${bankName} account? This will stop automatic transaction syncing.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            try {
              await finexerAPI.disconnectAccount(user.id, connectionId);
              await loadData(); // Reload data after disconnect
              Alert.alert("Success", "Bank account disconnected");
            } catch (error) {
              console.error("Error disconnecting account:", error);
              Alert.alert("Error", "Failed to disconnect account");
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: BankConnection["status"]) => {
    switch (status) {
      case "active":
        return colors.success[500];
      case "expired":
        return colors.warning[500];
      case "revoked":
        return colors.error[500];
      case "error":
        return colors.error[500];
      default:
        return colors.text.tertiary;
    }
  };

  const getStatusText = (status: BankConnection["status"]) => {
    switch (status) {
      case "active":
        return "Connected";
      case "expired":
        return "Expired";
      case "revoked":
        return "Disconnected";
      case "error":
        return "Error";
      default:
        return "Unknown";
    }
  };

  const formatBalance = (balance: number, currency: string) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency || "GBP",
    }).format(balance);
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: colors.background.default },
        ]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            Loading bank accounts...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background.default }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Bank Accounts
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push("/banking/connect")}
          >
            <Ionicons name="add" size={24} color={colors.primary[500]} />
          </TouchableOpacity>
        </View>

        {/* Connections */}
        {connections.length > 0 ? (
          <View style={styles.connectionsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Connected Banks
            </Text>
            {connections.map((connection) => (
              <View
                key={connection.connectionId}
                style={[
                  styles.connectionCard,
                  {
                    backgroundColor: colors.background.primary,
                    borderColor: colors.border.light,
                  },
                  shadows.sm,
                ]}
              >
                <View style={styles.connectionHeader}>
                  <View style={styles.connectionInfo}>
                    <Text
                      style={[styles.bankName, { color: colors.text.primary }]}
                    >
                      {connection.bankName}
                    </Text>
                    <View style={styles.statusContainer}>
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor: getStatusColor(connection.status),
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(connection.status) },
                        ]}
                      >
                        {getStatusText(connection.status)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.connectionActions}>
                    {connection.status === "active" && (
                      <TouchableOpacity
                        style={styles.syncButton}
                        onPress={() => handleSync(connection.connectionId)}
                        disabled={syncing === connection.connectionId}
                      >
                        {syncing === connection.connectionId ? (
                          <ActivityIndicator
                            size="small"
                            color={colors.primary[500]}
                          />
                        ) : (
                          <Ionicons
                            name="refresh"
                            size={20}
                            color={colors.primary[500]}
                          />
                        )}
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.disconnectButton}
                      onPress={() =>
                        handleDisconnect(
                          connection.connectionId,
                          connection.bankName
                        )
                      }
                    >
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color={colors.error[500]}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                {connection.errorMessage && (
                  <Text
                    style={[styles.errorText, { color: colors.error[500] }]}
                  >
                    {connection.errorMessage}
                  </Text>
                )}
                {connection.lastSyncAt && (
                  <Text
                    style={[
                      styles.lastSyncText,
                      { color: colors.text.tertiary },
                    ]}
                  >
                    Last synced:{" "}
                    {new Date(connection.lastSyncAt).toLocaleString()}
                  </Text>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="card-outline"
              size={64}
              color={colors.text.tertiary}
            />
            <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
              No Bank Accounts Connected
            </Text>
            <Text
              style={[styles.emptySubtitle, { color: colors.text.secondary }]}
            >
              Connect your bank account to automatically sync transactions and
              balances
            </Text>
            <TouchableOpacity
              style={[
                styles.connectButton,
                { backgroundColor: colors.primary[500] },
                shadows.md,
              ]}
              onPress={() => router.push("/banking/connect")}
            >
              <Ionicons name="link" size={20} color="white" />
              <Text style={styles.connectButtonText}>Connect Bank Account</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Accounts */}
        {accounts.length > 0 && (
          <View style={styles.accountsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Accounts ({accounts.length})
            </Text>
            {accounts.map((account, index) => (
              <View
                key={account.accountId || `account-${index}`}
                style={[
                  styles.accountCard,
                  {
                    backgroundColor: colors.background.primary,
                    borderColor: colors.border.light,
                  },
                  shadows.sm,
                ]}
              >
                <View style={styles.accountHeader}>
                  <View style={styles.accountInfo}>
                    <Text
                      style={[
                        styles.accountName,
                        { color: colors.text.primary },
                      ]}
                    >
                      {account.name}
                    </Text>
                    <Text
                      style={[
                        styles.accountType,
                        { color: colors.text.secondary },
                      ]}
                    >
                      {account.type} • {account.bankName}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.accountBalance,
                      { color: colors.text.primary },
                    ]}
                  >
                    {formatBalance(account.balance, account.currency)}
                  </Text>
                </View>
                <View style={styles.accountDetails}>
                  <Text
                    style={[
                      styles.accountNumber,
                      { color: colors.text.tertiary },
                    ]}
                  >
                    ****{account.accountNumber.slice(-4)}
                  </Text>
                  <Text
                    style={[
                      styles.lastUpdated,
                      { color: colors.text.tertiary },
                    ]}
                  >
                    Updated{" "}
                    {new Date(
                      account.lastSyncAt ||
                        account.lastUpdated ||
                        account.updatedAt
                    ).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    ...typography.body,
    marginTop: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  backButton: {
    padding: spacing.xs,
  },
  title: {
    ...typography.h1,
    flex: 1,
    textAlign: "center",
  },
  addButton: {
    padding: spacing.xs,
  },
  connectionsSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  connectionCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  connectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  connectionInfo: {
    flex: 1,
  },
  bankName: {
    ...typography.body,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    ...typography.caption,
    fontWeight: "500",
  },
  connectionActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  syncButton: {
    padding: spacing.xs,
  },
  disconnectButton: {
    padding: spacing.xs,
  },
  errorText: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  lastSyncText: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  emptyState: {
    alignItems: "center",
    padding: spacing.xl,
  },
  emptyTitle: {
    ...typography.h3,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.body,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  connectButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  connectButtonText: {
    ...typography.body,
    color: "white",
    fontWeight: "600",
  },
  accountsSection: {
    marginBottom: spacing.lg,
  },
  accountCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  accountHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    ...typography.body,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  accountType: {
    ...typography.caption,
  },
  accountBalance: {
    ...typography.h4,
    fontWeight: "600",
  },
  accountDetails: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  accountNumber: {
    ...typography.caption,
  },
  lastUpdated: {
    ...typography.caption,
  },
});
