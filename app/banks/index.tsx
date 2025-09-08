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
import * as WebBrowser from "expo-web-browser";
import { DEEP_LINK_URLS } from "../../constants/config";
import dayjs from "dayjs";

/**
 * Bank Account Interface
 */
interface BankAccount {
  accountId: string;
  bankName: string;
  bankLogo?: string;
  accountType: string;
  accountNumber: string;
  sortCode?: string;
  balance: number;
  currency: string;
  connectedAt: number;
  lastSyncAt: number;
  tokenExpiresAt: number;
  isActive: boolean;
  status: "connected" | "expired" | "disconnected";
  isExpired: boolean;
  errorMessage?: string;
  lastErrorAt?: number;
}

/**
 * Helper function to format token expiry information
 */
const formatExpiryInfo = (tokenExpiresAt: number) => {
  const expiryDate = dayjs(tokenExpiresAt);
  const now = dayjs();
  const daysUntilExpiry = expiryDate.diff(now, 'days');
  
  if (daysUntilExpiry < 0) {
    return {
      text: "Expired",
      color: "#F44336",
      isExpired: true
    };
  } else if (daysUntilExpiry === 0) {
    return {
      text: "Expires today",
      color: "#FF9800",
      isExpired: false
    };
  } else if (daysUntilExpiry === 1) {
    return {
      text: "Expires in 1 day",
      color: "#FF9800",
      isExpired: false
    };
  } else {
    return {
      text: `Expires in ${daysUntilExpiry} days`,
      color: daysUntilExpiry <= 7 ? "#FF9800" : "#4CAF50",
      isExpired: false
    };
  }
};

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
  const [syncing, setSyncing] = useState<string | null>(null);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      setHasExpiredTokens(false);
      setShowingCachedData(false);

      console.log("[Banks] Fetching connected banks...");

      // Try the new getConnectedBanks API first
      try {
        console.log("[Banks] Calling bankingAPI.getConnectedBanks()...");
        const banksData = await bankingAPI.getConnectedBanks();
        console.log(
          "[Banks] getConnectedBanks full response:",
          JSON.stringify(banksData, null, 2)
        );

        console.log(
          "[Banks] Checking banksData.banks:",
          banksData.banks,
          "Length:",
          banksData.banks?.length
        );

        console.log(
          "[Banks] Full API response check - banksData:",
          JSON.stringify(banksData, null, 2)
        );
        console.log("[Banks] banksData.banks exists:", !!banksData.banks);
        console.log(
          "[Banks] banksData.banks length:",
          banksData.banks?.length || 0
        );
        console.log("[Banks] banksData.banks array:", banksData.banks);

        // Debug each bank's logo data specifically
        if (banksData.banks) {
          banksData.banks.forEach((bank: any, index: number) => {
            console.log(`[Banks] Bank ${index + 1}:`, {
              bankName: bank.bankName,
              bankLogo: bank.bankLogo,
              logoLength: bank.bankLogo?.length || 0,
              logoType: typeof bank.bankLogo,
            });
          });
        }

        // Handle both data.accounts (from nordigen API) and banks array format
        const accountsArray = banksData.data?.accounts || banksData.banks || [];
        
        if (accountsArray && Array.isArray(accountsArray)) {
          console.log(
            "[Banks] Accounts array received, length:",
            accountsArray.length
          );

          // Transform to BankAccount format and check for expired tokens
          const transformedAccounts = accountsArray.map((bank: any) => ({
            accountId: bank.account_id || bank.accountId,
            bankName: bank.name || bank.bankName,
            bankLogo: bank.bankLogo,
            accountType: bank.type || bank.accountType,
            accountNumber: bank.mask || bank.accountNumber || '****',
            sortCode: bank.sortCode,
            balance: bank.balances?.available || bank.balance || 0,
            currency: bank.balances?.iso_currency_code || bank.currency || 'GBP',
            connectedAt: bank.connectedAt,
            lastSyncAt: bank.lastSyncAt,
            tokenExpiresAt: bank.tokenExpiresAt,
            isActive: bank.isActive !== false,
            status: (bank.status as "connected" | "expired" | "disconnected") || "connected",
            isExpired: bank.status === "expired" || bank.isExpired || (bank.tokenExpiresAt && Date.now() > bank.tokenExpiresAt),
            errorMessage: bank.errorMessage,
            lastErrorAt: bank.lastErrorAt,
          }));

          console.log("[Banks] Transformed accounts:", transformedAccounts);
          
          // Handle empty banks array as normal case (not an error)
          if (transformedAccounts.length === 0) {
            console.log("[Banks] No banks connected - showing empty state");
            setAccounts([]);
            setHasExpiredTokens(false);
            setShowingCachedData(false);
            return;
          }

          console.log(
            "[Banks] Account logos:",
            transformedAccounts.map((acc: { bankName: any; bankLogo: any; }) => ({
              bankName: acc.bankName,
              bankLogo: acc.bankLogo,
            }))
          );

          setAccounts(transformedAccounts);

          // Check if any banks have expired tokens
          const hasExpired = transformedAccounts.some((acc: any) => acc.isExpired);
          setHasExpiredTokens(hasExpired);
          if (hasExpired) {
            setShowingCachedData(true);
            console.log("[Banks] Found expired tokens, showing warning");
          }
          return;
        }
      } catch (apiError) {
        console.error(
          "[Banks] getConnectedBanks failed, trying fallback:",
          apiError
        );

        // Fallback: Try to get cached bank data if API fails
        try {
          const cachedData = await bankingAPI.getCachedBankData();
          console.log("[Banks] Cached data response:", cachedData);

          if (cachedData.connections && cachedData.connections.length > 0) {
            const transformedAccounts = cachedData.connections.map(
              (conn: any) => ({
                accountId: conn.accountId,
                bankName: conn.bankName,
                bankLogo: conn.bankLogo,
                accountType: conn.accountType,
                accountNumber: conn.accountNumber,
                sortCode: conn.sortCode,
                balance: conn.balance,
                currency: conn.currency,
                connectedAt: conn.connectedAt,
                lastSyncAt: conn.lastSyncAt,
                isActive: conn.isActive,
                status: "expired",
                isExpired: true,
                errorMessage: "Connection expired",
                lastErrorAt: Date.now(),
              })
            );

            console.log(
              "[Banks] Using cached expired connections:",
              transformedAccounts
            );
            setAccounts(transformedAccounts as BankAccount[]);
            setHasExpiredTokens(true);
            setShowingCachedData(true);
            return;
          }
        } catch (cachedError) {
          console.error("[Banks] Cached data also failed:", cachedError);
        }

        throw apiError; // Re-throw original error if fallback fails
      }

      // No banks found from main API
      console.log("[Banks] No banks found from main API");
      console.log("[Banks] Checking for cached bank data as fallback...");

      // Try to fetch cached bank data for expired connections
      try {
        const cachedResponse = await bankingAPI.getCachedBankData();
        console.log("[Banks] Cached response:", cachedResponse);

        if (
          cachedResponse.connections &&
          cachedResponse.connections.length > 0
        ) {
          console.log(
            "[Banks] Found cached connections, transforming to expired state"
          );
          const cachedAccounts = cachedResponse.connections.map(
            (conn: any) => ({
              accountId: conn.accountId,
              bankName: conn.bankName || "Unknown Bank",
              bankLogo: conn.bankLogo,
              accountType: conn.accountType || "Account",
              accountNumber: conn.accountNumber || "",
              sortCode: conn.sortCode,
              balance: conn.balance || 0,
              currency: conn.currency || "GBP",
              connectedAt: conn.connectedAt || Date.now(),
              lastSyncAt: conn.lastSyncAt || Date.now(),
              tokenExpiresAt: conn.tokenExpiresAt || Date.now(),
              isActive: false,
              status: "expired" as const,
              isExpired: true,
              errorMessage:
                "Bank connection has expired. Please reconnect to sync fresh data.",
              lastErrorAt: Date.now(),
            })
          );

          console.log(
            "[Banks] Using cached expired connections:",
            cachedAccounts
          );
          setAccounts(cachedAccounts);
          setHasExpiredTokens(true);
          setShowingCachedData(true);
          return;
        }
      } catch (cachedError) {
        console.error("[Banks] Failed to fetch cached data:", cachedError);
      }

      console.log(
        "[Banks] No cached data available either, setting empty accounts array"
      );
      setAccounts([]);
    } catch (error) {
      console.error("[Banks] Error fetching accounts:", error);
      setError("Failed to load bank accounts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleReconnectBank = async (accountId: string) => {
    try {
      // Find the bank connection to get provider ID
      const bank = accounts.find((acc) => acc.accountId === accountId);
      if (!bank) {
        showError("Bank connection not found");
        return;
      }

      // Extract provider ID from cached data or connection
      const providerId =
        (bank as any).cachedData?.providerId ||
        (bank as any).provider?.provider_id ||
        accountId;

      console.log(`[handleReconnectBank] Reconnecting bank:`, {
        accountId,
        bankName: bank.bankName,
        providerId,
      });

      // Generate direct auth link for this specific bank (with accountId for reconnection)
      const response = await bankingAPI.connectBankDirect(providerId);

      if (response.link) {
        // Open Nordigen/GoCardless auth page directly - no bank selection needed
        await WebBrowser.openAuthSessionAsync(
          response.link,
          DEEP_LINK_URLS.BANK_CALLBACK
        );
      } else {
        showError("Failed to generate reconnection link");
      }
    } catch (error) {
      console.error("Error initiating reconnection:", error);
      showError("Failed to start reconnection process");
    }
  };

  const handleRemoveBank = async (accountId: string, bankName: string) => {
    showConfirmation(
      "Remove Bank Connection",
      `Are you sure you want to remove ${bankName}? This will permanently delete all transactions and data associated with this bank account.`,
      async () => {
        try {
          await bankingAPI.removeBank(accountId);
          showSuccess("Bank connection removed successfully");
          // Refresh the accounts list
          await fetchAccounts();
        } catch (error) {
          console.error("Error removing bank:", error);
          showError("Failed to remove bank connection");
        }
      }
    );
  };

  const handleSyncAccount = async (accountId: string) => {
    try {
      setSyncing(accountId);
      await bankingAPI.refreshTransactions();
      showSuccess("Account synced successfully");
      // Refresh the accounts list
      await fetchAccounts();
    } catch (error) {
      console.error("Error syncing account:", error);
      showError("Failed to sync account");
    } finally {
      setSyncing(null);
    }
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
      {/* Minimalistic Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={colors.text.secondary}
            />
          </TouchableOpacity>

          <View style={styles.headerTitleSection}>
            <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
              Banks
            </Text>
            <Text
              style={[styles.headerSubtitle, { color: colors.text.tertiary }]}
            >
              {showingCachedData
                ? "Showing cached data"
                : `${accounts.length} connected`}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push("/banks/connect")}
          >
            <Ionicons name="add" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Minimalistic Warning Banner */}
      {hasExpiredTokens && (
        <View style={styles.bannerContainer}>
          <View
            style={[
              styles.warningBanner,
              { 
                backgroundColor: colors.background.primary,
                borderColor: "#FFA726",
                borderWidth: 1
              }
            ]}
          >
            <View style={styles.bannerContent}>
              <Text style={[styles.bannerTitle, { color: colors.text.primary }]}>
                Connection expired
              </Text>
              <Text style={[styles.bannerText, { color: colors.text.secondary }]}>
                Reconnect to sync fresh data
              </Text>
            </View>
            <TouchableOpacity
              style={styles.bannerButton}
              onPress={() => router.push("/banks/connect")}
            >
              <Text style={[styles.bannerButtonText, { color: colors.primary[500] }]}>Reconnect</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Clean Add Bank Button */}
        <Section marginTop={0}>
          <TouchableOpacity
            style={[
              styles.cleanAddButton,
              { 
                backgroundColor: colors.background.primary,
                borderColor: colors.border.light,
                borderWidth: 1
              }
            ]}
            activeOpacity={0.9}
            onPress={() => router.push("/banks/connect")}
          >
            <Ionicons name="add" size={20} color={colors.text.secondary} />
            <Text style={[styles.cleanAddButtonText, { color: colors.text.primary }]}>Add Bank</Text>
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
                onPress: () => router.push("/banks/connect"),
              }}
            />
          ) : (
            <View style={styles.bankList}>
              {accounts.map((account) => (
                <View
                  key={account.accountId}
                  style={[
                    styles.cleanBankCard,
                    {
                      backgroundColor: colors.background.primary,
                      borderColor: colors.border.light,
                    },
                  ]}
                >

                  {/* Clean Card Header */}
                  <View style={styles.cardHeader}>
                    <View style={styles.bankLogoContainer}>
                      <BankLogo
                        bankName={account.bankName}
                        logoUrl={account.bankLogo}
                        size="small"
                        showName={false}
                      />
                    </View>
                    <View style={styles.bankHeaderInfo}>
                      <Text
                        style={[
                          styles.bankName,
                          { color: colors.text.primary },
                        ]}
                      >
                        {account.bankName}
                      </Text>
                      <Text
                        style={[
                          styles.accountDetails,
                          { color: colors.text.tertiary },
                        ]}
                      >
                        ••••{account.accountNumber.slice(-4)}
                      </Text>
                      {account.tokenExpiresAt && (
                        <Text
                          style={[
                            styles.expiryDetails,
                            { color: formatExpiryInfo(account.tokenExpiresAt).color },
                          ]}
                        >
                          {formatExpiryInfo(account.tokenExpiresAt).text}
                        </Text>
                      )}
                    </View>
                    <View style={styles.statusBadge}>
                      <Text style={[
                        styles.statusText,
                        { 
                          color: account.isExpired ? "#FFA726" : "#4CAF50"
                        }
                      ]}>
                        {account.isExpired ? "Expired" : "Active"}
                      </Text>
                    </View>
                  </View>

                  {/* Clean Balance Section */}
                  <View style={styles.balanceSection}>
                    <Text
                      style={[
                        styles.balanceAmount,
                        { color: colors.text.primary },
                      ]}
                    >
                      {formatCurrency(account.balance, account.currency)}
                    </Text>
                  </View>

                  {/* Clean Actions */}
                  <View style={styles.actionButtons}>
                    {account.isExpired ? (
                      <TouchableOpacity
                        style={[
                          styles.reconnectAction,
                          { borderColor: "#FFA726" },
                        ]}
                        onPress={() => handleReconnectBank(account.accountId)}
                      >
                        <Text style={[styles.actionText, { color: "#FFA726" }]}>Reconnect</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[
                          styles.viewAction,
                          { borderColor: colors.border.light },
                        ]}
                        onPress={() =>
                          router.push(
                            `/transactions?accountId=${account.accountId}`
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.actionText,
                            { color: colors.text.secondary },
                          ]}
                        >
                          View
                        </Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={styles.menuButton}
                      onPress={() =>
                        handleRemoveBank(account.accountId, account.bankName)
                      }
                    >
                      <Ionicons
                        name="trash-outline"
                        size={16}
                        color={colors.text.tertiary}
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
            icon={{
              name: "sync-outline",
              backgroundColor: showingCachedData ? "#F3F4F6" : "#DBEAFE",
            }}
            title={
              loading
                ? "Syncing..."
                : showingCachedData
                  ? "Reconnect to Sync"
                  : "Sync Accounts"
            }
            subtitle={
              showingCachedData
                ? "Bank connection needed to sync"
                : "Update your account balances"
            }
            onPress={
              showingCachedData
                ? () => router.push("/banks/connect")
                : fetchAccounts
            }
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
  cleanAddButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 8,
  },
  cleanAddButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
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
  // Clean Header Styles
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    padding: 8,
  },
  headerTitleSection: {
    flex: 1,
    marginLeft: 16,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  addButton: {
    padding: 8,
  },
  // Clean Banner Styles
  bannerContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  bannerText: {
    fontSize: 12,
  },
  bannerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  bannerButtonText: {
    fontWeight: "500",
    fontSize: 12,
  },
  // Clean Bank Card Styles
  cleanBankCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  bankLogoContainer: {
    marginRight: 12,
  },
  bankHeaderInfo: {
    flex: 1,
  },
  bankName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  accountDetails: {
    fontSize: 12,
  },
  expiryDetails: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: "500",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "500",
  },
  balanceSection: {
    marginBottom: 12,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reconnectAction: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  viewAction: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "500",
  },
  menuButton: {
    padding: 8,
  },
});
