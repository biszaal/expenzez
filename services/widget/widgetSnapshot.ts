/**
 * Builds the home-screen widget snapshot from the app's existing data sources
 * and writes it to the shared store (see `types.ts` / `widgetBridge.ts`).
 *
 * Design: "snapshot only" — the widget never calls the API itself. The app
 * rebuilds and writes this snapshot whenever its data refreshes (dashboard
 * load, budget save, currency change, login/logout, privacy toggle). Callers
 * can pass data they already have in hand (balance, transactions) to avoid
 * redundant work; anything not passed is read from the per-user 5-minute API
 * cache, so this stays cheap.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import dayjs from "dayjs";

import { balanceAPI } from "../api/balanceAPI";
import { budgetAPI } from "../api/budgetAPI";
import { transactionAPI, Transaction } from "../api/transactionAPI";
import { StreakService } from "../streakService";
import { XPService } from "../xpService";
import { getActiveCurrency } from "../../utils/currencyStore";
import { symbolForCurrency } from "../../constants/currencies";
import { processTransactionExpense } from "../../utils/expenseDetection";

import {
  WidgetSnapshot,
  WidgetTopCategory,
  WIDGET_SNAPSHOT_VERSION,
  WIDGET_SNAPSHOT_KEY,
  WIDGET_HIDE_AMOUNTS_KEY,
} from "./types";
import { writeSnapshotAndReload } from "./widgetBridge";

export interface BuildSnapshotInput {
  /** Skip the SecureStore token check when the caller already knows the state. */
  loggedIn?: boolean;
  /** Current total balance the caller already loaded (avoids a cache read). */
  balance?: number;
  /** Transactions the caller already loaded (avoids a cache read). */
  transactions?: Transaction[];
}

/**
 * Whether widget amounts should be masked. Amounts are VISIBLE by default;
 * hiding is opt-in via Settings → Widgets. Only an explicit "true" hides, so
 * corrupt/legacy values can't accidentally flip a user who never opted in —
 * but an unreadable store still masks, since we can't rule out an opt-in.
 */
export async function getHideAmounts(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(WIDGET_HIDE_AMOUNTS_KEY);
    return v === "true";
  } catch {
    return true;
  }
}

/** Persist the privacy preference and refresh widgets to reflect it. */
export async function setHideAmounts(hide: boolean): Promise<void> {
  await AsyncStorage.setItem(WIDGET_HIDE_AMOUNTS_KEY, hide ? "true" : "false");
  await updateWidgets({}, { force: true });
}

