import React, { useCallback, useEffect, useState } from "react";
import {
  ScrollView,
  RefreshControl,
  StyleSheet,
  View,
  Text,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";
import { EmptyState } from "../../components/ui/EmptyState";
import { fontFamily } from "../../constants/theme";
import {
  transactionAPI,
  UploadedStatement,
} from "../../services/api/transactionAPI";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// "2026-05" -> { year: "2026", label: "May 2026" }. Falls back to the upload
// date when the statement period is missing.
function describePeriod(statement: UploadedStatement): {
  year: string;
  label: string;
} {
  const source =
    statement.periodMonth ||
    (statement.uploadedAt ? statement.uploadedAt.slice(0, 7) : null);
  if (source && /^\d{4}-\d{2}/.test(source)) {
    const [year, month] = source.split("-");
    const monthName = MONTH_NAMES[Number(month) - 1] || "";
    return { year, label: `${monthName} ${year}`.trim() };
  }
  return { year: "Other", label: "Unknown period" };
}

function formatUploadedAt(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface YearGroup {
  year: string;
  statements: UploadedStatement[];
}

export default function StatementsScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [statements, setStatements] = useState<UploadedStatement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await transactionAPI.getUploadedStatements();
      setStatements(res.statements || []);
    } catch (e: any) {
      console.error("[Statements] Failed to load:", e);
      setError("Could not load your statements. Pull to refresh to try again.");
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // Group by year (most recent year first), statements already newest-first.
  const groups: YearGroup[] = [];
  for (const s of statements) {
    const { year } = describePeriod(s);
    let group = groups.find((g) => g.year === year);
    if (!group) {
      group = { year, statements: [] };
      groups.push(group);
    }
    group.statements.push(s);
  }
  groups.sort((a, b) => b.year.localeCompare(a.year));

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={[
            styles.headerChip,
            {
              backgroundColor: colors.card.background,
              borderColor: colors.border.medium,
            },
          ]}
        >
          <Ionicons
            name="chevron-back"
            size={18}
            color={colors.text.secondary}
          />
        </Pressable>
        <Text
          style={[
            styles.headerTitleText,
            { color: colors.text.primary, fontFamily: fontFamily.semibold },
          ]}
        >
          Statements
        </Text>
        <Pressable
          onPress={() => router.push("/import-statement")}
          style={[
            styles.headerChip,
            {
              backgroundColor: colors.card.background,
              borderColor: colors.border.medium,
            },
          ]}
        >
          <Ionicons name="add" size={20} color={colors.text.secondary} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary.main} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary.main}
            />
          }
        >
          {statements.length === 0 ? (
            <EmptyState
              iconName="document-text-outline"
              title="No statements yet"
              description="Import a bank statement and it will show up here, grouped by the month and year it covers."
              actionLabel="Import a statement"
              onAction={() => router.push("/import-statement")}
            />
          ) : (
            <>
              {error && (
                <Text
                  style={[styles.errorText, { color: colors.error.main }]}
                >
                  {error}
                </Text>
              )}
              {groups.map((group) => (
                <View key={group.year} style={styles.section}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      {
                        color: colors.text.secondary,
                        fontFamily: fontFamily.semibold,
                      },
                    ]}
                  >
                    {group.year}
                  </Text>
                  {group.statements.map((s) => {
                    const { label } = describePeriod(s);
                    const uploaded = formatUploadedAt(s.uploadedAt);
                    return (
                      <View
                        key={s.statementId}
                        style={[
                          styles.card,
                          {
                            backgroundColor: colors.card.background,
                            borderColor: colors.border.medium,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.cardIcon,
                            {
                              backgroundColor:
                                (colors.primary.main || "#3B82F6") + "1F",
                            },
                          ]}
                        >
                          <Ionicons
                            name="document-text-outline"
                            size={20}
                            color={colors.primary.main || "#3B82F6"}
                          />
                        </View>
                        <View style={styles.cardBody}>
                          <Text
                            style={[
                              styles.cardBank,
                              {
                                color: colors.text.primary,
                                fontFamily: fontFamily.semibold,
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {s.bankName}
                          </Text>
                          <Text
                            style={[
                              styles.cardMeta,
                              {
                                color: colors.text.secondary,
                                fontFamily: fontFamily.medium,
                              },
                            ]}
                          >
                            {label}
                            {uploaded ? ` · Uploaded ${uploaded}` : ""}
                          </Text>
                        </View>
                        <View style={styles.cardCount}>
                          <Text
                            style={[
                              styles.cardCountNum,
                              {
                                color: colors.text.primary,
                                fontFamily: fontFamily.monoMedium,
                              },
                            ]}
                          >
                            {s.transactionCount}
                          </Text>
                          <Text
                            style={[
                              styles.cardCountLabel,
                              { color: colors.text.tertiary },
                            ]}
                          >
                            txns
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ))}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerChip: {
    width: 36,
    height: 36,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleText: { fontSize: 18 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
  errorText: { fontSize: 13, marginBottom: 12, textAlign: "center" },
  section: { marginTop: 20 },
  sectionTitle: {
    fontSize: 13,
    letterSpacing: 0.4,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardBody: { flex: 1 },
  cardBank: { fontSize: 15 },
  cardMeta: { fontSize: 12.5, marginTop: 2 },
  cardCount: { alignItems: "flex-end", marginLeft: 8 },
  cardCountNum: { fontSize: 16, letterSpacing: -0.4 },
  cardCountLabel: { fontSize: 10.5, marginTop: 1 },
});
