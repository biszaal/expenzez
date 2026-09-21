import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  RefreshControl,
  StyleSheet,
  View,
  Text,
  Pressable,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";
import { useTheme } from "../../contexts/ThemeContext";
import { useCurrency } from "../../contexts/CurrencyContext";
import { useAuthGuard } from "../../hooks/useAuthGuard";
import { fontFamily } from "../../constants/theme";
import { TabLoadingScreen } from "../../components/ui";
import { MerchantLogo } from "../../components/ui/MerchantLogo";
import { BankAvatar } from "../../components/accounts/BankAvatar";
import { accountsAPI, type Account } from "../../services/api/accountsAPI";
import { transactionAPI } from "../../services/api/transactionAPI";
import { spendBreakdown, excludedLabel } from "../../utils/spend";

/**
 * One bank's transactions.
 *
 * The whole point of grouping by account: the full list is noise when you're
 * trying to reconcile a single card against its statement.
 */
export default function AccountDetailScreen() {
  const router = useRouter();
  const { accountId } = useLocalSearchParams<{ accountId: string }>();
  const { colors } = useTheme();
  const { formatAmount } = useCurrency();
  useAuthGuard(undefined, true);

  const [account, setAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (isRefresh = false) => {
      if (!accountId) return;
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        const [accountsResponse, txnResponse] = await Promise.all([
          accountsAPI.getAccounts(undefined, { force: isRefresh }),
          transactionAPI.getTransactions({ accountId, limit: 500 } as any),
        ]);

        setAccount(
          (accountsResponse.accounts || []).find(
            (a) => a.accountId === accountId
          ) || null
        );
        setTransactions(txnResponse?.transactions || []);
      } catch (e) {
        console.error("[AccountDetail] Failed to load", e);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accountId]
  );

  useEffect(() => {
    load();
  }, [load]);

  // Group by month so a long history stays scannable.
  const sections = useMemo(() => {
    const byMonth = new Map<string, any[]>();
    for (const txn of transactions) {
      if (!txn.date) continue;
      const key = dayjs(txn.date).format("YYYY-MM");
      const list = byMonth.get(key) || [];
      list.push(txn);
      byMonth.set(key, list);
    }
    return Array.from(byMonth.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([month, rows]) => ({
        month,
        rows: rows.sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf()),
        spend: spendBreakdown(rows).spend,
      }));
  }, [transactions]);

  const handleDelete = () => {
    if (!account) return;
    Alert.alert(
      `Delete ${account.displayName}?`,
      `This removes the account and its ${account.transactionCount} transaction${
        account.transactionCount === 1 ? "" : "s"
      }. This can't be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await accountsAPI.deleteAccount(account.accountId);
              await transactionAPI.invalidateTransactionsCache();
              router.back();
            } catch (e) {
              console.error("[AccountDetail] Delete failed", e);
              Alert.alert(
                "Couldn't delete",
                "Something went wrong. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <TabLoadingScreen message="Loading account..." />;
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background.primary }]}
      edges={["top"]}
    >
      <View style={styles.navRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          hitSlop={10}
        >
          <Ionicons name="chevron-back" size={26} color={colors.primary[500]} />
        </Pressable>
        <Pressable
          onPress={handleDelete}
          accessibilityRole="button"
          accessibilityLabel="Delete account"
          hitSlop={10}
        >
          <Ionicons name="trash-outline" size={20} color={colors.text.tertiary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />
        }
      >
        <View style={styles.header}>
          <BankAvatar
            bankId={account?.bankId}
            bankName={account?.displayName || "Account"}
            colorHex={account?.colorHex}
            size={52}
          />
          <View style={{ flex: 1 }}>
            <Text
              numberOfLines={1}
              style={[
                styles.title,
                { color: colors.text.primary, fontFamily: fontFamily.semibold },
              ]}
            >
              {account?.displayName || "Account"}
            </Text>
            <Text
              style={[
                styles.subtitle,
                { color: colors.text.secondary, fontFamily: fontFamily.medium },
              ]}
            >
              {account?.accountIdentifier
                ? `•••• ${account.accountIdentifier} · `
                : ""}
              {transactions.length} transaction
              {transactions.length === 1 ? "" : "s"}
            </Text>
          </View>
        </View>

        {sections.length === 0 ? (
          <Text
            style={[
              styles.empty,
              { color: colors.text.tertiary, fontFamily: fontFamily.medium },
            ]}
          >
            No transactions for this account yet.
          </Text>
        ) : (
          sections.map((section) => (
            <View key={section.month} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text
                  style={[
                    styles.sectionTitle,
                    {
                      color: colors.text.secondary,
                      fontFamily: fontFamily.semibold,
                    },
                  ]}
                >
                  {dayjs(section.month).format("MMMM YYYY")}
                </Text>
                <Text
                  style={[
                    styles.sectionTotal,
                    {
                      color: colors.text.tertiary,
                      fontFamily: fontFamily.monoMedium,
                    },
                  ]}
                >
                  {formatAmount(section.spend)}
                </Text>
              </View>

              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.card.background,
                    borderColor: colors.border.medium,
                  },
                ]}
              >
                {section.rows.map((txn, index) => {
                  const label = excludedLabel(txn);
                  const amount = Number(txn.amount) || 0;
                  const isCredit = txn.type === "credit" || amount > 0;
                  return (
                    <View
                      key={txn.id || index}
                      style={[
                        styles.row,
                        index > 0 && {
                          borderTopWidth: 1,
                          borderTopColor: colors.border.medium,
                        },
                      ]}
                    >
                      <MerchantLogo
                        merchant={txn.merchant || txn.description || "?"}
                        size={34}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.rowTitle,
                            {
                              color: colors.text.primary,
                              fontFamily: fontFamily.medium,
                            },
                          ]}
                        >
                          {txn.merchant || txn.description || "Transaction"}
                        </Text>
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.rowMeta,
                            {
                              color: colors.text.tertiary,
                              fontFamily: fontFamily.medium,
                            },
                          ]}
                        >
                          {dayjs(txn.date).format("D MMM")}
                          {label ? ` · ${label} · not counted` : ""}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.rowAmount,
                          {
                            color: isCredit
                              ? colors.posFg
                              : colors.text.primary,
                            fontFamily: fontFamily.monoMedium,
                          },
                        ]}
                      >
                        {isCredit ? "+" : ""}
                        {formatAmount(Math.abs(amount))}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  content: { padding: 16, paddingBottom: 120 },
  header: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 24 },
  title: { fontSize: 24, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, marginTop: 2 },
  empty: { fontSize: 14, textAlign: "center", marginTop: 40 },
  section: { marginBottom: 20 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  sectionTitle: { fontSize: 13 },
  sectionTotal: { fontSize: 13 },
  card: { borderWidth: 1, borderRadius: 16, overflow: "hidden" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  rowTitle: { fontSize: 14 },
  rowMeta: { fontSize: 11, marginTop: 2 },
  rowAmount: { fontSize: 14 },
});
