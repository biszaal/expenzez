/**
 * Shared colors + formatting for the Android home-screen widgets.
 *
 * Colors are hex (the library's ColorProp type rejects loosely-typed strings).
 * Amount formatting is done manually (no Intl) so it works inside the headless
 * widget render task regardless of the Hermes Intl build.
 */
import type { FlexWidgetStyle } from "react-native-android-widget";
import type { WidgetBudget } from "../services/widget";

export const COLORS = {
  navy: "#0A1226",
  cobalt: "#2547F0",
  mint: "#13A06B",
  coral: "#E0455A",
  amber: "#F5A623",
  white: "#FFFFFF",
  muted: "#9AA3B8",
  track: "#1E2A47",
} as const;

/** Mask shown when amounts are hidden (privacy default). */
export const MASKED = "••••";

function group(value: number): string {
  const abs = Math.abs(value);
  const fixed = Number.isInteger(abs) ? String(Math.trunc(abs)) : abs.toFixed(2);
  const [intPart, dec] = fixed.split(".");
  const withSep = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return dec ? `${withSep}.${dec}` : withSep;
}

/** Format a money value with the currency symbol, or mask it. */
export function formatAmount(value: number, symbol: string, hidden: boolean): string {
  if (hidden) return MASKED;
  const sign = value < 0 ? "-" : "";
  return `${sign}${symbol}${group(value)}`;
}

/** Signed percentage label for the balance trend. */
export function trendLabel(pct: number): string {
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

/** "just now" / "12m ago" / "3h ago" / "2d ago" (null for bad input). */
export function timeAgo(iso: string | undefined): string | null {
  if (!iso) return null;
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return null;
  const mins = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

/** Hex colour literal accepted by react-native-android-widget's ColorProp. */
export type WidgetColor = `#${string}`;

export interface BudgetPace {
  /** Days remaining in this calendar month, including today. */
  daysLeft: number;
  /** How much can still be spent per remaining day (0 when over budget). */
  safePerDay: number;
  state: "over" | "watch" | "ontrack";
  label: string;
  color: WidgetColor;
}

/**
 * Pace of spend vs how far through the month we are: >10 points ahead of the
 * calendar is "Watch it", past the limit is "Over budget", otherwise on track.
 */
export function budgetPace(budget: WidgetBudget): BudgetPace {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - now.getDate() + 1;
  const elapsedPct = (now.getDate() / daysInMonth) * 100;
  const safePerDay = Math.max(0, budget.remaining) / daysLeft;

  if (budget.overBudget) {
    return { daysLeft, safePerDay, state: "over", label: "Over budget", color: COLORS.coral };
  }
  if (budget.progressPct > elapsedPct + 10) {
    return { daysLeft, safePerDay, state: "watch", label: "Watch it", color: COLORS.amber };
  }
  return { daysLeft, safePerDay, state: "ontrack", label: "On track", color: COLORS.mint };
}

/** Flame emoji sizing/colour tier — the streak "grows" as it gets longer. */
export function flameTier(streak: number): { size: number; color: WidgetColor } {
  if (streak >= 30) return { size: 34, color: COLORS.coral };
  if (streak >= 7) return { size: 28, color: COLORS.amber };
  if (streak >= 1) return { size: 22, color: COLORS.amber };
  return { size: 18, color: COLORS.muted };
}

/** Root card style shared by every widget. */
export const cardRoot: FlexWidgetStyle = {
  height: "match_parent",
  width: "match_parent",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "flex-start",
  backgroundColor: COLORS.navy,
  padding: 16,
  borderRadius: 24,
};
