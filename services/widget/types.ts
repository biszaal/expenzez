/**
 * Home-screen widget data layer — shared types & storage keys.
 *
 * A widget cannot run the React Native app or read SecureStore, so the app
 * writes a lightweight, glanceable *snapshot* to a shared store and the native
 * widget renders from it (see `widgetSnapshot.ts` / `widgetBridge.ts`).
 *
 * Keep this shape in sync with the native readers:
 *  - iOS: App Group `UserDefaults` (group.com.biszaal.expenzez)
 *  - Android: AsyncStorage key `WIDGET_SNAPSHOT_KEY` (read by the headless
 *    render task of `react-native-android-widget`).
 */

/** Bump when the snapshot shape changes so native readers can guard on it. */
export const WIDGET_SNAPSHOT_VERSION = 1 as const;

/** AsyncStorage key holding the latest snapshot JSON (Android reads this). */
export const WIDGET_SNAPSHOT_KEY = "@expenzez_widget_snapshot";

/** AsyncStorage key for the "show amounts in widgets" privacy setting. */
export const WIDGET_HIDE_AMOUNTS_KEY = "@expenzez_widget_hide_amounts";

/** iOS App Group shared between the app and the widget extension. */
export const WIDGET_APP_GROUP = "group.com.biszaal.expenzez";

export type TrendDirection = "up" | "down" | "flat";

export interface WidgetBalance {
  /** Current total balance in the user's display currency (no FX conversion). */
  amount: number;
  /** Balance captured in the previous snapshot — used to derive the trend. */
  prevAmount: number;
  /** Signed percentage change vs `prevAmount`. */
  trendPct: number;
  trendDir: TrendDirection;
}

export interface WidgetBudget {
  /** Spend so far this calendar month. */
  spent: number;
  /** Monthly spending limit (0 when the user has not set one). */
  limit: number;
  /** `limit - spent` (can be negative when over budget). */
  remaining: number;
  /** `spent / limit` as a percentage (0 when no limit). */
  progressPct: number;
  overBudget: boolean;
}

export interface WidgetStreak {
  /** Current daily activity streak. */
  current: number;
  /** Gamification level (from XPService). */
  level: number;
}

export interface WidgetSnapshot {
  v: typeof WIDGET_SNAPSHOT_VERSION;
  /** ISO timestamp of when this snapshot was written. */
  updatedAt: string;
  /** False after logout — widgets show a neutral "Sign in" prompt. */
  loggedIn: boolean;
  currency: { code: string; symbol: string };
  /** When true, widgets mask amounts as "••••" (privacy default). */
  hideAmounts: boolean;
  balance: WidgetBalance;
  budget: WidgetBudget;
  streak: WidgetStreak;
}