/** The app's theme setting — same key ThemeContext persists to. */
async function getThemeSetting(): Promise<"light" | "dark" | "system"> {
  try {
    const v = await AsyncStorage.getItem("@expenzez_theme");
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

async function isLoggedIn(): Promise<boolean> {
  try {
    const token = await SecureStore.getItemAsync("accessToken", {
      keychainService: "expenzez-tokens",
    });
    return !!token;
  } catch {
    return false;
  }
}

/** "eating_out" / "eating-out" / "eating out" -> "Eating Out". */
function prettyCategory(raw: string): string {
  return raw
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * This calendar month's spend total and top category, mirroring the spending
 * screen's expense-detection logic.
 */
function summarizeCurrentMonth(txns: Transaction[]): {
  spent: number;
  topCategory: WidgetTopCategory | null;
} {
  const currentMonth = dayjs().format("YYYY-MM");
  const byCategory: Record<string, number> = {};
  let total = 0;
  txns.forEach((txn, index) => {
    if (!txn?.date) return;
    if (dayjs(txn.date).format("YYYY-MM") !== currentMonth) return;
    const { isExpense } = processTransactionExpense(txn, index, false);
    if (!isExpense) return;
    const amount = Math.abs(Number(txn.amount) || 0);
    total += amount;
    const cat = (txn.category || "other").trim().toLowerCase();
    byCategory[cat] = (byCategory[cat] || 0) + amount;
  });
  let top: { name: string; spent: number } | null = null;
  for (const [name, spent] of Object.entries(byCategory)) {
    if (!top || spent > top.spent) top = { name, spent };
  }
  return {
    spent: total,
    topCategory: top ? { name: prettyCategory(top.name), spent: top.spent } : null,
  };
}

async function readPreviousSnapshot(): Promise<WidgetSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(WIDGET_SNAPSHOT_KEY);
    return raw ? (JSON.parse(raw) as WidgetSnapshot) : null;
  } catch {
    return null;
  }
}

function emptyMoneySections(): Pick<WidgetSnapshot, "balance" | "budget" | "streak"> {
  return {
    balance: { amount: 0, prevAmount: 0, trendPct: 0, trendDir: "flat", monthSpend: 0 },
    budget: {
      spent: 0,
      limit: 0,
      remaining: 0,
      progressPct: 0,
      overBudget: false,
      topCategory: null,
    },
    streak: { current: 0, level: 1, best: 0, xpIntoLevel: 0, xpPerLevel: XP_PER_LEVEL },
  };
}

// Mirrors XPService's flat leveling (XP_PER_LEVEL is private to that class).
const XP_PER_LEVEL = 100;

/** Assemble the snapshot. Resilient: any failing source degrades to zeros. */
export async function buildSnapshot(
  input: BuildSnapshotInput = {}
): Promise<WidgetSnapshot> {
  const code = getActiveCurrency();
  const currency = { code, symbol: symbolForCurrency(code) };
  const hideAmounts = await getHideAmounts();
  const theme = await getThemeSetting();
  const updatedAt = new Date().toISOString();
  const monthLabel = dayjs().format("MMMM");

  const loggedIn =
    input.loggedIn !== undefined ? input.loggedIn : await isLoggedIn();

  if (!loggedIn) {
    return {
      v: WIDGET_SNAPSHOT_VERSION,
      updatedAt,
      loggedIn: false,
      currency,
      hideAmounts,
      theme,
      monthLabel,
      ...emptyMoneySections(),
    };
  }

  // Balance
  let balanceAmount = input.balance;
  if (balanceAmount === undefined) {
    try {
      balanceAmount = (await balanceAPI.getSummary({ useCache: true })).balance;
    } catch {
      balanceAmount = 0;
    }
  }

  // Transactions (for this month's spend)
  let txns = input.transactions;
  if (!txns) {
    try {
      const resp = await transactionAPI.getTransactions({
        limit: 1800,
        useCache: true,
      });
      txns = resp.transactions || [];
    } catch {
      txns = [];
    }
  }
  const { spent, topCategory } = summarizeCurrentMonth(txns);

  // Budget limit
  let limit = 0;
  try {
    const prefs = await budgetAPI.getBudgetPreferences();
    limit = prefs.monthlySpendingLimit || prefs.monthlyBudget || 0;
  } catch {
    limit = 0;
  }
  const remaining = limit - spent;
  const progressPct = limit > 0 ? (spent / limit) * 100 : 0;
  const overBudget = limit > 0 && spent > limit;

  // Streak + level
  let streakCurrent = 0;
  let streakBest = 0;
  let level = 1;
  let xpIntoLevel = 0;
  try {
    const streak = await StreakService.getStreak();
    streakCurrent = streak.currentStreak;
    streakBest = streak.longestStreak;
  } catch {
    streakCurrent = 0;
    streakBest = 0;
  }
  try {
    const xp = await XPService.getUserXP();
    level = xp.level;
    xpIntoLevel = Math.max(0, xp.totalXP % XP_PER_LEVEL);
  } catch {
    level = 1;
    xpIntoLevel = 0;
  }

  // Balance trend vs the previously written snapshot
  const prev = await readPreviousSnapshot();
  const prevAmount =
    prev?.loggedIn && typeof prev?.balance?.amount === "number"
      ? prev.balance.amount
      : balanceAmount;
  const delta = balanceAmount - prevAmount;
  // Guard against a near-zero baseline (e.g. £0.01 -> £50) producing a
  // meaningless five-figure percentage in the widget's trend label.
  const trendPct =
    Math.abs(prevAmount) >= 1 ? (delta / Math.abs(prevAmount)) * 100 : 0;
  const trendDir = delta > 0 ? "up" : delta < 0 ? "down" : "flat";

  return {
    v: WIDGET_SNAPSHOT_VERSION,
    updatedAt,
    loggedIn: true,
    currency,
    hideAmounts,
    theme,
    monthLabel,
    balance: { amount: balanceAmount, prevAmount, trendPct, trendDir, monthSpend: spent },
    budget: { spent, limit, remaining, progressPct, overBudget, topCategory },
    streak: {
      current: streakCurrent,
      level,
      best: Math.max(streakBest, streakCurrent),
      xpIntoLevel,
      xpPerLevel: XP_PER_LEVEL,
    },
  };
}

/** ISO timestamp of the last written snapshot (for Settings → Widgets). */
export async function getWidgetLastUpdated(): Promise<string | null> {
  const prev = await readPreviousSnapshot();
  return prev?.updatedAt || null;
}

// Content signature (excludes the volatile `updatedAt`) used to skip
// redundant writes so frequent data loads don't thrash the widget timeline.
function signatureOf(s: WidgetSnapshot): string {
  const { updatedAt, ...rest } = s;
  return JSON.stringify(rest);
}

let lastSignature = "";
let lastWriteAt = 0;
const THROTTLE_MS = 30_000;

/**
 * Rebuild and write the widget snapshot. Throttled: identical content within
 * 30s is skipped unless `force` is set (e.g. the privacy toggle). Never throws.
 */
export async function updateWidgets(
  input: BuildSnapshotInput = {},
  opts: { force?: boolean } = {}
): Promise<void> {
  try {
    const snapshot = await buildSnapshot(input);
    const signature = signatureOf(snapshot);
    const now = Date.now();
    if (!opts.force && signature === lastSignature && now - lastWriteAt < THROTTLE_MS) {
      return;
    }
    lastSignature = signature;
    lastWriteAt = now;
    await writeSnapshotAndReload(JSON.stringify(snapshot));
    if (__DEV__) {
      console.log("[widget] snapshot updated", snapshot);
    }
  } catch (e) {
    console.warn("[widget] updateWidgets failed", e);
  }
}
