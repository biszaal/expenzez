/**
 * AdsDebugCard — a temporary, opt-in diagnostics panel for the ad pipeline.
 *
 * Renders nothing unless ADS_DEBUG is on (dev, or a release build with
 * EXPO_PUBLIC_ADMOB_FORCE_TEST=true). It prints every condition the ad gate
 * checks, so a single TestFlight screenshot shows exactly WHY ads are / aren't
 * appearing — instead of guessing. It also shows which ad unit IDs are live
 * (test vs real) so "no fill" on brand-new real units is distinguishable from a
 * broken gate.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { spacing, borderRadius, fontFamily } from "../../constants/theme";
import { useAds } from "../../hooks/useAds";
import {
  ADS_DEBUG,
  NATIVE_AD_UNIT_ID,
  BANNER_AD_UNIT_ID,
} from "../../constants/ads";

// Google's public test ad unit IDs always start with this publisher prefix.
const TEST_PREFIX = "ca-app-pub-3940256099942544";

export default function AdsDebugCard() {
  const { colors } = useTheme();
  const { shouldShowAds, gates, canRequestPersonalized, phase } = useAds();

  if (!ADS_DEBUG) return null;

  const rows: { label: string; ok: boolean; note?: string }[] = [
    { label: "ADS_ENABLED", ok: gates.adsEnabled },
    {
      label: "native module available",
      ok: gates.available,
      note: gates.available ? undefined : "module not in this build",
    },
    {
      label: "SDK initialized",
      ok: gates.initialized,
      note: gates.initialized ? undefined : "setup() didn't finish",
    },
    { label: "consent resolved", ok: gates.consentResolved },
    { label: "logged in", ok: gates.isLoggedIn },
    {
      label: "onboarding complete",
      ok: gates.onboardingComplete,
      note: gates.onboardingComplete ? undefined : "flag not set on device",
    },
    {
      label: "RevenueCat resolved",
      ok: !gates.subLoading,
      note: gates.subLoading ? "still loading" : undefined,
    },
    {
      label: "not Pro",
      ok: gates.devIgnorePro || !gates.isPro,
      note: gates.isPro
        ? gates.devIgnorePro
          ? "Pro, but dev-override on"
          : "Pro → ads hidden by design"
        : undefined,
    },
  ];

  const usingTestNative = NATIVE_AD_UNIT_ID.startsWith(TEST_PREFIX);
  const usingTestBanner = BANNER_AD_UNIT_ID.startsWith(TEST_PREFIX);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card.background, borderColor: colors.border.medium },
      ]}
    >
      <Text style={[styles.title, { color: colors.text.primary }]}>
        Ads diagnostics
      </Text>

      <View
        style={[
          styles.verdict,
          {
            backgroundColor: shouldShowAds ? colors.lime[500] : colors.rose[500],
          },
        ]}
      >
        <Text style={styles.verdictText}>
          {shouldShowAds
            ? "Gate OPEN — ads allowed. If none appear, it's no-fill (new units)."
            : "Gate CLOSED — see the ✗ below."}
        </Text>
      </View>

      {rows.map((r) => (
        <View key={r.label} style={styles.row}>
          <Text style={[styles.check, { color: r.ok ? colors.lime[500] : colors.rose[500] }]}>
            {r.ok ? "✓" : "✗"}
          </Text>
          <Text style={[styles.rowLabel, { color: colors.text.secondary }]}>
            {r.label}
          </Text>
          {r.note ? (
            <Text style={[styles.note, { color: colors.text.tertiary }]} numberOfLines={1}>
              {r.note}
            </Text>
          ) : null}
        </View>
      ))}

      <View style={[styles.divider, { backgroundColor: colors.border.light }]} />

      <Text style={[styles.meta, { color: colors.text.secondary }]}>
        setup phase: {phase}
      </Text>
      <Text style={[styles.meta, { color: colors.text.tertiary }]}>
        native unit: {usingTestNative ? "TEST" : "REAL"} · banner:{" "}
        {usingTestBanner ? "TEST" : "REAL"} · personalized:{" "}
        {canRequestPersonalized ? "yes" : "no"}
      </Text>
      <Text style={[styles.meta, { color: colors.text.tertiary }]} numberOfLines={1}>
        {NATIVE_AD_UNIT_ID}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 13,
    fontFamily: fontFamily.semibold,
    marginBottom: spacing.sm,
  },
  verdict: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  verdictText: {
    color: "#FFFFFF",
    fontSize: 11.5,
    fontFamily: fontFamily.semibold,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3,
    gap: 8,
  },
  check: {
    width: 14,
    fontSize: 13,
    fontFamily: fontFamily.bold,
    textAlign: "center",
  },
  rowLabel: {
    fontSize: 12.5,
    fontFamily: fontFamily.medium,
  },
  note: {
    flex: 1,
    fontSize: 11,
    fontFamily: fontFamily.regular,
    textAlign: "right",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.sm,
  },
  meta: {
    fontSize: 10.5,
    fontFamily: fontFamily.monoMedium,
    marginTop: 2,
  },
});
