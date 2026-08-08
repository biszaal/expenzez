/**
 * AdBanner — an anchored adaptive banner.
 *
 * Renders null unless ads are allowed (useAds). Height is reserved so the
 * layout doesn't jump when the ad loads, and it keeps clear of interactive
 * controls (accidental-click policy).
 */

import React, { useState } from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { useAds } from "../../hooks/useAds";
import { BANNER_AD_UNIT_ID } from "../../constants/ads";
import { spacing } from "../../constants/theme";
import AdErrorBoundary from "./AdErrorBoundary";

// Guarded require so a missing/stale native module degrades to "no ad" instead
// of throwing at import (the package eagerly calls getEnforcing on the native
// turbo module, which crashes a dev client built before the module existed).
let GMA: any = null;
try {
  GMA = require("react-native-google-mobile-ads");
} catch {
  GMA = null;
}
const BannerAd = GMA?.BannerAd;
const ANCHORED_ADAPTIVE =
  GMA?.BannerAdSize?.ANCHORED_ADAPTIVE_BANNER ?? "ANCHORED_ADAPTIVE_BANNER";

interface AdBannerProps {
  style?: ViewStyle;
}

function AdBannerInner({ style }: AdBannerProps) {
  const { shouldShowAds, getRequestOptions } = useAds();
  const [failed, setFailed] = useState(false);

  if (!shouldShowAds || failed || !BannerAd) return null;

  return (
    <AdErrorBoundary>
    <View style={[styles.container, style]}>
      <BannerAd
        unitId={BANNER_AD_UNIT_ID}
        size={ANCHORED_ADAPTIVE}
        requestOptions={getRequestOptions()}
        onAdFailedToLoad={(error) => {
          console.log("[Ads] banner load error:", error?.message);
          setFailed(true);
        }}
      />
    </View>
    </AdErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    // Reserve roughly one banner row so the surrounding layout stays stable.
    minHeight: 60,
  },
});

/**
 * Wrapped rather than boundary-inside-return, for the same reason as
 * NativeAdCard: getRequestOptions() is evaluated during this component's own
 * render, and a boundary rendered by that component cannot catch it.
 */
export default function AdBanner(props: AdBannerProps) {
  return (
    <AdErrorBoundary>
      <AdBannerInner {...props} />
    </AdErrorBoundary>
  );
}
