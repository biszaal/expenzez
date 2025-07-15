import React, { useState, useEffect } from "react";
import {
  ScrollView,
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuthGuard } from "../../hooks/useAuthGuard";
import { useAlert } from "../../hooks/useAlert";
import {
  Header,
  Section,
  ListItem,
  EmptyState,
  Badge,
  BankLogo,
} from "../../components/ui";
import { bankingAPI } from "../../services/api";
import { formatCurrency } from "../../utils/formatters";
import { useTheme } from "../../contexts/ThemeContext";
import { spacing, borderRadius, shadows } from "../../constants/theme";

/**
 * Bank Account Interface
 */
interface BankAccount {
  id: string;
  name: string;
  bank: string;
  balance: number;
  currency: string;
  accountNumber: string;
}

/**
 * Banks Screen - Manage connected bank accounts
 *
 * Features:
 * - View connected bank accounts
 * - Add new bank connections
 * - Sync account data
 * - Disconnect accounts
 * - Security settings
 */
export default function BanksScreen() {
  const router = useRouter();
  const { isLoggedIn } = useAuthGuard();
  const { showConfirmation, showError, showSuccess } = useAlert();
  const { colors } = useTheme();

  // State management
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Fetch accounts on component mount
  useEffect(() => {
    if (isLoggedIn) {
      fetchAccounts();
    }
  }, [isLoggedIn]);

  /**
   * Fetch bank accounts from API
   */
  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await bankingAPI.getAccounts();
      setAccounts(response.accounts || []);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      showError("Failed to load bank accounts");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sync all connected accounts
   */
  const handleSyncAccounts = async () => {
    try {
      setSyncing(true);
      await bankingAPI.syncAccounts();
      await fetchAccounts(); // Refresh accounts after sync
      showSuccess("Accounts synced successfully");
    } catch (error) {
      console.error("Error syncing accounts:", error);
      showError("Failed to sync accounts");
    } finally {
      setSyncing(false);
    }
  };

  /**
   * Disconnect a bank account with confirmation
   */
  const handleDisconnectAccount = async (accountId: string) => {
    showConfirmation(
      "Disconnect Account",
      "Are you sure you want to disconnect this account?",
      async () => {
        try {
          await bankingAPI.disconnectAccount(accountId);
          await fetchAccounts(); // Refresh accounts
          showSuccess("Account disconnected successfully");
        } catch (error) {
          console.error("Error disconnecting account:", error);
          showError("Failed to disconnect account");
        }
      }
    );
  };

  // If not logged in, don't render anything (auth guard will handle redirect)
  if (!isLoggedIn) {
    return null;
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background.secondary },
      ]}
    >
      {/* Header with title and add button */}
      <Header
        title="Banks"
        subtitle="Manage your connected accounts"
        showBackButton={false}
        rightButton={{
          icon: "add-circle-outline",
          onPress: () => router.push("/banks/connect"),
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Add Bank Button */}
        <Section marginTop={0}>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary[500] }]}
            activeOpacity={0.9}
            onPress={() => router.push("/banks/connect")}
          >
            <Ionicons name="add-circle-outline" size={24} color="#fff" />
            <Text style={styles.addButtonText}>Add Bank Account</Text>
          </TouchableOpacity>
        </Section>

        {/* Connected Banks Section */}
        <Section title="Connected Banks">
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary[500]} />
              <Text
                style={[styles.loadingText, { color: colors.text.secondary }]}
              >
                Loading accounts...
              </Text>
            </View>
          ) : accounts.length === 0 ? (
            <EmptyState
              icon="card-outline"
              title="No banks connected yet"
              subtitle="Connect your first bank account to get started"
              actionButton={{
                title: "Add Bank Account",
                onPress: () => router.push("/banks/connect"),
              }}
            />
          ) : (
            <View style={styles.bankList}>
              {accounts.map((account) => (
                <View
                  key={account.id}
                  style={[
                    styles.bankItem,
                    {
                      backgroundColor: colors.background.primary,
                      borderColor: colors.border.light,
                    },
                  ]}
                >
                  {/* Bank Logo */}
                  <BankLogo
                    bankName={account.bank}
                    size="medium"
                    showName={false}
                  />

                  {/* Bank Information */}
                  <View style={styles.bankInfo}>
                    <Text
                      style={[styles.bankName, { color: colors.text.primary }]}
                      numberOfLines={1}
                    >
                      {account.name}
                    </Text>
                    <Text
                      style={[
                        styles.bankAccount,
                        { color: colors.text.secondary },
                      ]}
                      numberOfLines={1}
                    >
                      {account.accountNumber} • {account.bank}
                    </Text>
                    <Text
                      style={[
                        styles.bankBalance,
                        { color: colors.text.primary },
                      ]}
                    >
                      {formatCurrency(account.balance)}
                    </Text>
                  </View>

                  {/* Bank Actions */}
                  <View style={styles.bankActions}>
                    <Badge text="Connected" variant="success" size="small" />
                    <TouchableOpacity
                      style={styles.disconnectButton}
                      onPress={() => handleDisconnectAccount(account.id)}
                    >
                      <Ionicons
                        name="close-circle"
                        size={20}
                        color={colors.error[600]}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Section>

        {/* Quick Actions Section */}
        <Section title="Quick Actions">
          <ListItem
            icon={{ name: "sync-outline", backgroundColor: "#DBEAFE" }}
            title={syncing ? "Syncing..." : "Sync Accounts"}
            subtitle="Update your account balances"
            onPress={handleSyncAccounts}
            disabled={syncing}
            rightElement={
              syncing ? (
                <ActivityIndicator size="small" color={colors.primary[500]} />
              ) : (
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.text.tertiary}
                />
              )
            }
          />

          <ListItem
            icon={{ name: "shield-outline", backgroundColor: "#D1FAE5" }}
            title="Security Settings"
            subtitle="Manage your account security"
            onPress={() => router.push("/security")}
          />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing["2xl"],
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    ...shadows.md,
  },
  addButtonText: {
    marginLeft: spacing.sm,
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
  },
  bankList: {
    gap: spacing.md,
  },
  bankItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    ...shadows.sm,
  },
  bankInfo: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.md,
  },
  bankName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  bankAccount: {
    fontSize: 14,
  },
  bankBalance: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: spacing.xs,
  },
  bankActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  disconnectButton: {
    padding: spacing.sm,
  },
});
