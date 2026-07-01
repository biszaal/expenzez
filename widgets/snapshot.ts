/**
 * Reads the widget snapshot the app persisted to AsyncStorage. Runs inside the
 * headless widget render task, so it only touches AsyncStorage (no network /
 * SecureStore).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  WidgetSnapshot,
  WIDGET_SNAPSHOT_KEY,
  WIDGET_SNAPSHOT_VERSION,
} from "../services/widget";

const fallback: WidgetSnapshot = {
  v: WIDGET_SNAPSHOT_VERSION,
  updatedAt: "",
  loggedIn: false,
  currency: { code: "GBP", symbol: "£" },
  hideAmounts: true,
  balance: { amount: 0, prevAmount: 0, trendPct: 0, trendDir: "flat" },
  budget: { spent: 0, limit: 0, remaining: 0, progressPct: 0, overBudget: false },
  streak: { current: 0, level: 1 },
};

export async function loadSnapshot(): Promise<WidgetSnapshot> {
  try {
    const raw = await AsyncStorage.getItem(WIDGET_SNAPSHOT_KEY);
    if (raw) {
      return { ...fallback, ...(JSON.parse(raw) as Partial<WidgetSnapshot>) };
    }
  } catch {
    // fall through to fallback
  }
  return fallback;
}
