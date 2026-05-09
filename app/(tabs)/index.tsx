import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  ScrollView,
  RefreshControl,
  StyleSheet,
  View,
  Text,
  Pressable,
} from "react-native";
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import dayjs from "dayjs";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useSecurity } from "../../contexts/SecurityContext";
import { useNotifications } from "../../contexts/NotificationContext";
import { useAuth } from "../auth/AuthContext";
import { useRevenueCat } from "../../contexts/RevenueCatContext";
import { budgetAPI } from "../../services/api";
import { fontFamily } from "../../constants/theme";
import { DashboardSkeleton } from "../../components/ui/SkeletonLoader";
import { UpgradeBanner } from "../../components/premium/UpgradeBanner";
import { useDashboardData } from "../../hooks/useDashboardData";
import { BillsAPI, type SavedBill } from "../../services/api/billsAPI";

// v1.5 home — electric purple + lime, mono numerals, full-bleed dark.
// All data wiring (useDashboardData, RevenueCat, notifications, auth) is
// unchanged from the previous implementation; only the visual layer was
// redesigned to match the Claude Design handoff.

type CategoryKey =
  | "food"
  | "transport"
  | "shopping"
  | "entertainment"
  | "bills"
  | "healthcare"
  | "travel"
  | "groceries"
  | "income";

const CATEGORY_ICON: Record<CategoryKey, keyof typeof Ionicons.glyphMap> = {
  food: "restaurant",
  transport: "car",
  shopping: "bag-handle",
  entertainment: "game-controller",
  bills: "receipt",
  healthcare: "medkit",
  travel: "airplane",
  groceries: "cart",
  income: "trending-up",
};

const CATEGORY_LABEL: Record<CategoryKey, string> = {
  food: "Food",
  transport: "Transport",
  shopping: "Shopping",
  entertainment: "Entertainment",
  bills: "Bills",
  healthcare: "Healthcare",
  travel: "Travel",
  groceries: "Groceries",
  income: "Income",
};

type CategoryAggregate = { key: CategoryKey; amount: number };

const KNOWN_CATEGORIES: CategoryKey[] = [
  "food",
  "transport",
  "shopping",
  "entertainment",
  "bills",
  "healthcare",
  "travel",
  "groceries",
  "income",
];

function normalizeCategory(raw?: string): CategoryKey {
  const s = (raw || "").toLowerCase().trim();
  if (KNOWN_CATEGORIES.includes(s as CategoryKey)) return s as CategoryKey;
  if (s.includes("food") || s.includes("dining") || s.includes("restaurant")) return "food";
  if (s.includes("grocer") || s.includes("supermarket")) return "groceries";
  if (s.includes("transport") || s.includes("uber") || s.includes("taxi") || s.includes("rail")) return "transport";
  if (s.includes("shop") || s.includes("amazon") || s.includes("retail")) return "shopping";
  if (s.includes("bill") || s.includes("utility") || s.includes("rent")) return "bills";
  if (s.includes("travel") || s.includes("hotel") || s.includes("flight")) return "travel";
  if (s.includes("health") || s.includes("pharma") || s.includes("medic")) return "healthcare";
  if (s.includes("game") || s.includes("netflix") || s.includes("spotify") || s.includes("entertainment"))
    return "entertainment";
  if (s.includes("salary") || s.includes("income") || s.includes("payment received")) return "income";
  return "shopping";
}

