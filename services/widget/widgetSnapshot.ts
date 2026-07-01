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

/** Whether widget amounts should be masked. Defaults to hidden (privacy). */
export async function getHideAmounts(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(WIDGET_HIDE_AMOUNTS_KEY);
    if (v === null) return true; // hidden by default
    // Fail safe: only an explicit "false" un-hides; any other stored value
    // (corruption, future format change) keeps amounts masked.
    return v !== "false";
  } catch {
    return true;
  }
}

/** Persist the privacy preference and refresh widgets to reflect it. */
export async function setHideAmounts(hide: boolean): Promise<void> {
  await AsyncStorage.setItem(WIDGET_HIDE_AMOUNTS_KEY, hide ? "true" : "false");
  await updateWidgets({}, { force: true });
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

/** Sum of this calendar month's spend, mirroring the spending screen's logic. */
function sumCurrentMonthSpend(txns: Transaction[]): number {
  const currentMonth = dayjs().format("YYYY-MM");
  let total = 0;
  txns.forEach((txn, index) => {
    if (!txn?.date) return;
    if (dayjs(txn.date).format("YYYY-MM") !== currentMonth) return;
    const { isExpense } = processTransactionExpense(txn, index, false);
    if (isExpense) total += Math.abs(Number(txn.amount) || 0);
  });
  return total;
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
    balance: { amount: 0, prevAmount: 0, trendPct: 0, trendDir: "flat" },
    budget: { spent: 0, limit: 0, remaining: 0, progressPct: 0, overBudget: false },
    streak: { current: 0, level: 1 },
  };
}

/** Assemble the snapshot. Resilient: any failing source degrades to zeros. */
export async function buildSnapshot(
  input: BuildSnapshotInput = {}
): Promise<WidgetSnapshot> {
  const code = getActiveCurrency();
  const currency = { code, symbol: symbolForCurrency(code) };
  const hideAmounts = await getHideAmounts();
  const updatedAt = new Date().toISOString();

  const loggedIn =
    input.loggedIn !== undefined ? input.loggedIn : await isLoggedIn();

  if (!loggedIn) {
    return {
      v: WIDGET_SNAPSHOT_VERSION,
      updatedAt,
      loggedIn: false,
      currency,
      hideAmounts,
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
  const spent = sumCurrentMonthSpend(txns);

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
  let level = 1;
  try {
    streakCurrent = (await StreakService.getStreak()).currentStreak;
  } catch {
    streakCurrent = 0;
  }
  try {
    level = (await XPService.getUserXP()).level;
  } catch {
    level = 1;
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
    balance: { amount: balanceAmount, prevAmount, trendPct, trendDir },
    budget: { spent, limit, remaining, progressPct, overBudget },
    streak: { current: streakCurrent, level },
  };
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
