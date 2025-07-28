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
import {
  getAccountDetails,
  getAccountBalance,
  getInstitutions,
  getAllAccountIds,
} from "../../services/dataSource";
import { formatCurrency } from "../../utils/formatters";
import { useTheme } from "../../contexts/ThemeContext";
import { spacing, borderRadius, shadows } from "../../constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { bankingAPI } from "../../services/api";

/**
 * Bank Account Interface
 */
interface BankAccount {
  id: string;
  name: string;
  iban: string;
  institution: {
    id: string;
    name: string;
    logo: string;
  };
  balance: number;
  currency: string;
  status: string;
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
  const [accountIds, setAccountIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasExpiredTokens, setHasExpiredTokens] = useState(false);
  const [showingCachedData, setShowingCachedData] = useState(false);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      setHasExpiredTokens(false);
      setShowingCachedData(false);

      // First, check connection status
      const connectionStatus = await bankingAPI.checkBankConnectionStatus();
      
      if (connectionStatus.hasExpiredTokens) {
        console.log("Expired tokens detected, showing cached data");
        setHasExpiredTokens(true);
        setShowingCachedData(true);
        
        // Get cached bank data
        const cachedData = await bankingAPI.getCachedBankData();
        
        // Transform cached data to BankAccount format
        const transformedAccounts = cachedData.connections.map((conn: any) => ({
          id: conn.accountId,
          name: conn.bankName,
          iban: conn.accountNumber,
          institution: {
            id: conn.accountId,
            name: conn.bankName,
            logo: conn.logo || "",
          },
          balance: conn.balance,
          currency: conn.currency,
          status: conn.isExpired ? "Token Expired" : "Active",
        }));
        
        setAccounts(transformedAccounts);
      } else {
        // Normal flow - fetch fresh data
        const accountsData = await bankingAPI.getAccounts();
        setAccounts(accountsData.accounts || []);
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
      setError("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

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
        subtitle={showingCachedData ? "Showing last saved data" : "Manage your connected accounts"}
        showBackButton={false}
        rightButton={{
          icon: "add-circle-outline",
          onPress: () => router.push("/banks/select"),
        }}
      />

      {/* Expired Token Warning Banner */}
      {hasExpiredTokens && (
        <View style={[styles.warningBanner, { backgroundColor: "#FEF3C7", borderColor: "#F59E0B" }]}>
          <Ionicons name="warning-outline" size={20} color="#D97706" />
          <View style={styles.warningContent}>
            <Text style={[styles.warningTitle, { color: "#92400E" }]}>
              Bank Connection Expired
            </Text>
            <Text style={[styles.warningText, { color: "#B45309" }]}>
              Your bank connection has expired. Reconnect to get fresh data.
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.reconnectButton, { backgroundColor: colors.primary[500] }]}
            onPress={() => router.push("/banks/select")}
          >
            <Text style={styles.reconnectButtonText}>Reconnect</Text>
          </TouchableOpacity>
        </View>
      )}

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
            onPress={() => router.push("/banks/select")}
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
          ) : error ? (
            <EmptyState
              icon="alert-circle-outline"
              title="Error"
              subtitle={error}
              actionButton={{
                title: "Retry",
                onPress: fetchAccounts,
              }}
            />
          ) : accounts.length === 0 ? (
            <EmptyState
              icon="card-outline"
              title="No banks connected yet"
              subtitle="Connect your first bank account to get started"
              actionButton={{
                title: "Add Bank Account",
                onPress: () => router.push("/banks/select"),
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
                    bankName={account.institution.name}
                    logoUrl={account.institution.logo}
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
                      IBAN: {account.iban}
                    </Text>
                    <Text
                      style={[
                        styles.bankBalance,
                        { color: colors.text.primary },
                      ]}
                    >
                      {account.balance.toLocaleString(undefined, {
                        style: "currency",
                        currency: account.currency,
                      })}
                    </Text>
                    <View style={styles.statusContainer}>
                      <Text
                        style={{
                          color: colors.text.tertiary,
                          fontSize: 12,
                          marginTop: 2,
                        }}
                      >
                        Status: {account.status}
                      </Text>
                      {account.status === "Token Expired" && (
                        <Badge
                          text="Expired"
                          variant="warning"
                          size="small"
                        />
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Section>

        {/* Quick Actions Section */}
        <Section title="Quick Actions">
          <ListItem
            icon={{ name: "sync-outline", backgroundColor: showingCachedData ? "#F3F4F6" : "#DBEAFE" }}
            title={loading ? "Syncing..." : showingCachedData ? "Reconnect to Sync" : "Sync Accounts"}
            subtitle={showingCachedData ? "Bank connection needed to sync" : "Update your account balances"}
            onPress={showingCachedData ? () => router.push("/banks/select") : fetchAccounts}
            disabled={loading}
            rightElement={
              loading ? (
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
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  bankActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  disconnectButton: {
    padding: spacing.sm,
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  warningContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  warningText: {
    fontSize: 12,
  },
  reconnectButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  reconnectButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
});
