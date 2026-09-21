import React, { useCallback, useEffect, useState } from "react";
import {
  ScrollView,
  RefreshControl,
  StyleSheet,
  View,
  Text,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import dayjs from "dayjs";
import { useTheme } from "../../contexts/ThemeContext";
import { useCurrency } from "../../contexts/CurrencyContext";
import { useAuthGuard } from "../../hooks/useAuthGuard";
import { fontFamily } from "../../constants/theme";
import { TabLoadingScreen } from "../../components/ui";
import { EmptyState } from "../../components/ui/EmptyState";
import { accountsAPI, type Account } from "../../services/api/accountsAPI";
import { BankAvatar } from "../../components/accounts/BankAvatar";

/**
 * Every bank and card the user has imported, with this month's spend on each.
 *
 * Accounts exist because the user imported a statement — there are no live
 * bank connections — so this screen doubles as the entry point for adding more.
 */
export default function AccountsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { formatAmount } = useCurrency();
  useAuthGuard(undefined, true);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [unassigned, setUnassigned] = useState<{
    transactionCount: number;
    monthSpend: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Which month the figures cover. The server decides — statements arrive in
  // arrears, so the newest month with data is usually the previous one, and
  // pinning this to dayjs() showed every account at zero for weeks at a time.
  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const response = await accountsAPI.getAccounts(undefined, {
        force: isRefresh,
      });
      setAccounts(response.accounts || []);
      setUnassigned(response.unassigned || null);
      if (response.month) setMonth(response.month);
    } catch (e) {
      console.error("[Accounts] Failed to load accounts", e);
      setError("We couldn't load your accounts. Pull down to try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const monthTotal = accounts.reduce((sum, a) => sum + (a.monthSpend || 0), 0);

  // "this month" is a lie whenever the newest data is older than today, and
  // the transaction count beside it is all-time — so name the month instead.
  const periodLabel =
    month === dayjs().format("YYYY-MM")
      ? "this month"
      : `in ${dayjs(month).format("MMM")}`;

  if (loading) {
    return <TabLoadingScreen message="Loading your accounts..." />;
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background.primary }]}
      edges={["top"]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />
        }
      >
        <View style={styles.header}>
          <Text
            style={[
              styles.title,
              { color: colors.text.primary, fontFamily: fontFamily.semibold },
            ]}
          >
            Accounts
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: colors.text.secondary, fontFamily: fontFamily.medium },
            ]}
          >
            {dayjs(month).format("MMMM YYYY")} ·{" "}
            {formatAmount(monthTotal)} spent
          </Text>
        </View>

        {error && (
          <Text
            style={[
              styles.error,
              { color: colors.rose[500], fontFamily: fontFamily.medium },
            ]}
          >
            {error}
          </Text>
        )}

        {accounts.length === 0 && !error ? (
          <EmptyState
            iconName="business-outline"
            title="No accounts yet"
            description="Import a bank statement and we'll detect which bank it's from, then keep its transactions together here."
            actionLabel="Import a statement"
            onAction={() => router.push("/import-statement" as any)}
          />
        ) : (
          <View style={styles.list}>
            {accounts.map((account) => (
              <Pressable
                key={account.accountId}
                onPress={() =>
                  router.push(`/accounts/${encodeURIComponent(account.accountId)}` as any)
                }
                accessibilityRole="button"
                accessibilityLabel={`${account.displayName}, ${formatAmount(account.monthSpend)} spent ${periodLabel}`}
                style={({ pressed }) => [
                  styles.card,
                  {
                    backgroundColor: colors.card.background,
                    borderColor: colors.border.medium,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <BankAvatar
                  bankId={account.bankId}
                  bankName={account.displayName}
                  colorHex={account.colorHex}
                />
                <View style={styles.cardBody}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.cardTitle,
                      {
                        color: colors.text.primary,
                        fontFamily: fontFamily.semibold,
                      },
                    ]}
                  >
                    {account.displayName}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.cardMeta,
                      {
                        color: colors.text.tertiary,
                        fontFamily: fontFamily.medium,
                      },
                    ]}
                  >
                    {account.accountIdentifier
                      ? `•••• ${account.accountIdentifier} · `
                      : ""}
                    {account.transactionCount} transaction
                    {account.transactionCount === 1 ? "" : "s"}
                  </Text>
                </View>
                <View style={styles.cardAmount}>
                  <Text
                    style={[
                      styles.amount,
                      {
                        color: colors.text.primary,
                        fontFamily: fontFamily.monoMedium,
                      },
                    ]}
                  >
                    {formatAmount(account.monthSpend)}
                  </Text>
                  <Text
                    style={[
                      styles.amountLabel,
                      {
                        color: colors.text.tertiary,
                        fontFamily: fontFamily.medium,
                      },
                    ]}
                  >
                    {periodLabel}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.text.tertiary}
                />
              </Pressable>
            ))}

            {/* Transactions with no account — manual entries, or imports from
                before accounts existed. Shown so the per-account figures add up
                to the overall total instead of quietly disagreeing with it. */}
            {unassigned && unassigned.transactionCount > 0 && (
              <Pressable
                onPress={() => router.push("/transactions" as any)}
                accessibilityRole="button"
                accessibilityLabel={`Not linked to an account, ${unassigned.transactionCount} transaction${unassigned.transactionCount === 1 ? "" : "s"}, ${formatAmount(unassigned.monthSpend)} ${periodLabel}`}
                style={({ pressed }) => [
                  styles.card,
                  {
                    backgroundColor: colors.card.background,
                    borderColor: colors.border.medium,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <BankAvatar bankName="Other" colorHex="#7C8698" />
                <View style={styles.cardBody}>
                  <Text
                    style={[
                      styles.cardTitle,
                      {
                        color: colors.text.primary,
                        fontFamily: fontFamily.semibold,
                      },
                    ]}
                  >
                    Not linked to an account
                  </Text>
                  <Text
                    style={[
                      styles.cardMeta,
                      {
                        color: colors.text.tertiary,
                        fontFamily: fontFamily.medium,
                      },
                    ]}
                  >
                    {unassigned.transactionCount} transaction
                    {unassigned.transactionCount === 1 ? "" : "s"}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.amount,
                    {
                      color: colors.text.primary,
                      fontFamily: fontFamily.monoMedium,
                    },
                  ]}
                >
                  {formatAmount(unassigned.monthSpend)}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.text.tertiary}
                />
              </Pressable>
            )}
          </View>
        )}

        {accounts.length > 0 && (
          <Pressable
            onPress={() => router.push("/import-statement" as any)}
            accessibilityLabel="Add an account via statement"
            style={({ pressed }) => [
              styles.addButton,
              {
                borderColor: colors.border.medium,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            accessibilityRole="button"
          >
            <Ionicons name="add" size={18} color={colors.primary[500]} />
            <Text
              style={[
                styles.addLabel,
                { color: colors.primary[500], fontFamily: fontFamily.semibold },
              ]}
            >
              Add an account via statement
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 16, paddingBottom: 120 },
  header: { marginBottom: 20 },
  title: { fontSize: 30, letterSpacing: -0.8 },
  subtitle: { fontSize: 13, marginTop: 2 },
  error: { fontSize: 13, marginBottom: 12 },
  list: { gap: 10 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 15 },
  cardMeta: { fontSize: 12, marginTop: 2 },
  cardAmount: { alignItems: "flex-end" },
  amount: { fontSize: 15 },
  amountLabel: { fontSize: 10, marginTop: 1 },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 16,
  },
  addLabel: { fontSize: 14 },
});
