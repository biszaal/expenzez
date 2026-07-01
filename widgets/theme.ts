/**
 * Shared colors + formatting for the Android home-screen widgets.
 *
 * Colors are hex (the library's ColorProp type rejects loosely-typed strings).
 * Amount formatting is done manually (no Intl) so it works inside the headless
 * widget render task regardless of the Hermes Intl build.
 */
import type { FlexWidgetStyle } from "react-native-android-widget";

export const COLORS = {
  navy: "#0A1226",
  cobalt: "#2547F0",
  mint: "#13A06B",
  coral: "#E0455A",
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