function formatGBP(amount: number): { whole: string; decimals: string } {
  const absolute = Math.abs(amount);
  const [whole, dec] = absolute.toFixed(2).split(".");
  // Group digits with commas
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return { whole: grouped, decimals: `.${dec}` };
}

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { isLocked } = useSecurity();
  const router = useRouter();
  const { unreadCount, notifications } = useNotifications();
  const { isLoggedIn, user } = useAuth();
  const revenueCatData = useRevenueCat();
  const { isPro, isLoading: revenueCatLoading, refreshCustomerInfo } = revenueCatData;

  const {
    transactions,
    loading,
    refreshing,
    refreshData,
    forceRefresh,
  } = useDashboardData();

  const [userBudget, setUserBudget] = useState<number>(2000);
  const [bills, setBills] = useState<SavedBill[]>([]);

  // Aggregate the current calendar month's transactions for the hero + cards.
  const monthAggregates = useMemo(() => {
    const now = dayjs();
    const start = now.startOf("month");
    const monthTxns = transactions.filter((t) =>
      t.date ? dayjs(t.date).isAfter(start.subtract(1, "second")) : false
    );
    let income = 0;
    let spent = 0;
    let txnCount = 0;
    let depositCount = 0;
    const categoryTotals: Record<string, number> = {};

    for (const t of monthTxns) {
      const amt = Number(t.amount) || 0;
      const isCredit = t.type === "credit" || amt > 0;
      if (isCredit) {
        income += Math.abs(amt);
        depositCount += 1;
      } else {
        spent += Math.abs(amt);
        txnCount += 1;
        const cat = normalizeCategory(t.category);
        categoryTotals[cat] = (categoryTotals[cat] || 0) + Math.abs(amt);
      }
    }

    const topCategories: CategoryAggregate[] = Object.entries(categoryTotals)
      .map(([key, amount]) => ({ key: key as CategoryKey, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);

    const net = income - spent;
    return { income, spent, net, txnCount, depositCount, topCategories };
  }, [transactions]);

  // Budget % used for the ring; clamp to [0, 1] so ring never overflows.
  const budgetUsed = userBudget > 0 ? Math.min(monthAggregates.spent / userBudget, 1) : 0;

  const recentTxns = useMemo(() => {
    return [...transactions]
      .sort((a, b) =>
        dayjs(b.date || 0).valueOf() - dayjs(a.date || 0).valueOf()
      )
      .slice(0, 5);
  }, [transactions]);

  const upcomingBills = useMemo(() => {
    const today = dayjs().startOf("day");
    return [...bills]
      .filter((b) => b?.nextDueDate && b.status !== "cancelled")
      .filter((b) => dayjs(b.nextDueDate).isAfter(today.subtract(1, "day")))
      .sort(
        (a, b) =>
          dayjs(a.nextDueDate).valueOf() - dayjs(b.nextDueDate).valueOf()
      )
      .slice(0, 3);
  }, [bills]);

  const unreadList = useMemo(
    () =>
      (notifications || [])
        .filter((n) => !n.read)
        .slice(0, 3),
    [notifications]
  );

  const loadUserBudget = async () => {
    try {
      const prefs = await budgetAPI.getBudgetPreferences();
      if (prefs.monthlySpendingLimit) setUserBudget(prefs.monthlySpendingLimit);
    } catch (err) {
      console.error("Error loading user budget:", err);
    }
  };

  const loadBills = async () => {
    try {
      const list = await BillsAPI.getBills();
      setBills(Array.isArray(list) ? list : []);
    } catch (err) {
      // Silent — bills are optional widget data, missing them shouldn't disrupt home.
      setBills([]);
    }
  };

  useEffect(() => {
    if (!isLocked && isLoggedIn) {
      loadUserBudget();
    }
  }, [isLocked, isLoggedIn]);

  useEffect(() => {
    if (!isLocked && isLoggedIn) {
      loadBills();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLocked, isLoggedIn, transactions.length]);

  const checkForNewTransaction = useCallback(async () => {
    try {
      await forceRefresh();
    } catch (err) {
      console.error("[Home] Error refreshing data:", err);
    }
  }, [forceRefresh]);

  const hasRefreshedOnFocusRef = useRef(false);
  useFocusEffect(
    React.useCallback(() => {
      if (isLoggedIn && !isLocked && !hasRefreshedOnFocusRef.current) {
        hasRefreshedOnFocusRef.current = true;
        refreshCustomerInfo().catch(() => undefined);
        checkForNewTransaction();
        setTimeout(() => {
          hasRefreshedOnFocusRef.current = false;
        }, 2000);
      }
    }, [isLoggedIn, isLocked, refreshCustomerInfo, checkForNewTransaction])
  );

  const greeting = useMemo(() => {
    const hour = dayjs().hour();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const userInitial = (user?.firstName || user?.email || "E")
    .charAt(0)
    .toUpperCase();
  const userFirstName =
    user?.firstName || (user?.email ? user.email.split("@")[0] : null) || "there";

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: colors.background.primary },
        ]}
      >
        <DashboardSkeleton />
      </SafeAreaView>
    );
  }

  const net = formatGBP(monthAggregates.net);
  const monthLabel = dayjs().format("MMMM");

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
      edges={["top"]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshData}
            colors={[colors.primary[500]]}
            tintColor={colors.primary[500]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerDate, { color: colors.text.secondary }]}>
              {dayjs().format("dddd, D MMMM")}
            </Text>
            <Text style={[styles.headerGreeting, { color: colors.text.primary }]}>
              {greeting}, {userFirstName}
              <Text style={{ color: colors.primary[500] }}>.</Text>
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => router.push("/notifications" as any)}
              style={[
                styles.headerIcon,
                {
                  backgroundColor: colors.card.background,
                  borderColor: colors.border.medium,
                },
              ]}
            >
              <Ionicons
                name="notifications-outline"
                size={18}
                color={colors.text.secondary}
              />
              {unreadCount > 0 && (
                <View
                  style={[
                    styles.headerBadge,
                    {
                      backgroundColor: colors.lime[500],
                      borderColor: colors.card.background,
                    },
                  ]}
                />
              )}
            </Pressable>
            <Pressable
              onPress={() => router.push("/(tabs)/account" as any)}
              style={styles.avatarPressable}
            >
              <LinearGradient
                colors={[colors.primary[500], colors.primary[600]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>{userInitial}</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>

        {/* Net cashflow hero */}
        <View style={styles.heroSection}>
          <Text style={[styles.heroEyebrow, { color: colors.text.tertiary }]}>
            NET CASHFLOW · {monthLabel.toUpperCase()}
          </Text>
          <View style={styles.heroAmountRow}>
            <Text style={[styles.heroCurrency, { color: colors.text.tertiary }]}>£</Text>
            <Text style={[styles.heroWhole, { color: colors.text.primary }]}>
              {net.whole}
            </Text>
            <Text style={[styles.heroDecimals, { color: colors.text.tertiary }]}>
              {net.decimals}
            </Text>
          </View>
          {monthAggregates.income > 0 && (
            <View style={styles.heroSubRow}>
              <View
                style={[
                  styles.heroChip,
                  {
                    backgroundColor:
                      monthAggregates.net >= 0 ? colors.posBg : colors.negBg,
                  },
                ]}
              >
                <Ionicons
                  name={monthAggregates.net >= 0 ? "trending-up" : "trending-down"}
                  size={11}
                  color={monthAggregates.net >= 0 ? colors.posFg : colors.negFg}
                />
                <Text
                  style={[
                    styles.heroChipText,
                    {
                      color:
                        monthAggregates.net >= 0 ? colors.posFg : colors.negFg,
                    },
                  ]}
                >
                  {monthAggregates.net >= 0 ? "Positive" : "Negative"}
                </Text>
              </View>
              <Text style={[styles.heroSubText, { color: colors.text.secondary }]}>
                {monthLabel}
              </Text>
            </View>
          )}
        </View>

        {/* Income / Spent dual */}
        <View style={styles.dualGrid}>
          <DualCard
            icon="arrow-down"
            label="INCOME"
            tone={colors.lime[500]}
            tintBg={colors.posBg}
            value={`£${formatGBP(monthAggregates.income).whole}`}
            sub={`${monthAggregates.depositCount} deposit${monthAggregates.depositCount === 1 ? "" : "s"}`}
            colors={colors}
          />
          <DualCard
            icon="arrow-up"
            label="SPENT"
            tone={colors.rose[500]}
            tintBg={colors.negBg}
            value={`£${formatGBP(monthAggregates.spent).whole}`}
            sub={`${monthAggregates.txnCount} transaction${monthAggregates.txnCount === 1 ? "" : "s"}`}
            colors={colors}
          />
        </View>

        {/* Budget ring */}
        <Pressable
          onPress={() => router.push("/budgets" as any)}
          style={[
            styles.card,
            {
              backgroundColor: colors.card.background,
              borderColor: colors.border.medium,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View>
              <Text style={[styles.cardTitle, { color: colors.text.primary }]}>
                Monthly budget
              </Text>
              <Text
                style={[styles.cardSubtitle, { color: colors.text.secondary }]}
              >
                £{formatGBP(monthAggregates.spent).whole} of £
                {formatGBP(userBudget).whole}
              </Text>
            </View>
            <View
              style={[
                styles.statusChip,
                {
                  backgroundColor:
                    budgetUsed > 0.9
                      ? colors.negBg
                      : budgetUsed > 0.7
                        ? "rgba(245,179,66,0.16)"
                        : colors.posBg,
                },
              ]}
            >
              <Text
                style={[
                  styles.statusChipText,
                  {
                    color:
                      budgetUsed > 0.9
                        ? colors.negFg
                        : budgetUsed > 0.7
                          ? colors.amber[500]
                          : colors.posFg,
                  },
                ]}
              >
                {budgetUsed > 0.9
                  ? "OVER"
                  : budgetUsed > 0.7
                    ? "AT RISK"
                    : "ON TRACK"}
              </Text>
            </View>
          </View>

          <View style={styles.ringRow}>
            <BudgetRing percent={budgetUsed} colors={colors} isDark={isDark} />
            <View style={styles.ringStats}>
              <RingStatLine
                tone={colors.lime[500]}
                value={Math.round((1 - budgetUsed) * 100)}
                label="% remaining"
                colors={colors}
              />
              <RingStatLine
                tone={colors.amber[500]}
                value={dayjs().daysInMonth() - dayjs().date()}
                label="days left"
                colors={colors}
              />
              <RingStatLine
                tone={colors.primary[500]}
                value={`£${formatGBP(Math.max(userBudget - monthAggregates.spent, 0)).whole}`}
                label="to spend"
                colors={colors}
              />
            </View>
          </View>
        </Pressable>

        {/* Top categories */}
        {monthAggregates.topCategories.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text
                style={[styles.sectionTitle, { color: colors.text.primary }]}
              >
                Top categories
              </Text>
              <Pressable onPress={() => router.push("/(tabs)/spending" as any)}>
                <Text
                  style={[styles.sectionLink, { color: colors.primary[500] }]}
                >
                  See all
                </Text>
              </Pressable>
            </View>
            <View style={{ gap: 8 }}>
              {monthAggregates.topCategories.map((cat) => {
                const pal = colors.category[cat.key];
                const max = monthAggregates.topCategories[0]?.amount || 1;
                const pct = Math.min(cat.amount / max, 1);
                return (
                  <View
                    key={cat.key}
                    style={[
                      styles.catRow,
                      {
                        backgroundColor: colors.card.background,
                        borderColor: colors.border.medium,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.catIcon,
                        { backgroundColor: pal.bg },
                      ]}
                    >
                      <Ionicons
                        name={CATEGORY_ICON[cat.key]}
                        size={18}
                        color={pal.fg}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.catRowHeader}>
                        <Text
                          style={[
                            styles.catName,
                            { color: colors.text.primary },
                          ]}
                        >
                          {CATEGORY_LABEL[cat.key]}
                        </Text>
                        <Text
                          style={[styles.catAmount, { color: colors.text.primary }]}
                        >
                          £{formatGBP(cat.amount).whole}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.catBar,
                          { backgroundColor: colors.border.light },
                        ]}
                      >
                        <View
                          style={{
                            width: `${pct * 100}%`,
                            height: "100%",
                            backgroundColor: pal.fg,
                            borderRadius: 4,
                          }}
                        />
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Recent transactions */}
        {recentTxns.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text
                style={[styles.sectionTitle, { color: colors.text.primary }]}
              >
                Recent transactions
              </Text>
              <Pressable onPress={() => router.push("/(tabs)/spending" as any)}>
                <Text
                  style={[styles.sectionLink, { color: colors.primary[500] }]}
                >
                  See all
                </Text>
              </Pressable>
            </View>
            <View style={{ gap: 8 }}>
              {recentTxns.map((tx, idx) => {
                const amt = Number(tx.amount) || 0;
                const isCredit = tx.type === "credit" || amt > 0;
                const cat = normalizeCategory(tx.category);
                const pal = colors.category[cat];
                const formatted = formatGBP(amt);
                const desc =
                  (tx as any).merchant ||
                  tx.description ||
                  CATEGORY_LABEL[cat];
                return (
                  <View
                    key={`${tx.id || idx}-${idx}`}
                    style={[
                      styles.txnRow,
                      {
                        backgroundColor: colors.card.background,
                        borderColor: colors.border.medium,
                      },
                    ]}
                  >
                    <View
                      style={[styles.txnIcon, { backgroundColor: pal.bg }]}
                    >
                      <Ionicons
                        name={CATEGORY_ICON[cat]}
                        size={16}
                        color={pal.fg}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        numberOfLines={1}
                        style={[styles.txnName, { color: colors.text.primary }]}
                      >
                        {desc}
                      </Text>
                      <Text
                        style={[styles.txnDate, { color: colors.text.tertiary }]}
                      >
                        {tx.date ? dayjs(tx.date).format("D MMM") : ""}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.txnAmount,
                        {
                          color: isCredit ? colors.lime[500] : colors.text.primary,
                        },
                      ]}
                    >
                      {isCredit ? "+" : "−"}£{formatted.whole}
                      <Text style={{ color: colors.text.tertiary }}>
                        {formatted.decimals}
                      </Text>
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Upcoming bills */}
        {upcomingBills.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text
                style={[styles.sectionTitle, { color: colors.text.primary }]}
              >
                Upcoming bills
              </Text>
              <Pressable onPress={() => router.push("/budgets" as any)}>
                <Text
                  style={[styles.sectionLink, { color: colors.primary[500] }]}
                >
                  See all
                </Text>
              </Pressable>
            </View>
            <View style={{ gap: 8 }}>
              {upcomingBills.map((bill) => {
                const due = dayjs(bill.nextDueDate);
                const daysOut = due.diff(dayjs().startOf("day"), "day");
                const cat = normalizeCategory(bill.category);
                const pal = colors.category[cat];
                const formatted = formatGBP(bill.amount);
                const dueLabel =
                  daysOut <= 0
                    ? "Due today"
                    : daysOut === 1
                      ? "Due tomorrow"
                      : `In ${daysOut} days · ${due.format("D MMM")}`;
                const urgent = daysOut <= 3;
                return (
                  <Pressable
                    key={bill.id}
                    onPress={() => router.push("/budgets" as any)}
                    style={[
                      styles.txnRow,
                      {
                        backgroundColor: colors.card.background,
                        borderColor: urgent
                          ? "rgba(245,179,66,0.4)"
                          : colors.border.medium,
                      },
                    ]}
                  >
                    <View
                      style={[styles.txnIcon, { backgroundColor: pal.bg }]}
                    >
                      <Ionicons
                        name={CATEGORY_ICON[cat]}
                        size={16}
                        color={pal.fg}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        numberOfLines={1}
                        style={[styles.txnName, { color: colors.text.primary }]}
                      >
                        {bill.name || bill.merchant}
                      </Text>
                      <Text
                        style={[
                          styles.txnDate,
                          {
                            color: urgent
                              ? colors.amber[500]
                              : colors.text.tertiary,
                          },
                        ]}
                      >
                        {dueLabel}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.txnAmount,
                        { color: colors.text.primary },
                      ]}
                    >
                      £{formatted.whole}
                      <Text style={{ color: colors.text.tertiary }}>
                        {formatted.decimals}
                      </Text>
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Unread notifications */}
        {unreadList.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text
                style={[styles.sectionTitle, { color: colors.text.primary }]}
              >
                What's new
              </Text>
              <Pressable
                onPress={() => router.push("/notifications" as any)}
              >
                <Text
                  style={[styles.sectionLink, { color: colors.primary[500] }]}
                >
                  See all
                </Text>
              </Pressable>
            </View>
            <View style={{ gap: 8 }}>
              {unreadList.map((n) => {
                const iconName: keyof typeof Ionicons.glyphMap =
                  n.type === "transaction"
                    ? "swap-horizontal"
                    : n.type === "budget"
                      ? "wallet"
                      : n.type === "security"
                        ? "shield-checkmark"
                        : n.type === "insight"
                          ? "sparkles"
                          : "notifications";
                return (
                  <Pressable
                    key={n.id}
                    onPress={() => router.push("/notifications" as any)}
                    style={[
                      styles.notifRow,
                      {
                        backgroundColor: colors.card.background,
                        borderColor: colors.border.medium,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.notifIcon,
                        {
                          backgroundColor: isDark
                            ? "rgba(157,91,255,0.16)"
                            : "rgba(123,63,228,0.12)",
                        },
                      ]}
                    >
                      <Ionicons
                        name={iconName}
                        size={16}
                        color={colors.primary[500]}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        numberOfLines={1}
                        style={[styles.txnName, { color: colors.text.primary }]}
                      >
                        {n.title}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.txnDate,
                          { color: colors.text.tertiary },
                        ]}
                      >
                        {n.message}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.notifDot,
                        { backgroundColor: colors.lime[500] },
                      ]}
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* AI insight strip — link to AI assistant */}
        {isPro && (
          <Pressable
            onPress={() => router.push("/ai-assistant")}
            style={[
              styles.aiCard,
              {
                borderColor: isDark
                  ? "rgba(157,91,255,0.25)"
                  : "rgba(123,63,228,0.20)",
              },
            ]}
          >
            <LinearGradient
              colors={
                isDark
                  ? ["rgba(157,91,255,0.16)", "rgba(197,242,92,0.06)"]
                  : ["rgba(123,63,228,0.12)", "rgba(92,133,25,0.06)"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={[colors.primary[500], colors.primary[600]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.aiIcon,
                {
                  shadowColor: colors.primary[500],
                },
              ]}
            >
              <Ionicons name="sparkles" size={18} color="#FFFFFF" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text
                style={[styles.aiEyebrow, { color: colors.primary[500] }]}
              >
                EXPENZEZ AI
              </Text>
              <Text style={[styles.aiBody, { color: colors.text.primary }]}>
                Tap to chat about your spending, budgets and goals.
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.text.tertiary}
            />
          </Pressable>
        )}

        {/* Upgrade Banner — keep existing flow for non-premium */}
        {!revenueCatLoading && !isPro && (
          <View style={{ marginHorizontal: 22, marginTop: 14 }}>
            <UpgradeBanner
              variant="subtle"
              message="Upgrade to Premium for unlimited budgets & advanced features"
              actionLabel="Upgrade"
            />
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const DualCard: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  tone: string;
  tintBg: string;
  value: string;
  sub: string;
  colors: any;
}> = ({ icon, label, tone, tintBg, value, sub, colors }) => (
  <View
    style={[
      styles.dualCard,
      {
        backgroundColor: colors.card.background,
        borderColor: colors.border.medium,
      },
    ]}
  >
    <View style={styles.dualHeader}>
      <View style={[styles.dualBadge, { backgroundColor: tintBg }]}>
        <Ionicons name={icon} size={13} color={tone} />
      </View>
      <Text style={[styles.dualLabel, { color: tone }]}>{label}</Text>
    </View>
    <Text style={[styles.dualValue, { color: colors.text.primary }]}>{value}</Text>
    <Text style={[styles.dualSub, { color: colors.text.tertiary }]}>{sub}</Text>
  </View>
);

const BudgetRing: React.FC<{
  percent: number;
  colors: any;
  isDark: boolean;
}> = ({ percent, colors, isDark }) => {
  const size = 92;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - circumference * percent;
  const trackColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(40,20,80,0.08)";

  return (
    <View
      style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <SvgLinearGradient id="ringGrad" x1="0" y1="0" x2={size} y2={size}>
            <Stop offset="0" stopColor={colors.primary[500]} />
            <Stop offset="1" stopColor={colors.lime[500]} />
          </SvgLinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.ringInner}>
          <Text style={[styles.ringValue, { color: colors.text.primary }]}>
            {Math.round(percent * 100)}
            <Text style={[styles.ringValueSmall, { color: colors.text.tertiary }]}>%</Text>
          </Text>
          <Text style={[styles.ringLabel, { color: colors.text.tertiary }]}>USED</Text>
        </View>
      </View>
    </View>
  );
};

const RingStatLine: React.FC<{
  tone: string;
  value: string | number;
  label: string;
  colors: any;
}> = ({ tone, value, label, colors }) => (
  <View style={styles.ringStatLine}>
    <View style={[styles.ringDot, { backgroundColor: tone }]} />
    <Text style={[styles.ringStatValue, { color: colors.text.primary }]}>
      {value}
    </Text>
    <Text style={[styles.ringStatLabel, { color: colors.text.secondary }]}>
      {label}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingTop: 6 },

  // Header
  header: {
    paddingHorizontal: 22,
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerDate: {
    fontSize: 13,
    fontFamily: fontFamily.medium,
    letterSpacing: 0.2,
  },
  headerGreeting: {
    fontSize: 22,
    fontFamily: fontFamily.semibold,
    marginTop: 2,
    letterSpacing: -0.4,
  },
  headerActions: { flexDirection: "row", gap: 10 },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBadge: {
    position: "absolute",
    top: 9,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 2,
  },
  avatarPressable: { width: 40, height: 40 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: fontFamily.bold,
  },

  // Hero
  heroSection: { paddingHorizontal: 22, paddingTop: 24 },
  heroEyebrow: {
    fontSize: 12,
    fontFamily: fontFamily.semibold,
    letterSpacing: 1.2,
  },
  heroAmountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 6,
    gap: 4,
  },
  heroCurrency: {
    fontFamily: fontFamily.mono,
    fontSize: 24,
    letterSpacing: -1,
  },
  heroWhole: {
    fontFamily: fontFamily.monoMedium,
    fontSize: 56,
    letterSpacing: -2.8,
    lineHeight: 60,
  },
  heroDecimals: {
    fontFamily: fontFamily.mono,
    fontSize: 24,
    letterSpacing: -1,
  },
  heroSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  heroChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  heroChipText: {
    fontSize: 12,
    fontFamily: fontFamily.semibold,
  },
  heroSubText: {
    fontSize: 12,
    fontFamily: fontFamily.medium,
  },

  // Dual cards
  dualGrid: {
    flexDirection: "row",
    paddingHorizontal: 22,
    paddingTop: 20,
    gap: 10,
  },
  dualCard: {
    flex: 1,
    padding: 14,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dualHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  dualBadge: {
    width: 22,
    height: 22,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  dualLabel: {
    fontSize: 11,
    fontFamily: fontFamily.semibold,
    letterSpacing: 0.5,
  },
  dualValue: {
    marginTop: 10,
    fontFamily: fontFamily.monoMedium,
    fontSize: 22,
    letterSpacing: -0.8,
  },
  dualSub: {
    marginTop: 4,
    fontSize: 11,
    fontFamily: fontFamily.medium,
  },

  // Budget card
  card: {
    marginHorizontal: 22,
    marginTop: 14,
    padding: 18,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: fontFamily.semibold,
  },
  cardSubtitle: {
    fontSize: 12,
    fontFamily: fontFamily.medium,
    marginTop: 2,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusChipText: {
    fontSize: 11,
    fontFamily: fontFamily.semibold,
    letterSpacing: 0.5,
  },
  ringRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 18,
  },
  ringInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  ringValue: {
    fontFamily: fontFamily.monoSemibold,
    fontSize: 22,
    letterSpacing: -0.8,
  },
  ringValueSmall: {
    fontFamily: fontFamily.mono,
    fontSize: 12,
  },
  ringLabel: {
    fontSize: 9,
    fontFamily: fontFamily.semibold,
    letterSpacing: 0.5,
    marginTop: -2,
  },
  ringStats: { flex: 1, gap: 8 },
  ringStatLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  ringDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  ringStatValue: {
    fontFamily: fontFamily.monoSemibold,
    fontSize: 14,
    minWidth: 30,
  },
  ringStatLabel: {
    fontSize: 13,
    fontFamily: fontFamily.medium,
  },

  // Sections
  section: {
    paddingHorizontal: 22,
    marginTop: 18,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: fontFamily.semibold,
  },
  sectionLink: {
    fontSize: 12,
    fontFamily: fontFamily.medium,
  },

  // Category rows
  catRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  catIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  catRowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  catName: {
    fontSize: 14,
    fontFamily: fontFamily.medium,
  },
  catAmount: {
    fontFamily: fontFamily.monoMedium,
    fontSize: 13,
  },
  catBar: {
    height: 4,
    borderRadius: 4,
    marginTop: 7,
    overflow: "hidden",
  },

  // Transaction / bill rows
  txnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  txnIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  txnName: {
    fontSize: 14,
    fontFamily: fontFamily.medium,
    letterSpacing: -0.1,
  },
  txnDate: {
    fontSize: 11.5,
    fontFamily: fontFamily.medium,
    marginTop: 2,
  },
  txnAmount: {
    fontFamily: fontFamily.monoMedium,
    fontSize: 14,
    letterSpacing: -0.4,
  },

  // Notification rows
  notifRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  notifIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // AI strip
  aiCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 22,
    marginTop: 14,
    padding: 16,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  aiIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  aiEyebrow: {
    fontSize: 11,
    fontFamily: fontFamily.semibold,
    letterSpacing: 0.6,
  },
  aiBody: {
    fontSize: 13.5,
    fontFamily: fontFamily.medium,
    lineHeight: 19,
    marginTop: 2,
  },
});
